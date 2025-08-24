import {Types} from 'mongoose';

import {IUser} from '~models/user/user.model';

import {Email} from '~utils/email';

// Mock the env config
jest.mock('~config/env.config', () => ({
  APP_NAME: 'Keep in Touch',
  SUPPORT_EMAIL: 'support@keepintouch.com',
}));

describe('Password Reset Email', () => {
  let testUser: Partial<IUser>;
  let email: Email;
  let resetUrl: string;

  beforeEach(() => {
    testUser = {
      email: 'test@example.com',
      name: 'John Doe',
      username: 'johndoe',
      _id: new Types.ObjectId(),
    };

    resetUrl = 'http://localhost:3001/reset-password?token=abc123';
    email = new Email({user: testUser as IUser, url: resetUrl});
  });

  describe('Email sending', () => {
    it('should send password reset email without errors', async () => {
      // Mock the transport to avoid actual email sending in tests
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any
      const mockSendMail = jest.fn().mockResolvedValue(true);

      emailInstance.newTransport = jest.fn().mockReturnValue({
        sendMail: mockSendMail,
      });

      await expect(email.sendPasswordReset()).resolves.not.toThrow();
      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          from: expect.stringContaining('Keep in Touch'),
          to: testUser.email,
          subject: 'Reset Your Password - Keep in Touch',
          html: expect.stringContaining('<!DOCTYPE html>'),
          text: expect.stringContaining('Hello John!'),
        }),
      );
    });
  });
});
