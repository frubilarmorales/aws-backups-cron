"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const fs = require("fs");
const AWS = require("aws-sdk");
const handlebars = require("handlebars");
const mailer_1 = require("@nestjs-modules/mailer");
let AppService = exports.AppService = class AppService {
    constructor(mailerService) {
        this.mailerService = mailerService;
        AWS.config.update({
            accessKeyId: process.env.AWS_ACCESS_KEY_ID,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
            region: process.env.AWS_REGION,
        });
        this.s3 = new AWS.S3();
    }
    async uploadFilesToS3() {
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
        const uploadedFilesInfo = [];
        let successfulUploads = 0;
        for (const fileName of fileNames) {
            const filePath = `${backupFolderPath}/${fileName}`;
            const uploadResult = await this.uploadFile(filePath, fileName);
            if (uploadResult) {
                successfulUploads++;
                const url = this.generateDownloadUrl(process.env.S3_BUCKET, fileName);
                const fileStats = this.getFileStats(filePath);
                uploadedFilesInfo.push({
                    name: fileName,
                    size: fileStats ? fileStats.size : 0,
                    bucket: process.env.S3_BUCKET,
                    url,
                    uploaded: true,
                });
            }
            else {
                uploadedFilesInfo.push({
                    name: fileName,
                    size: 0,
                    bucket: process.env.S3_BUCKET,
                    url: '',
                    uploaded: false,
                });
            }
        }
        this.totalFilesToUpload = fileNames.length;
        console.log(`Se cargaron ${successfulUploads} de ${fileNames.length} archivos .rar a Amazon S3.`);
        await this.sendUploadCompleteEmail(successfulUploads, uploadedFilesInfo);
        return {
            successfulUploads,
            totalFilesToUpload: fileNames.length,
        };
    }
    async sendUploadCompleteEmail(successfulUploads, uploadedFilesInfo) {
        try {
            const source = fs.readFileSync('template/backups.hbs', 'utf-8');
            const template = handlebars.compile(source);
            const currentYear = new Date().getFullYear();
            const html = template({
                uploadedFilesInfo,
                successfulUploads,
                currentYear,
                totalFilesToUpload: this.totalFilesToUpload,
            });
            await this.mailerService.sendMail({
                to: 'panchojs12@gmail.com',
                subject: 'Respaldo Completado',
                text: 'Los respaldos se han subido correctamente.',
                html,
            });
            console.log('Email de carga completa enviado correctamente.');
        }
        catch (error) {
            console.error('Error al enviar el correo de carga completa:', error);
        }
    }
    async uploadFile(filePath, fileName) {
        try {
            if (!fs.existsSync(filePath)) {
                const logMessageNotFound = `${new Date().toISOString()} - No se encontró el archivo ${fileName}\n`;
                fs.appendFileSync('upload.log', logMessageNotFound);
                console.log(`No se encontró el archivo ${fileName}`);
                return null;
            }
            const fileContent = fs.readFileSync(filePath);
            const params = {
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
            fs.unlinkSync(filePath);
            return response;
        }
        catch (error) {
            const logMessageError = `${new Date().toISOString()} - Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}\n`;
            fs.appendFileSync('upload.log', logMessageError);
            console.error(`Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}`);
            return null;
        }
    }
    getFileStats(filePath) {
        try {
            const stats = fs.statSync(filePath);
            console.log(filePath);
            return stats;
        }
        catch (error) {
            console.error(`Error al obtener las estadísticas del archivo ${filePath}: ${error.message}`);
            return null;
        }
    }
    generateDownloadUrl(bucketName, fileName) {
        return `https://${bucketName}.s3.amazonaws.com/${fileName}`;
    }
};
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [mailer_1.MailerService])
], AppService);
//# sourceMappingURL=app.service.js.map