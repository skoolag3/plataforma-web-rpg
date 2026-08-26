import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  listar() {
    return this.prisma.noticia.findMany({
      where: { publicada: true },
      orderBy: { criado_em: 'desc' },
      take: 6,
      select: {
        id: true,
        titulo: true,
        resumo: true,
        imagem: true,
        categoria: true,
        criado_em: true,
      },
    });
  }

  async buscar(id: string) {
    const noticia = await this.prisma.noticia.findFirst({
      where: { id, publicada: true },
    });
    if (!noticia) throw new NotFoundException('Notícia não encontrada.');
    return noticia;
  }
}
