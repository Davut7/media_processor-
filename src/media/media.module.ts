import { Module } from '@nestjs/common';
import { MediaService } from './media.service';
import { MediaController } from './media.controller';
import { MinioModule } from 'src/minio/minio.module';
import { ImageProcess } from 'src/helpers/utils/images/imageProcess';
import { VideoProcess } from 'src/helpers/utils/videos/videoProcess';

@Module({
  imports: [MinioModule],
  controllers: [MediaController],
  providers: [MediaService, ImageProcess, VideoProcess],
  exports: [MediaService],
})
export class MediaModule {}
