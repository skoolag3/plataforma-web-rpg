import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { BannerRotacaoService } from '../../jogo/banner-rotacao.service';
import { PROBABILIDADES_RARIDADE } from '../../jogo/gacha.config';

@Injectable()
export class AdminBannersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly bannerRotacaoService: BannerRotacaoService,
  ) {}

  async listar() {
    const [banners, rotacao] = await Promise.all([
      this.prisma.banner.findMany({
        include: {
          cartas: { include: { carta: true } },
        },
        orderBy: { criado_em: 'asc' },
      }),
      this.bannerRotacaoService.obterAtual(),
    ]);

    return {
      probabilidades: PROBABILIDADES_RARIDADE,
      rotacao: rotacao
        ? {
            bannerAtualId: rotacao.idBanner,
            proximaRotacaoEm: rotacao.proximaRotacaoEm,
            forcadoPorAdmin: rotacao.forcadoPorAdmin,
          }
        : null,
      banners: banners.map((banner) => ({
        id: banner.id,
        nome: banner.nome,
        custoGiro: banner.custo_giro,
        ativo: banner.ativo ?? false,
        totalCartas: banner.cartas.length,
        raridades: Object.entries(
          banner.cartas.reduce<Record<string, number>>((total, item) => {
            total[item.carta.raridade] =
              (total[item.carta.raridade] ?? 0) + 1;
            return total;
          }, {}),
        ).map(([raridade, total]) => ({ raridade, total })),
      })),
    };
  }

  async forcar(idBanner: string) {
    const rotacao = await this.bannerRotacaoService.forcar(idBanner);

    return {
      message: `${rotacao.nomeBanner} definido como banner atual.`,
      bannerAtualId: rotacao.idBanner,
      proximaRotacaoEm: rotacao.proximaRotacaoEm,
    };
  }
}
