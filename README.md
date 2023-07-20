# API de respaldos con NestJS y AWS S3

![NestJS Logo](https://nestjs.com/img/logo_text.svg)

## Descripción

Este repositorio contiene una API desarrollada con NestJS que se encarga de realizar respaldos programados y automáticos a AWS S3. La API utiliza un cron job para ejecutar la tarea de subir archivos comprimidos en formato .rar a un bucket de Amazon S3 de forma periódica.

## Funcionalidad

- Programa una tarea de respaldo cada minuto utilizando un cron job.
- Explora una carpeta local definida en la configuración para obtener los archivos .rar que serán respaldados.
- Utiliza las credenciales de acceso de AWS proporcionadas en las variables de entorno para interactuar con el servicio S3 de Amazon.
- Sube cada archivo de respaldo a un bucket específico en Amazon S3, eliminándolo localmente después de una carga exitosa.
- Registra los eventos y errores importantes en un archivo de registro (upload.log) para un seguimiento detallado.

## Uso

1. Asegúrate de tener Node.js y NPM instalados en tu sistema.
2. Clona este repositorio en tu máquina local.
3. Instala las dependencias ejecutando `npm install`.
4. Configura las variables de entorno en un archivo `.env` según el formato proporcionado en el archivo `.env.example`.
5. Coloca los archivos que deseas respaldar en la carpeta definida en la variable de entorno `FOLDER_BACKUP`.
6. Ejecuta la API utilizando `npm run start`.

## Estructura del Proyecto

El repositorio contiene dos componentes principales:

1. **AppController**: Un controlador NestJS que define la lógica para el cron job y el proceso de subida de archivos a S3.
2. **AppService**: Un servicio NestJS que se encarga de interactuar con AWS S3 y realizar la subida de los archivos.

## Contribución

Si deseas contribuir a este proyecto, ¡serás bienvenido! Siéntete libre de abrir problemas o enviar pull requests.

## Notas

- Asegúrate de mantener seguras las credenciales de acceso de AWS y no las compartas en el repositorio.
- El archivo de registro `upload.log` se generará automáticamente y almacenará detalles sobre cada respaldo realizado y cualquier error encontrado.

## Licencia

Este proyecto está bajo la Licencia [MIT](LICENSE).

---
Hecho con ❤️ y ☕️ por [TuNombre](https://github.com/TuNombre)
