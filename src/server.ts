import dotenv from 'dotenv';
import app from './app';
import {connectToDatabase} from './config/database.config';
import {logger} from './utils/logger';

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
    const PORT = process.env.PORT || 3000;
    server = app.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT}`);
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
