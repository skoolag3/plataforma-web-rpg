import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  analisarResposta,
  executarTurno,
  iniciarBatalha,
  type CartaBatalhaBase,
} from './batalha.engine';

@Injectable()
export class PartidasService {
  constructor(private readonly prisma: PrismaService) {}

  provocacao() {
    return {
      personalidade: 'Lorde Umbra, o estrategista arrogante',
      pergunta:
        'Seu deck parece frágil. Diga-me: por que eu deveria acreditar que você sobreviverá ao primeiro turno?',
    };
  }

  async iniciarContraBot(idUsuario: string, resposta: string) {
    const deck = await this.prisma.deck.findFirst({
      where: { id_usuario: idUsuario, ativo: true, excluido_em: null },
      include: {
        cartas: {
          include: { carta: true },
          orderBy: { posicao_slot: 'asc' },
        },
      },
    });
    if (!deck || deck.cartas.length !== 6) {
      throw new BadRequestException('Ative um deck completo com 6 cartas antes de batalhar.');
    }

    const cartasBot = await this.prisma.carta.findMany({
      where: { ativo: true, excluido_em: null },
      orderBy: [{ raridade: 'asc' }, { nome: 'asc' }],
      take: 6,
    });
    if (cartasBot.length < 6) {
      throw new BadRequestException('Cadastre pelo menos 6 cartas ativas para o bot.');
    }

    const dificuldade = analisarResposta(resposta);
    const estado = iniciarBatalha(
      deck.cartas.map(({ carta }) => this.mapearCarta(carta)),
      cartasBot.map((carta) => this.mapearCarta(carta)),
      dificuldade,
    );
    while (estado.status === 'EM_ANDAMENTO' && estado.turno < 100) {
      executarTurno(estado);
    }
    if (estado.status === 'EM_ANDAMENTO') {
      estado.status = 'FINALIZADA';
      estado.vencedor = 'EMPATE';
    }

    const resultado =
      estado.vencedor === 'JOGADOR'
        ? 'VITORIA'
        : estado.vencedor === 'BOT'
          ? 'DERROTA'
          : 'EMPATE';
    const variacao = resultado === 'VITORIA' ? 20 : resultado === 'DERROTA' ? -8 : 0;
    const log = await this.prisma.logPartida.create({
      data: {
        id_usuario: idUsuario,
        id_deck_usado: deck.id,
        resultado,
        turnos_jogados: estado.turno,
        variacao_pontos: variacao,
        timestamp_fim: new Date(),
      },
    });

    return {
      id: log.id,
      personalidade: this.provocacao().personalidade,
      resposta,
      dificuldade,
      resultado,
      variacaoPontos: variacao,
      estado,
    };
  }

  async historico(idUsuario: string) {
    return this.prisma.logPartida.findMany({
      where: { id_usuario: idUsuario },
      select: {
        id: true,
        resultado: true,
        turnos_jogados: true,
        variacao_pontos: true,
        timestamp_inicio: true,
        timestamp_fim: true,
        deck: { select: { nome: true } },
      },
      orderBy: { timestamp_inicio: 'desc' },
      take: 30,
    });
  }

  private mapearCarta(carta: {
    id: string;
    nome: string;
    hp_base: number;
    dano_base: number;
    defesa_base: number;
    elemento: string;
    passiva: unknown;
  }): CartaBatalhaBase {
    const passiva =
      carta.passiva && typeof carta.passiva === 'object' && !Array.isArray(carta.passiva)
        ? (carta.passiva as Record<string, unknown>)
        : {};
    return {
      id: carta.id,
      nome: carta.nome,
      hp: Math.max(1, carta.hp_base),
      ataque: Math.max(1, carta.dano_base),
      defesa: Math.max(0, carta.defesa_base),
      velocidade:
        typeof passiva.velocidade === 'number'
          ? Math.max(1, passiva.velocidade)
          : 10 + (typeof passiva.custo === 'number' ? passiva.custo : 0),
      elemento: carta.elemento,
      passiva,
    };
  }
}
