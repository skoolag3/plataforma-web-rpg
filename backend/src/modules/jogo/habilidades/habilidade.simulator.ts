import type {
  ConfiguracaoHabilidade,
  RequisitoHabilidade,
} from './habilidade.types';

export type CenarioTesteHabilidade = {
  turno: number;
  ataquesRealizados: number;
  hpAtual: number;
  hpMaximo: number;
};

export type ResultadoSimulacaoHabilidade = {
  acionada: boolean;
  requisitoAtendido: boolean;
  valorCalculado: number;
  percentualHp: number;
  resumo: string;
};

export function simularHabilidade(
  habilidade: ConfiguracaoHabilidade,
  cenario: CenarioTesteHabilidade,
): ResultadoSimulacaoHabilidade {
  const percentualHp = Math.floor((cenario.hpAtual / cenario.hpMaximo) * 100);
  const requisitoAtendido = verificarRequisito(
    habilidade.requisito,
    cenario,
    percentualHp,
  );
  const valorCalculado = calcularValor(habilidade, cenario);

  return {
    acionada: requisitoAtendido,
    requisitoAtendido,
    valorCalculado,
    percentualHp,
    resumo: requisitoAtendido
      ? `${habilidade.nome} seria ativada com valor ${valorCalculado}.`
      : `${habilidade.nome} não seria ativada porque o requisito não foi alcançado.`,
  };
}

function verificarRequisito(
  requisito: RequisitoHabilidade,
  cenario: CenarioTesteHabilidade,
  percentualHp: number,
) {
  if (requisito.tipo === 'CONTADOR_ATAQUES') {
    return cenario.ataquesRealizados >= requisito.quantidade;
  }
  if (requisito.tipo === 'HP_ABAIXO') {
    return percentualHp < requisito.percentual;
  }
  if (requisito.tipo === 'TURNO_MINIMO') {
    return cenario.turno >= requisito.turno;
  }
  return true;
}

function calcularValor(
  habilidade: ConfiguracaoHabilidade,
  cenario: CenarioTesteHabilidade,
) {
  if (habilidade.escala.tipo === 'NENHUMA') return habilidade.valorBase;

  const multiplicador =
    habilidade.escala.tipo === 'POR_TURNO'
      ? Math.max(0, cenario.turno - 1)
      : cenario.ataquesRealizados;
  const valor = habilidade.valorBase + habilidade.escala.valor * multiplicador;
  return Math.min(valor, habilidade.escala.limite);
}
