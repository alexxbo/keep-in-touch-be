import ejs from 'ejs';
import {convert} from 'html-to-text';
import nodemailer, {type Transporter} from 'nodemailer';
import path from 'path';
import env from '../config/env.config';
import {IUser} from '../models/user/user.model';

interface EmailOptions {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}

interface EmailConstructorParams {
  user: IUser;
  url: string;
}

export class Email {
  readonly to: string;
  readonly firstName: string;
  readonly url: string;
  readonly from: string;

  constructor({user, url}: EmailConstructorParams) {
    this.to = user.email;
    this.firstName = user.name.split(' ')[0];
    this.url = url;
    this.from = `Keep in Touch <${env.EMAIL_FROM || 'noreply@keepintouch.com'}>`;
  }

  private newTransport(): Transporter {
    return nodemailer.createTransport({
      service: env.EMAIL_SERVICE,
      auth: {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      },
    });
  }

  async send(template: string, subject: string): Promise<void> {
    const html = await this.renderTemplate(`${template}.html.ejs`);

    const text = convert(html, {
      wordwrap: 80,
      preserveNewlines: true,
      selectors: [
        // Make links more readable
        {selector: 'a', options: {ignoreHref: false}},
        // Skip images and focus on content
        {selector: 'img', format: 'skip'},
        // Convert buttons to plain text with URL
        {
          selector: '.button',
          format: 'anchor',
          options: {ignoreHref: false},
        },
        // Style headers nicely
        {selector: 'h1', format: 'heading', options: {uppercase: false}},
        {selector: 'h2', format: 'heading', options: {uppercase: false}},
        // Add spacing around warning sections
        {selector: '.warning', format: 'block'},
        // Handle the URL fallback section
        {selector: '.url-fallback', format: 'block'},
      ],
      formatters: {
        // Custom formatter for headings
        heading: function (elem, walk, builder, formatOptions) {
          builder.openBlock({
            leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
          });
          walk(elem.children, builder);
          builder.closeBlock({
            trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
          });
        },
        // Custom formatter for blocks with spacing
        block: function (elem, walk, builder) {
          builder.openBlock({leadingLineBreaks: 1});
          walk(elem.children, builder);
          builder.closeBlock({trailingLineBreaks: 1});
        },
      },
    });

    const mailOptions: EmailOptions = {
      from: this.from,
      to: this.to,
      subject,
      html,
      text,
    };

    try {
      await this.newTransport().sendMail(mailOptions);
    } catch (error) {
      console.error('Error sending email:', error);
    }
  }

  private async renderTemplate(templateName: string): Promise<string> {
    const templatePath = path.join(
      __dirname,
      '../templates/emails',
      templateName,
    );

    try {
      return await ejs.renderFile(templatePath, {
        firstName: this.firstName,
        url: this.url,
        appName: env.APP_NAME,
        supportEmail: env.SUPPORT_EMAIL,
      });
    } catch (error) {
      console.error(`Failed to render email template ${templateName}:`, error);
      return '<p>Email template error</p>';
    }
  }

  async sendPasswordReset(): Promise<void> {
    await this.send('passwordReset', 'Reset Your Password - Keep in Touch');
  }
}
