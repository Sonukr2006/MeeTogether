import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  async sendEmail(input: SendEmailInput) {
    const provider = this.configService.get<string>('email.provider') ?? 'console';

    switch (provider) {
      case 'resend':
        return this.sendWithResend(input);
      case 'console':
      default:
        return this.sendToConsole(input);
    }
  }

  private async sendWithResend(input: SendEmailInput) {
    const apiKey = this.configService.get<string>('email.resendApiKey');
    const from = this.configService.get<string>('email.from');

    if (!apiKey || !from) {
      this.logger.warn('Resend provider configured without RESEND_API_KEY or EMAIL_FROM. Falling back to console.');
      return this.sendToConsole(input);
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Failed to send email via Resend: ${body}`);
    }

    return { provider: 'resend' };
  }

  private sendToConsole(input: SendEmailInput) {
    this.logger.log(
      JSON.stringify({
        type: 'email_preview',
        to: input.to,
        subject: input.subject,
        text: input.text,
      }),
    );

    return { provider: 'console' };
  }
}
