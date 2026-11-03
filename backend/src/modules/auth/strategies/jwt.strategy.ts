import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { obterJwtSecret } from '../jwt.config';
import { extrairCookie, NOME_COOKIE_SESSAO } from '../auth-cookie';
import { tokenFoiRevogado } from '../session-revocation';

type JwtPayload = {
  sub: string;
  purpose?: string;
  finalidade?: string;
  jti?: string;
  iat?: number;
};

export function extrairJwt(request: Request) {
  const tokenCabecalho = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (tokenCabecalho && tokenCabecalho !== '__cookie_session__') {
    return tokenCabecalho;
  }

  return extrairCookie(request, NOME_COOKIE_SESSAO);
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: extrairJwt,
      ignoreExpiration: false,
      secretOrKey: obterJwtSecret(),
    });
  }

  async validate(payload: JwtPayload) {
    if (
      payload.finalidade ||
      (payload.purpose !== undefined && payload.purpose !== 'session')
    ) {
      throw new UnauthorizedException('Token inválido para autenticação de sessão.');
    }

    if (tokenFoiRevogado(payload.sub, payload.jti, payload.iat)) {
      throw new UnauthorizedException('Sessão encerrada ou expirada.');
    }

    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: payload.sub,
        ativo: true,
        email_verificado: true,
        excluido_em: null,
      },
      select: {
        id: true,
        email: true,
        is_admin: true,
        bloqueado: true,
        tentativas_login: true,
      },
    });

    const bloqueadoPorAdmin =
      Boolean(usuario?.bloqueado) && (usuario?.tentativas_login ?? 0) < 5;

    if (!usuario || bloqueadoPorAdmin) {
      throw new UnauthorizedException('Sessão inválida ou conta indisponível.');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      isAdmin: Boolean(usuario.is_admin),
    };
  }
}
