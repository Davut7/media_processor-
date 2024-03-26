import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateLogDto, FindLogsFilter, LogsSortEnum } from './dto/logs.dto';
import { getSortParams } from 'src/helpers/query/queryHelpers';
import { LogsEntity } from './entity/log.entity';

@Injectable()
export class LoggerService {
  constructor(
    @InjectRepository(LogsEntity) private logsRepository: Repository<LogsEntity>,
  ) {}

  async createLog(log: CreateLogDto): Promise<LogsEntity> {
    const newLog = this.logsRepository.create(log);
    await this.logsRepository.save(newLog, { data: { isCreatingLogs: true } });
    return newLog;
  }

  async findAllLogs(query: FindLogsFilter) {
    const { page = 1, take = 10, sort = LogsSortEnum.createdAt_ASC } = query;

    const { orderField, orderDirection } = getSortParams(sort);

    const logsQuery = this.logsRepository
      .createQueryBuilder('logs')
      .orderBy(`"${orderField}"`, orderDirection)
      .take(take)
      .skip((page - 1) * take);
    if (query.level) {
      logsQuery.where('logs.level = :level', { level: query.level });
    }
    if (query.method) {
      logsQuery.where('logs.method = :method', { method: query.method });
    }
    const [logs, count] = await logsQuery.getManyAndCount();
    return {
      logs: logs,
      count: count,
      message: 'Logs returned successfully!',
    };
  }
}
