import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';
import * as handlebars from 'handlebars';
import { MailerService } from '@nestjs-modules/mailer';
import { uploadFile, findFilesWithKeywords } from './utils/utilis.functions';

@Injectable()
export class AppService {
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

  async uploadFilesToS3(): Promise<{
    successfulUploads: number;
    totalFilesToUpload: number;
  }> {
    const backupFolderPath = process.env.FOLDER_BACKUP;
    const fileNames: any = findFilesWithKeywords(
      backupFolderPath,
      ['mulchen', 'laja'],
      '.rar',
    );

    if (fileNames.length === 0) {
      console.log(
        'No se obtuvieron archivos con las palabras clave para cargar.',
      );
      return {
        successfulUploads: 0,
        totalFilesToUpload: 0,
      };
    }

    const uploadedFilesInfo: {
      name: string;
      bucket: string;
      uploaded: boolean;
      size: number;
    }[] = [];
    let successfulUploads = 0;
    console.log(fileNames);
    for (const fileName of fileNames) {
      const filePath = `${backupFolderPath}/${fileName}`;
      let folderName = 'otro'; // Carpeta predeterminada

      if (fileName.includes('laja')) {
        folderName = 'LAJA';
      } else if (fileName.includes('mulchen')) {
        if (fileName.includes('dga')) {
          folderName = 'MULCHEN/ZEBBRA_DGA';
        }
        if (fileName.includes('ZebbraDB')) {
          folderName = 'MULCHEN/ZEBBRA_SMA';
        }
        if (fileName.includes('Maderas')) {
          folderName = 'MULCHEN/ZEBBRA_MADERAS';
        }
      }

      await uploadFile(filePath, fileName, folderName);

      if (uploadedFilesInfo) {
        successfulUploads++;

        // Guardar información del archivo
        const fileStats = this.getFileStats(filePath);
        uploadedFilesInfo.push({
          name: fileName,
          size: fileStats ? fileStats.size : 0,
          bucket: process.env.S3_BUCKET,
          uploaded: true,
        });
      } else {
        // Si el archivo no se subió correctamente, marcarlo como no subido
        uploadedFilesInfo.push({
          name: fileName,
          size: 0,
          bucket: process.env.S3_BUCKET,
          uploaded: false,
        });
      }
    }

    this.totalFilesToUpload = fileNames.length;

    console.log(
      `Se cargaron ${successfulUploads} de ${fileNames.length} archivos .rar a Amazon S3.`,
    );

    // Después de cargar los archivos, enviamos el correo
    await this.sendUploadCompleteEmail(successfulUploads, uploadedFilesInfo);

    return {
      successfulUploads,
      totalFilesToUpload: fileNames.length,
    };
  }

  async sendUploadCompleteEmail(
    successfulUploads: number,
    uploadedFilesInfo: {
      name: string;
      bucket: string;
      uploaded: boolean;
    }[],
  ): Promise<void> {
    try {
      // Cargar la plantilla desde el archivo
      const source = fs.readFileSync('template/backups.hbs', 'utf-8');
      const template = handlebars.compile(source);
      const currentYear = new Date().getFullYear();
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

  private getFileStats(filePath: string): fs.Stats {
    try {
      const stats = fs.statSync(filePath);
      console.log(filePath);
      return stats;
    } catch (error) {
      console.error(
        `Error al obtener las estadísticas del archivo ${filePath}: ${error.message}`,
      );
      return null;
    }
  }

  private generateDownloadUrl(bucketName: string, fileName: string): string {
    return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
  }
}
