import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { PartidasService } from './partidas.service';
import { gerarTrilhaExpedicao, type TrilhaExpedicao } from './expedicao.trilha';

const expedicaoInclude = {
  deck: { select: { id: true, nome: true } },
  partidas: {
    select: {
      id: true,
      etapa_expedicao: true,
      resultado: true,
      timestamp_inicio: true,
    },
    orderBy: { timestamp_inicio: 'desc' as const },
  },
} satisfies Prisma.ExpedicaoInclude;

type ExpedicaoPersistida = Prisma.ExpedicaoGetPayload<{
  include: typeof expedicaoInclude;
}>;

const recompensaChefe = 100;

@Injectable()
export class ExpedicoesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly partidasService: PartidasService,
  ) {}

  async criar(idUsuario: string, idDeck: string) {
    await this.sincronizar(idUsuario);
    const ativa = await this.prisma.expedicao.findFirst({
      where: { id_usuario: idUsuario, status: 'EM_ANDAMENTO' },
    });
    if (ativa) throw new ConflictException('Já existe uma expedição ativa.');

    const deck = await this.prisma.deck.findFirst({
      where: { id: idDeck, id_usuario: idUsuario, excluido_em: null },
      include: { cartas: true },
    });
    if (!deck || deck.cartas.length < 3 || deck.cartas.length > 6) {
      throw new BadRequestException('Selecione um deck com 3 a 6 cartas.');
    }

    const seed = Math.abs(
      Math.trunc(Date.now() + this.hashTexto(`${idUsuario}:${idDeck}`)),
    );
    await this.prisma.expedicao.create({
      data: {
        id_usuario: idUsuario,
        id_deck: idDeck,
        seed,
        trilha: gerarTrilhaExpedicao(seed),
      },
    });
    return this.buscarAtual(idUsuario);
  }

  async buscarAtual(idUsuario: string) {
    await this.sincronizar(idUsuario);
    const expedicao = await this.prisma.expedicao.findFirst({
      where: { id_usuario: idUsuario },
      include: expedicaoInclude,
      orderBy: { criado_em: 'desc' },
    });
    return expedicao ? this.formatar(expedicao) : null;
  }

  async escolher(idUsuario: string, idExpedicao: string, idEscolha: string) {
    await this.sincronizar(idUsuario);
    const expedicao = await this.prisma.expedicao.findFirst({
      where: {
        id: idExpedicao,
        id_usuario: idUsuario,
        status: 'EM_ANDAMENTO',
      },
      include: expedicaoInclude,
    });
    if (!expedicao)
      throw new NotFoundException('Expedição ativa não encontrada.');
    if (
      expedicao.partidas.some((partida) => partida.resultado === 'EM_ANDAMENTO')
    ) {
      throw new ConflictException(
        'Conclua a batalha atual antes de escolher outra rota.',
      );
    }
    if (expedicao.escolha_atual) {
      throw new ConflictException('Esta etapa já possui uma rota selecionada.');
    }

    const trilha = this.normalizarTrilha(expedicao.trilha);
    const opcoes =
      expedicao.etapa_atual === 3
        ? [trilha.chefe]
        : (trilha.etapas[expedicao.etapa_atual]?.opcoes ?? []);
    const escolha = opcoes.find((opcao) => opcao.id === idEscolha);
    if (!escolha)
      throw new BadRequestException('Escolha inválida para esta etapa.');

    const reservada = await this.prisma.expedicao.updateMany({
      where: {
        id: expedicao.id,
        id_usuario: idUsuario,
        status: 'EM_ANDAMENTO',
        etapa_atual: expedicao.etapa_atual,
        escolha_atual: null,
      },
      data: {
        escolha_atual: escolha.id,
        escolhas: { push: escolha.id },
        atualizado_em: new Date(),
      },
    });
    if (!reservada.count)
      throw new ConflictException('A rota já foi escolhida.');

    try {
      await this.partidasService.iniciar(idUsuario, expedicao.id_deck, {
        idExpedicao: expedicao.id,
        etapa: expedicao.etapa_atual,
        dificuldade: escolha.dificuldade,
      });
    } catch (error) {
      await this.prisma.expedicao.update({
        where: { id: expedicao.id },
        data: {
          escolha_atual: null,
          escolhas: expedicao.escolhas,
          atualizado_em: new Date(),
        },
      });
      throw error;
    }

    return this.buscarAtual(idUsuario);
  }

  async abandonar(idUsuario: string, idExpedicao: string) {
    const atualizada = await this.prisma.expedicao.updateMany({
      where: {
        id: idExpedicao,
        id_usuario: idUsuario,
        status: 'EM_ANDAMENTO',
        partidas: { none: { resultado: 'EM_ANDAMENTO' } },
      },
      data: {
        status: 'ABANDONADA',
        finalizado_em: new Date(),
        atualizado_em: new Date(),
      },
    });
    if (!atualizada.count) {
      throw new ConflictException(
        'Não é possível abandonar durante uma batalha.',
      );
    }
    return this.buscarAtual(idUsuario);
  }

  private async sincronizar(idUsuario: string) {
    const expedicao = await this.prisma.expedicao.findFirst({
      where: { id_usuario: idUsuario, status: 'EM_ANDAMENTO' },
      include: expedicaoInclude,
      orderBy: { criado_em: 'desc' },
    });
    if (!expedicao?.escolha_atual) return;

    const partida = expedicao.partidas.find(
      (item) => item.etapa_expedicao === expedicao.etapa_atual,
    );
    if (!partida || partida.resultado === 'EM_ANDAMENTO') return;

    if (partida.resultado !== 'VITORIA') {
      await this.prisma.expedicao.updateMany({
        where: {
          id: expedicao.id,
          status: 'EM_ANDAMENTO',
          etapa_atual: expedicao.etapa_atual,
        },
        data: {
          status: 'FALHOU',
          finalizado_em: new Date(),
          atualizado_em: new Date(),
        },
      });
      return;
    }

    if (expedicao.etapa_atual < 3) {
      await this.prisma.expedicao.updateMany({
        where: {
          id: expedicao.id,
          status: 'EM_ANDAMENTO',
          etapa_atual: expedicao.etapa_atual,
        },
        data: {
          etapa_atual: { increment: 1 },
          escolha_atual: null,
          atualizado_em: new Date(),
        },
      });
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const concluida = await tx.expedicao.updateMany({
        where: {
          id: expedicao.id,
          status: 'EM_ANDAMENTO',
          etapa_atual: 3,
        },
        data: {
          status: 'CONCLUIDA',
          finalizado_em: new Date(),
          atualizado_em: new Date(),
        },
      });
      if (!concluida.count) return;
      await tx.ledgerRuby.create({
        data: {
          id_usuario: idUsuario,
          quantidade: recompensaChefe,
          motivo: 'EXPEDICAO_CONCLUIDA',
          id_referencia: expedicao.id,
          descricao: 'Recompensa pela conclusão da Expedição.',
        },
      });
    });
  }

  private normalizarTrilha(valor: Prisma.JsonValue): TrilhaExpedicao {
    return valor as unknown as TrilhaExpedicao;
  }

  private formatar(expedicao: ExpedicaoPersistida) {
    const trilha = this.normalizarTrilha(expedicao.trilha);
    const partidaAtual = expedicao.partidas.find(
      (partida) => partida.etapa_expedicao === expedicao.etapa_atual,
    );
    return {
      id: expedicao.id,
      status: expedicao.status,
      seed: expedicao.seed,
      etapaAtual: expedicao.etapa_atual,
      totalEtapas: 4,
      deck: expedicao.deck,
      escolhas: expedicao.escolhas,
      etapas: trilha.etapas.map((etapa) => ({
        ...etapa,
        status:
          etapa.indice < expedicao.etapa_atual
            ? 'CONCLUIDA'
            : etapa.indice === expedicao.etapa_atual &&
                expedicao.status === 'EM_ANDAMENTO'
              ? 'ATUAL'
              : 'BLOQUEADA',
      })),
      chefe: {
        ...trilha.chefe,
        status:
          expedicao.etapa_atual === 3 && expedicao.status === 'EM_ANDAMENTO'
            ? 'ATUAL'
            : expedicao.status === 'CONCLUIDA'
              ? 'CONCLUIDA'
              : 'BLOQUEADA',
      },
      opcoesAtuais:
        expedicao.status !== 'EM_ANDAMENTO' || partidaAtual
          ? []
          : expedicao.etapa_atual === 3
            ? [trilha.chefe]
            : (trilha.etapas[expedicao.etapa_atual]?.opcoes ?? []),
      partidaAtual: partidaAtual
        ? {
            id: partidaAtual.id,
            status:
              partidaAtual.resultado === 'EM_ANDAMENTO'
                ? 'EM_ANDAMENTO'
                : 'FINALIZADA',
            resultado:
              partidaAtual.resultado === 'EM_ANDAMENTO'
                ? null
                : partidaAtual.resultado,
          }
        : null,
      recompensaFinal: recompensaChefe,
      criadoEm: expedicao.criado_em,
      finalizadoEm: expedicao.finalizado_em,
    };
  }

  private hashTexto(texto: string) {
    return [...texto].reduce(
      (hash, caractere) => (hash * 31 + caractere.charCodeAt(0)) | 0,
      0,
    );
  }
}
