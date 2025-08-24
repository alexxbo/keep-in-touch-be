import mongoose from 'mongoose';
import {logger} from '~utils/logger';
import env from './env.config';

export const connectToDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(env.MONGODB_URI, {
      autoIndex: env.NODE_ENV !== 'production',
    });

    logger.info('🟢 MongoDB connected');
  } catch (err) {
    logger.error('🔴 MongoDB connection failed', err);
    process.exit(1);
  }
};
