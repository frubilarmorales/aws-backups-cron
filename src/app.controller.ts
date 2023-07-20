import { Controller } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import * as fs from 'fs';
import { AppService } from './app.service';

@Controller()
export class AppController {
  public backupInterval: any;
  constructor(private readonly s3Service: AppService) {}
  @Cron('0 * * * * *') // Ejecutar cada 3 segundos
  async uploadFiles(): Promise<string> {
    const backupFolderPath = process.env.FOLDER_BACKUP;
    const fileNames = fs
      .readdirSync(backupFolderPath)
      .filter((fileName) => fileName.endsWith('.rar'));

    if (fileNames.length === 0) {
      console.log('No se obtuvieron archivos');
      return 'No se obtuvieron archivos';
    }

    for (const fileName of fileNames) {
      const filePath = `${backupFolderPath}/${fileName}`;
      await this.s3Service.uploadFile(filePath, fileName);
    }

    return 'Respaldo subido exitosamente';
  }
}
