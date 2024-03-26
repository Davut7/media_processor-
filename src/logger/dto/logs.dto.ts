import { IsNumber, IsOptional, IsPositive, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';
import { PartialType } from '@nestjs/mapped-types';
import { LogsEntity } from '../entity/log.entity';

export class CreateLogDto extends PartialType(LogsEntity) {}

export enum LogMethodEnum {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

export enum LogLevelEnum {
  LOG = 'log',
  WARN = 'warn',
  ERROR = 'error',
  VERBOSE = 'verbose',
  DEBUG = 'debug',
}

export enum LogsSortEnum {
  createdAt_ASC = 'createdAt_ASC',
  createdAt_DESC = 'createdAt_DESC',
  id_ASC = 'id_ASC',
  id_DESC = 'id_DESC',
}

export class FindLogsFilter {
  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  take: number;

  @IsNumber()
  @IsOptional()
  @IsPositive()
  @Transform(({ value }) => parseInt(value))
  page: number;

  @IsOptional()
  @IsEnum(LogMethodEnum)
  method: LogMethodEnum;

  @IsOptional()
  @IsEnum(LogLevelEnum)
  level: LogLevelEnum;

  // @IsOptional()
  // @IsNumber()
  // status: LogStatusEnum;

  @IsOptional()
  @IsEnum(LogsSortEnum)
  sort: LogsSortEnum;
}
