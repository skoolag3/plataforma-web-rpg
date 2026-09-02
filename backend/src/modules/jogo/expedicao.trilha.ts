export type DificuldadeRota = 'FACIL' | 'MEDIA' | 'DIFICIL' | 'CHEFE';

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
};

export function gerarTrilhaExpedicao(seed: number): TrilhaExpedicao {
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
    chefe: {
      id: 'chefe-final',
      titulo: 'Guardião da Expedição',
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
