import * as Winston from 'winston';
import { env } from '../../globals';
import Logger from './Logger';

export default class LoggerFactor {
  public static createLogger(): Logger {
    const logger = Winston.createLogger({
      level: env.LOGGING_LEVEL,
      exitOnError: false,
      transports: [
        new Winston.transports.Console({
          format: Winston.format.simple(),
        }),
      ],
    });

    return new Logger(logger);
  }
}
