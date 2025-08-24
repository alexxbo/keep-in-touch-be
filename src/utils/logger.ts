import winston from 'winston';

import {loggerOptions} from '~config/logger.config';

export const logger = winston.createLogger(loggerOptions);
