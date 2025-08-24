import {Types} from 'mongoose';
import {IUser} from '../../../models/user/user.model';
import {Email} from '../../../utils/email';

describe('Email Template Rendering', () => {
  let testUser: Partial<IUser>;
  let email: Email;
  let resetUrl: string;

  beforeEach(() => {
    // Set environment variables for testing
    process.env.APP_NAME = 'Keep in Touch';
    process.env.SUPPORT_EMAIL = 'support@keepintouch.com';

    testUser = {
      email: 'test@example.com',
      name: 'John Doe',
      username: 'johndoe',
      _id: new Types.ObjectId(),
    };

    resetUrl = 'http://localhost:3001/reset-password?token=abc123';
    email = new Email({user: testUser as IUser, url: resetUrl});
  });

  describe('Success cases', () => {
    it('should render HTML template successfully', async () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const htmlContent = await emailInstance.renderTemplate(
        'passwordReset.html.ejs',
      );

      expect(htmlContent).toBeTruthy();
      expect(htmlContent).toContain('<!DOCTYPE html>');
      expect(htmlContent).toContain('Hello John!');
      expect(htmlContent).toContain('Keep in Touch');
      expect(htmlContent).toContain(resetUrl);
    });
  });

  describe('Error cases', () => {
    it('should handle template rendering errors gracefully', async () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const htmlContent = await emailInstance.renderTemplate(
        'nonexistent.html.ejs',
      );

      expect(htmlContent).toBe('<p>Email template error</p>');
    });
  });
});
