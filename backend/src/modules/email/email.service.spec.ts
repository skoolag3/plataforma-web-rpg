import { ServiceUnavailableException } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailService } from './email.service';

jest.mock('nodemailer', () => ({ createTransport: jest.fn() }));

describe('EmailService', () => {
  const anterior = {
    nodeEnv: process.env.NODE_ENV,
    host: process.env.SMTP_HOST,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    port: process.env.SMTP_PORT,
    from: process.env.MAIL_FROM,
    frontendUrl: process.env.FRONTEND_URL,
  };

  afterEach(() => {
    jest.clearAllMocks();
    for (const [chave, valor] of Object.entries({
      NODE_ENV: anterior.nodeEnv,
      SMTP_HOST: anterior.host,
      SMTP_USER: anterior.user,
      SMTP_PASS: anterior.pass,
      SMTP_PORT: anterior.port,
      MAIL_FROM: anterior.from,
      FRONTEND_URL: anterior.frontendUrl,
    })) {
      if (valor === undefined) delete process.env[chave];
      else process.env[chave] = valor;
    }
  });

  it('não informa envio quando falta configuração SMTP em produção', async () => {
    process.env.NODE_ENV = 'production';
    delete process.env.SMTP_HOST;
    delete process.env.SMTP_USER;
    delete process.env.SMTP_PASS;

    await expect(
      new EmailService().sendVerificationEmail({
        email: 'teste@example.com',
        nome: 'Teste',
        token: 'token-de-teste',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('não informa envio quando a porta SMTP é inválida em produção', async () => {
    process.env.NODE_ENV = 'production';
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'teste@example.com';
    process.env.SMTP_PASS = 'senha-de-teste';
    process.env.SMTP_PORT = '0';

    await expect(
      new EmailService().sendVerificationEmail({
        email: 'teste@example.com',
        nome: 'Teste',
        token: 'token-de-teste',
      }),
    ).rejects.toBeInstanceOf(ServiceUnavailableException);
  });

  it('envia uma verificação identificada como AnimeCards', async () => {
    process.env.SMTP_HOST = 'smtp.example.com';
    process.env.SMTP_USER = 'animecards@example.com';
    process.env.SMTP_PASS = 'senha-de-teste';
    process.env.SMTP_PORT = '587';
    process.env.MAIL_FROM = 'AnimeCards <animecards@example.com>';
    process.env.FRONTEND_URL = 'https://animecards.example.com';
    const enviar = jest.fn().mockResolvedValue({ messageId: 'teste' });
    (nodemailer.createTransport as jest.Mock).mockReturnValue({
      sendMail: enviar,
    });

    await new EmailService().sendVerificationEmail({
      email: 'jogador@example.com',
      nome: 'Jogador',
      token: 'token-de-teste',
    });

    expect(enviar).toHaveBeenCalledTimes(1);
    const mensagem = (
      enviar.mock.calls as unknown as [nodemailer.SendMailOptions][]
    )[0][0];
    expect(mensagem.from).toEqual({
      name: 'AnimeCards',
      address: 'animecards@example.com',
    });
    expect(mensagem.to).toBe('jogador@example.com');
    expect(mensagem.subject).toBe('AnimeCards: confirme seu e-mail');
    expect(mensagem.html).toContain('Se você não criou essa conta');
    expect(mensagem.html).toContain(
      'src="https://animecards.example.com/email/animecards-banner.png"',
    );
    expect(mensagem.text).toContain('AnimeCards');
  });
});
