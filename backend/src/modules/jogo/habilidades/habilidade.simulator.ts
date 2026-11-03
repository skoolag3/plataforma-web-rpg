import type {
  ConfiguracaoHabilidade,
  RequisitoHabilidade,
} from './habilidade.types';
import { calcularValorEscalado } from './habilidade.escala';

export type CenarioTesteHabilidade = {
  criticoAtivou?: boolean;
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
  const valorCalculado =
    habilidade.requisito.tipo === 'CHANCE' && !requisitoAtendido
      ? 0
      : calcularValorEscalado(habilidade, cenario.turno, cenario.ataquesRealizados);

  return {
    acionada: requisitoAtendido,
    requisitoAtendido,
    valorCalculado,
    percentualHp,
    resumo: requisitoAtendido
      ? habilidade.tipoEfeito === 'CRITICO' && habilidade.requisito.tipo === 'CHANCE'
        ? `${habilidade.requisito.percentual}% de chance de causar +${valorCalculado}% de dano no ataque.`
        : `${habilidade.nome} seria ativada com valor ${valorCalculado}.`
      : habilidade.requisito.tipo === 'CHANCE'
        ? `O golpe não foi crítico. A chance configurada é ${habilidade.requisito.percentual}%; nenhum bônus de dano foi aplicado.`
        : `${habilidade.nome} não seria ativada porque o requisito não foi alcançado.`,
  };
}

function verificarRequisito(
  requisito: RequisitoHabilidade,
  cenario: CenarioTesteHabilidade,
  percentualHp: number,
) {
  if (requisito.tipo === 'CHANCE') {
    return cenario.criticoAtivou ?? true;
  }
  if (requisito.tipo === 'CONTADOR_ATAQUES') {
    return cenario.ataquesRealizados >= requisito.quantidade;
  }
  if (requisito.tipo === 'HP_ABAIXO') {
    return percentualHp < requisito.percentual;
  }
  if (requisito.tipo === 'TURNO_MINIMO') {
    return cenario.turno >= requisito.turno;
  }
  if (requisito.tipo === 'INTERVALO_TURNOS') {
    return cenario.turno >= 1 && cenario.turno % requisito.intervalo === 0;
  }
  return true;
}
