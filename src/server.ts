import dotenv from 'dotenv';
import 'module-alias/register';
import {connectToDatabase} from '~config/database.config';
import env from '~config/env.config';
import {logger} from '~utils/logger';
import app from './app';

dotenv.config();

process.on('uncaughtException', (err: Error) => {
  logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  logger.error(`${err.name}: ${err.message}\n${err.stack}`);
  process.exit(1);
});

let server: import('http').Server;

(async () => {
  try {
    await connectToDatabase();
    server = app.listen(env.PORT, () => {
      logger.info(`🚀 Server is running on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error('Failed to start server:', err);

    process.exit(1);
  }
})();

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('UNHANDLED REJECTION! 💥 Shutting down...');
  logger.error(
    reason instanceof Error
      ? `${reason.name}: ${reason.message}\n${reason.stack}`
      : String(reason),
  );

  if (server) {
    server.close(() => process.exit(1));
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM RECEIVED. Shutting down gracefully');

  if (server) {
    server.close(() => {
      logger.info('💥 Process terminated!');
      process.exit(0);
    });
  }
});

process.on('SIGINT', () => {
  logger.info('👋 SIGINT RECEIVED. Shutting down gracefully');

  if (server) {
    server.close(() => {
      logger.info('💥 Process terminated!');
      process.exit(0);
    });
  }
});
