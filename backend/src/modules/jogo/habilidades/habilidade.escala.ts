import { limitesHabilidade } from './habilidade.limites';
import type { ConfiguracaoHabilidade } from './habilidade.types';

export function limiteIncrementoEscala(valorBase: number) {
  return Math.max(1, Math.ceil(valorBase / limitesHabilidade.escala.divisorIncremento));
}

export function limiteTotalEscala(valorBase: number) {
  return valorBase * limitesHabilidade.escala.multiplicadorMaximo;
}

export function calcularValorEscalado(
  habilidade: ConfiguracaoHabilidade,
  turno: number,
  ataquesRealizados: number,
) {
  if (habilidade.escala.tipo === 'NENHUMA') return habilidade.valorBase;

  const multiplicador = habilidade.escala.tipo === 'POR_TURNO'
    ? Math.max(0, turno - 1)
    : Math.max(0, ataquesRealizados);
  const incremento = Math.min(
    habilidade.escala.valor,
    limiteIncrementoEscala(habilidade.valorBase),
  );

  return Math.min(
    habilidade.escala.limite,
    limiteTotalEscala(habilidade.valorBase),
    habilidade.valorBase + incremento * multiplicador,
  );
}
