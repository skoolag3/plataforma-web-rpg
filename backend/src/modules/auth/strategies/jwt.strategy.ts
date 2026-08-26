import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../database/prisma.service';
import { obterJwtSecret } from '../jwt.config';

type JwtPayload = {
  sub: string;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
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
