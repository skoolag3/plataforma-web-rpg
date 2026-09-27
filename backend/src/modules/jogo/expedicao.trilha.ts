export type DificuldadeRota = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'CHEFE';
import type { ConfiguracaoBoss } from './boss.dialogo';

export type OpcaoRota = {
  id: string;
  titulo: string;
  descricao: string;
  dificuldade: DificuldadeRota;
  risco: string;
};

export type TrilhaExpedicao = {
  etapas: Array<{ indice: number; opcoes: OpcaoRota[] }>;
  chefe: OpcaoRota;
  configuracao?: ConfiguracaoRecompensasExpedicao;
  boss?: ConfiguracaoBoss;
};

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
): TrilhaExpedicao {
  const random = criarRandom(seed);
  const modelos: Omit<OpcaoRota, 'id'>[] = [
    {
      titulo: 'Trilha protegida',
      descricao: 'Um confronto direto com resistência reduzida.',
      dificuldade: 'FACIL',
      risco: 'Baixo',
    },
    {
      titulo: 'Ruínas instáveis',
      descricao: 'Adversários equilibrados guardam esta passagem.',
      dificuldade: 'MEDIA',
      risco: 'Médio',
    },
    {
      titulo: 'Fenda corrompida',
      descricao: 'Uma rota curta dominada por inimigos fortalecidos.',
      dificuldade: 'DIFICIL',
      risco: 'Alto',
    },
  ];
  const etapas = Array.from({ length: 3 }, (_, indice) => ({
    indice,
    opcoes: embaralhar(modelos, random).map((modelo) => ({
      ...modelo,
      id: `etapa-${indice + 1}-${modelo.dificuldade.toLowerCase()}`,
    })),
  }));
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
