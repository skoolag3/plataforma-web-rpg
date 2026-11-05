import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as nodemailer from 'nodemailer';

type SendVerificationEmailInput = {
  email: string;
  nome: string;
  token: string;
};

type SendPasswordResetEmailInput = SendVerificationEmailInput;

type SendEmailChangeConfirmationInput = SendVerificationEmailInput & {
  novoEmail: string;
};

type SendPendingEmailVerificationInput = SendVerificationEmailInput & {
  emailAtual: string;
};

type SmtpConfig = {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  from: { name: string; address: string };
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
      subject: 'AnimeCards: confirme seu e-mail',
      html: this.buildVerificationHtml(nome, verificationUrl),
      text: `Olá, ${nome}. Você criou uma conta no AnimeCards. Confirme seu e-mail para começar a jogar: ${verificationUrl}\n\nO link expira em 24 horas. Se você não criou essa conta, ignore esta mensagem.`,
    });
    this.logger.log('SMTP aceitou o e-mail de verificação.');
  }

  async sendPasswordResetEmail({
    email,
    nome,
    token,
  }: SendPasswordResetEmailInput) {
    const resetUrl = this.buildPasswordResetUrl(token);
    const smtpConfig = this.getSmtpConfig();

    if (!smtpConfig) {
      this.logger.warn(
        `SMTP nao configurado. Link de redefinicao de senha: ${resetUrl}`,
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
      subject: 'AnimeCards: redefina sua senha',
      html: this.buildPasswordResetHtml(nome, resetUrl),
      text: `Ola, ${nome}. Redefina sua senha acessando: ${resetUrl}`,
    });
    this.logger.log('SMTP aceitou o e-mail de redefinição de senha.');
  }

  async sendEmailChangeConfirmation({
    email,
    nome,
    token,
    novoEmail,
  }: SendEmailChangeConfirmationInput) {
    const confirmationUrl = this.buildEmailChangeConfirmationUrl(token);
    const smtpConfig = this.getSmtpConfig();

    if (!smtpConfig) {
      this.logger.warn(
        `SMTP nao configurado. Link de confirmacao da troca: ${confirmationUrl}`,
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

    const nomeSeguro = this.escaparHtml(nome);
    const novoEmailSeguro = this.escaparHtml(novoEmail);

    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: 'AnimeCards: confirme a troca do seu e-mail',
      html: this.buildEmailHtml(
        `Olá, ${nomeSeguro}.`,
        `Recebemos uma solicitação para trocar seu e-mail para ${novoEmailSeguro}.`,
        'Confirmar troca de e-mail',
        confirmationUrl,
        'O link expira em 30 minutos. Se você não solicitou a troca, ignore esta mensagem.',
      ),
      text: `Ola, ${nome}. Confirme a troca para ${novoEmail}: ${confirmationUrl}`,
    });
    this.logger.log('SMTP aceitou o e-mail de confirmação de troca.');
  }

  async sendPendingEmailVerification({
    email,
    nome,
    token,
    emailAtual,
  }: SendPendingEmailVerificationInput) {
    const confirmationUrl = this.buildEmailChangeConfirmationUrl(token);
    const smtpConfig = this.getSmtpConfig();

    if (!smtpConfig) {
      this.logger.warn(
        `SMTP nao configurado. Link do novo e-mail: ${confirmationUrl}`,
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

    const nomeSeguro = this.escaparHtml(nome);
    const emailAtualSeguro = this.escaparHtml(emailAtual);

    await transporter.sendMail({
      from: smtpConfig.from,
      to: email,
      subject: 'AnimeCards: confirme seu novo e-mail',
      html: this.buildEmailHtml(
        `Olá, ${nomeSeguro}.`,
        `O endereço atual ${emailAtualSeguro} autorizou a troca para este e-mail.`,
        'Concluir troca de e-mail',
        confirmationUrl,
        'O link expira em 30 minutos. A troca só acontece depois deste clique.',
      ),
      text: `Ola, ${nome}. Conclua a troca do e-mail ${emailAtual}: ${confirmationUrl}`,
    });
    this.logger.log('SMTP aceitou o e-mail para o novo endereço.');
  }

  private getSmtpConfig(): SmtpConfig | null {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const secure = this.parseBoolean(process.env.SMTP_SECURE) ?? port === 465;
    const from = process.env.MAIL_FROM?.trim() || user;

    const missing = [
      ['SMTP_HOST', host],
      ['SMTP_USER', user],
      ['SMTP_PASS', pass],
    ]
      .filter(([, value]) => !value)
      .map(([name]) => name);

    if (missing.length > 0) {
      this.logger.warn(`Variaveis SMTP ausentes: ${missing.join(', ')}`);
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'Envio de e-mail indisponível. Tente novamente mais tarde.',
        );
      }
      return null;
    }

    if (!Number.isInteger(port) || port < 1 || port > 65535) {
      this.logger.warn('SMTP_PORT inválido.');
      if (process.env.NODE_ENV === 'production') {
        throw new ServiceUnavailableException(
          'Envio de e-mail indisponível. Tente novamente mais tarde.',
        );
      }
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
      from: {
        name: 'AnimeCards',
        address: from.match(/<([^<>]+)>/)?.[1] ?? from,
      },
    };
  }

  private buildVerificationHtml(nome: string, verificationUrl: string) {
    const nomeSeguro = this.escaparHtml(nome);
    return this.buildEmailHtml(
      `Olá, ${nomeSeguro}.`,
      'Você criou uma conta no AnimeCards. Confirme seu e-mail para começar a jogar.',
      'Confirmar meu e-mail',
      verificationUrl,
      'O link expira em 24 horas. Se você não criou essa conta, ignore esta mensagem.',
    );
  }

  private buildPasswordResetHtml(nome: string, resetUrl: string) {
    const nomeSeguro = this.escaparHtml(nome);
    return this.buildEmailHtml(
      `Olá, ${nomeSeguro}.`,
      'Recebemos uma solicitação para alterar sua senha.',
      'Alterar senha',
      resetUrl,
      'O link expira em 1 hora. Se você não pediu isso, ignore este e-mail.',
    );
  }

  private buildEmailHtml(
    saudacao: string,
    descricao: string,
    acao: string,
    url: string,
    aviso: string,
  ) {
    const frontendUrl = (
      process.env.FRONTEND_URL ?? 'http://localhost:3000'
    ).replace(/\/$/, '');
    const bannerUrl = `${frontendUrl}/email/animecards-banner.png`;
    return `<!doctype html>
      <html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head>
      <body style="margin:0;padding:24px 12px;background:#0a0a14;font-family:Arial,sans-serif;color:#f4f1ff">
        <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;margin:0 auto;background:#111020;border:1px solid #34254f;border-radius:16px;overflow:hidden">
          <tr><td style="padding:0;background:#000;text-align:center">
            <img src="${bannerUrl}" alt="AnimeCards" width="560" style="display:block;width:100%;max-width:560px;height:auto;border:0;color:#fff;font-size:24px;font-weight:bold">
          </td></tr>
          <tr><td style="padding:28px 30px 32px;line-height:1.6">
            <p style="margin:0 0 14px;font-size:18px;font-weight:bold;color:#fff">${saudacao}</p>
            <p style="margin:0 0 26px;font-size:15px;color:#ded8ed">${descricao}</p>
            <p style="margin:0 0 26px"><a href="${url}" style="display:inline-block;padding:13px 22px;border-radius:9px;background:#7938d9;color:#fff;font-size:15px;font-weight:bold;text-decoration:none">${acao}</a></p>
            <p style="margin:0;font-size:13px;color:#aaa2bb">${aviso}</p>
          </td></tr>
        </table>
      </body></html>`;
  }

  private escaparHtml(valor: string) {
    return valor
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }

  private buildVerificationUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/verificar-email?token=${token}`;
  }

  private buildPasswordResetUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/alterar-senha?token=${token}`;
  }

  private buildEmailChangeConfirmationUrl(token: string) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    return `${frontendUrl}/confirmar-troca-email?token=${token}`;
  }

  private parseBoolean(value: string | undefined) {
    if (value === undefined) {
      return null;
    }

    return ['true', '1', 'yes'].includes(value.toLowerCase());
  }
}
