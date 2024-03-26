import {
  ConsoleLogger,
  ConsoleLoggerOptions,
  Injectable,
} from '@nestjs/common';
import { LoggerService } from '../../../logger/logger.service';
import { ConfigService } from '@nestjs/config';
import getLogLevels from './getLog';

const NOT_LOG_HTTP_URLS = ['api/root/logs'];
const notSaveInDBContexts = [
  'LogsService',
  'InstanceLoader',
  'RoutesResolver',
  'RouterExplorer',
  'NestApplication',
  'SQL',
];
const notLogContexts = ['logs'];

@Injectable()
class CustomLogger extends ConsoleLogger {
  private readonly logService: LoggerService;
  private readonly configService: ConfigService;

  constructor(
    context: string,
    options: ConsoleLoggerOptions,
    configService: ConfigService,
    logService: LoggerService,
  ) {
    const environment = configService.get('environment');

    super(context, {
      ...options,
      logLevels: getLogLevels(
        environment === 'production' || environment === 'production2',
      ),
    });

    this.configService = configService;
    this.logService = logService;
  }

  async log(message: string, ...optionalParams: any[]) {
    if (optionalParams.length === 1) {
      const context = optionalParams[0];
      if (notLogContexts.includes(context)) {
        return;
      }
      super.log.apply(this, [message, context]);
      if (notSaveInDBContexts.includes(context)) {
        return;
      }
      await this.logService.createLog({
        message,
        context,
        level: 'log',
      });
    } else {
      const [
        [host, url, statusCode, method, user, nextLoggerMessage],
        context,
      ] = optionalParams;

      super.log.apply(this, [
        nextLoggerMessage || message,
        context || optionalParams[optionalParams.length - 1],
      ]);

      await this.logService.createLog({
        host,
        url,
        statusCode,
        method,
        user,
        message,
        context: context || optionalParams[optionalParams.length - 1],
        level: 'log',
      });
    }
  }

  async error(message: string, ...optionalParams: any[]) {
    const context = optionalParams.pop();
    super.error.apply(this, [message, context]);
    if (notLogContexts.includes(context)) {
      return;
    }
    super.log.apply(this, [message, context]);
    if (notSaveInDBContexts.includes(context)) {
      return;
    }
    await this.logService.createLog({
      message,
      context,
      level: 'log',
    });
    if (optionalParams[0]) {
      const [host, url, statusCode, method, user] = optionalParams[0];

      await this.logService.createLog({
        host,
        url,
        statusCode,
        method,
        user,
        message,
        context: context,
        level: 'error',
      });
    } else {
      await this.logService.createLog({
        message,
        context,
        level: 'error',
      });
    }
  }

  async warn(message: string, context?: string) {
    super.warn.apply(this, [message, context]);
    if (notLogContexts.includes(context)) {
      return;
    }
    super.log.apply(this, [message, context]);
    if (notSaveInDBContexts.includes(context)) {
      return;
    }
    await this.logService.createLog({
      message,
      context,
      level: 'log',
    });
    await this.logService.createLog({
      message,
      context,
      level: 'warn',
    });
  }

  async debug(message: string, context?: string) {
    super.debug.apply(this, [message, context]);

    if (notLogContexts.includes(context)) {
      return;
    }
    super.log.apply(this, [message, context]);
    if (notSaveInDBContexts.includes(context)) {
      return;
    }
    await this.logService.createLog({
      message,
      context,
      level: 'log',
    });

    if (this.configService.get('environment') === 'development') {
      await this.logService.createLog({
        message,
        context,
        level: 'debug',
      });
    }
  }

  async verbose(message: string, context?: string) {
    if (notLogContexts.includes(context)) {
      return;
    }
    super.log.apply(this, [message, context]);
    if (notSaveInDBContexts.includes(context)) {
      return;
    }
    await this.logService.createLog({
      message,
      context,
      level: 'log',
    });

    if (this.configService.get('environment') === 'development') {
      await this.logService.createLog({
        message,
        context,
        level: 'verbose',
      });
    }
  }
}

export default CustomLogger;
