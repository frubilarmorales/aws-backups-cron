import * as AWS from 'aws-sdk';
import { MailerService } from '@nestjs-modules/mailer';
export declare class AppService {
    private readonly mailerService;
    private s3;
    totalFilesToUpload: number;
    constructor(mailerService: MailerService);
    uploadFilesToS3(): Promise<{
        successfulUploads: number;
        totalFilesToUpload: number;
    }>;
    sendUploadCompleteEmail(successfulUploads: number, uploadedFilesInfo: {
        name: string;
        bucket: string;
        url: string;
        uploaded: boolean;
    }[]): Promise<void>;
    uploadFile(filePath: string, fileName: string): Promise<AWS.S3.PutObjectOutput>;
    private getFileStats;
    private generateDownloadUrl;
}
