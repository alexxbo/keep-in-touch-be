import {MongoMemoryServer} from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.SUPPORT_EMAIL = 'support@keepintouch.com';
process.env.EMAIL_FROM = 'noreply@keepintouch.com';
process.env.EMAIL_USER = 'test@gmail.com';
process.env.EMAIL_PASS = 'testpassword';
