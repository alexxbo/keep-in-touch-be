import {convert} from 'html-to-text';
import {Types} from 'mongoose';
import {IUser} from '../../models/user/user.model';
import {Email} from '../../utils/email';

describe('Email Service', () => {
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

  describe('Template Rendering', () => {
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

    it('should handle template rendering errors gracefully', async () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const htmlContent = await emailInstance.renderTemplate(
        'nonexistent.html.ejs',
      );

      expect(htmlContent).toBe('<p>Email template error</p>');
    });
  });

  describe('HTML to Text Conversion', () => {
    it('should convert HTML to text with proper formatting', async () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const htmlContent = await emailInstance.renderTemplate(
        'passwordReset.html.ejs',
      );

      const textContent = convert(htmlContent, {
        wordwrap: 80,
        preserveNewlines: true,
        selectors: [
          {selector: 'a', options: {ignoreHref: false}},
          {selector: 'img', format: 'skip'},
          {
            selector: '.button',
            format: 'anchor',
            options: {ignoreHref: false},
          },
          {selector: 'h1', format: 'heading', options: {uppercase: false}},
          {selector: 'h2', format: 'heading', options: {uppercase: false}},
          {selector: '.warning', format: 'block'},
          {selector: '.url-fallback', format: 'block'},
        ],
        formatters: {
          heading: function (elem, walk, builder, formatOptions) {
            builder.openBlock({
              leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
            });
            walk(elem.children, builder);
            builder.closeBlock({
              trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
            });
          },
          block: function (elem, walk, builder) {
            builder.openBlock({leadingLineBreaks: 1});
            walk(elem.children, builder);
            builder.closeBlock({trailingLineBreaks: 1});
          },
        },
      });

      expect(textContent).toBeTruthy();
      expect(textContent).toContain('Hello John!');
      expect(textContent).toContain('Keep in Touch');
      expect(textContent).toContain(resetUrl);
      expect(textContent).toContain('Reset Password');
      expect(textContent).not.toContain('<');
      expect(textContent).not.toContain('>');
    });

    it('should preserve URLs in text conversion', async () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      const htmlContent = await emailInstance.renderTemplate(
        'passwordReset.html.ejs',
      );

      const textContent = convert(htmlContent, {
        wordwrap: 80,
        selectors: [
          {selector: 'a', options: {ignoreHref: false}},
          {
            selector: '.button',
            format: 'anchor',
            options: {ignoreHref: false},
          },
        ],
      });

      expect(textContent).toContain(resetUrl);
    });
  });

  describe('Email Construction', () => {
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

    it('should set proper email properties', () => {
      const emailInstance = email as any; // eslint-disable-line @typescript-eslint/no-explicit-any

      expect(emailInstance.to).toBe(testUser.email);
      expect(emailInstance.firstName).toBe('John');
      expect(emailInstance.url).toBe(resetUrl);
      expect(emailInstance.from).toContain('Keep in Touch');
    });
  });

  describe('Password Reset Email', () => {
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
