import { Injectable, OnModuleInit } from '@nestjs/common';
import amqp, { ChannelWrapper } from 'amqp-connection-manager';
import { ConfirmChannel, Message } from 'amqplib';
import { MediaService } from 'src/media/media.service';

@Injectable()
export class RabbitmqService implements OnModuleInit {
  private channelWrapper: ChannelWrapper;

  constructor(private mediaService: MediaService) {
    const connection = amqp.connect(['amqp://localhost']);
    this.channelWrapper = connection.createChannel();
  }

  public async onModuleInit() {
    try {
      await this.setupQueue();
      await this.consumeImageMessages();
      await this.consumeVideoMessages();
    } catch (error) {
      console.log('Error during RabbitMQ setup:', error);
    }
  }

  private async setupQueue() {
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.assertQueue('imageQueue', { durable: true });
    });
    await this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.assertQueue('videoQueue', { durable: true });
    });
  }

  private async consumeImageMessages() {
    this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.consume('imageQueue', async (message: Message | null) => {
        if (message === null) {
          return;
        }
        try {
          const { fileName, mediaId } = JSON.parse(message.content.toString());
          await this.mediaService.imageProcessing(fileName, mediaId);
          channel.ack(message);
        } catch (error) {
          console.log('Error processing message:', error);
          channel.reject(message, false);
        }
      });
    });
  }
  private async consumeVideoMessages() {
    this.channelWrapper.addSetup(async (channel: ConfirmChannel) => {
      await channel.consume('videoQueue', async (message: Message | null) => {
        if (message === null) {
          return;
        }
        try {
          const { fileName, mediaId } = JSON.parse(message.content.toString());
          await this.mediaService.videoTransform(fileName, mediaId);
          channel.ack(message);
        } catch (error) {
          console.log('Error processing message:', error);
          channel.reject(message, false);
        }
      });
    });
  }
}
