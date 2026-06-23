import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma.service';

type GoogleState = {
  sub: string;
  finalidade: 'VINCULAR_GOOGLE';
};

type GoogleTokenResponse = {
  id_token?: string;
};

type GoogleTokenInfo = {
  sub?: string;
  email?: string;
  email_verified?: string;
  aud?: string;
};

@Injectable()
export class GoogleOAuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  gerarUrlVinculo(idUsuario: string) {
    const config = this.getConfig();
    const state = this.jwtService.sign(
      { sub: idUsuario, finalidade: 'VINCULAR_GOOGLE' },
      { expiresIn: '10m' },
    );
    const parametros = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.callbackUrl,
      response_type: 'code',
      scope: 'openid email profile',
      state,
      access_type: 'offline',
      prompt: 'consent',
    });

    return {
      url: `https://accounts.google.com/o/oauth2/v2/auth?${parametros}`,
    };
  }

  async processarCallback(code: string, state: string) {
    const config = this.getConfig();
    let payload: GoogleState;

    try {
      payload = this.jwtService.verify<GoogleState>(state);
    } catch {
      throw new BadRequestException('Estado OAuth invalido ou expirado.');
    }

    if (payload.finalidade !== 'VINCULAR_GOOGLE') {
      throw new BadRequestException('Finalidade OAuth invalida.');
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
        'Google nao concluiu a autorizacao.',
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
      throw new BadRequestException('Identidade Google invalida.');
    }

    const vinculoExistente = await this.prisma.provedorUsuario.findUnique({
      where: {
        provedor_id_provedor: {
          provedor: 'GOOGLE',
          id_provedor: info.sub,
        },
      },
    });

    if (vinculoExistente && vinculoExistente.id_usuario !== payload.sub) {
      throw new ConflictException(
        'Esta conta Google ja esta vinculada a outro usuario.',
      );
    }

    await this.prisma.provedorUsuario.upsert({
      where: {
        id_usuario_provedor: {
          id_usuario: payload.sub,
          provedor: 'GOOGLE',
        },
      },
      create: {
        id_usuario: payload.sub,
        provedor: 'GOOGLE',
        id_provedor: info.sub,
        email_provedor: info.email,
      },
      update: {
        id_provedor: info.sub,
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
        'OAuth Google nao configurado no servidor.',
      );
    }

    return { clientId, clientSecret, callbackUrl };
  }
}
