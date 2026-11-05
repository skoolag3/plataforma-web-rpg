import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomInt } from 'node:crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { PartidasService } from '../combate/partidas.service';
import {
  gerarSeedExpedicao,
  gerarTrilhaExpedicao,
  percentualMantidoNaEtapa,
  type OpcaoRota,
  type TrilhaExpedicao,
  type SecaoCampanha,
  secoesPadraoCampanha,
} from './expedicao.trilha';
import {
  configuracaoRecompensasPadrao,
  recompensaAposDerrota,
  recompensaDaRota,
  rubysPerdidosNaDerrota,
  type ConfiguracaoRecompensasExpedicao,
} from './expedicao.recompensas';
import {
  avaliarRespostaBoss,
  multiplicadorBoss,
  perguntaBoss,
  type DialogoBoss,
} from './boss.dialogo';

const expedicaoInclude = {
  deck: { select: { id: true, nome: true } },
  produto: {
    select: { id: true, nome: true, descricao: true, tema: true, tipo: true },
  },
  partidas: {
    select: {
      id: true,
      etapa_expedicao: true,
      resultado: true,
      recompensa_rubys: true,
      timestamp_inicio: true,
    },
    orderBy: { timestamp_inicio: 'desc' as const },
  },
} satisfies Prisma.ExpedicaoInclude;

type ExpedicaoPersistida = Prisma.ExpedicaoGetPayload<{
  include: typeof expedicaoInclude;
}>;

@Injectable()
export class ExpedicoesService {
  private readonly processandoBoss = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly partidasService: PartidasService,
  ) {}

  async criar(idUsuario: string, idDeck: string) {
    await this.sincronizar(idUsuario);
    const configuracao = await this.sortearProduto();
    const ativa = await this.prisma.expedicao.findFirst({
      where: { id_usuario: idUsuario, status: 'EM_ANDAMENTO' },
    });
    if (ativa) throw new ConflictException('Já existe uma expedição ativa.');

    const deck = await this.prisma.deck.findFirst({
      where: { id: idDeck, id_usuario: idUsuario, excluido_em: null },
      include: {
        cartas: {
          where: { carta: { ativo: true, excluido_em: null } },
        },
      },
    });
    if (!deck || deck.cartas.length < 1 || deck.cartas.length > 6) {
      throw new BadRequestException('Selecione um deck com 1 a 6 cartas.');
    }

    const idsCartas = deck.cartas.map((item) => item.id_carta);
    const cartasPossuidas = await this.prisma.inventario.count({
      where: {
        id_usuario: idUsuario,
        id_carta: { in: idsCartas },
        quantidade: { gt: 0 },
        carta: { ativo: true, excluido_em: null },
      },
    });
    if (cartasPossuidas !== idsCartas.length) {
      throw new BadRequestException(
        'O deck possui cartas indisponíveis ou fora do inventário.',
      );
    }

    const seed = gerarSeedExpedicao(`${idUsuario}:${idDeck}`);
    await this.prisma.expedicao.create({
      data: {
        id_usuario: idUsuario,
        id_deck: idDeck,
        id_produto_expedicao: configuracao.id,
        seed,
        trilha: gerarTrilhaExpedicao(
          seed,
          {
            percentualMantidoDerrota: configuracao.percentual_mantido_derrota,
            recompensas: {
              FACIL: configuracao.recompensa_facil,
              MEDIA: configuracao.recompensa_media,
              DIFICIL: configuracao.recompensa_dificil,
              CHEFE: configuracao.recompensa_chefe,
            },
          },
          {
            nome: configuracao.boss_nome,
            personalidade: configuracao.boss_personalidade,
            provocacao: configuracao.boss_provocacao,
            perguntas: configuracao.boss_perguntas,
            cartas: configuracao.boss_cartas,
          },
          Array.isArray(configuracao.secoes) && configuracao.secoes.length
            ? configuracao.secoes as SecaoCampanha[]
            : secoesPadraoCampanha({
                percentualMantidoDerrota: configuracao.percentual_mantido_derrota,
                recompensas: {
                  FACIL: configuracao.recompensa_facil, MEDIA: configuracao.recompensa_media,
                  DIFICIL: configuracao.recompensa_dificil, CHEFE: configuracao.recompensa_chefe,
                },
              }),
        ),
      },
    });
    return this.buscarAtual(idUsuario);
  }

  private async sortearProduto() {
    const agora = new Date();
    const produtos = await this.prisma.produtoExpedicao.findMany({
      where: {
        ativo: true,
        AND: [
          { OR: [{ inicio_em: null }, { inicio_em: { lte: agora } }] },
          { OR: [{ fim_em: null }, { fim_em: { gte: agora } }] },
        ],
      },
      orderBy: { criado_em: 'asc' },
    });
    if (!produtos.length)
      throw new ConflictException(
        'Nenhum produto de expedição está disponível agora.',
      );
    const pesoTotal = produtos.reduce(
      (total, produto) => total + produto.peso,
      0,
    );
    let sorteio = randomInt(pesoTotal);
    for (const produto of produtos) {
      sorteio -= produto.peso;
      if (sorteio < 0) return produto;
    }
    return produtos[0];
  }

  async buscarAtual(idUsuario: string) {
    await this.sincronizar(idUsuario);
    const ativa = await this.prisma.expedicao.findFirst({
      where: { id_usuario: idUsuario, status: 'EM_ANDAMENTO' },
      include: expedicaoInclude,
      orderBy: { criado_em: 'desc' },
    });
    if (ativa) return this.formatar(ativa);

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

    const trilha = this.normalizarTrilha(expedicao.trilha, expedicao.seed);
    if (expedicao.etapa_atual === trilha.etapas.length && trilha.boss && !expedicao.dialogo_boss) {
      throw new ConflictException(
        'Responda à provocação do boss antes do confronto.',
      );
    }
    const opcoes =
      expedicao.etapa_atual === trilha.etapas.length
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
        cartasAdversario: escolha.cartas,
        quantidadeCartas: escolha.quantidadeCartas,
        modoCartas: escolha.modoCartas,
        mixed: escolha.mixed,
        boss:
          expedicao.etapa_atual === trilha.etapas.length && trilha.boss
            ? {
                cartas: trilha.boss.cartas,
              }
            : undefined,
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

  async responderBoss(
    idUsuario: string,
    idExpedicao: string,
    resposta: string,
  ) {
    const texto = resposta.trim();
    if (texto.length < 5)
      throw new BadRequestException(
        'Escreva uma resposta com pelo menos 5 caracteres.',
      );
    if (texto.length > 200)
      throw new BadRequestException(
        'A resposta deve ter no máximo 200 caracteres.',
      );
    if (this.processandoBoss.has(idExpedicao)) {
      throw new ConflictException(
        'A resposta ao boss já está sendo processada.',
      );
    }

    this.processandoBoss.add(idExpedicao);
    try {
      const expedicao = await this.prisma.expedicao.findFirst({
        where: {
          id: idExpedicao,
          id_usuario: idUsuario,
          status: 'EM_ANDAMENTO',
        },
      });
      if (!expedicao)
        throw new NotFoundException('Confronto final indisponível.');
      if (expedicao.dialogo_boss || expedicao.escolha_atual)
        throw new ConflictException('A resposta do boss já foi registrada.');
      const trilha = this.normalizarTrilha(expedicao.trilha, expedicao.seed);
      if (expedicao.etapa_atual !== trilha.etapas.length)
        throw new NotFoundException('Confronto final indisponível.');
      if (!trilha.boss)
        throw new BadRequestException(
          'Esta expedição não possui diálogo configurado.',
        );
      const pergunta = perguntaBoss(trilha.boss, expedicao.seed);
      const avaliacao = await avaliarRespostaBoss(
        trilha.boss,
        pergunta,
        texto,
      );
      const dialogo: DialogoBoss = {
        pergunta,
        resposta: texto,
        reacao: avaliacao.reacao,
        nota: avaliacao.nota,
        multiplicador: multiplicadorBoss(avaliacao.nota),
        modo: avaliacao.modo,
      };
      const salvo = await this.prisma.expedicao.updateMany({
        where: {
          id: idExpedicao,
          id_usuario: idUsuario,
          status: 'EM_ANDAMENTO',
          etapa_atual: trilha.etapas.length,
          escolha_atual: null,
          dialogo_boss: { equals: Prisma.DbNull },
        },
        data: {
          dialogo_boss: dialogo as unknown as Prisma.InputJsonValue,
          atualizado_em: new Date(),
        },
      });
      if (!salvo.count)
        throw new ConflictException('A resposta já foi enviada.');
      return this.buscarAtual(idUsuario);
    } finally {
      this.processandoBoss.delete(idExpedicao);
    }
  }

  async abandonar(idUsuario: string, idExpedicao: string) {
    const atualizada = await this.prisma.expedicao.updateMany({
      where: {
        id: idExpedicao,
        id_usuario: idUsuario,
        status: 'EM_ANDAMENTO',
        partidas: { none: { resultado: 'EM_ANDAMENTO' } },
        dialogo_boss: { equals: Prisma.DbNull },
      },
      data: {
        status: 'ABANDONADA',
        finalizado_em: new Date(),
        atualizado_em: new Date(),
      },
    });
    if (!atualizada.count) {
      throw new ConflictException(
        'Não é possível abandonar durante uma batalha ou após responder ao boss.',
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

    const trilha = this.normalizarTrilha(expedicao.trilha, expedicao.seed);
    const configuracao = this.obterConfiguracaoTrilha(trilha);
    const escolha = this.buscarEscolhaAtual(trilha, expedicao);
    if (!escolha) return;
    const recompensaPendente = Math.round(
      this.recompensaEscolha(escolha, configuracao) *
        (escolha.dificuldade === 'CHEFE'
          ? ((expedicao.dialogo_boss as DialogoBoss | null)?.multiplicador ?? 1)
          : 1),
    );

    if (partida.resultado !== 'VITORIA') {
      const percentualMantido = percentualMantidoNaEtapa(trilha, expedicao.etapa_atual);
      const recompensaMantida = recompensaAposDerrota(
        recompensaPendente,
        percentualMantido,
      );
      const rubysPerdidos = rubysPerdidosNaDerrota(
        recompensaPendente,
        percentualMantido,
      );
      await this.prisma.$transaction(async (tx) => {
        const falhou = await tx.expedicao.updateMany({
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
        if (!falhou.count) return;
        await tx.logPartida.update({
          where: { id: partida.id },
          data: { recompensa_rubys: recompensaMantida },
        });
        if (recompensaMantida > 0) {
          await tx.ledgerRuby.create({
            data: {
              id_usuario: idUsuario,
              quantidade: recompensaMantida,
              motivo: 'EXPEDICAO_RESGATE_DERROTA',
              id_referencia: partida.id,
              descricao: `Resgate da Expedição após perder ${rubysPerdidos} Rubys.`,
            },
          });
          await tx.usuario.update({
            where: { id: idUsuario },
            data: {
              saldo_rubys_cache: { increment: recompensaMantida },
              atualizado_em: new Date(),
            },
          });
        }
      });
      return;
    }

    if (expedicao.etapa_atual < trilha.etapas.length) {
      await this.prisma.$transaction(async (tx) => {
        const avancou = await tx.expedicao.updateMany({
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
        if (!avancou.count) return;
        await tx.logPartida.update({
          where: { id: partida.id },
          data: { recompensa_rubys: recompensaPendente },
        });
        await tx.ledgerRuby.create({
          data: {
            id_usuario: idUsuario,
            quantidade: recompensaPendente,
            motivo: 'CHECKPOINT_EXPEDICAO',
            id_referencia: partida.id,
            descricao: `Recompensa assegurada no checkpoint ${expedicao.etapa_atual + 1}.`,
          },
        });
        await tx.usuario.update({
          where: { id: idUsuario },
          data: {
            saldo_rubys_cache: { increment: recompensaPendente },
            atualizado_em: new Date(),
          },
        });
      });
      return;
    }

    const dialogo = expedicao.dialogo_boss as DialogoBoss | null;
    const recompensaChefe = Math.round(
      recompensaDaRota('CHEFE', configuracao) * (dialogo?.multiplicador ?? 1),
    );
    await this.prisma.$transaction(async (tx) => {
      const concluida = await tx.expedicao.updateMany({
        where: {
          id: expedicao.id,
          status: 'EM_ANDAMENTO',
          etapa_atual: trilha.etapas.length,
        },
        data: {
          status: 'CONCLUIDA',
          finalizado_em: new Date(),
          atualizado_em: new Date(),
        },
      });
      if (!concluida.count) return;
      await tx.logPartida.update({
        where: { id: partida.id },
        data: { recompensa_rubys: recompensaChefe },
      });
      await tx.ledgerRuby.create({
        data: {
          id_usuario: idUsuario,
          quantidade: recompensaChefe,
          motivo: 'EXPEDICAO_CONCLUIDA',
          id_referencia: expedicao.id,
          descricao: 'Recompensa pela conclusão da Expedição.',
        },
      });
      await tx.usuario.update({
        where: { id: idUsuario },
        data: {
          saldo_rubys_cache: { increment: recompensaChefe },
          atualizado_em: new Date(),
        },
      });
    });
  }

  private normalizarTrilha(valor: Prisma.JsonValue, seed = 1): TrilhaExpedicao {
    if (
      valor &&
      typeof valor === 'object' &&
      !Array.isArray(valor) &&
      Array.isArray((valor as Partial<TrilhaExpedicao>).etapas) &&
      (valor as Partial<TrilhaExpedicao>).chefe
    ) {
      return valor as unknown as TrilhaExpedicao;
    }
    return gerarTrilhaExpedicao(seed || 1);
  }

  private buscarEscolhaAtual(
    trilha: TrilhaExpedicao,
    expedicao: ExpedicaoPersistida,
  ): OpcaoRota | null {
    const opcoes =
      expedicao.etapa_atual === trilha.etapas.length
        ? [trilha.chefe]
        : (trilha.etapas[expedicao.etapa_atual]?.opcoes ?? []);
    return opcoes.find((opcao) => opcao.id === expedicao.escolha_atual) ?? null;
  }

  private obterConfiguracaoTrilha(
    trilha: TrilhaExpedicao,
  ): ConfiguracaoRecompensasExpedicao {
    return trilha.configuracao ?? configuracaoRecompensasPadrao;
  }

  private recompensaEscolha(opcao: OpcaoRota, configuracao: ConfiguracaoRecompensasExpedicao) {
    return opcao.recompensa ?? recompensaDaRota(opcao.dificuldade, configuracao);
  }

  private formatarOpcao(
    opcao: OpcaoRota,
    configuracao: ConfiguracaoRecompensasExpedicao,
    multiplicador = 1,
  ) {
    return {
      ...opcao,
      recompensa: Math.round(
        this.recompensaEscolha(opcao, configuracao) *
          (opcao.dificuldade === 'CHEFE' ? multiplicador : 1),
      ),
    };
  }

  private formatar(expedicao: ExpedicaoPersistida) {
    const trilha = this.normalizarTrilha(expedicao.trilha, expedicao.seed);
    const configuracao = this.obterConfiguracaoTrilha(trilha);
    const multiplicador =
      (expedicao.dialogo_boss as DialogoBoss | null)?.multiplicador ?? 1;
    const partidaAtual = expedicao.partidas.find(
      (partida) => partida.etapa_expedicao === expedicao.etapa_atual,
    );
    const escolhaAtual = this.buscarEscolhaAtual(trilha, expedicao);
    const rubysAssegurados = expedicao.partidas.reduce(
      (total, partida) => total + partida.recompensa_rubys,
      0,
    );
    return {
      id: expedicao.id,
      status: expedicao.status,
      seed: expedicao.seed,
      etapaAtual: expedicao.etapa_atual,
      totalEtapas: trilha.etapas.length + 1,
      deck: expedicao.deck,
      produto: expedicao.produto,
      escolhas: expedicao.escolhas,
      etapas: trilha.etapas.map((etapa) => ({
        indice: etapa.indice,
        opcoes: etapa.opcoes.map((opcao) =>
          this.formatarOpcao(opcao, configuracao),
        ),
        status:
          etapa.indice < expedicao.etapa_atual
            ? 'CONCLUIDA'
            : etapa.indice === expedicao.etapa_atual &&
                expedicao.status === 'EM_ANDAMENTO'
              ? 'ATUAL'
              : 'BLOQUEADA',
      })),
      chefe: {
        ...this.formatarOpcao(trilha.chefe, configuracao, multiplicador),
        status:
          expedicao.etapa_atual === trilha.etapas.length && expedicao.status === 'EM_ANDAMENTO'
            ? 'ATUAL'
            : expedicao.status === 'CONCLUIDA'
              ? 'CONCLUIDA'
              : 'BLOQUEADA',
      },
      dialogoBoss: trilha.boss
        ? {
            nome: trilha.boss.nome,
            provocacao: trilha.boss.provocacao,
            pergunta: perguntaBoss(trilha.boss, expedicao.seed),
            resultado: expedicao.dialogo_boss as DialogoBoss | null,
          }
        : null,
      opcoesAtuais:
        expedicao.status !== 'EM_ANDAMENTO' || partidaAtual
          ? []
          : expedicao.etapa_atual === trilha.etapas.length
            ? [this.formatarOpcao(trilha.chefe, configuracao, multiplicador)]
            : (trilha.etapas[expedicao.etapa_atual]?.opcoes.map((opcao) =>
                this.formatarOpcao(opcao, configuracao),
              ) ?? []),
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
      recompensaFinal: Math.round(
        recompensaDaRota('CHEFE', configuracao) * multiplicador,
      ),
      recompensaPendente: escolhaAtual
        ? Math.round(
            this.recompensaEscolha(escolhaAtual, configuracao) *
              (escolhaAtual.dificuldade === 'CHEFE' ? multiplicador : 1),
          )
        : 0,
      rubysPerdidos:
        expedicao.status === 'FALHOU' && escolhaAtual
          ? rubysPerdidosNaDerrota(
              Math.round(
                this.recompensaEscolha(escolhaAtual, configuracao) *
                  (escolhaAtual.dificuldade === 'CHEFE' ? multiplicador : 1),
              ),
              percentualMantidoNaEtapa(trilha, expedicao.etapa_atual),
            )
          : 0,
      rubysAssegurados,
      criadoEm: expedicao.criado_em,
      finalizadoEm: expedicao.finalizado_em,
    };
  }
}
