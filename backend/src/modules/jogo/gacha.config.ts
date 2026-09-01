export const LIMITE_PITY = 80;
export const INTERVALO_ROTACAO_BANNER_MS = 30 * 60 * 1000;
export const INTERVALO_GIRO_GRATUITO_MS = 12 * 60 * 60 * 1000;

export function obterProximaRotacaoBanner(agora = Date.now()) {
  return new Date(
    Math.floor(agora / INTERVALO_ROTACAO_BANNER_MS + 1) *
      INTERVALO_ROTACAO_BANNER_MS,
  );
}

export function obterInicioJanelaGiroGratuito(agora = Date.now()) {
  const data = new Date(agora);
  const horaUtc = data.getUTCHours();
  const horaInicio = horaUtc >= 13 ? 13 : horaUtc >= 1 ? 1 : 13;

  if (horaUtc < 1) data.setUTCDate(data.getUTCDate() - 1);
  data.setUTCHours(horaInicio, 0, 0, 0);
  return data;
}

export function obterProximoGiroGratuito(agora = Date.now()) {
  return new Date(
    obterInicioJanelaGiroGratuito(agora).getTime() + INTERVALO_GIRO_GRATUITO_MS,
  );
}

export function giroGratuitoDisponivel(
  ultimaColeta?: Date | null,
  agora = Date.now(),
) {
  return (
    !ultimaColeta ||
    ultimaColeta.getTime() < obterInicioJanelaGiroGratuito(agora).getTime()
  );
}

export const PROBABILIDADES_RARIDADE = [
  { raridade: 'UR', percentual: 1 },
  { raridade: 'SSR', percentual: 4 },
  { raridade: 'SR', percentual: 15 },
  { raridade: 'R', percentual: 30 },
  { raridade: 'N', percentual: 50 },
] as const;

export type RaridadeGacha =
  (typeof PROBABILIDADES_RARIDADE)[number]['raridade'];
