import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  executarTurno as executarTurnoMotor,
  iniciarBatalha,
  type Dificuldade,
  type Lado,
  type AcaoTurno,
} from './batalha.engine';
import {
  calcularVantagemCarta,
  cartaBatalhaInclude,
  criarCartaPersistida,
  filtrarCartasPorForca,
  formatarPartidaPersistida,
  mapearCartaBatalha,
  montarEstadoPartida,
  partidaInclude,
  selecionarCartasAdversario,
} from './partidas.helpers';

export { filtrarCartasPorForca, selecionarCartasAdversario };

const recompensaVitoria = { pontos: 10, rubys: 25 };

@Injectable()
export class PartidasService {
  constructor(private readonly prisma: PrismaService) {}

  async ranking(limite = 100) {
    const usuarios = await this.prisma.usuario.findMany({
      where: {
        is_admin: false,
        ativo: true,
        email_verificado: true,
        excluido_em: null,
      },
      select: {
        id: true,
        nome: true,
        nivel: true,
        pontos_experiencia: true,
        perfil: {
          select: {
            avatar_url: true,
            mostrar_no_ranking: true,
            molduraSelecionada: { select: { classe_css: true } },
            cartaMolduraSelecionada: {
              select: { moldura: true, config_visual: true },
            },
          },
        },
      },
    });

    if (!usuarios.length) return { jogadores: [] };

    const idsUsuarios = usuarios.map((usuario) => usuario.id);
    const [pontuacoes, colecoes] = await Promise.all([
      this.prisma.logPartida.groupBy({
        by: ['id_usuario'],
        where: {
          id_usuario: { in: idsUsuarios },
          resultado: { not: 'EM_ANDAMENTO' },
        },
        _sum: { variacao_pontos: true },
        _count: { id: true },
      }),
      this.prisma.inventario.groupBy({
        by: ['id_usuario'],
        where: {
          id_usuario: { in: idsUsuarios },
          quantidade: { gt: 0 },
        },
        _count: { id: true },
      }),
    ]);
    const porUsuario = new Map(
      pontuacoes.map((item) => [item.id_usuario, item]),
    );
    const colecaoPorUsuario = new Map(
      colecoes.map((item) => [item.id_usuario, item._count.id]),
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
          cartasColecionadas: colecaoPorUsuario.get(usuario.id) ?? 0,
          avatarUrl: usuario.perfil?.avatar_url ?? null,
          molduraClasse: usuario.perfil?.cartaMolduraSelecionada
            ? 'molduraCarta'
            : (usuario.perfil?.molduraSelecionada?.classe_css ??
              'molduraPadrao'),
          molduraUrl: usuario.perfil?.cartaMolduraSelecionada?.moldura ?? null,
          molduraConfig:
            usuario.perfil?.cartaMolduraSelecionada?.config_visual ?? null,
        };
      })
      .filter((jogador) => jogador.pontos > 0)
      .sort(
        (a, b) =>
          b.pontos - a.pontos ||
          b.partidas - a.partidas ||
          b.cartasColecionadas - a.cartasColecionadas ||
          a.nome.localeCompare(b.nome, 'pt-BR'),
      )
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
      boss?: { cartas: string[] };
      cartasAdversario?: string[];
      quantidadeCartas?: number;
      modoCartas?: 'ALEATORIO' | 'MANUAL';
      mixed?: boolean;
    },
  ) {
    const existente = await this.prisma.logPartida.findFirst({
      where: { id_usuario: idUsuario, resultado: 'EM_ANDAMENTO' },
      include: partidaInclude,
      orderBy: { timestamp_inicio: 'desc' },
    });
    if (existente) return formatarPartidaPersistida(existente);

    const deck = await this.prisma.deck.findFirst({
      where: { id: idDeck, id_usuario: idUsuario, excluido_em: null },
      include: {
        cartas: {
          where: { carta: { ativo: true, excluido_em: null } },
          include: { carta: { include: cartaBatalhaInclude } },
          orderBy: { posicao_slot: 'asc' },
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

    const cartasCandidatas = await this.prisma.carta.findMany({
      where: {
        ativo: true,
        excluido_em: null,
        ...(contexto?.boss?.cartas.length
          ? { id: { in: contexto.boss.cartas } }
          : contexto?.modoCartas === 'MANUAL'
            ? { id: { in: contexto.cartasAdversario ?? [] } }
            : {}),
      },
      orderBy: [{ raridade: 'asc' }, { nome: 'asc' }],
      take: contexto?.boss ? 100 : 1000,
      include: cartaBatalhaInclude,
    });
    const cartasJogador = deck.cartas.map((item) => item.carta);
    const candidatasEquilibradas =
      contexto?.boss || contexto?.modoCartas === 'MANUAL'
        ? cartasCandidatas
        : filtrarCartasPorForca(cartasCandidatas, cartasJogador);
    const quantidadeDesejada = contexto?.boss
      ? deck.cartas.length
      : (contexto?.quantidadeCartas ?? deck.cartas.length);
    const quantidadeEsperada =
      contexto?.modoCartas === 'MANUAL'
        ? quantidadeDesejada
        : Math.min(
            quantidadeDesejada,
            Math.max(1, candidatasEquilibradas.length),
          );
    const cartasBot = contexto?.boss
      ? [...cartasCandidatas]
          .sort(
            (a, b) =>
              calcularVantagemCarta(b, cartasJogador) -
              calcularVantagemCarta(a, cartasJogador),
          )
          .slice(0, quantidadeEsperada)
      : selecionarCartasAdversario(candidatasEquilibradas, quantidadeEsperada, {
          ...contexto,
          quantidadeCartas: quantidadeEsperada,
        });
    if (cartasBot.length !== quantidadeEsperada) {
      throw new BadRequestException(
        `Cadastre pelo menos ${quantidadeEsperada} cartas ativas para montar o adversário.`,
      );
    }

    const estado = iniciarBatalha(
      cartasJogador.map((carta) => mapearCartaBatalha(carta)),
      cartasBot.map((carta) => mapearCartaBatalha(carta)),
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
                criarCartaPersistida(
                  carta,
                  cartasJogador[indice],
                  'JOGADOR',
                  indice,
                ),
              ),
              ...estado.bot.cartas.map((carta, indice) =>
                criarCartaPersistida(carta, cartasBot[indice], 'BOT', indice),
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
      return formatarPartidaPersistida(partida);
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
    return partida ? formatarPartidaPersistida(partida) : null;
  }

  async buscar(idUsuario: string, idPartida: string) {
    const partida = await this.buscarPartida(idUsuario, idPartida);
    return formatarPartidaPersistida(partida);
  }

  async executarTurno(idUsuario: string, idPartida: string, acao: AcaoTurno) {
    const partida = await this.buscarPartida(idUsuario, idPartida);
    if (partida.resultado !== 'EM_ANDAMENTO') {
      throw new BadRequestException('Esta batalha já foi finalizada.');
    }

    const estado = montarEstadoPartida(partida);
    try {
      executarTurnoMotor(estado, acao);
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : 'Ação inválida.',
      );
    }
    const resultado =
      estado.status === 'EM_ANDAMENTO'
        ? 'EM_ANDAMENTO'
        : estado.vencedor === 'JOGADOR'
          ? 'VITORIA'
          : estado.vencedor === 'BOT'
            ? 'DERROTA'
            : 'EMPATE';
    const venceu = resultado === 'VITORIA';
    const recompensaRubys =
      venceu && !partida.id_expedicao ? recompensaVitoria.rubys : 0;

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
          recompensa_rubys: recompensaRubys,
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
              passiva: carta.passiva as Prisma.InputJsonValue,
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
            ...(!partida.id_expedicao
              ? { saldo_rubys_cache: { increment: recompensaVitoria.rubys } }
              : {}),
            atualizado_em: new Date(),
          },
        });
        if (!partida.id_expedicao) {
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
}
