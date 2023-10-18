import { Injectable  } from '@nestjs/common';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import * as handlebars from 'handlebars';
import { MailerService } from '@nestjs-modules/mailer';
import * as wbm from 'wbm';

@Injectable()
export class AppService   {
  private s3: AWS.S3;
  totalFilesToUpload: number;

  constructor(private readonly mailerService: MailerService) {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.s3 = new AWS.S3();
  }

  async uploadFilesToS3(): Promise<{ successfulUploads: number; totalFilesToUpload: number }> {
    const backupFolderPath = process.env.FOLDER_BACKUP;
    const fileNames = fs
      .readdirSync(backupFolderPath)
      .filter((fileName) => fileName.endsWith('.rar'));

    if (fileNames.length === 0) {
      console.log('No se obtuvieron archivos .rar para cargar.');
      return {
        successfulUploads: 0,
        totalFilesToUpload: 0,
      };
    }

   

    const uploadedFilesInfo: { name: string; bucket: string; url: string; uploaded: boolean; size: number }[] = [];
    let successfulUploads = 0;

    for (const fileName of fileNames) {
      const filePath = `${backupFolderPath}/${fileName}`;
      const uploadResult: any = await this.uploadFile(filePath, fileName);

      if (uploadResult) {
        successfulUploads++;
        const url = this.generateDownloadUrl(process.env.S3_BUCKET, fileName);
        // Guardar información del archivo
        const fileStats = this.getFileStats(filePath);
        uploadedFilesInfo.push({
          name: fileName,
          size: fileStats ? fileStats.size : 0, // Agregar tamaño del archivo
          bucket: process.env.S3_BUCKET,
          url,
          uploaded: true,
        });
      } else {
        // Si el archivo no se subió correctamente, marcarlo como no subido
        uploadedFilesInfo.push({
          name: fileName,
          size: 0, // Tamaño 0 para archivos que no se subieron
          bucket: process.env.S3_BUCKET,
          url: '',
          uploaded: false,
        });
      }
    }

    this.totalFilesToUpload = fileNames.length;

    console.log(`Se cargaron ${successfulUploads} de ${fileNames.length} archivos .rar a Amazon S3.`);

    // Después de cargar los archivos, enviamos el correo
    await this.sendUploadCompleteEmail(successfulUploads, uploadedFilesInfo);

    return {
      successfulUploads,
      totalFilesToUpload: fileNames.length,
    };
  }


  async sendUploadCompleteEmail(
              successfulUploads: number,
              uploadedFilesInfo: { name: string; bucket: string; url: string; uploaded: boolean }[]
            ): Promise<void> {
              try {
                // Cargar la plantilla desde el archivo
                const source = fs.readFileSync('template/backups.hbs', 'utf-8');
          
                // Compilar la plantilla
                const template = handlebars.compile(source);
          
                // Obtener el año actual
                const currentYear = new Date().getFullYear();
          
                // Renderizar la plantilla con los datos
                const html = template({
                  uploadedFilesInfo,
                  successfulUploads,
                  currentYear,
                  totalFilesToUpload: this.totalFilesToUpload,
                });
          
                // Enviar el correo electrónico con la tabla de respaldos subidos
                await this.mailerService.sendMail({
                  to: 'panchojs12@gmail.com', // Cambia la dirección de correo de destino
                  subject: 'Respaldo Completado',
                  text: 'Los respaldos se han subido correctamente.',
                  html,
                });
          
                console.log('Email de carga completa enviado correctamente.');
              } catch (error) {
                console.error('Error al enviar el correo de carga completa:', error);
              }
            }
          
            // El resto del código del servicio permanece igual
        
          

  async uploadFile(filePath: string, fileName: string): Promise<AWS.S3.PutObjectOutput> {
    try {
      if (!fs.existsSync(filePath)) {
        const logMessageNotFound = `${new Date().toISOString()} - No se encontró el archivo ${fileName}\n`;
        fs.appendFileSync('upload.log', logMessageNotFound);
        console.log(`No se encontró el archivo ${fileName}`);
        return null;
      }

      const fileContent = fs.readFileSync(filePath);

      const params: AWS.S3.PutObjectRequest = {
        Bucket: process.env.S3_BUCKET,
        Key: fileName,
        Body: fileContent,
      };

      const logMessagePreparing = `${new Date().toISOString()} - Preparando archivo ${fileName} para subir a Amazon S3\n`;
      fs.appendFileSync('upload.log', logMessagePreparing);
      console.log(`Preparando archivo ${fileName} para subir a Amazon S3`);

      const logMessageLoading = `${new Date().toISOString()} - Cargando archivo ${fileName} en el bucket ${params.Bucket}\n`;
      fs.appendFileSync('upload.log', logMessageLoading);
      console.log(`Cargando archivo ${fileName} en el bucket ${params.Bucket}`);

      const response = await this.s3.putObject(params).promise();

      const logMessageLoaded = `${new Date().toISOString()} - Archivo ${fileName} cargado en el bucket ${params.Bucket}\n`;
      fs.appendFileSync('upload.log', logMessageLoaded);
      console.log(`Archivo ${fileName} cargado exitosamente en el bucket ${params.Bucket}`);

      fs.unlinkSync(filePath); // Elimina el archivo de la carpeta de respaldos después de subirlo

      return response;
    } catch (error) {
      const logMessageError = `${new Date().toISOString()} - Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}\n`;
      fs.appendFileSync('upload.log', logMessageError);
      console.error(`Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}`);
      return null;
    }
  }

  private getFileStats(filePath: string): fs.Stats {
    try {
      const stats = fs.statSync(filePath);
      console.log(filePath);
      return stats;
    } catch (error) {
      console.error(`Error al obtener las estadísticas del archivo ${filePath}: ${error.message}`);
      return null;
    }
  }

  private generateDownloadUrl(bucketName: string, fileName: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
  }
}
