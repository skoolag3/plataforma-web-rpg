export type DificuldadeRota = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'CHEFE';
import type { ConfiguracaoBoss } from './boss.dialogo';

export type OpcaoRota = {
  id: string;
  titulo: string;
  descricao: string;
  dificuldade: DificuldadeRota;
  risco: string;
  recompensa?: number;
  cartas?: string[];
  quantidadeCartas?: number;
  modoCartas?: 'ALEATORIO' | 'MANUAL';
  mixed?: boolean;
  percentualMantidoDerrota?: number;
};

export type CaminhoCampanha = {
  dificuldade: Exclude<DificuldadeRota, 'CHEFE'>;
  recompensa: number;
  cartas: string[];
  quantidadeCartas?: number;
  modoCartas?: 'ALEATORIO' | 'MANUAL';
  mixed?: boolean;
  titulo?: string;
  descricao?: string;
};

export type SecaoCampanha =
  | { tipo: 'BATALHA'; caminhos: CaminhoCampanha[]; grupo?: number; percentualMantidoDerrota?: number }
  | { tipo: 'BOSS'; percentualMantidoDerrota?: number };

export function secoesPadraoCampanha(recompensas: ConfiguracaoRecompensasExpedicao): SecaoCampanha[] {
  return [...[0, 1, 2].map((indice) => ({
    tipo: 'BATALHA' as const,
    grupo: indice < 2 ? 1 : 2,
    caminhos: (['FACIL', 'MEDIA', 'DIFICIL'] as const).map((dificuldade) => ({
      dificuldade, recompensa: recompensas.recompensas[dificuldade], cartas: [],
      quantidadeCartas: 3, modoCartas: 'ALEATORIO' as const, mixed: false,
    })),
  })), { tipo: 'BOSS' }];
}

export type TrilhaExpedicao = {
  etapas: Array<{ indice: number; opcoes: OpcaoRota[]; percentualMantidoDerrota?: number }>;
  chefe: OpcaoRota;
  configuracao?: ConfiguracaoRecompensasExpedicao;
  boss?: ConfiguracaoBoss;
};

export function percentualMantidoNaEtapa(trilha: TrilhaExpedicao, indice: number) {
  return (indice === trilha.etapas.length
    ? trilha.chefe.percentualMantidoDerrota
    : trilha.etapas[indice]?.percentualMantidoDerrota)
    ?? trilha.configuracao?.percentualMantidoDerrota
    ?? configuracaoRecompensasPadrao.percentualMantidoDerrota;
}

const rotasPorDificuldade: Record<
  Exclude<DificuldadeRota, 'CHEFE'>,
  Array<Omit<OpcaoRota, 'id' | 'dificuldade' | 'risco'>>
> = {
  FACIL: [
    {
      titulo: 'Bosque dos Ecos',
      descricao: 'Criaturas jovens guardam uma passagem coberta por raízes.',
    },
    {
      titulo: 'Ponte do Luar',
      descricao: 'Patrulheiros dispersos protegem a travessia silenciosa.',
    },
    {
      titulo: 'Campo das Cinzas',
      descricao: 'Restos de uma batalha escondem um pequeno grupo rival.',
    },
  ],
  MEDIA: [
    {
      titulo: 'Ruínas de Aster',
      descricao: 'Sentinelas antigas despertam entre corredores instáveis.',
    },
    {
      titulo: 'Pântano Violeta',
      descricao: 'A névoa fortalece inimigos acostumados ao terreno hostil.',
    },
    {
      titulo: 'Passagem do Eclipse',
      descricao: 'Duas patrulhas disputam a única saída segura da região.',
    },
  ],
  DIFICIL: [
    {
      titulo: 'Fenda Carmesim',
      descricao: 'A energia corrompida aumenta o poder dos adversários.',
    },
    {
      titulo: 'Fortaleza Abandonada',
      descricao: 'Um esquadrão veterano transformou as muralhas em armadilha.',
    },
    {
      titulo: 'Abismo do Invocador',
      descricao: 'A rota mais curta leva ao confronto mais perigoso da trilha.',
    },
  ],
};

const riscoPorDificuldade = {
  FACIL: 'Baixo',
  MEDIA: 'Médio',
  DIFICIL: 'Alto',
} satisfies Record<Exclude<DificuldadeRota, 'CHEFE'>, string>;

const maiorInteiroPostgres = 2_147_483_647;

export function gerarSeedExpedicao(referencia: string, timestamp = Date.now()) {
  const hash = [...referencia].reduce(
    (valor, caractere) =>
      (valor * 31 + caractere.charCodeAt(0)) % maiorInteiroPostgres,
    0,
  );
  return Math.abs((timestamp + hash) % maiorInteiroPostgres) || 1;
}

export function gerarTrilhaExpedicao(
  seed: number,
  configuracao = configuracaoRecompensasPadrao,
  boss?: ConfiguracaoBoss,
  secoes: SecaoCampanha[] = secoesPadraoCampanha(configuracao),
): TrilhaExpedicao {
  const random = criarRandom(seed);
  const etapas = secoes.slice(0, -1).map((secao, indice) => {
    if (secao.tipo !== 'BATALHA') throw new Error('Seção de batalha inválida.');
    const opcoes = secao.caminhos.slice(0, 3).map((caminho, indiceCaminho) => {
      const { dificuldade } = caminho;
      const modelos = rotasPorDificuldade[dificuldade];
      const modelo = modelos[Math.floor(random() * modelos.length)];
      return {
        ...modelo,
        titulo: caminho.titulo?.trim() || modelo.titulo,
        descricao: caminho.descricao?.trim() || modelo.descricao,
        id: `etapa-${indice + 1}-caminho-${indiceCaminho + 1}`,
        dificuldade,
        risco: riscoPorDificuldade[dificuldade],
        recompensa: caminho.recompensa,
        cartas: caminho.cartas,
        quantidadeCartas: caminho.quantidadeCartas,
        modoCartas: caminho.modoCartas,
        mixed: caminho.mixed,
      };
    });

    return { indice, opcoes: embaralhar(opcoes, random), percentualMantidoDerrota: secao.percentualMantidoDerrota };
  });
  return {
    etapas,
    configuracao,
    boss,
    chefe: {
      id: 'chefe-final',
      titulo: boss?.nome ?? 'Guardião da Expedição',
      descricao: 'O último adversário protege a recompensa da jornada.',
      dificuldade: 'CHEFE',
      risco: 'Chefe',
      percentualMantidoDerrota: secoes.at(-1)?.percentualMantidoDerrota,
    },
  };
}

function embaralhar<T>(itens: T[], random: () => number) {
  const copia = [...itens];
  for (let indice = copia.length - 1; indice > 0; indice -= 1) {
    const destino = Math.floor(random() * (indice + 1));
    [copia[indice], copia[destino]] = [copia[destino], copia[indice]];
  }
  return copia;
}

function criarRandom(seed: number) {
  let valor = seed >>> 0;
  return () => {
    valor += 0x6d2b79f5;
    let nmr = valor;
    nmr = Math.imul(nmr ^ (nmr >>> 15), nmr | 1);
    nmr ^= nmr + Math.imul(nmr ^ (nmr >>> 7), nmr | 61);
    return ((nmr ^ (nmr >>> 14)) >>> 0) / 4294967296;
  };
}
import type { ConfiguracaoRecompensasExpedicao } from './expedicao.recompensas';
import { configuracaoRecompensasPadrao } from './expedicao.recompensas';
