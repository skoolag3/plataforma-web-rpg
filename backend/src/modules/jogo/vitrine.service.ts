import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';

@Injectable()
export class VitrineService {
  constructor(private readonly prisma: PrismaService) {}

  listarCartas() {
    return this.prisma.carta.findMany({
      where: { ativo: true, excluido_em: null, foto: { not: null } },
      orderBy: { criado_em: 'asc' },
      take: 3,
      select: {
        id: true,
        nome: true,
        raridade: true,
        elemento: true,
        foto: true,
        moldura: true,
        config_visual: true,
      },
    });
  }
}
