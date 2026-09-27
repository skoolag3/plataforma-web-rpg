import type { DificuldadeRota } from './expedicao.trilha';

export type ConfiguracaoRecompensasExpedicao = {
  recompensas: Record<DificuldadeRota, number>;
  percentualMantidoDerrota: number;
};

export const configuracaoRecompensasPadrao: ConfiguracaoRecompensasExpedicao = {
  percentualMantidoDerrota: 70,
  recompensas: {
    FACIL: 25,
    MEDIA: 25,
    DIFICIL: 25,
    CHEFE: 100,
  },
};

export function recompensaDaRota(
  dificuldade: DificuldadeRota,
  configuracao = configuracaoRecompensasPadrao,
) {
  return configuracao.recompensas[dificuldade];
}

export function recompensaAposDerrota(
  recompensaPendente: number,
  percentualMantido = configuracaoRecompensasPadrao.percentualMantidoDerrota,
) {
  return Math.ceil(recompensaPendente * (percentualMantido / 100));
}

export function rubysPerdidosNaDerrota(
  recompensaPendente: number,
  percentualMantido = configuracaoRecompensasPadrao.percentualMantidoDerrota,
) {
  return (
    recompensaPendente -
    recompensaAposDerrota(recompensaPendente, percentualMantido)
  );
}
