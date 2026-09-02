import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { join } from 'node:path';

const LOGO_PATH = join(__dirname, 'assets', 'logo.jpg');
const LOGO_CID = 'logo';

// Brand colours, kept in step with frontend/src/index.css.
const DARK_GREEN = '#18744E';
const DARK = '#101010';

function passwordResetHtml(link: string): string {
  return `<!doctype html>
<html lang="pl">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>Reset hasła</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f4f4f5;">
    <!-- Inbox preview line. Hidden in the message itself; the padding stops the
         heading from being pulled in after it. -->
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Link do ustawienia nowego hasła. Ważny godzinę, działa tylko raz.
      ${'&#8199;&#65279;'.repeat(60)}
    </div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f5;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:520px;background-color:#ffffff;border-radius:12px;padding:32px;font-family:Arial,Helvetica,sans-serif;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="cid:${LOGO_CID}" width="140" alt="Bieszczadzki Uniwersytet Ludowy" style="display:block;border:0;">
              </td>
            </tr>
            <tr>
              <td align="center" style="font-size:20px;font-weight:bold;color:${DARK};padding-bottom:16px;">
                Reset hasła
              </td>
            </tr>
            <tr>
              <td style="font-size:15px;line-height:22px;color:${DARK};padding-bottom:24px;">
                Otrzymaliśmy prośbę o zresetowanie hasła do Twojego konta
                w Wirtualnym Biurze. Kliknij przycisk poniżej, aby ustawić nowe
                hasło.
              </td>
            </tr>
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <a href="${link}" style="display:inline-block;background-color:${DARK_GREEN};color:#ffffff;text-decoration:none;font-size:15px;font-weight:bold;padding:14px 28px;border-radius:8px;">
                  Ustaw nowe hasło
                </a>
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:20px;color:#6b7280;padding-bottom:16px;">
                Link jest ważny przez godzinę i można go użyć tylko raz.
                Jeśli przycisk nie działa, skopiuj ten adres do przeglądarki:
              </td>
            </tr>
            <tr>
              <td style="font-size:12px;line-height:18px;color:#6b7280;word-break:break-all;padding-bottom:24px;">
                ${link}
              </td>
            </tr>
            <tr>
              <td style="font-size:13px;line-height:20px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:16px;">
                Jeśli to nie Ty prosiłeś o reset, zignoruj tę wiadomość.
                Twoje hasło pozostanie bez zmian.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

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
      html: passwordResetHtml(link),
      attachments: [
        {
          filename: 'logo.jpg',
          path: LOGO_PATH,
          cid: LOGO_CID,
        },
      ],
    });
  }
}
