import { Controller, Get } from '@nestjs/common';
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

  // @Get('send')
  // async send_mail() {
  //   const successfulUploads = 3;
  //   const uploadedFilesInfo = [
  //     {
  //       name: 'bucket',
  //       bucket: 'hola',
  //       uploaded: true,
  //     },
  //   ];
  //   const resp = this.appService.sendUploadCompleteEmail(
  //     successfulUploads,
  //     uploadedFilesInfo,
  //   );
  //   if (resp) {
  //     return {
  //       ok: true,
  //       message: 'Mensaje enviado ',
  //     };
  //   } else {
  //     return { ok: false, message: 'Error al evniar el correo' };
  //   }
  // }
}
