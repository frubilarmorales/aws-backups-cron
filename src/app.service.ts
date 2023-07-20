import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as AWS from 'aws-sdk';

@Injectable()
export class AppService {
  private s3: AWS.S3;

  constructor() {
    AWS.config.update({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    this.s3 = new AWS.S3();
  }

  async uploadFile(
    filePath: string,
    fileName: string,
  ): Promise<AWS.S3.PutObjectOutput> {
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

      const logMessageLoading = `${new Date().toISOString()} - Cargando archivo ${fileName} en el bucket ${
        params.Bucket
      }\n`;
      fs.appendFileSync('upload.log', logMessageLoading);

      console.log(`Cargando archivo ${fileName} en el bucket ${params.Bucket}`);

      const response = await this.s3.putObject(params).promise();

      const logMessageLoaded = `${new Date().toISOString()} - Archivo ${fileName} cargado en el bucket ${
        params.Bucket
      }\n`;
      fs.appendFileSync('upload.log', logMessageLoaded);

      console.log(
        `Archivo ${fileName} cargado exitosamente en el bucket ${params.Bucket}`,
      );

      fs.unlinkSync(filePath); // Elimina el archivo de la carpeta de respaldos después de subirlo

      return response;
    } catch (error) {
      const logMessageError = `${new Date().toISOString()} - Error al cargar el archivo ${fileName} a Amazon S3: ${
        error.message
      }\n`;
      fs.appendFileSync('upload.log', logMessageError);
      console.log(
        `Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}`,
      );
      return null;
    }
  }
}
