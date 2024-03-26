import { Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerController } from './logger.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import CustomLogger from '../helpers/constants/logger/customLogger';
import { LogsEntity } from './entity/log.entity';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([LogsEntity]),
  ],
  controllers: [LoggerController],
  providers: [LoggerService, CustomLogger],
  exports: [CustomLogger,LoggerService],
})
export class LoggerModule {}
