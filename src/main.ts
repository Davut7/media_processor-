import { HttpAdapterHost, NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import * as Sentry from '@sentry/node';
import { SentryFilter } from './utils/sentry.filter';
import CustomLogger from './helpers/constants/logger/customLogger';
declare const module: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger:
      process.env.NODE_ENV === 'production'
        ? ['error']
        : ['log', 'debug', 'error', 'warn'],
  });

  Sentry.init({
    dsn: process.env.SENTRY_DNS,
  });
  const { httpAdapter } = app.get(HttpAdapterHost);
  app.useGlobalFilters(new SentryFilter(httpAdapter));
  await app.listen(() => {
    console.log(`Your server is listening on port ${port}`);
  });
  app.useLogger(app.get(CustomLogger));

  if (module.hot) {
    module.hot.accept();
    module.hot.dispose(() => app.close());
  }
}
bootstrap();
