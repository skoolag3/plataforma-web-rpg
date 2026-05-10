import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type SendVerificationEmailInput = {
  email: string;
  nome: string;
  token: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: string;
};

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendVerificationEmail({
    email,
    nome,
    token,
  }: SendVerificationEmailInput) {
    const verificationUrl = this.buildVerificationUrl(token);
    const smtpConfig = this.getSmtpConfig();

    if (!smtpConfig) {
      this.logger.warn(
        `SMTP nao configurado. Link de verificacao: ${verificationUrl}`,
      );
      return;
    }

    const transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: {
        user: smtpConfig.user,
        pass: smtpConfig.pass,
      },
    });

    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: 'Verifique seu e-mail',
      html: this.buildVerificationHtml(nome, verificationUrl),
      text: `Ola, ${nome}. Verifique seu e-mail acessando: ${verificationUrl}`,
    });
  }

  private getSmtpConfig(): SmtpConfig | null {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = this.parseBoolean(process.env.SMTP_SECURE) ?? port === 465;
    const from = process.env.MAIL_FROM ?? user;

    const missing = [
      ['SMTP_HOST', host],
      ['SMTP_USER', user],
      ['SMTP_PASS', pass],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      this.logger.warn(`Variaveis SMTP ausentes: ${missing.join(', ')}`);
      return null;
    }

    if (Number.isNaN(port)) {
      this.logger.warn('SMTP_PORT invalido.');
      return null;
    }

    if (!host || !user || !pass || !from) {
      return null;
    }

    return {
      host,
      port,
      secure,
      user,
      pass,
      from,
    };
  }

  private buildVerificationHtml(nome: string, verificationUrl: string) {
    return `
      <p>Ola, ${nome}.</p>
      <p>Confirme seu e-mail para verificar sua conta.</p>
      <p><a href="${verificationUrl}">Verificar e-mail</a></p>
      <p>Esse link expira em 24 horas.</p>
    `;
  }

  private buildVerificationUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/verificar-email?token=${token}`;
  }

  private parseBoolean(value: string | undefined) {
    if (value === undefined) {
      return null;
    }

    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
}
