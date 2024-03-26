import { Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

interface CurrentUserRequest extends Request {
  currentUser?: any;
}

const notLogHTTPUrls = ['/api/root/logs'];

export class LogsMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: CurrentUserRequest, res: Response, next: NextFunction) {
    const { method, originalUrl, hostname, currentUser } = req;

    let host;
    let incomingMessage;
    if (req.headers['x-real-ip'] === hostname) {
      host = 'localhost';
      incomingMessage = 'Internal request';
    } else {
      host = req.headers['x-real-ip'] || '';
      incomingMessage = 'External request';
    }

    const notIsLog = notLogHTTPUrls.includes(originalUrl.split('/')?.[2]);
    if (!notIsLog) {
      this.logger.log(
        incomingMessage,
        [host, originalUrl],
        0,
        method,
        JSON.stringify(currentUser ?? 'Not signed in', null, 2),
      );
    }

    res.on('finish', () => {
      const { method, originalUrl } = req;
      const { statusCode, statusMessage } = res;

      const message = `Response code: ${statusCode} - Method: ${method} - URL: ${originalUrl} - Host: ${host}.}`;
      if (statusCode < 400) {
        if (!notIsLog) {
          return this.logger.log(statusMessage, [
            host,
            originalUrl,
            statusCode,
            method,
            JSON.stringify(currentUser ?? 'Not signed in', null, 2),
            message,
          ]);
        }

        return this.logger.error(statusCode + ' Cannot log this API');
      }

      if (statusCode >= 400) {
        return this.logger.warn(message);
      }

      return this.logger.log(message);
    });
    next();
  }
}
