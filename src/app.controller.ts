import { Controller } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Cron('0 * * * * *') // Define la expresión cron según tus necesidades
  async handleCron(): Promise<void> {
    const result = await this.appService.uploadFilesToS3();
    if (result.successfulUploads === result.totalFilesToUpload) {
      console.log('Todos los archivos se cargaron con éxito.');
    } else {
      console.log('No se cargaron todos los archivos con éxito.');
    }
  }
}
