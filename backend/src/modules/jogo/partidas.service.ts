import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import {
  executarTurno as executarTurnoMotor,
  iniciarBatalha,
  type CartaBatalha,
  type CartaBatalhaBase,
  type EstadoBatalha,
  type Dificuldade,
  type Lado,
} from './batalha.engine';

const partidaInclude = {
  deck: { select: { id: true, nome: true } },
  expedicao: { select: { id: true, etapa_atual: true } },
  cartas: { orderBy: [{ lado: 'asc' as const }, { posicao: 'asc' as const }] },
  eventos: { orderBy: { sequencia: 'asc' as const } },
} satisfies Prisma.LogPartidaInclude;

type PartidaPersistida = Prisma.LogPartidaGetPayload<{
  include: typeof partidaInclude;
}>;

type CartaCompleta = {
  id: string;
  nome: string;
  raridade: string;
  elemento: string;
  hp_base: number;
  dano_base: number;
  defesa_base: number;
  passiva: Prisma.JsonValue | null;
  foto: string | null;
  moldura: string | null;
  config_visual: Prisma.JsonValue | null;
};

const recompensaVitoria = { pontos: 10, rubys: 25 };

@Injectable()
export class PartidasService {
  constructor(private readonly prisma: PrismaService) {}

  async ranking(limite = 100) {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        is_admin: false,
        ativo: true,
        excluido_em: null,
      },
      select: {
        id: true,
        nome: true,
        nivel: true,
        pontos_experiencia: true,
        perfil: { select: { avatar_url: true, mostrar_no_ranking: true } },
      },
    });

    if (!usuarios.length) return { jogadores: [] };

    const pontuacoes = await this.prisma.logPartida.groupBy({
      by: ['id_usuario'],
      where: {
        id_usuario: { in: usuarios.map((usuario) => usuario.id) },
        resultado: { not: 'EM_ANDAMENTO' },
      },
      _sum: { variacao_pontos: true },
      _count: { id: true },
    });
    const porUsuario = new Map(
      pontuacoes.map((item) => [item.id_usuario, item]),
    );

    const jogadores = usuarios
      .filter(
        (usuario) =>
          usuario.perfil == null || usuario.perfil.mostrar_no_ranking,
      )
      .map((usuario) => {
        const pontuacao = porUsuario.get(usuario.id);
        return {
          posicao: 0,
          id: usuario.id,
          nome: usuario.nome,
          nivel: usuario.nivel ?? 1,
          pontos:
            pontuacao?._sum.variacao_pontos ?? usuario.pontos_experiencia ?? 0,
          partidas: pontuacao?._count.id ?? 0,
          avatarUrl: usuario.perfil?.avatar_url ?? null,
        };
      })
      .filter((jogador) => jogador.pontos > 0)
      .sort((a, b) => b.pontos - a.pontos || b.partidas - a.partidas)
      .slice(0, Math.min(Math.max(limite, 1), 100));

    return {
      jogadores: jogadores.map((jogador, indice) => ({
        ...jogador,
        posicao: indice + 1,
      })),
    };
  }

  async iniciar(
    idUsuario: string,
    idDeck: string,
    contexto?: {
      idExpedicao: string;
      etapa: number;
      dificuldade: Dificuldade;
    },
  ) {
    const existente = await this.prisma.logPartida.findFirst({
      where: { id_usuario: idUsuario, resultado: 'EM_ANDAMENTO' },
      include: partidaInclude,
      orderBy: { timestamp_inicio: 'desc' },
    });
    if (existente) return this.formatar(existente);

    const deck = await this.prisma.deck.findFirst({
      where: { id: idDeck, id_usuario: idUsuario, excluido_em: null },
      include: {
        cartas: {
          include: { carta: true },
          orderBy: { posicao_slot: 'asc' },
        },
      },
    });
    if (!deck || deck.cartas.length < 3 || deck.cartas.length > 6) {
      throw new BadRequestException('Selecione um deck com 3 a 6 cartas.');
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

    const cartasBot = await this.prisma.carta.findMany({
      where: { ativo: true, excluido_em: null },
      orderBy: [{ raridade: 'asc' }, { nome: 'asc' }],
      take: deck.cartas.length,
    });
    if (cartasBot.length !== deck.cartas.length) {
      throw new BadRequestException(
        `Cadastre pelo menos ${deck.cartas.length} cartas ativas para montar o adversário.`,
      );
    }

    const cartasJogador = deck.cartas.map((item) => item.carta);
    const estado = iniciarBatalha(
      cartasJogador.map((carta) => this.mapearCarta(carta)),
      cartasBot.map((carta) => this.mapearCarta(carta)),
      contexto?.dificuldade ?? 'MEDIA',
    );

    try {
      const partida = await this.prisma.logPartida.create({
        data: {
          id_usuario: idUsuario,
          id_deck_usado: deck.id,
          id_expedicao: contexto?.idExpedicao,
          etapa_expedicao: contexto?.etapa,
          resultado: 'EM_ANDAMENTO',
          turnos_jogados: 0,
          variacao_pontos: 0,
          recompensa_rubys: 0,
          cartas: {
            create: [
              ...estado.jogador.cartas.map((carta, indice) =>
                this.criarCartaPersistida(
                  carta,
                  cartasJogador[indice],
                  'JOGADOR',
                  indice,
                ),
              ),
              ...estado.bot.cartas.map((carta, indice) =>
                this.criarCartaPersistida(
                  carta,
                  cartasBot[indice],
                  'BOT',
                  indice,
                ),
              ),
            ],
          },
          eventos: {
            create: estado.eventos.map((evento, indice) => ({
              sequencia: indice + 1,
              turno: evento.turno,
              tipo: evento.tipo,
              origem: evento.origem,
              texto: evento.texto,
              valor: evento.valor,
            })),
          },
        },
        include: partidaInclude,
      });
      return this.formatar(partida);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma batalha em andamento.');
      }
      throw error;
    }
  }

  async buscarAtual(idUsuario: string) {
    const partida = await this.prisma.logPartida.findFirst({
      where: { id_usuario: idUsuario, resultado: 'EM_ANDAMENTO' },
      include: partidaInclude,
      orderBy: { timestamp_inicio: 'desc' },
    });
    return partida ? this.formatar(partida) : null;
  }

  async buscar(idUsuario: string, idPartida: string) {
    const partida = await this.buscarPartida(idUsuario, idPartida);
    return this.formatar(partida);
  }

  async executarTurno(idUsuario: string, idPartida: string) {
    const partida = await this.buscarPartida(idUsuario, idPartida);
    if (partida.resultado !== 'EM_ANDAMENTO') {
      throw new BadRequestException('Esta batalha já foi finalizada.');
    }

    const estado = this.montarEstado(partida);
    executarTurnoMotor(estado);
    const resultado =
      estado.status === 'EM_ANDAMENTO'
        ? 'EM_ANDAMENTO'
        : estado.vencedor === 'JOGADOR'
          ? 'VITORIA'
          : estado.vencedor === 'BOT'
            ? 'DERROTA'
            : 'EMPATE';
    const venceu = resultado === 'VITORIA';

    await this.prisma.$transaction(async (tx) => {
      const atualizada = await tx.logPartida.updateMany({
        where: {
          id: idPartida,
          id_usuario: idUsuario,
          resultado: 'EM_ANDAMENTO',
          turnos_jogados: partida.turnos_jogados,
        },
        data: {
          resultado,
          turnos_jogados: estado.turno,
          variacao_pontos: venceu ? recompensaVitoria.pontos : 0,
          recompensa_rubys: venceu ? recompensaVitoria.rubys : 0,
          ...(resultado !== 'EM_ANDAMENTO'
            ? { timestamp_fim: new Date() }
            : {}),
        },
      });
      if (atualizada.count === 0) {
        throw new ConflictException(
          'Este turno já foi processado. Atualize a batalha.',
        );
      }

      const cartasPersistidas = {
        JOGADOR: partida.cartas.filter((carta) => carta.lado === 'JOGADOR'),
        BOT: partida.cartas.filter((carta) => carta.lado === 'BOT'),
      };
      for (const lado of ['JOGADOR', 'BOT'] as Lado[]) {
        const cartasEstado =
          lado === 'JOGADOR' ? estado.jogador.cartas : estado.bot.cartas;
        for (const [indice, carta] of cartasEstado.entries()) {
          await tx.partidaCarta.update({
            where: { id: cartasPersistidas[lado][indice].id },
            data: {
              hp_atual: carta.hpAtual,
              ataque_atual: carta.ataqueAtual,
              defesa_atual: carta.defesaAtual,
              velocidade_atual: carta.velocidadeAtual,
              derrotada: carta.derrotada,
              atualizado_em: new Date(),
            },
          });
        }
      }

      const primeiraSequencia = partida.eventos.length + 1;
      if (estado.eventos.length) {
        await tx.eventoPartida.createMany({
          data: estado.eventos.map((evento, indice) => ({
            id_partida: idPartida,
            sequencia: primeiraSequencia + indice,
            turno: evento.turno,
            tipo: evento.tipo,
            origem: evento.origem,
            texto: evento.texto,
            valor: evento.valor,
          })),
        });
      }

      if (venceu) {
        await tx.usuario.update({
          where: { id: idUsuario },
          data: {
            pontos_experiencia: { increment: recompensaVitoria.pontos },
            atualizado_em: new Date(),
          },
        });
        await tx.ledgerRuby.create({
          data: {
            id_usuario: idUsuario,
            quantidade: recompensaVitoria.rubys,
            motivo: 'VITORIA_PARTIDA',
            id_referencia: idPartida,
            descricao: 'Recompensa por vitória em batalha.',
          },
        });
      }
    });

    return this.buscar(idUsuario, idPartida);
  }

  async historico(idUsuario: string) {
    return this.prisma.logPartida.findMany({
      where: { id_usuario: idUsuario, resultado: { not: 'EM_ANDAMENTO' } },
      select: {
        id: true,
        resultado: true,
        turnos_jogados: true,
        variacao_pontos: true,
        recompensa_rubys: true,
        timestamp_inicio: true,
        timestamp_fim: true,
        deck: { select: { nome: true } },
      },
      orderBy: { timestamp_inicio: 'desc' },
      take: 30,
    });
  }

  private buscarPartida(idUsuario: string, idPartida: string) {
    return this.prisma.logPartida
      .findFirst({
        where: { id: idPartida, id_usuario: idUsuario },
        include: partidaInclude,
      })
      .then((partida) => {
        if (!partida) throw new NotFoundException('Batalha não encontrada.');
        return partida;
      });
  }

  private montarEstado(partida: PartidaPersistida): EstadoBatalha {
    const montarEquipe = (lado: Lado) => {
      const cartas = partida.cartas
        .filter((carta) => carta.lado === lado)
        .map((carta) => ({
          id: carta.id_carta,
          nome: carta.nome_snapshot,
          hp: carta.hp_base,
          ataque: carta.ataque_base,
          defesa: carta.defesa_base,
          velocidade: carta.velocidade_base,
          elemento: carta.elemento,
          passiva: this.normalizarPassiva(carta.passiva),
          hpAtual: carta.hp_atual,
          ataqueAtual: carta.ataque_atual,
          defesaAtual: carta.defesa_atual,
          velocidadeAtual: carta.velocidade_atual,
          derrotada: carta.derrotada,
        }));
      const ativa = Math.max(
        0,
        cartas.findIndex((carta) => !carta.derrotada),
      );
      return { cartas, ativa };
    };

    return {
      turno: partida.turnos_jogados,
      status: 'EM_ANDAMENTO',
      vencedor: null,
      jogador: montarEquipe('JOGADOR'),
      bot: montarEquipe('BOT'),
      eventos: [],
    };
  }

  private criarCartaPersistida(
    carta: CartaBatalha,
    original: CartaCompleta,
    lado: Lado,
    indice: number,
  ): Prisma.PartidaCartaCreateWithoutPartidaInput {
    return {
      carta: { connect: { id: original.id } },
      lado,
      posicao: indice + 1,
      nome_snapshot: original.nome,
      raridade: original.raridade,
      elemento: original.elemento,
      foto: original.foto,
      moldura: original.moldura,
      config_visual: original.config_visual ?? undefined,
      passiva: original.passiva ?? undefined,
      hp_base: carta.hp,
      ataque_base: carta.ataque,
      defesa_base: carta.defesa,
      velocidade_base: carta.velocidade,
      hp_atual: carta.hpAtual,
      ataque_atual: carta.ataqueAtual,
      defesa_atual: carta.defesaAtual,
      velocidade_atual: carta.velocidadeAtual,
      derrotada: carta.derrotada,
    };
  }

  private mapearCarta(carta: CartaCompleta): CartaBatalhaBase {
    const passiva = this.normalizarPassiva(carta.passiva);
    return {
      id: carta.id,
      nome: carta.nome,
      hp: Math.max(1, carta.hp_base),
      ataque: Math.max(1, carta.dano_base),
      defesa: Math.max(0, carta.defesa_base),
      velocidade:
        typeof passiva.velocidade === 'number'
          ? Math.max(1, passiva.velocidade)
          : 10,
      elemento: carta.elemento,
      passiva,
    };
  }

  private normalizarPassiva(passiva: unknown) {
    return passiva && typeof passiva === 'object' && !Array.isArray(passiva)
      ? (passiva as Record<string, unknown>)
      : {};
  }

  private formatar(partida: PartidaPersistida) {
    const formatarEquipe = (lado: Lado) => {
      const cartas = partida.cartas
        .filter((carta) => carta.lado === lado)
        .map((carta) => ({
          id: carta.id_carta,
          nome: carta.nome_snapshot,
          raridade: carta.raridade,
          elemento: carta.elemento,
          foto: carta.foto,
          moldura: carta.moldura,
          configVisual: carta.config_visual,
          passiva: this.normalizarPassiva(carta.passiva),
          hp: carta.hp_base,
          hpAtual: carta.hp_atual,
          ataqueBase: carta.ataque_base,
          defesaBase: carta.defesa_base,
          velocidadeBase: carta.velocidade_base,
          ataque: carta.ataque_atual,
          defesa: carta.defesa_atual,
          velocidade: carta.velocidade_atual,
          derrotada: carta.derrotada,
          posicao: carta.posicao,
        }));
      const indiceAtiva = cartas.findIndex((carta) => !carta.derrotada);
      return {
        ativa: indiceAtiva < 0 ? cartas.length - 1 : indiceAtiva,
        cartas,
      };
    };

    return {
      id: partida.id,
      status:
        partida.resultado === 'EM_ANDAMENTO' ? 'EM_ANDAMENTO' : 'FINALIZADA',
      resultado:
        partida.resultado === 'EM_ANDAMENTO' ? null : partida.resultado,
      turno: partida.turnos_jogados,
      vez: partida.resultado === 'EM_ANDAMENTO' ? 'JOGADOR' : null,
      deck: partida.deck,
      expedicao: partida.expedicao
        ? {
            id: partida.expedicao.id,
            etapa: partida.etapa_expedicao ?? partida.expedicao.etapa_atual,
          }
        : null,
      recompensas: {
        pontos: partida.variacao_pontos ?? 0,
        rubys: partida.recompensa_rubys,
      },
      jogador: formatarEquipe('JOGADOR'),
      bot: formatarEquipe('BOT'),
      eventos: partida.eventos.map((evento) => ({
        id: evento.id,
        sequencia: evento.sequencia,
        turno: evento.turno,
        tipo: evento.tipo,
        origem: evento.origem,
        texto: evento.texto,
        valor: evento.valor,
        criadoEm: evento.criado_em,
      })),
      iniciadoEm: partida.timestamp_inicio,
      finalizadoEm: partida.timestamp_fim,
    };
  }
}
