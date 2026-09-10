import type { DificuldadeRota } from './expedicao.trilha';

const percentualMantidoNaDerrota = 0.7;

const recompensaPorDificuldade: Record<DificuldadeRota, number> = {
  FACIL: 25,
  MEDIA: 25,
  DIFICIL: 25,
  CHEFE: 100,
};

export function recompensaDaRota(dificuldade: DificuldadeRota) {
  return recompensaPorDificuldade[dificuldade];
}

export function recompensaAposDerrota(recompensaPendente: number) {
  return Math.ceil(recompensaPendente * percentualMantidoNaDerrota);
}

export function rubysPerdidosNaDerrota(recompensaPendente: number) {
  return recompensaPendente - recompensaAposDerrota(recompensaPendente);
}
