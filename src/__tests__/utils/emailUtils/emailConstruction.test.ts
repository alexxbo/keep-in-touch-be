import {Types} from 'mongoose';
import {IUser} from '~models/user/user.model';
import {Email} from '~utils/email';

// Mock the env config
jest.mock('~config/env.config', () => ({
  APP_NAME: 'Keep in Touch',
  SUPPORT_EMAIL: 'support@keepintouch.com',
}));

describe('Email Construction', () => {
  let testUser: Partial<IUser>;
  let resetUrl: string;

  beforeEach(() => {
    testUser = {
      email: 'test@example.com',
      name: 'John Doe',
      username: 'johndoe',
      _id: new Types.ObjectId(),
    };

    resetUrl = 'http://localhost:3001/reset-password?token=abc123';
  });

  describe('Name processing', () => {
    it('should extract first name from full name', () => {
      const userWithLongName = {
        ...testUser,
        name: 'John Michael Doe',
      };

      const emailWithLongName = new Email({
        user: userWithLongName as IUser,
        url: resetUrl,
      });

      const emailInstance = emailWithLongName as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      expect(emailInstance.firstName).toBe('John');
    });
  });

  describe('Email properties', () => {
    it('should set proper email properties', () => {
      const email = new Email({user: testUser as IUser, url: resetUrl});
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(emailInstance.to).toBe(testUser.email);
      expect(emailInstance.firstName).toBe('John');
      expect(emailInstance.url).toBe(resetUrl);
      expect(emailInstance.from).toContain('Keep in Touch');
    });
  });
});
