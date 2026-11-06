import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { obterOAuthStateSecret } from '../auth/jwt.config';
import { AuthService } from '../auth/services/auth.service';

type GoogleState = {
  sub?: string;
  finalidade: 'VINCULAR_GOOGLE' | 'LOGIN_GOOGLE';
  nonce?: string;
  purpose?: string;
};

type GoogleTokenResponse = {
  id_token?: string;
};

type GoogleTokenInfo = {
  sub?: string;
  email?: string;
  email_verified?: string;
  aud?: string;
  name?: string;
};

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly authService: AuthService,
  ) {}

  gerarUrlLogin() {
    return this.gerarUrl({ finalidade: 'LOGIN_GOOGLE' });
  }

  gerarUrlVinculo(idUsuario: string) {
    return this.gerarUrl({
      sub: idUsuario,
      finalidade: 'VINCULAR_GOOGLE',
    });
  }

  private gerarUrl(payload: GoogleState) {
    const config = this.getConfig();
    const nonce = randomBytes(16).toString('hex');
    const state = this.jwtService.sign(
      { ...payload, nonce, purpose: 'oauth_state' },
      { secret: obterOAuthStateSecret(), expiresIn: '10m' },
    );
    const parametros = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'select_account',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${parametros}`,
      nonce,
    };
  }

  async processarCallback(
    code: string,
    state: string,
    nonceCookie?: string | null,
  ) {
    const config = this.getConfig();
    let payload: GoogleState;

    try {
      payload = this.jwtService.verify<GoogleState>(state, {
        secret: obterOAuthStateSecret(),
      });
    } catch {
      throw new BadRequestException('Estado OAuth inválido ou expirado.');
    }

    if (
      payload.purpose !== 'oauth_state' ||
      (payload.finalidade !== 'VINCULAR_GOOGLE' &&
        payload.finalidade !== 'LOGIN_GOOGLE')
    ) {
      throw new BadRequestException('Finalidade OAuth inválida.');
    }

    if (!payload.nonce || !nonceCookie || payload.nonce !== nonceCookie) {
      throw new BadRequestException('Sessão OAuth inválida (falha de validação CSRF).');
    }

    if (payload.finalidade === 'VINCULAR_GOOGLE' && !payload.sub) {
      throw new BadRequestException('Usuário do vínculo não informado.');
    }

    const respostaToken = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: config.clientId,
        client_secret: config.clientSecret,
        redirect_uri: config.callbackUrl,
        grant_type: 'authorization_code',
      }),
    });
    const tokens = (await respostaToken.json()) as GoogleTokenResponse;

    if (!respostaToken.ok || !tokens.id_token) {
      throw new ServiceUnavailableException(
        'O Google não concluiu a autorização.',
      );
    }

    const respostaInfo = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(tokens.id_token)}`,
    );
    const info = (await respostaInfo.json()) as GoogleTokenInfo;

    if (
      !respostaInfo.ok ||
      !info.sub ||
      info.aud !== config.clientId ||
      info.email_verified !== 'true'
    ) {
      throw new BadRequestException('Identidade Google inválida.');
    }

    if (payload.finalidade === 'LOGIN_GOOGLE') {
      return this.autenticarComGoogle(info);
    }

    await this.vincularGoogle(payload.sub!, info);
    return { finalidade: 'VINCULAR_GOOGLE' as const };
  }

  private async autenticarComGoogle(info: GoogleTokenInfo) {
    const email = info.email?.toLowerCase().trim();

    if (!email || !info.sub) {
      throw new BadRequestException('O Google não informou um e-mail válido.');
    }

    const vinculo = await this.prisma.provedorUsuario.findUnique({
      where: {
        provedor_id_provedor: {
          provedor: 'GOOGLE',
          id_provedor: info.sub,
        },
      },
      include: { usuario: true },
    });

    if (vinculo) {
      await this.prisma.provedorUsuario.update({
        where: { id: vinculo.id },
        data: { ultimo_login_em: new Date(), email_provedor: email },
      });
      return {
        finalidade: 'LOGIN_GOOGLE' as const,
        sessao: await this.authService.criarSessaoOAuth(vinculo.usuario),
      };
    }

    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email },
    });
    const nomeGoogle = info.name?.trim().slice(0, 100) || email.split('@')[0];
    const usuario = usuarioExistente
      ? await this.prisma.usuario.update({
          where: { id: usuarioExistente.id },
          data: {
            email_verificado: true,
            token_verificacao_email: null,
            token_verificacao_expira_em: null,
            ...(!usuarioExistente.email_verificado
              ? {
                  nome: nomeGoogle,
                  senha_hash: await bcrypt.hash(
                    randomBytes(32).toString('hex'),
                    10,
                  ),
                  senha_definida: false,
                  bloqueado: false,
                  tentativas_login: 0,
                }
              : {}),
          },
        })
      : await this.prisma.usuario.upsert({
          where: { email },
          create: {
            nome: nomeGoogle,
            email,
            senha_hash: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            senha_definida: false,
            email_verificado: true,
            bloqueado: false,
            tentativas_login: 0,
          },
          update: {
            email_verificado: true,
            token_verificacao_email: null,
            token_verificacao_expira_em: null,
          },
        });

    await this.prisma.provedorUsuario.upsert({
      where: {
        id_usuario_provedor: {
          id_usuario: usuario.id,
          provedor: 'GOOGLE',
        },
      },
      create: {
        id_usuario: usuario.id,
        provedor: 'GOOGLE',
        id_provedor: info.sub,
        email_provedor: email,
        ultimo_login_em: new Date(),
      },
      update: {
        id_provedor: info.sub,
        email_provedor: email,
        ultimo_login_em: new Date(),
      },
    });

    return {
      finalidade: 'LOGIN_GOOGLE' as const,
      sessao: await this.authService.criarSessaoOAuth(usuario),
    };
  }

  private async vincularGoogle(idUsuario: string, info: GoogleTokenInfo) {
    const vinculoExistente = await this.prisma.provedorUsuario.findUnique({
      where: {
        provedor_id_provedor: {
          provedor: 'GOOGLE',
          id_provedor: info.sub!,
        },
      },
    });

    if (vinculoExistente && vinculoExistente.id_usuario !== idUsuario) {
      throw new ConflictException(
        'Esta conta Google já está vinculada a outro usuário.',
      );
    }

    await this.prisma.provedorUsuario.upsert({
      where: {
        id_usuario_provedor: {
          id_usuario: idUsuario,
          provedor: 'GOOGLE',
        },
      },
      create: {
        id_usuario: idUsuario,
        provedor: 'GOOGLE',
        id_provedor: info.sub!,
        email_provedor: info.email,
      },
      update: {
        id_provedor: info.sub!,
        email_provedor: info.email,
      },
    });
  }

  private getConfig() {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackUrl = process.env.GOOGLE_CALLBACK_URL;

    if (!clientId || !clientSecret || !callbackUrl) {
      throw new ServiceUnavailableException(
        'OAuth do Google não configurado no servidor.',
      );
    }

    return { clientId, clientSecret, callbackUrl };
  }
}
