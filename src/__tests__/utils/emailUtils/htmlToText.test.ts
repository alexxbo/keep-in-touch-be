import {convert} from 'html-to-text';
import {Types} from 'mongoose';

import {IUser} from '~models/user/user.model';

import {Email} from '~utils/email';

// Mock the env config
jest.mock('~config/env.config', () => ({
  APP_NAME: 'Keep in Touch',
  SUPPORT_EMAIL: 'support@keepintouch.com',
}));

describe('HTML to Text Conversion', () => {
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

  describe('Text conversion formatting', () => {
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
});
