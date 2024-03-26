import { LogLevel } from '@nestjs/common';

function getLogLevels(isProduction: boolean): LogLevel[] {
  if (isProduction) {
    return ['log', 'warn', 'error'];
  }
  return ['log', 'warn', 'error', 'verbose', 'debug'];
}
export default getLogLevels;
