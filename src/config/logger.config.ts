import path from 'path';
import winston from 'winston';

import env from './env.config';

const isProduction = env.NODE_ENV === 'production';

const {align, combine, timestamp, printf, colorize} = winston.format;
const transports = [];

if (isProduction) {
  transports.push(
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
    }),
  );
} else {
  transports.push(
    new winston.transports.Console({
      format: combine(
        colorize({all: true}),
        timestamp({format: 'YYYY-MM-DD hh:mm:ss.SSS A'}),
        align(),
        printf(
          info =>
            `[${info.timestamp}] ${info.level}: ${info.message} ${info.stack ? `\n${info.stack}` : ''}`,
        ),
      ),
    }),
  );
}

export const loggerOptions = {
  level: env.LOG_LEVEL,
  levels: winston.config.npm.levels,
  transports,
  exitOnError: false,
  exceptionHandlers: [
    new winston.transports.File({filename: path.join('logs', 'exception.log')}),
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join('logs', 'rejections.log'),
    }),
  ],
};
