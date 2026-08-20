import { limitesHabilidade } from './habilidade.limites';
import type {
  ConfiguracaoHabilidade,
  ErroValidacaoHabilidade,
  ResultadoValidacaoHabilidade,
} from './habilidade.types';

type Intervalo = { minimo: number; maximo: number };

export function validarHabilidade(
  habilidade: ConfiguracaoHabilidade,
): ResultadoValidacaoHabilidade {
  const erros: ErroValidacaoHabilidade[] = [];
  const nome = habilidade.nome.trim();
  const descricao = habilidade.descricao?.trim() ?? '';

  if (
    nome.length < limitesHabilidade.nome.minimo ||
    nome.length > limitesHabilidade.nome.maximo
  ) {
    adicionarErro(
      erros,
      'nome',
      'NOME_FORA_LIMITE',
      `O nome deve ter entre ${limitesHabilidade.nome.minimo} e ${limitesHabilidade.nome.maximo} caracteres.`,
    );
  }

  if (descricao.length > limitesHabilidade.descricao.maximo) {
    adicionarErro(
      erros,
      'descricao',
      'DESCRICAO_FORA_LIMITE',
      `A descrição deve ter no máximo ${limitesHabilidade.descricao.maximo} caracteres.`,
    );
  }

  const limiteValor = obterLimiteValor(habilidade);
  validarInteiroNoIntervalo(
    erros,
    'valorBase',
    habilidade.valorBase,
    limiteValor,
    'VALOR_FORA_LIMITE',
  );

  validarCompatibilidadeEfeito(erros, habilidade);
  validarFormaAplicacao(erros, habilidade);
  validarRequisito(erros, habilidade);
  validarEscala(erros, habilidade, limiteValor);
  validarDuracao(erros, habilidade);

  return { valida: erros.length === 0, erros };
}

function obterLimiteValor(habilidade: ConfiguracaoHabilidade): Intervalo {
  if (habilidade.tipoEfeito === 'EVASAO') {
    return limitesHabilidade.percentualEvasao;
  }
  if (habilidade.tipoEfeito === 'ROUBO_VIDA') {
    return limitesHabilidade.percentualRouboVida;
  }
  return habilidade.unidade === 'PERCENTUAL'
    ? limitesHabilidade.valorPercentual
    : limitesHabilidade.valorFixo;
}

function validarCompatibilidadeEfeito(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  const alteraAtributo =
    habilidade.tipoEfeito === 'BUFF' || habilidade.tipoEfeito === 'DEBUFF';

  if (alteraAtributo && !habilidade.atributo) {
    adicionarErro(
      erros,
      'atributo',
      'ATRIBUTO_OBRIGATORIO',
      'Buffs e debuffs precisam informar o atributo modificado.',
    );
  }
  if (!alteraAtributo && habilidade.atributo) {
    adicionarErro(
      erros,
      'atributo',
      'ATRIBUTO_INCOMPATIVEL',
      'Este tipo de efeito não utiliza um atributo.',
    );
  }
  if (
    (habilidade.tipoEfeito === 'EVASAO' ||
      habilidade.tipoEfeito === 'ROUBO_VIDA') &&
    habilidade.unidade !== 'PERCENTUAL'
  ) {
    adicionarErro(
      erros,
      'unidade',
      'UNIDADE_INCOMPATIVEL',
      'Evasão e roubo de vida devem utilizar valor percentual.',
    );
  }
}

function validarFormaAplicacao(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  if (
    habilidade.formaAplicacao === 'SUBSTITUI_ATAQUE' &&
    habilidade.gatilho !== 'AO_ATACAR'
  ) {
    adicionarErro(
      erros,
      'formaAplicacao',
      'FORMA_APLICACAO_INCOMPATIVEL',
      'Somente habilidades acionadas ao atacar podem substituir o ataque.',
    );
  }
}

function validarRequisito(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  const requisito = habilidade.requisito;

  if (requisito.tipo === 'CONTADOR_ATAQUES') {
    validarInteiroNoIntervalo(
      erros,
      'requisito.quantidade',
      requisito.quantidade,
      limitesHabilidade.ataquesNecessarios,
      'CONTADOR_ATAQUES_FORA_LIMITE',
    );
    if (habilidade.gatilho !== 'AO_ATACAR') {
      adicionarErro(
        erros,
        'requisito.tipo',
        'REQUISITO_INCOMPATIVEL',
        'O contador de ataques exige o gatilho AO_ATACAR.',
      );
    }
  }

  if (requisito.tipo === 'HP_ABAIXO') {
    validarInteiroNoIntervalo(
      erros,
      'requisito.percentual',
      requisito.percentual,
      limitesHabilidade.percentualHp,
      'HP_FORA_LIMITE',
    );
  }

  if (requisito.tipo === 'TURNO_MINIMO') {
    validarInteiroNoIntervalo(
      erros,
      'requisito.turno',
      requisito.turno,
      limitesHabilidade.turnoMinimo,
      'TURNO_FORA_LIMITE',
    );
  }
}

function validarEscala(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
  limiteValor: Intervalo,
) {
  if (habilidade.escala.tipo === 'NENHUMA') return;

  validarInteiroNoIntervalo(
    erros,
    'escala.valor',
    habilidade.escala.valor,
    limiteValor,
    'ESCALA_FORA_LIMITE',
  );
  validarInteiroNoIntervalo(
    erros,
    'escala.limite',
    habilidade.escala.limite,
    limiteValor,
    'LIMITE_ESCALA_FORA_LIMITE',
  );

  if (habilidade.escala.limite < habilidade.valorBase) {
    adicionarErro(
      erros,
      'escala.limite',
      'LIMITE_ESCALA_MENOR_QUE_BASE',
      'O limite da escala não pode ser menor que o valor base.',
    );
  }
}

function validarDuracao(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  if (habilidade.duracaoTurnos === undefined) return;

  const aceitaDuracao = ['BUFF', 'DEBUFF', 'ESCUDO'].includes(
    habilidade.tipoEfeito,
  );
  if (!aceitaDuracao) {
    adicionarErro(
      erros,
      'duracaoTurnos',
      'DURACAO_INCOMPATIVEL',
      'Somente buffs, debuffs e escudos possuem duração em turnos.',
    );
  }
  validarInteiroNoIntervalo(
    erros,
    'duracaoTurnos',
    habilidade.duracaoTurnos,
    limitesHabilidade.duracaoTurnos,
    'DURACAO_FORA_LIMITE',
  );
}

function validarInteiroNoIntervalo(
  erros: ErroValidacaoHabilidade[],
  campo: string,
  valor: number,
  intervalo: Intervalo,
  codigo: string,
) {
  if (
    !Number.isInteger(valor) ||
    valor < intervalo.minimo ||
    valor > intervalo.maximo
  ) {
    adicionarErro(
      erros,
      campo,
      codigo,
      `O valor deve ser um inteiro entre ${intervalo.minimo} e ${intervalo.maximo}.`,
    );
  }
}

function adicionarErro(
  erros: ErroValidacaoHabilidade[],
  campo: string,
  codigo: string,
  mensagem: string,
) {
  erros.push({ campo, codigo, mensagem });
}
