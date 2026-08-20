export const limitesHabilidade = {
  nome: { minimo: 3, maximo: 100 },
  descricao: { maximo: 500 },
  valorFixo: { minimo: 1, maximo: 9999 },
  valorPercentual: { minimo: 1, maximo: 500 },
  percentualEvasao: { minimo: 1, maximo: 95 },
  percentualRouboVida: { minimo: 1, maximo: 100 },
  ataquesNecessarios: { minimo: 1, maximo: 20 },
  percentualHp: { minimo: 1, maximo: 99 },
  turnoMinimo: { minimo: 1, maximo: 100 },
  duracaoTurnos: { minimo: 1, maximo: 20 },
} as const;
