import path from 'path';
import winston from 'winston';

const isProduction = process.env.NODE_ENV === 'production';

const {combine, timestamp, printf, colorize, errors} = winston.format;

const logFormat = printf(({level, message, timestamp, stack}) => {
  return `[${timestamp}] ${level}: ${stack || message}`;
});

const transports = [];

if (process.env.NODE_ENV === 'production') {
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
        colorize(),
        timestamp({format: 'YYYY-MM-DD HH:mm:ss'}),
        errors({stack: true}),
        logFormat,
      ),
    }),
  );
}

export const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug',
  levels: winston.config.npm.levels,
  format: combine(
    timestamp({format: 'DD-MM-YYYY HH:mm:ss'}),
    errors({stack: true}),
    logFormat,
  ),
  transports,
});
