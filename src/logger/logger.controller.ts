import { Controller, Get, Query } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { FindLogsFilter } from './dto/logs.dto';

@Controller('/root/logs')
export class LoggerController {
  constructor(private readonly loggerService: LoggerService) {}

  @Get()
  getLogs(@Query() query: FindLogsFilter) {
    return this.loggerService.findAllLogs(query);
  }
}
