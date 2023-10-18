import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ScheduleModule } from '@nestjs/schedule';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        service: 'Gmail', // Utilizar el servicio de Gmail
        secure: false, // true para el puerto 465, false para otros puertos
        port: 465, // Puerto para el envío del correo
        auth: {
          user: process.env.MAILER_AUTH_USER, // Usuario de correo electrónico obtenido desde .env
          pass: process.env.MAILER_AUTH_PASS,
        },
      },
      defaults: {
        from: '"nest-modules" <user@outlook.com>', // Correo saliente predeterminado
      },
      template: {
        dir: process.cwd() + '/template/', // Directorio de plantillas de correo
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
