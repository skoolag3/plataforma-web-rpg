import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  AtualizarAdminCampanhaDto,
  AtualizarBossDto,
} from '../dto/admin-campanha.dto';

@Injectable()
export class AdminCampanhaService {
  constructor(private readonly prisma: PrismaService) {}

  async obterPainel() {
    const [
      configuracao,
      total,
      ativas,
      concluidas,
      falhas,
      abandonadas,
      recentes,
    ] = await Promise.all([
      this.obterConfiguracao(),
      this.prisma.expedicao.count(),
      this.prisma.expedicao.count({ where: { status: 'EM_ANDAMENTO' } }),
      this.prisma.expedicao.count({ where: { status: 'CONCLUIDA' } }),
      this.prisma.expedicao.count({ where: { status: 'FALHOU' } }),
      this.prisma.expedicao.count({ where: { status: 'ABANDONADA' } }),
      this.prisma.expedicao.findMany({
        take: 12,
        orderBy: { criado_em: 'desc' },
        include: {
          usuario: { select: { nome: true, email: true } },
          deck: { select: { nome: true } },
          partidas: { select: { recompensa_rubys: true } },
        },
      }),
    ]);

    return {
      configuracao: this.formatarConfiguracao(configuracao),
      boss: this.formatarBoss(configuracao),
      metricas: { total, ativas, concluidas, falhas, abandonadas },
      recentes: recentes.map((expedicao) => ({
        id: expedicao.id,
        jogador: expedicao.usuario.nome,
        email: expedicao.usuario.email,
        deck: expedicao.deck.nome,
        status: expedicao.status,
        etapaAtual: expedicao.etapa_atual,
        rubys: expedicao.partidas.reduce(
          (soma, partida) => soma + partida.recompensa_rubys,
          0,
        ),
        criadoEm: expedicao.criado_em,
        finalizadoEm: expedicao.finalizado_em,
      })),
    };
  }

  async atualizar(dto: AtualizarAdminCampanhaDto) {
    const configuracao = await this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ativa: dto.ativa,
        recompensa_facil: dto.recompensaFacil,
        recompensa_media: dto.recompensaMedia,
        recompensa_dificil: dto.recompensaDificil,
        recompensa_chefe: dto.recompensaChefe,
        percentual_mantido_derrota: dto.percentualMantidoDerrota,
      },
      update: {
        ativa: dto.ativa,
        recompensa_facil: dto.recompensaFacil,
        recompensa_media: dto.recompensaMedia,
        recompensa_dificil: dto.recompensaDificil,
        recompensa_chefe: dto.recompensaChefe,
        percentual_mantido_derrota: dto.percentualMantidoDerrota,
        atualizado_em: new Date(),
      },
    });

    return {
      message: 'Configuração da campanha atualizada.',
      configuracao: this.formatarConfiguracao(configuracao),
    };
  }

  async atualizarBoss(dto: AtualizarBossDto) {
    const ids = [...new Set(dto.cartas)];
    if (ids.length > 0 && ids.length < 6)
      throw new BadRequestException(
        'Selecione pelo menos seis cartas ou deixe vazio para usar todas as cartas ativas.',
      );
    if (
      !dto.nome.trim() ||
      !dto.personalidade.trim() ||
      !dto.provocacao.trim() ||
      dto.perguntas.some((item) => !item.trim())
    )
      throw new BadRequestException(
        'Preencha nome, personalidade, provocação e as quatro perguntas.',
      );
    const total = await this.prisma.carta.count({
      where: { id: { in: ids }, ativo: true, excluido_em: null },
    });
    if (total !== ids.length)
      throw new BadRequestException('A seleção contém cartas indisponíveis.');
    const configuracao = await this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        boss_nome: dto.nome.trim(),
        boss_personalidade: dto.personalidade.trim(),
        boss_provocacao: dto.provocacao.trim(),
        boss_perguntas: dto.perguntas.map((item) => item.trim()),
        boss_cartas: ids,
      },
      update: {
        boss_nome: dto.nome.trim(),
        boss_personalidade: dto.personalidade.trim(),
        boss_provocacao: dto.provocacao.trim(),
        boss_perguntas: dto.perguntas.map((item) => item.trim()),
        boss_cartas: ids,
        atualizado_em: new Date(),
      },
    });
    return {
      message: 'Boss final atualizado.',
      boss: this.formatarBoss(configuracao),
    };
  }

  private obterConfiguracao() {
    return this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  private formatarConfiguracao(configuracao: {
    ativa: boolean;
    recompensa_facil: number;
    recompensa_media: number;
    recompensa_dificil: number;
    recompensa_chefe: number;
    percentual_mantido_derrota: number;
    atualizado_em: Date;
  }) {
    return {
      ativa: configuracao.ativa,
      recompensaFacil: configuracao.recompensa_facil,
      recompensaMedia: configuracao.recompensa_media,
      recompensaDificil: configuracao.recompensa_dificil,
      recompensaChefe: configuracao.recompensa_chefe,
      percentualMantidoDerrota: configuracao.percentual_mantido_derrota,
      atualizadoEm: configuracao.atualizado_em,
    };
  }

  private formatarBoss(configuracao: {
    boss_nome: string;
    boss_personalidade: string;
    boss_provocacao: string;
    boss_perguntas: string[];
    boss_cartas: string[];
  }) {
    return {
      nome: configuracao.boss_nome,
      personalidade: configuracao.boss_personalidade,
      provocacao: configuracao.boss_provocacao,
      perguntas: configuracao.boss_perguntas,
      cartas: configuracao.boss_cartas,
    };
  }
}
