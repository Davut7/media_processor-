import { Injectable } from '@nestjs/common';
import { createReadStream, createWriteStream } from 'fs';
import { unlink } from 'fs/promises';
import internal from 'stream';
import { pipeline } from 'stream/promises';
import * as ffmpeg from 'fluent-ffmpeg';
import { MinioService } from 'src/minio/minio.service';
import * as ffmpegProbe from 'ffmpeg-probe';
@Injectable()
export class VideoProcess {
  constructor(private minioService: MinioService) {}

  async getVideoMetadata(filePath: string) {
    try {
      const metadata = await ffmpegProbe(filePath);
      if (metadata && metadata.streams && metadata.streams.length > 0) {
        const videoStream = metadata.streams.find(
          (stream) => stream.codec_type === 'video',
        );
        if (videoStream && videoStream.width && videoStream.height) {
          const aspectRatio = videoStream.width / videoStream.height;
          return {
            width: videoStream.width,
            height: videoStream.height,
            aspectRatio,
          };
        }
      }
      throw new Error('Video metadata not found');
    } catch (error: any) {
      throw new Error(`Failed to get video metadata: ${error.message}`);
    }
  }
  async transCodeVideo(inputFile: internal.Readable, fileName: string) {
    const convertedName = fileName.replace('_uploaded_', '_transcoded_');
    const tempInputFile = `./temp/${fileName}`;
    const tempOutputFile = `./temp/${convertedName}`;
    const writeStream = createWriteStream(tempInputFile);

    try {
      await pipeline(inputFile, writeStream);
    } catch (err) {
      console.error('Error piping streams:', err);
      throw err;
    }
    const metadata = await this.getVideoMetadata(tempInputFile);

    try {
      ffmpeg()
        .input(tempInputFile)
        .videoCodec('libx265')
        .audioCodec('aac')
        .size(`${metadata.width}x${metadata.height}`)
        .videoBitrate('500k')
        .audioBitrate('128k')
        .aspect(`${metadata.aspectRatio}`)
        .fps(30)
        .format('mp4')
        .outputOptions('-crf 23')
        .save(tempOutputFile)
        .on('error', (err) => {
          console.log('Error:', err);
        })
        .on('progress', (progress) => {
          console.log('Processing: ' + progress.percent + '% done');
        })
        .on('end', async () => {
          console.log('Transcoding ended');
          try {
            await unlink(tempInputFile);
            await this.minioService.deleteFile(fileName);
            await this.minioService.uploadFileStream(
              convertedName,
              createReadStream(tempOutputFile),
              'video/mp4',
            );
            await unlink(tempOutputFile);
          } catch (err) {
            console.log('Error deleting input file:', err);
          }
        })
        .run();
      const minioFilePath = await this.minioService.getFileUrl(convertedName);
      return {
        fileName: convertedName,
        minioFilePath: minioFilePath,
      };
    } catch (err) {
      console.error('Error transcoding video:', err);
      throw err;
    }
  }
}
