import Environment from './util/Environment';
import Logger from './services/Logging/Logger';
import LoggerFactor from './services/Logging/LoggerFactory';

export const env = new Environment(process.env);
export const logger = LoggerFactor.createLogger();
