import * as fs from 'fs';
import * as AWS from 'aws-sdk';

export function findFilesWithKeywords(
  directory: string,
  keywords: string[],
  extension: string,
) {
  const fileNames = fs.readdirSync(directory);

  return fileNames.filter((fileName) => {
    return (
      keywords.some((keyword) => fileName.toLowerCase().includes(keyword)) &&
      fileName.endsWith(extension)
    );
  });
}

export async function uploadFile(
  filePath: string,
  fileName: string,
  folderName: string,
): Promise<void> {
  try {
    if (!fs.existsSync(filePath)) {
      const logMessageNotFound = `${new Date().toISOString()} - No se encontró el archivo ${fileName}\n`;
      fs.appendFileSync('upload.log', logMessageNotFound);
      console.log(`No se encontró el archivo ${fileName}`);
      return;
    }

    const fileContent = fs.readFileSync(filePath);

    const s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });

    let params: AWS.S3.PutObjectRequest;

    if (folderName === 'LAJA') {
      params = {
        Bucket: 'cmpclaja',
        Key: `2024/LAJA/${fileName}`,
        Body: fileContent,
      };
    } else if (folderName === 'MULCHEN') {
      params = {
        Bucket: 'cmpclaja',
        Key: `2024/MULCHEN/${fileName}`,
        Body: fileContent,
      };
    } else {
      // Si no se especifica una carpeta válida, puedes manejar el error adecuadamente
      console.error('Carpeta no válida especificada.');
      return;
    }

    const response = await s3.putObject(params).promise();

    if (response) {
      console.log(
        `Archivo ${fileName} subido a la carpeta ${folderName} en S3`,
      );
      // Eliminar el archivo local después de la carga exitosa
      fs.unlinkSync(filePath);
    } else {
      console.log(`Error al subir ${fileName} a la carpeta ${folderName}.`);
    }
  } catch (error) {
    // Aquí puedes manejar el error de la carga en S3
    console.error(
      `Error al cargar el archivo ${fileName} a Amazon S3: ${error.message}`,
    );
    // Puedes agregar lógica adicional aquí, como registrar el error o notificarlo.
  }
}

export async function findAndUploadFiles() {
  const backupFolderPath = process.env.FOLDER_BACKUP;
  const fileNames = findFilesWithKeywords(
    backupFolderPath,
    ['mulchen', 'laja'],
    '.rar',
  );

  if (fileNames.length === 0) {
    console.log(
      'No se obtuvieron archivos con las palabras clave para cargar.',
    );
    return;
  }

  for (const fileName of fileNames) {
    const filePath = `${backupFolderPath}/${fileName}`;
    let folderName = 'otro'; // Carpeta predeterminada

    if (fileName.includes('laja')) {
      folderName = 'LAJA';
    } else if (fileName.includes('mulchen')) {
      folderName = 'MULCHEN';
    }

    await uploadFile(filePath, fileName, folderName);
  }
}
