import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo() {
    const [
      usuarios,
      usuariosAtivos,
      cartas,
      cartasAtivas,
      partidas,
      rubys,
      raridades,
      recentes,
      topInventario,
    ] = await Promise.all([
      this.prisma.usuario.count({ where: { excluido_em: null } }),
      this.prisma.usuario.count({
        where: { excluido_em: null, ativo: true, bloqueado: false },
      }),
      this.prisma.carta.count({ where: { excluido_em: null } }),
      this.prisma.carta.count({ where: { excluido_em: null, ativo: true } }),
      this.prisma.logPartida.count(),
      this.prisma.usuario.aggregate({
        _sum: { saldo_rubys_cache: true },
        where: { excluido_em: null },
      }),
      this.prisma.carta.groupBy({
        by: ['raridade'],
        where: { excluido_em: null },
        _count: { _all: true },
      }),
      this.prisma.carta.findMany({
        where: { excluido_em: null },
        orderBy: { criado_em: 'desc' },
        take: 5,
        select: {
          id: true,
          nome: true,
          raridade: true,
          elemento: true,
          ativo: true,
          criado_em: true,
        },
      }),
      this.prisma.inventario.groupBy({
        by: ['id_carta'],
        where: { id_carta: { not: null } },
        _sum: { quantidade: true },
        orderBy: { _sum: { quantidade: 'desc' } },
        take: 5,
      }),
    ]);

    const cartaIds = topInventario
      .map((item) => item.id_carta)
      .filter((id): id is string => Boolean(id));

    const cartasTop = cartaIds.length
      ? await this.prisma.carta.findMany({
          where: { id: { in: cartaIds } },
          select: { id: true, nome: true, raridade: true },
        })
      : [];

    return {
      metricas: {
        usuarios,
        usuariosAtivos,
        cartas,
        cartasAtivas,
        partidas,
        rubysEmCirculacao: rubys._sum.saldo_rubys_cache ?? 0,
      },
      raridades: raridades.map((item) => ({
        raridade: item.raridade,
        total: item._count._all,
      })),
      atividadeRecente: recentes.map((carta) => ({
        tipo: 'carta',
        texto: `Carta criada: ${carta.nome}`,
        data: carta.criado_em,
        status: carta.ativo ? 'Ativa' : 'Inativa',
        detalhe: `${carta.raridade} / ${carta.elemento}`,
      })),
      topCartas: topInventario.map((item) => {
        const carta = cartasTop.find(
          (cartaTop) => cartaTop.id === item.id_carta,
        );

        return {
          id: item.id_carta,
          nome: carta?.nome ?? 'Carta removida',
          raridade: carta?.raridade ?? '-',
          quantidade: item._sum.quantidade ?? 0,
        };
      }),
    };
  }
}
