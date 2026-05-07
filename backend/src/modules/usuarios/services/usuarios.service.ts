import { ConflictException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../../database/prisma.service';

type CriarUsuarioInput = {
  nome: string;
  email: string;
  senha: string;
};

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async criar({ nome, email, senha }: CriarUsuarioInput) {
    const emailNormalizado = email.toLowerCase().trim();
    const usuarioExistente = await this.prisma.usuario.findUnique({
      where: { email: emailNormalizado },
    });

    if (usuarioExistente) {
      throw new ConflictException('E-mail ja cadastrado.');
    }

    const senhaHash = await bcrypt.hash(senha, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nome,
        email: emailNormalizado,
        senha_hash: senhaHash,
      },
    });

    return this.semSenha(usuario);
  }

  async buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async buscarPorId(id: string) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id },
    });

    return usuario ? this.semSenha(usuario) : null;
  }

  semSenha<T extends { senha_hash: string }>(usuario: T) {
    const { senha_hash: _senhaHash, ...usuarioSemSenha } = usuario;
    return usuarioSemSenha;
  }
}
