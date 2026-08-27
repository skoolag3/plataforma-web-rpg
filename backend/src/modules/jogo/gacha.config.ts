export const LIMITE_PITY = 80;
export const INTERVALO_ROTACAO_BANNER_MS = 30 * 60 * 1000;

export const PROBABILIDADES_RARIDADE = [
  { raridade: 'UR', percentual: 1 },
  { raridade: 'SSR', percentual: 4 },
  { raridade: 'SR', percentual: 15 },
  { raridade: 'R', percentual: 30 },
  { raridade: 'N', percentual: 50 },
] as const;

export type RaridadeGacha = (typeof PROBABILIDADES_RARIDADE)[number]['raridade'];
