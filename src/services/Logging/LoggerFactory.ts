import * as Winston from 'winston';
import Environment from '../../util/Environment';
import Logger from './Logger';

export default class LoggerFactory {
  public static myLogger: Logger;

  public static createLogger(env: Environment): Logger {
    if (this.myLogger) {
      return this.myLogger;
    }
    else {
      const logger = Winston.createLogger({
        level: env.LOGGING_LEVEL,
        exitOnError: false,
        transports: [
          new Winston.transports.Console({
            format: Winston.format.simple(),
          }),
        ],
      });
      this.myLogger = new Logger(logger);
    }

    return this.myLogger;
  }
}
