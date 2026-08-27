import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { INTERVALO_ROTACAO_BANNER_MS } from './gacha.config';

@Injectable()
export class BannerRotacaoService {
  constructor(private readonly prisma: PrismaService) {}

  async obterAtual() {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(830030)`;
        return this.resolverAtual(tx);
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  async forcar(idBanner: string) {
    return this.prisma.$transaction(
      async (tx) => {
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(830030)`;
        const banner = await tx.banner.findFirst({
          where: { id: idBanner, ativo: true },
          select: { id: true, nome: true },
        });
        if (!banner)
          throw new NotFoundException('Banner ativo não encontrado.');

        const rotacao = await this.salvar(tx, banner.id, true, new Date());
        return { ...rotacao, nomeBanner: banner.nome };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async resolverAtual(tx: Prisma.TransactionClient) {
    const banners = await tx.banner.findMany({
      where: { ativo: true },
      select: { id: true },
      orderBy: { criado_em: 'asc' },
    });
    if (!banners.length) return null;

    const agora = new Date();
    const rotacao = await tx.bannerRotacao.findUnique({
      where: { id: 1 },
    });
    const atualAtivo = banners.some(
      (banner) => banner.id === rotacao?.id_banner,
    );

    if (rotacao && atualAtivo && rotacao.proxima_rotacao_em > agora) {
      return this.mapear(rotacao);
    }

    const candidatos =
      banners.length > 1
        ? banners.filter((banner) => banner.id !== rotacao?.id_banner)
        : banners;
    const escolhido = candidatos[Math.floor(Math.random() * candidatos.length)];
    return this.salvar(tx, escolhido.id, false, agora);
  }

  private async salvar(
    tx: Prisma.TransactionClient,
    idBanner: string,
    forcadoPorAdmin: boolean,
    agora: Date,
  ) {
    const proximaRotacaoEm = new Date(
      agora.getTime() + INTERVALO_ROTACAO_BANNER_MS,
    );
    const rotacao = await tx.bannerRotacao.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        id_banner: idBanner,
        proxima_rotacao_em: proximaRotacaoEm,
        forcado_por_admin: forcadoPorAdmin,
      },
      update: {
        id_banner: idBanner,
        proxima_rotacao_em: proximaRotacaoEm,
        forcado_por_admin: forcadoPorAdmin,
        atualizado_em: agora,
      },
    });
    return this.mapear(rotacao);
  }

  private mapear(rotacao: {
    id_banner: string;
    proxima_rotacao_em: Date;
    forcado_por_admin: boolean;
  }) {
    return {
      idBanner: rotacao.id_banner,
      proximaRotacaoEm: rotacao.proxima_rotacao_em,
      forcadoPorAdmin: rotacao.forcado_por_admin,
    };
  }
}
