import { Injectable } from '@nestjs/common';
import { MinioService } from '../minio/minio.service';
import { DataSource } from 'typeorm';
import { ImageProcess } from 'src/helpers/utils/images/imageProcess';
import { VideoProcess } from 'src/helpers/utils/videos/videoProcess';
import { MediaStatusEnum } from 'src/helpers/constants/media';

@Injectable()
export class MediaService {
  constructor(
    private minioService: MinioService,
    private imageProcess: ImageProcess,
    private videoProcess: VideoProcess,
    private dataSource: DataSource,
  ) {}

  async videoTransform(fileName: string, mediaId: string) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const minioFile = await this.minioService.getObject(fileName);
    const transformedFile = await this.videoProcess.transCodeVideo(
      minioFile,
      fileName,
    );
    await queryBuilder
      .update('medias')
      .set({
        fileName: transformedFile.fileName,
        status: MediaStatusEnum.TRANSCODED,
        filePath: transformedFile.minioFilePath,
      })
      .where('id = :mediaId', { mediaId })
      .execute();
  }

  async imageProcessing(fileName: string, mediaId: string) {
    const queryBuilder = this.dataSource.createQueryBuilder();
    const minioFile = await this.minioService.getObject(fileName);
    const originalFile = await this.imageProcess.writeStreamToTempFile(
      minioFile,
      fileName,
    );
    await this.minioService.deleteFile(fileName);
    const transformedFile = await this.imageProcess.convertFile(
      originalFile.tempFilePath,
    );
    await this.minioService.uploadFileStream(
      originalFile.fileName,
      transformedFile.stream,
      transformedFile.mimeType,
    );
    await queryBuilder
      .update('medias')
      .set({
        fileName: originalFile.fileName,
        status: MediaStatusEnum.TRANSCODED,
        filePath: originalFile.minioFilePath,
      })
      .where('id = :mediaId', { mediaId })
      .execute();
  }
}
