import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../database/prisma.service';
import { obterJwtSecret } from '../jwt.config';
import { NOME_COOKIE_SESSAO } from '../auth-cookie';

type JwtPayload = {
  sub: string;
};

function extrairCookieSessao(request: Request) {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const prefixo = `${NOME_COOKIE_SESSAO}=`;
  const cookie = cookies.find((item) => item.trim().startsWith(prefixo));
  return cookie ? decodeURIComponent(cookie.trim().slice(prefixo.length)) : null;
}

function extrairJwt(request: Request) {
  const tokenCabecalho = ExtractJwt.fromAuthHeaderAsBearerToken()(request);
  if (tokenCabecalho && tokenCabecalho !== '__cookie_session__') {
    return tokenCabecalho;
  }

  return extrairCookieSessao(request);
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
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: payload.sub,
        ativo: true,
        bloqueado: false,
        email_verificado: true,
        excluido_em: null,
      },
      select: {
        id: true,
        email: true,
        is_admin: true,
      },
    });

    if (!usuario) {
      throw new UnauthorizedException('Sessão inválida ou conta indisponível.');
    }

    return {
      id: usuario.id,
      email: usuario.email,
      isAdmin: Boolean(usuario.is_admin),
    };
  }
}
