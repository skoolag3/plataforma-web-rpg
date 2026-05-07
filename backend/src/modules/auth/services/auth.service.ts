import { ConflictException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';
import { RegisterDto } from '../dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async registrar(data: RegisterDto) {
    const email = data.email.toLowerCase().trim();
    const userExiste = await this.prisma.usuario.findUnique({
      where: { email },
    });
    if (userExiste) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }
    const senhaHash = await bcrypt.hash(data.senha, 10);
    const usuario = await this.prisma.usuario.create({
      data: {
        nome: data.nome,
        email,
        senha_hash: senhaHash,
      },
    });
    const { senha_hash: _, ...usuSemSenha } = usuario;
    const payload = {
      sub: usuario.id,
      email: usuario.email,
      isAdmin: Boolean(usuario.is_admin),
    };
    return {
      usuario: usuSemSenha,
      access_token: this.jwtService.sign(payload),
    };
  }
}