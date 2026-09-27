import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { BannerRotacaoService } from '../../jogo/banner-rotacao.service';
import { PROBABILIDADES_RARIDADE } from '../../jogo/gacha.config';
import type {
  AtualizarAdminBannerDto,
  CriarAdminBannerDto,
} from '../dto/admin-banner.dto';

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
        cartas: banner.cartas.map(({ carta }) => ({
          id: carta.id,
          nome: carta.nome,
          raridade: carta.raridade,
          elemento: carta.elemento,
        })),
        raridades: Object.entries(
          banner.cartas.reduce<Record<string, number>>((total, item) => {
            total[item.carta.raridade] = (total[item.carta.raridade] ?? 0) + 1;
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

  async criar(dto: CriarAdminBannerDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(830030)`;
        const ativos = await tx.banner.count({ where: { ativo: true } });
        const ativo = dto.ativo ?? true;

        if (!ativo && ativos === 0) {
          throw new ConflictException(
            'O primeiro banner precisa permanecer ativo.',
          );
        }

        await this.validarCartas(tx, dto.cartasIds);
        const banner = await tx.banner.create({
          data: {
            nome: dto.nome.trim(),
            custo_giro: dto.custoGiro,
            ativo,
            cartas: {
              create: dto.cartasIds.map((idCarta) => ({
                id_carta: idCarta,
                taxa_drop: 1,
              })),
            },
          },
        });

        return { message: 'Banner criado.', id: banner.id };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async atualizar(idBanner: string, dto: AtualizarAdminBannerDto) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(830030)`;
        const banner = await tx.banner.findUnique({
          where: { id: idBanner },
          select: { id: true, ativo: true },
        });
        if (!banner) throw new NotFoundException('Banner não encontrado.');

        if (banner.ativo && dto.ativo === false) {
          await this.validarOutroAtivo(tx, idBanner);
        }
        if (dto.cartasIds) await this.validarCartas(tx, dto.cartasIds);

        await tx.banner.update({
          where: { id: idBanner },
          data: {
            ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
            ...(dto.custoGiro !== undefined
              ? { custo_giro: dto.custoGiro }
              : {}),
            ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
            ...(dto.cartasIds
              ? {
                  cartas: {
                    deleteMany: {},
                    create: dto.cartasIds.map((idCarta) => ({
                      id_carta: idCarta,
                      taxa_drop: 1,
                    })),
                  },
                }
              : {}),
            atualizado_em: new Date(),
          },
        });

        return { message: 'Banner atualizado.' };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async remover(idBanner: string) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(830030)`;
        const banner = await tx.banner.findUnique({
          where: { id: idBanner },
          select: {
            id: true,
            nome: true,
            ativo: true,
            _count: { select: { gachaLogs: true } },
          },
        });
        if (!banner) throw new NotFoundException('Banner não encontrado.');
        if (banner.ativo) await this.validarOutroAtivo(tx, idBanner);
        if (banner._count.gachaLogs > 0) {
          throw new ConflictException(
            'Este banner possui giros no histórico. Desative-o em vez de excluir.',
          );
        }

        const substituto = await tx.banner.findFirst({
          where: { id: { not: idBanner }, ativo: true },
          orderBy: { criado_em: 'asc' },
          select: { id: true },
        });
        const rotacao = await tx.bannerRotacao.findUnique({ where: { id: 1 } });
        if (rotacao?.id_banner === idBanner && substituto) {
          await tx.bannerRotacao.update({
            where: { id: 1 },
            data: {
              id_banner: substituto.id,
              forcado_por_admin: false,
              atualizado_em: new Date(),
            },
          });
        }

        await tx.banner.delete({ where: { id: idBanner } });
        return { message: `${banner.nome} excluído.` };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async validarOutroAtivo(
    tx: Prisma.TransactionClient,
    idBanner: string,
  ) {
    const outrosAtivos = await tx.banner.count({
      where: { id: { not: idBanner }, ativo: true },
    });
    if (!outrosAtivos) {
      throw new ConflictException(
        'É obrigatório manter pelo menos um banner ativo.',
      );
    }
  }

  private async validarCartas(
    tx: Prisma.TransactionClient,
    cartasIds: string[],
  ) {
    const total = await tx.carta.count({
      where: {
        id: { in: cartasIds },
        ativo: true,
        excluido_em: null,
      },
    });
    if (total !== cartasIds.length) {
      throw new BadRequestException(
        'Selecione somente cartas ativas e disponíveis.',
      );
    }
  }
}
