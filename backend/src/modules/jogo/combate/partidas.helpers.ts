import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomInt } from 'node:crypto';
import type {
  CartaBatalha,
  CartaBatalhaBase,
  EstadoBatalha,
  Lado,
} from './batalha.engine';
import type { ConfiguracaoHabilidade } from '../habilidades/habilidade.types';

export const partidaInclude = {
  deck: { select: { id: true, nome: true } },
  expedicao: { select: { id: true, etapa_atual: true } },
  cartas: { orderBy: [{ lado: 'asc' as const }, { posicao: 'asc' as const }] },
  eventos: { orderBy: { sequencia: 'asc' as const } },
} satisfies Prisma.LogPartidaInclude;

export type PartidaPersistida = Prisma.LogPartidaGetPayload<{
  include: typeof partidaInclude;
}>;

export type CartaCompleta = {
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
  classe: {
    nome: string;
    prioridade_ataque: number;
    modificador_hp: number;
    modificador_ataque: number;
    modificador_defesa: number;
  } | null;
  habilidades: {
    ordem: number;
    habilidade: {
      nome: string;
      descricao: string | null;
      modo_execucao: string;
      tipo_efeito: string;
      gatilho: string;
      alvo: string;
      atributo: string | null;
      unidade: string;
      valor_base: number;
      forma_aplicacao: string;
      requisito_tipo: string;
      requisito_valor: number | null;
      escala_tipo: string;
      escala_valor: number | null;
      escala_limite: number | null;
      duracao_turnos: number | null;
      status: string;
    };
  }[];
};

export const cartaBatalhaInclude = {
  classe: true,
  habilidades: {
    where: { habilidade: { status: 'PUBLICADA' } },
    include: { habilidade: true },
    orderBy: { ordem: 'asc' as const },
  },
} satisfies Prisma.CartaInclude;

export function calcularVantagemCarta(
  carta: CartaCompleta,
  adversarias: CartaCompleta[],
) {
  const supera = (elemento: string, alvo: string) =>
    ({
      fogo: 'natureza',
      natureza: 'agua',
      agua: 'fogo',
      luz: 'sombra',
      sombra: 'luz',
    })[elemento] === alvo;
  const vantagemElemental =
    adversarias.filter((alvo) => supera(carta.elemento, alvo.elemento)).length *
    100;
  return (
    vantagemElemental +
    carta.dano_base * 2 +
    carta.hp_base / 4 +
    carta.defesa_base
  );
}

export function normalizarPassiva(passiva: unknown) {
  return passiva && typeof passiva === 'object' && !Array.isArray(passiva)
    ? (passiva as Record<string, unknown>)
    : {};
}

export function mapearHabilidadeCarta(
  habilidade: CartaCompleta['habilidades'][number]['habilidade'],
): ConfiguracaoHabilidade {
  const requisito =
    habilidade.requisito_tipo === 'CHANCE'
      ? { tipo: 'CHANCE' as const, percentual: habilidade.requisito_valor ?? 0 }
      : habilidade.requisito_tipo === 'CONTADOR_ATAQUES'
        ? {
            tipo: 'CONTADOR_ATAQUES' as const,
            quantidade: habilidade.requisito_valor ?? 1,
          }
        : habilidade.requisito_tipo === 'HP_ABAIXO'
          ? {
              tipo: 'HP_ABAIXO' as const,
              percentual: habilidade.requisito_valor ?? 1,
            }
          : habilidade.requisito_tipo === 'TURNO_MINIMO'
            ? {
                tipo: 'TURNO_MINIMO' as const,
                turno: habilidade.requisito_valor ?? 1,
              }
            : habilidade.requisito_tipo === 'INTERVALO_TURNOS'
              ? {
                  tipo: 'INTERVALO_TURNOS' as const,
                  intervalo: habilidade.requisito_valor ?? 2,
                }
              : { tipo: 'NENHUM' as const };
  const escala: ConfiguracaoHabilidade['escala'] =
    habilidade.escala_tipo === 'POR_TURNO' ||
    habilidade.escala_tipo === 'POR_ATAQUE'
      ? {
          tipo: habilidade.escala_tipo,
          valor: habilidade.escala_valor ?? 0,
          limite: habilidade.escala_limite ?? habilidade.valor_base,
        }
      : { tipo: 'NENHUMA' as const };
  return {
    nome: habilidade.nome,
    ...(habilidade.descricao ? { descricao: habilidade.descricao } : {}),
    modoExecucao: 'AUTOMATICA',
    tipoEfeito: habilidade.tipo_efeito as ConfiguracaoHabilidade['tipoEfeito'],
    gatilho: habilidade.gatilho as ConfiguracaoHabilidade['gatilho'],
    alvo: habilidade.alvo as ConfiguracaoHabilidade['alvo'],
    ...(habilidade.atributo
      ? {
          atributo: habilidade.atributo as ConfiguracaoHabilidade['atributo'],
        }
      : {}),
    unidade: habilidade.unidade as ConfiguracaoHabilidade['unidade'],
    valorBase: habilidade.valor_base,
    formaAplicacao:
      habilidade.forma_aplicacao as ConfiguracaoHabilidade['formaAplicacao'],
    requisito,
    escala,
    ...(habilidade.duracao_turnos
      ? { duracaoTurnos: habilidade.duracao_turnos }
      : {}),
    status: 'PUBLICADA',
  };
}

export function mapearCartaBatalha(carta: CartaCompleta): CartaBatalhaBase {
  const passiva = normalizarPassiva(carta.passiva);
  const classe = carta.classe;
  const habilidades = carta.habilidades.map(({ habilidade }) =>
    mapearHabilidadeCarta(habilidade),
  );
  return {
    id: carta.id,
    nome: carta.nome,
    hp: carta.hp_base,
    ataque: carta.dano_base,
    defesa: carta.defesa_base,
    velocidade: classe?.prioridade_ataque ?? 50,
    elemento: carta.elemento,
    passiva: {
      ...passiva,
      classe: classe?.nome ?? passiva.classe,
      ...(typeof passiva.nome === 'string' || !habilidades.length
        ? {}
        : {
            nome: habilidades.map((habilidade) => habilidade.nome).join(', '),
          }),
      habilidades,
    },
  };
}

export function criarCartaPersistida(
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
    passiva: carta.passiva as Prisma.InputJsonValue,
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

export function montarEstadoPartida(partida: PartidaPersistida): EstadoBatalha {
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
        passiva: normalizarPassiva(carta.passiva),
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

export function formatarPartidaPersistida(partida: PartidaPersistida) {
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
        passiva: normalizarPassiva(carta.passiva),
        hp: carta.hp_base,
        hpAtual: carta.hp_atual,
        ataqueBase: carta.ataque_base,
        defesaBase: carta.defesa_base,
        ataque: carta.ataque_atual,
        defesa: carta.defesa_atual,
        prioridadeAtaque: carta.velocidade_atual,
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

export function filtrarCartasPorForca<
  T extends { hp_base: number; dano_base: number; defesa_base: number },
>(candidatas: T[], deck: T[]): T[] {
  if (!deck.length || !candidatas.length) return candidatas;
  const forca = (carta: T) =>
    carta.hp_base / 4 + carta.dano_base * 2 + carta.defesa_base;
  const media =
    deck.reduce((total, carta) => total + forca(carta), 0) / deck.length;
  const proximas = candidatas
    .map((carta) => ({ carta, distancia: Math.abs(forca(carta) - media) }))
    .sort((a, b) => a.distancia - b.distancia);
  const limite = Math.max(deck.length, 12);
  const faixa = proximas.filter(
    ({ carta }) => forca(carta) >= media * 0.75 && forca(carta) <= media * 1.25,
  );
  return (faixa.length >= deck.length ? faixa : proximas.slice(0, limite)).map(
    ({ carta }) => carta,
  );
}

export function selecionarCartasAdversario<T extends { id: string }>(
  candidatas: T[],
  quantidadeDeck: number,
  contexto?: {
    cartasAdversario?: string[];
    quantidadeCartas?: number;
    modoCartas?: 'ALEATORIO' | 'MANUAL';
    mixed?: boolean;
  },
): T[] {
  const quantidade = contexto?.quantidadeCartas ?? quantidadeDeck;
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 6) {
    throw new BadRequestException('Configure entre 1 e 6 cartas adversárias.');
  }
  const ids = contexto?.cartasAdversario ?? [];
  const embaralhar = (cartas: T[]) => {
    const resultado = [...cartas];
    for (let indice = resultado.length - 1; indice > 0; indice--) {
      const destino = randomInt(indice + 1);
      [resultado[indice], resultado[destino]] = [
        resultado[destino],
        resultado[indice],
      ];
    }
    return resultado;
  };
  if (contexto?.modoCartas === 'MANUAL') {
    const selecionadas = ids.map((id) =>
      candidatas.find((carta) => carta.id === id),
    );
    if (
      selecionadas.some((carta) => !carta) ||
      new Set(ids).size !== ids.length
    ) {
      throw new BadRequestException(
        'As cartas manuais estão indisponíveis ou repetidas.',
      );
    }
    if (contexto.mixed) {
      if (selecionadas.length < quantidade) {
        throw new BadRequestException(
          'O conjunto mixed precisa ter cartas suficientes.',
        );
      }
      return embaralhar(selecionadas as T[]).slice(0, quantidade);
    }
    if (selecionadas.length !== quantidade) {
      throw new BadRequestException(
        'Selecione exatamente a quantidade de cartas configurada.',
      );
    }
    return selecionadas as T[];
  }
  if (!contexto?.modoCartas && ids.length) {
    const selecionadas = candidatas.filter((carta) => ids.includes(carta.id));
    return [
      ...selecionadas,
      ...embaralhar(candidatas.filter((carta) => !ids.includes(carta.id))),
    ].slice(0, quantidade);
  }
  return embaralhar(candidatas).slice(0, quantidade);
}
