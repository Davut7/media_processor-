import { Module } from '@nestjs/common';
import { RabbitmqService } from './rabbitmq.service';
import { MediaModule } from 'src/media/media.module';

@Module({
  imports: [MediaModule],
  providers: [RabbitmqService],
  exports: [RabbitmqService],
})
export class RabbitmqModule {}
