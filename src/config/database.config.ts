import mongoose from 'mongoose';
import {logger} from '../utils/logger';

export const connectToDatabase = async (): Promise<void> => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    logger.error('Missing MONGO_URI in environment');
    process.exit(1);
  }

  try {
    await mongoose.connect(mongoUri, {
      autoIndex: process.env.NODE_ENV !== 'production',
    });

    logger.info('🟢 MongoDB connected');
  } catch (err) {
    logger.error('🔴 MongoDB connection failed', err);
    process.exit(1);
  }
};
