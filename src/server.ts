import dotenv from 'dotenv';
import app from './app';
import {connectToDatabase} from './config/database';
import {logger} from './utils/logger';

dotenv.config();

(async () => {
  await connectToDatabase();
  const PORT = process.env.PORT || 3000;

  app.listen(PORT, () => {
    logger.info(`🚀 Server is running on port ${PORT}`);
  });
})();
