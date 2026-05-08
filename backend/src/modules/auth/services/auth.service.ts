import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import { emailRegex } from '../dto/email.regex';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';

const maxTentativasLogin = 5;

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registrar(data: RegisterDto) {
    const email = data.email.toLowerCase().trim();
    this.validarEmail(email);

    const userExiste = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (userExiste) {
      throw new ConflictException('Ja existe um usuario com este e-mail.');
    }

    const senhaHash = await bcrypt.hash(data.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: data.nome.trim(),
        email,
        senha_hash: senhaHash,
        email_verificado: true,
        token_verificacao_email: null,
        token_verificacao_expira_em: null,
        bloqueado: false,
        tentativas_login: 0,
      },
    });

    return {
      usuario: this.removerSenha(usuario),
      access_token: this.gerarToken(usuario),
    };
  }

  async login(data: LoginDto) {
    const email = data.email.toLowerCase().trim();
    this.validarEmail(email);

    const usuario = await this.prisma.usuario.findUnique({
      where: { email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciais invalidas.');
    }

    if (usuario.bloqueado) {
      throw new ForbiddenException('Conta bloqueada por excesso de tentativas.');
    }

    const senhaValida = await bcrypt.compare(data.senha, usuario.senha_hash);

    if (!senhaValida) {
      const tentativas = (usuario.tentativas_login ?? 0) + 1;
      const bloqueado = tentativas >= maxTentativasLogin;

      await this.prisma.usuario.update({
        where: { id: usuario.id },
        data: {
          tentativas_login: tentativas,
          bloqueado,
        },
      });

      if (bloqueado) {
        throw new ForbiddenException('Conta bloqueada por excesso de tentativas.');
      }

      throw new UnauthorizedException('Credenciais invalidas.');
    }

    const usuarioAtualizado =
      usuario.tentativas_login || usuario.bloqueado
        ? await this.prisma.usuario.update({
            where: { id: usuario.id },
            data: {
              tentativas_login: 0,
              bloqueado: false,
            },
          })
        : usuario;

    return {
      usuario: this.removerSenha(usuarioAtualizado),
      access_token: this.gerarToken(usuarioAtualizado),
    };
  }

  async buscarPerfil(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    return usuario ? this.removerSenha(usuario) : null;
  }

  private gerarToken(usuario: Usuario) {
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      isAdmin: Boolean(usuario.is_admin),
    };

    return this.jwtService.sign(payload);
  }

  private validarEmail(email: string) {
    if (!emailRegex.test(email)) {
      throw new BadRequestException('Digite um e-mail valido, sem caracteres especiais.');
    }
  }

  private removerSenha(usuario: Usuario) {
    const {
      senha_hash: _senhaHash,
      token_verificacao_email: _tokenVerificacaoEmail,
      ...usuarioSemSenha
    } = usuario;

    return this.formatarDatasBrasil(usuarioSemSenha);
  }

  private formatarDatasBrasil<T extends Record<string, unknown>>(data: T) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [
        key,
        value instanceof Date ? this.formatarDataBrasil(value) : value,
      ]),
    );
  }

  private formatarDataBrasil(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(data)
      .replace(',', '');
  }
}
