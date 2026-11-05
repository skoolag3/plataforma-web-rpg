export const RECOMPENSA_SEMANAL_RUBYS = 500;
export const INTERVALO_SEMANA_MS = 7 * 24 * 60 * 60 * 1000;

export function obterInicioSemana(agora = Date.now()) {
  const data = new Date(agora);
  const diasDesdeSegunda = (data.getUTCDay() + 6) % 7;

  data.setUTCHours(13, 0, 0, 0);
  data.setUTCDate(data.getUTCDate() - diasDesdeSegunda);

  if (data.getTime() > agora) {
    data.setUTCDate(data.getUTCDate() - 7);
  }

  return data;
}

export function obterProximaRecompensaSemanal(agora = Date.now()) {
  return new Date(obterInicioSemana(agora).getTime() + INTERVALO_SEMANA_MS);
}

export function recompensaSemanalDisponivel(
  ultimoResgate?: Date | null,
  agora = Date.now(),
) {
  return (
    !ultimoResgate ||
    ultimoResgate.getTime() < obterInicioSemana(agora).getTime()
  );
}
