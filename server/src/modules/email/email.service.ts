import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html?: string;
};

@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const nodeEnv = this.configService.get<string>('nodeEnv');
    if (nodeEnv !== 'production') return;

    const provider = this.configService.get<string>('email.provider');
    if (!provider || provider === 'console') {
      throw new Error(
        'Production requires a real email provider (e.g., resend). EMAIL_PROVIDER is set to "console" or missing.',
      );
    }

    const apiKey = this.configService.get<string>('email.resendApiKey');
    if (!apiKey) {
      throw new Error(
        'RESEND_API_KEY is required in production. Email delivery cannot fall back to console.',
      );
    }
  }

  async sendEmail(input: SendEmailInput) {
    const provider = this.configService.get<string>('email.provider') ?? 'console';
    const nodeEnv = this.configService.get<string>('nodeEnv');

    if (nodeEnv === 'production' && provider === 'console') {
      throw new Error(
        'Email delivery via console is not permitted in production. Configure a real email provider.',
      );
    }

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
      throw new Error(
        'Resend email provider is not properly configured: missing RESEND_API_KEY or EMAIL_FROM.',
      );
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
      const error = new Error(`Failed to send email via Resend: ${body}`);
      this.logger.error({
        message: 'Email delivery failed',
        provider: 'resend',
        to: input.to,
        subject: input.subject,
        statusCode: response.status,
        responseBody: body,
      });
      throw error;
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
