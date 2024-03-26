import { Injectable } from '@nestjs/common';
import { createWriteStream } from 'fs';
import { readFile, unlink } from 'fs/promises';
import { join } from 'path';
import * as sharp from 'sharp';
import { MinioService } from 'src/minio/minio.service';
import internal from 'stream';
import { pipeline } from 'stream/promises';

@Injectable()
export class ImageProcess {
  constructor(private minioService: MinioService) {}
  async convertFile(file: string) {
    const originalFile = await readFile(file);

    const metadata = await sharp(originalFile).metadata();

    const originalWidth = metadata.width;
    const originalHeight = metadata.height;

    let targetWidth: number;
    let targetHeight: number;

    if (originalWidth / originalHeight >= 16 / 9) {
      targetWidth = 1080;
      targetHeight = Math.round((targetWidth * 9) / 16);
    } else {
      targetHeight = 1080;
      targetWidth = Math.round((targetHeight * 16) / 9);
    }

    const maintainAspectRatio =
      targetWidth / targetHeight === originalWidth / originalHeight;

    const transformedStream = sharp(originalFile)
      .resize({
        width: maintainAspectRatio ? undefined : targetWidth,
        height: maintainAspectRatio ? undefined : targetHeight,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .jpeg({ quality: 90, progressive: true });

    const mimeType = 'image/jpeg';
    await unlink(file);
    return {
      stream: transformedStream,
      mimeType: mimeType,
    };
  }

  async writeStreamToTempFile(
    originalImageStream: internal.Readable,
    fileName: string,
  ) {
    const tempFilePath = join('./temp', fileName);
    const convertedFileName = fileName.replace('_uploaded_', '_transcoded_');
    try {
      const writeStream = createWriteStream(tempFilePath);

      await pipeline(originalImageStream, writeStream);

      const minioFilePath =
        await this.minioService.getFileUrl(convertedFileName);

      return {
        tempFilePath: tempFilePath,
        fileName: convertedFileName,
        minioFilePath: minioFilePath,
      };
    } catch (err) {
      console.error('Error writing stream to file:', err);
      throw err;
    }
  }
}
