import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { SalvarAdminNoticiaDto } from '../dto/admin-noticia.dto';

@Injectable()
export class AdminNoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.noticia.findMany({ orderBy: { criado_em: 'desc' } });
  }

  criar(dto: SalvarAdminNoticiaDto) {
    return this.prisma.noticia.create({ data: this.dados(dto) });
  }

  async atualizar(id: string, dto: SalvarAdminNoticiaDto) {
    await this.buscar(id);
    return this.prisma.noticia.update({
      where: { id },
      data: { ...this.dados(dto), atualizado_em: new Date() },
    });
  }

  async remover(id: string) {
    await this.buscar(id);
    await this.prisma.noticia.delete({ where: { id } });
    return { message: 'Notícia removida.' };
  }

  private async buscar(id: string) {
    const noticia = await this.prisma.noticia.findUnique({ where: { id } });
    if (!noticia) throw new NotFoundException('Notícia não encontrada.');
    return noticia;
  }

  private dados(dto: SalvarAdminNoticiaDto) {
    return {
      titulo: dto.titulo.trim(),
      resumo: dto.resumo.trim(),
      conteudo: dto.conteudo.trim(),
      imagem: dto.imagem?.trim() || null,
      categoria: dto.categoria,
      anexos: dto.anexos as unknown as Prisma.InputJsonValue,
      publicada: dto.publicada,
    };
  }
}
