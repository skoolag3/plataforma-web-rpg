import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { obterProximaRotacaoBanner } from './gacha.config';

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
          select: { id: true, nome: true, inicio_em: true, fim_em: true },
        });
        if (!banner)
          throw new NotFoundException('Banner ativo não encontrado.');
        const agora = new Date();
        if ((banner.inicio_em && banner.inicio_em > agora) || (banner.fim_em && banner.fim_em <= agora)) {
          throw new NotFoundException('Banner fora do período agendado.');
        }

        const rotacao = await this.salvar(tx, banner.id, true, agora);
        return { ...rotacao, nomeBanner: banner.nome };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  }

  private async resolverAtual(tx: Prisma.TransactionClient) {
    const banners = await tx.banner.findMany({
      where: { ativo: true },
      select: { id: true, inicio_em: true, fim_em: true },
      orderBy: { criado_em: 'asc' },
    });
    if (!banners.length) return null;

    const agora = new Date();
    const proximoAgendamento = banners.filter((banner) => banner.inicio_em && banner.inicio_em > agora).sort((a, b) => (a.inicio_em?.getTime() ?? 0) - (b.inicio_em?.getTime() ?? 0))[0]?.inicio_em ?? null;
    const agendados = banners.filter((banner) => banner.inicio_em && banner.inicio_em <= agora && (!banner.fim_em || banner.fim_em > agora));
    const agendado = [...agendados].sort((a, b) => (b.inicio_em?.getTime() ?? 0) - (a.inicio_em?.getTime() ?? 0))[0];
    const disponiveis = banners.filter((banner) => !banner.inicio_em && (!banner.fim_em || banner.fim_em > agora));
    const rotacao = await tx.bannerRotacao.findUnique({
      where: { id: 1 },
    });
    if (agendado) {
      if (rotacao?.id_banner === agendado.id) return { ...this.mapear(rotacao), proximaRotacaoEm: agendado.fim_em ?? proximoAgendamento };
      const nova = await this.salvar(tx, agendado.id, false, agora);
      return { ...nova, proximaRotacaoEm: agendado.fim_em ?? proximoAgendamento };
    }
    if (!disponiveis.length) return null;
    const atualAtivo = disponiveis.some(
      (banner) => banner.id === rotacao?.id_banner,
    );

    if (rotacao && atualAtivo && rotacao.proxima_rotacao_em > agora) {
      const proxima = rotacao.proxima_rotacao_em;
      const estaAlinhada =
        proxima.getUTCMinutes() % 30 === 0 &&
        proxima.getUTCSeconds() === 0 &&
        proxima.getUTCMilliseconds() === 0;

      if (!estaAlinhada) {
        return this.salvar(
          tx,
          rotacao.id_banner,
          rotacao.forcado_por_admin,
          agora,
        );
      }
      return { ...this.mapear(rotacao), proximaRotacaoEm: proximoAgendamento };
    }

    const escolhido = disponiveis.find((banner) => banner.id === rotacao?.id_banner) ?? disponiveis[0];
    const nova = await this.salvar(tx, escolhido.id, false, agora);
    return { ...nova, proximaRotacaoEm: proximoAgendamento };
  }

  private async salvar(
    tx: Prisma.TransactionClient,
    idBanner: string,
    forcadoPorAdmin: boolean,
    agora: Date,
  ) {
    const proximaRotacaoEm = obterProximaRotacaoBanner(agora.getTime());
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
