import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';

export type PeriodoDashboard = '7d' | '30d' | 'tudo';

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async resumo(periodo: PeriodoDashboard = '7d') {
    const agora = new Date();
    const inicioPeriodo =
      periodo === '7d'
        ? new Date(agora.getTime() - 7 * 24 * 60 * 60 * 1000)
        : periodo === '30d'
          ? new Date(agora.getTime() - 30 * 24 * 60 * 60 * 1000)
          : null;

    const filtroDataCriado = inicioPeriodo ? { gte: inicioPeriodo } : undefined;

    const [
      usuarios,
      usuariosAtivos,
      usuariosBloqueados,
      usuariosNaoVerificados,
      usuariosNovosPeriodo,
      usuariosLoginPeriodo,
      cartas,
      cartasAtivas,
      cartasSemHabilidade,
      cartasForaDeBanner,
      habilidadesRascunho,
      habilidadesNaoTestadas,
      bannersAtivos,
      noticiasPublicadas,
      noticiasRascunho,
      partidasTotal,
      partidasPeriodo,
      partidasResultadoPeriodo,
      partidasTurnosAgg,
      expedicoesStatusPeriodo,
      rubysTotal,
      rubysEmitidosAgg,
      rubysConsumidosAgg,
      gachaAggPeriodo,
      gachaPorBannerPeriodo,
      transacoesPagasPeriodo,
      raridades,
      logsAdminCarta,
      logsAdminUsuario,
      recentesCartas,
      topInventario,
      topDeckCartas,
    ] = await Promise.all([
      this.prisma.usuario.count({ where: { excluido_em: null } }),
      this.prisma.usuario.count({
        where: { excluido_em: null, ativo: true, bloqueado: false },
      }),
      this.prisma.usuario.count({
        where: { excluido_em: null, bloqueado: true },
      }),
      this.prisma.usuario.count({
        where: { excluido_em: null, email_verificado: false },
      }),
      this.prisma.usuario.count({
        where: {
          excluido_em: null,
          ...(filtroDataCriado ? { criado_em: filtroDataCriado } : {}),
        },
      }),
      this.prisma.usuario.count({
        where: {
          excluido_em: null,
          ...(filtroDataCriado
            ? { ultimo_login_em: filtroDataCriado }
            : { ultimo_login_em: { not: null } }),
        },
      }),
      this.prisma.carta.count({ where: { excluido_em: null } }),
      this.prisma.carta.count({ where: { excluido_em: null, ativo: true } }),
      this.prisma.carta.findMany({
        where: { excluido_em: null, ativo: true, habilidades: { none: {} } },
        select: { nome: true },
      }),
      this.prisma.carta.findMany({
        where: { excluido_em: null, ativo: true, banners: { none: {} } },
        select: { nome: true },
      }),
      this.prisma.habilidade.findMany({
        where: { status: 'RASCUNHO' },
        select: { nome: true },
      }),
      this.prisma.habilidade.count({
        where: { status: { not: 'INATIVA' }, testada_em: null },
      }),
      this.prisma.banner.count({ where: { ativo: true } }),
      this.prisma.noticia.count({ where: { publicada: true } }),
      this.prisma.noticia.count({ where: { publicada: false } }),
      this.prisma.logPartida.count(),
      this.prisma.logPartida.count({
        where: filtroDataCriado
          ? { timestamp_inicio: filtroDataCriado }
          : undefined,
      }),
      this.prisma.logPartida.groupBy({
        by: ['resultado'],
        where: filtroDataCriado
          ? { timestamp_inicio: filtroDataCriado }
          : undefined,
        _count: { _all: true },
      }),
      this.prisma.logPartida.aggregate({
        where: filtroDataCriado
          ? { timestamp_inicio: filtroDataCriado }
          : undefined,
        _avg: { turnos_jogados: true },
        _sum: { recompensa_rubys: true },
      }),
      this.prisma.expedicao.groupBy({
        by: ['status'],
        where: filtroDataCriado ? { criado_em: filtroDataCriado } : undefined,
        _count: { _all: true },
      }),
      this.prisma.usuario.aggregate({
        _sum: { saldo_rubys_cache: true },
        where: { excluido_em: null },
      }),
      this.prisma.ledgerRuby.aggregate({
        where: {
          quantidade: { gt: 0 },
          ...(filtroDataCriado ? { criado_em: filtroDataCriado } : {}),
        },
        _sum: { quantidade: true },
      }),
      this.prisma.ledgerRuby.aggregate({
        where: {
          quantidade: { lt: 0 },
          ...(filtroDataCriado ? { criado_em: filtroDataCriado } : {}),
        },
        _sum: { quantidade: true },
      }),
      this.prisma.logGacha.aggregate({
        where: filtroDataCriado
          ? { timestamp_pull: filtroDataCriado }
          : undefined,
        _count: { _all: true },
        _sum: { rubys_gastos: true },
        _avg: { pity_contador: true },
      }),
      this.prisma.logGacha.groupBy({
        by: ['id_banner'],
        where: filtroDataCriado
          ? { timestamp_pull: filtroDataCriado }
          : undefined,
        _count: { _all: true },
        _sum: { rubys_gastos: true },
        orderBy: { _count: { id_banner: 'desc' } },
        take: 4,
      }),
      this.prisma.logTransacao.aggregate({
        where: {
          status_pagamento: {
            in: ['CONCLUIDO', 'PAGO', 'PAID', 'SUCCEEDED', 'APROVADO'],
          },
          ...(filtroDataCriado ? { timestamp_compra: filtroDataCriado } : {}),
        },
        _count: { _all: true },
        _sum: { valor_brl: true },
      }),
      this.prisma.carta.groupBy({
        by: ['raridade'],
        where: { excluido_em: null },
        _count: { _all: true },
      }),
      this.prisma.logAdminCarta.findMany({
        orderBy: { criado_em: 'desc' },
        take: 6,
        include: { admin: { select: { nome: true } } },
      }),
      this.prisma.logAdminUsuario.findMany({
        orderBy: { criado_em: 'desc' },
        take: 6,
        include: {
          admin: { select: { nome: true } },
          usuario: { select: { nome: true } },
        },
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
        where: { id_carta: { not: null }, quantidade: { gt: 0 } },
        _count: { id_usuario: true },
        orderBy: { _count: { id_usuario: 'desc' } },
        take: 5,
      }),
      this.prisma.deckCarta.groupBy({
        by: ['id_carta'],
        _count: { id_carta: true },
        orderBy: { _count: { id_carta: 'desc' } },
        take: 5,
      }),
    ]);

    const bannerIds = gachaPorBannerPeriodo.map((item) => item.id_banner);
    const cartaIds = Array.from(
      new Set([
        ...topInventario
          .map((item) => item.id_carta)
          .filter((id): id is string => Boolean(id)),
        ...topDeckCartas.map((item) => item.id_carta),
      ]),
    );

    const [bannersTop, cartasInfo] = await Promise.all([
      bannerIds.length
        ? this.prisma.banner.findMany({
            where: { id: { in: bannerIds } },
            select: { id: true, nome: true, ativo: true },
          })
        : Promise.resolve(
            [] as { id: string; nome: string; ativo: boolean | null }[],
          ),
      cartaIds.length
        ? this.prisma.carta.findMany({
            where: { id: { in: cartaIds } },
            select: { id: true, nome: true, raridade: true, elemento: true },
          })
        : Promise.resolve(
            [] as {
              id: string;
              nome: string;
              raridade: string;
              elemento: string;
            }[],
          ),
    ]);

    const contarResultado = (chave: string) =>
      partidasResultadoPeriodo
        .filter((item) => item.resultado.toUpperCase().includes(chave))
        .reduce((acc, item) => acc + item._count._all, 0);

    const vitorias = contarResultado('VITORIA');
    const derrotas = contarResultado('DERROTA');
    const abandonosPartida =
      contarResultado('ABANDON') + contarResultado('DESIST');
    const partidasDecididas = vitorias + derrotas;
    const taxaVitoria = partidasDecididas
      ? Math.round((vitorias / partidasDecididas) * 100)
      : 0;

    const contarExpedicao = (status: string) =>
      expedicoesStatusPeriodo.find((item) => item.status === status)?._count
        ._all ?? 0;

    const expAtivas = contarExpedicao('EM_ANDAMENTO');
    const expConcluidas = contarExpedicao('CONCLUIDA');
    const expFalhas = contarExpedicao('FALHOU');
    const expAbandonadas = contarExpedicao('ABANDONADA');
    const expTotal = expAtivas + expConcluidas + expFalhas + expAbandonadas;
    const expFinalizadas = expConcluidas + expFalhas + expAbandonadas;
    const taxaConclusaoExpedicao = expFinalizadas
      ? Math.round((expConcluidas / expFinalizadas) * 100)
      : 0;

    const eventosAuditoria = [
      ...logsAdminCarta.map((log) => ({
        tipo: 'carta',
        texto: `Carta ${log.acao.toLowerCase()}: ${log.nome_carta}`,
        data: log.criado_em,
        status: log.acao,
        detalhe: log.admin?.nome ? `Por ${log.admin.nome}` : 'Ação do sistema',
      })),
      ...logsAdminUsuario.map((log) => ({
        tipo: 'usuario',
        texto: log.descricao || `${log.acao} (${log.usuario.nome})`,
        data: log.criado_em,
        status: log.categoria,
        detalhe: `Admin: ${log.admin.nome} -> ${log.usuario.nome}`,
      })),
    ]
      .sort((a, b) => (b.data?.getTime() ?? 0) - (a.data?.getTime() ?? 0))
      .slice(0, 6);

    const atividadeRecente =
      eventosAuditoria.length > 0
        ? eventosAuditoria
        : recentesCartas.map((carta) => ({
            tipo: 'carta',
            texto: `Carta no catálogo: ${carta.nome}`,
            data: carta.criado_em,
            status: carta.ativo ? 'Ativa' : 'Inativa',
            detalhe: `${carta.raridade} / ${carta.elemento}`,
          }));

    const nomesSemHabilidade = cartasSemHabilidade.map((c) => c.nome);
    const nomesForaDeBanner = cartasForaDeBanner.map((c) => c.nome);
    const nomesSkillsRascunho = habilidadesRascunho.map((h) => h.nome);

    const alertas: {
      id: string;
      severidade: 'critico' | 'atencao' | 'ok';
      pergunta: string;
      resposta: string;
      acaoLabel: string;
      href: string;
    }[] = [];

    if (bannersAtivos === 0) {
      alertas.push({
        id: 'sem-banner',
        severidade: 'critico',
        pergunta: 'O Gacha está operando?',
        resposta: 'Nenhum banner ativo no momento. Jogadores não podem invocar.',
        acaoLabel: 'Ativar banner',
        href: '/admin/banners',
      });
    }
    if (nomesSemHabilidade.length > 0) {
      alertas.push({
        id: 'cartas-sem-skill',
        severidade: 'atencao',
        pergunta: 'Cartas sem habilidade vinculada',
        resposta: `${nomesSemHabilidade.join(', ')}`,
        acaoLabel: 'Revisar cartas',
        href: '/admin/cartas',
      });
    }
    if (nomesForaDeBanner.length > 0) {
      alertas.push({
        id: 'cartas-sem-drop',
        severidade: 'atencao',
        pergunta: 'Cartas fora de qualquer banner',
        resposta: `${nomesForaDeBanner.join(', ')}`,
        acaoLabel: 'Configurar drops',
        href: '/admin/banners',
      });
    }
    if (nomesSkillsRascunho.length > 0 || habilidadesNaoTestadas > 0) {
      alertas.push({
        id: 'skills-pendentes',
        severidade: 'atencao',
        pergunta: 'Habilidades em rascunho ou sem teste',
        resposta:
          nomesSkillsRascunho.length > 0
            ? `Rascunho: ${nomesSkillsRascunho.join(', ')}`
            : `${habilidadesNaoTestadas} ainda não testada(s).`,
        acaoLabel: 'Ver habilidades',
        href: '/admin/habilidades',
      });
    }
    if (usuariosBloqueados > 0 || usuariosNaoVerificados > 0) {
      alertas.push({
        id: 'contas-atencao',
        severidade: 'atencao',
        pergunta: 'Como está o acesso das contas?',
        resposta: `${usuariosBloqueados} bloqueada(s) e ${usuariosNaoVerificados} aguardando verificação de e-mail.`,
        acaoLabel: 'Gerenciar contas',
        href: '/admin/usuarios',
      });
    }
    if (alertas.length === 0) {
      alertas.push({
        id: 'tudo-ok',
        severidade: 'ok',
        pergunta: 'Existem gargalos operacionais no catálogo?',
        resposta:
          'Todas as cartas ativas possuem habilidades, banners ativos e nenhuma pendência crítica.',
        acaoLabel: 'Ver catálogo',
        href: '/admin/cartas',
      });
    }

    const rubysEmitidos = rubysEmitidosAgg._sum.quantidade ?? 0;
    const rubysConsumidos = Math.abs(rubysConsumidosAgg._sum.quantidade ?? 0);

    return {
      periodo,
      metricas: {
        usuarios,
        usuariosAtivos,
        usuariosBloqueados,
        usuariosNaoVerificados,
        usuariosNovosPeriodo,
        usuariosLoginPeriodo,
        cartas,
        cartasAtivas,
        partidas: partidasTotal,
        partidasPeriodo,
        rubysEmCirculacao: rubysTotal._sum.saldo_rubys_cache ?? 0,
      },
      combate: {
        partidasPeriodo,
        vitorias,
        derrotas,
        abandonosPartida,
        taxaVitoria,
        mediaTurnos: Math.round((partidasTurnosAgg._avg.turnos_jogados ?? 0) * 10) / 10,
        rubysRecompensados: partidasTurnosAgg._sum.recompensa_rubys ?? 0,
        expedicoes: {
          total: expTotal,
          ativas: expAtivas,
          concluidas: expConcluidas,
          falhas: expFalhas,
          abandonadas: expAbandonadas,
          taxaConclusao: taxaConclusaoExpedicao,
        },
      },
      economia: {
        rubysEmCirculacao: rubysTotal._sum.saldo_rubys_cache ?? 0,
        rubysEmitidosPeriodo: rubysEmitidos,
        rubysConsumidosPeriodo: rubysConsumidos,
        saldoLiquidoPeriodo: rubysEmitidos - rubysConsumidos,
        girosGachaPeriodo: gachaAggPeriodo._count._all ?? 0,
        rubysGastosGachaPeriodo: gachaAggPeriodo._sum.rubys_gastos ?? 0,
        pityMedio: Math.round((gachaAggPeriodo._avg.pity_contador ?? 0) * 10) / 10,
        comprasPagasPeriodo: transacoesPagasPeriodo._count._all ?? 0,
        receitaBrlPeriodo: Number(transacoesPagasPeriodo._sum.valor_brl ?? 0),
        bannersMaisGirados: gachaPorBannerPeriodo.map((item) => {
          const banner = bannersTop.find((b) => b.id === item.id_banner);
          return {
            id: item.id_banner,
            nome: banner?.nome ?? 'Banner removido',
            ativo: banner?.ativo ?? false,
            giros: item._count._all,
            rubysGastos: item._sum.rubys_gastos ?? 0,
          };
        }),
      },
      saudeCatalogo: {
        cartasSemHabilidade: nomesSemHabilidade.length,
        nomesSemHabilidade,
        cartasForaDeBanner: nomesForaDeBanner.length,
        nomesForaDeBanner,
        habilidadesRascunho: nomesSkillsRascunho.length,
        nomesSkillsRascunho,
        habilidadesNaoTestadas,
        bannersAtivos,
        noticiasPublicadas,
        noticiasRascunho,
      },
      alertas,
      raridades: raridades.map((item) => ({
        raridade: item.raridade,
        total: item._count._all,
      })),
      atividadeRecente,
      topCartas: topInventario.map((item) => {
        const carta = cartasInfo.find((c) => c.id === item.id_carta);
        return {
          id: item.id_carta,
          nome: carta?.nome ?? 'Carta removida',
          raridade: carta?.raridade ?? '-',
          elemento: carta?.elemento ?? '-',
          quantidade: item._count.id_usuario ?? 0,
        };
      }),
      topDecks: topDeckCartas.map((item) => {
        const carta = cartasInfo.find((c) => c.id === item.id_carta);
        return {
          id: item.id_carta,
          nome: carta?.nome ?? 'Carta removida',
          raridade: carta?.raridade ?? '-',
          elemento: carta?.elemento ?? '-',
          decks: item._count.id_carta,
        };
      }),
    };
  }

  async listarUltimosPities(limite = 50) {
    const logs = await this.prisma.logGacha.findMany({
      take: Math.min(100, Math.max(1, limite)),
      orderBy: { timestamp_pull: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: {
              select: {
                avatar_url: true,
              },
            },
          },
        },
        banner: {
          select: {
            id: true,
            nome: true,
            configuracao: true,
          },
        },
        cartaObtida: {
          select: {
            id: true,
            nome: true,
            raridade: true,
            elemento: true,
            foto: true,
            moldura: true,
            config_visual: true,
          },
        },
      },
    });

    return logs.map((log) => {
      let limitePityBanner: number | null = null;
      if (
        log.banner.configuracao &&
        typeof log.banner.configuracao === 'object' &&
        'pities' in (log.banner.configuracao as object) &&
        Array.isArray((log.banner.configuracao as any).pities)
      ) {
        const pities = (log.banner.configuracao as any).pities as Array<{
          raridade: string;
          limite: number;
        }>;
        const pityDaRaridade = pities.find(
          (p) => p.raridade === log.cartaObtida.raridade,
        );
        if (pityDaRaridade) {
          limitePityBanner = pityDaRaridade.limite;
        }
      }

      return {
        id: log.id,
        pityContador: log.pity_contador,
        limitePityBanner,
        foiPityGarantido:
          limitePityBanner !== null && log.pity_contador >= limitePityBanner,
        rubysGastos: log.rubys_gastos,
        dataHora: log.timestamp_pull ? log.timestamp_pull.toISOString() : null,
        jogador: {
          id: log.usuario.id,
          nome: log.usuario.nome,
          email: log.usuario.email,
          avatarUrl: log.usuario.perfil?.avatar_url || null,
        },
        banner: {
          id: log.banner.id,
          nome: log.banner.nome,
        },
        carta: {
          id: log.cartaObtida.id,
          nome: log.cartaObtida.nome,
          raridade: log.cartaObtida.raridade,
          elemento: log.cartaObtida.elemento,
          foto: log.cartaObtida.foto,
          moldura: log.cartaObtida.moldura,
          configVisual: log.cartaObtida.config_visual,
        },
      };
    });
  }
}
