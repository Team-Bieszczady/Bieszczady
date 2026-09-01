import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly transporter: nodemailer.Transporter;

  constructor(private readonly config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.getOrThrow<string>('SMTP_HOST'),
      port: Number(this.config.getOrThrow<string>('SMTP_PORT')),
      auth: {
        user: this.config.getOrThrow<string>('SMTP_USER'),
        pass: this.config.getOrThrow<string>('SMTP_PASS'),
      },
    });
  }

  async sendPasswordReset(to: string, token: string): Promise<void> {
    const adres = this.config.getOrThrow<string>('CORS_ORIGIN');
    const link = `${adres}/reset-password?token=${token}`;
    await this.transporter.sendMail({
      from: this.config.getOrThrow<string>('SMTP_FROM'),
      to,
      subject: 'Reset hasła',
      text: `Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta w Wirtualnym Biurze.

Kliknij poniższy link, aby ustawić nowe hasło. Link jest ważny przez godzinę:
${link}

Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość. Twoje hasło pozostanie bez zmian.`,
    });
  }
}
