import { Module } from '@nestjs/common';
import { MinioService } from './minio.service';
import { ConfigService } from '@nestjs/config';

@Module({
  providers: [MinioService, ConfigService],
  exports: [MinioService],
})
export class MinioModule {}
