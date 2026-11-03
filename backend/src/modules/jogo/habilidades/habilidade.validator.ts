import { limitesHabilidade } from './habilidade.limites';
import { limiteIncrementoEscala, limiteTotalEscala } from './habilidade.escala';
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
  if (habilidade.tipoEfeito === 'CRITICO') return limitesHabilidade.percentualCritico;
  if (habilidade.tipoEfeito === 'EVASAO') {
    return limitesHabilidade.percentualEvasao;
  }
  if (habilidade.tipoEfeito === 'ROUBO_VIDA') {
    return limitesHabilidade.percentualRouboVida;
  }
  if (habilidade.unidade === 'FIXO') return limitesHabilidade.valorFixo;
  if (habilidade.tipoEfeito === 'DANO') {
    return habilidade.formaAplicacao === 'SUBSTITUI_ATAQUE'
      ? limitesHabilidade.percentualAtaqueSubstituto
      : limitesHabilidade.percentualDanoDireto;
  }
  return limitesHabilidade.percentualEfeito;
}

function validarCompatibilidadeEfeito(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  const alteraAtributo =
    habilidade.tipoEfeito === 'BUFF' || habilidade.tipoEfeito === 'DEBUFF';
  const alvoEsperado = ['DANO', 'DEBUFF', 'CRITICO'].includes(habilidade.tipoEfeito)
    ? 'INIMIGO_ATIVO'
    : 'PROPRIA_CARTA';
  if (habilidade.alvo !== alvoEsperado) {
    adicionarErro(erros, 'alvo', 'ALVO_INCOMPATIVEL',
      `O efeito ${habilidade.tipoEfeito} deve afetar ${alvoEsperado === 'INIMIGO_ATIVO' ? 'o inimigo ativo' : 'a própria carta'}.`);
  }

  if (habilidade.tipoEfeito === 'CRITICO') {
    if (habilidade.gatilho !== 'AO_ATACAR' ||
        habilidade.formaAplicacao !== 'ANTES_ACAO' ||
        habilidade.alvo !== 'INIMIGO_ATIVO' ||
        habilidade.unidade !== 'PERCENTUAL' ||
        habilidade.requisito.tipo !== 'CHANCE' ||
        habilidade.escala.tipo !== 'NENHUMA') {
      adicionarErro(erros, 'tipoEfeito', 'CRITICO_INCOMPATIVEL',
        'Crítico exige: ao atacar, antes da ação, inimigo ativo, percentual e chance sem escala.');
    }
  } else if (habilidade.requisito.tipo === 'CHANCE') {
    adicionarErro(erros, 'requisito', 'CHANCE_INCOMPATIVEL',
      'A chance é exclusiva do efeito crítico.');
  }

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
  if (habilidade.formaAplicacao === 'SUBSTITUI_ATAQUE' &&
      habilidade.tipoEfeito === 'DANO' &&
      habilidade.unidade !== 'PERCENTUAL') {
    adicionarErro(
      erros, 'unidade', 'UNIDADE_SUBSTITUICAO_INCOMPATIVEL',
      'Dano que substitui um ataque deve usar porcentagem do ataque.',
    );
  }
}

function validarRequisito(
  erros: ErroValidacaoHabilidade[],
  habilidade: ConfiguracaoHabilidade,
) {
  const requisito = habilidade.requisito;

  if (requisito.tipo === 'CHANCE') {
    validarInteiroNoIntervalo(erros, 'requisito.percentual', requisito.percentual,
      { minimo: 1, maximo: 100 }, 'CHANCE_FORA_LIMITE');
  }

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
  if (requisito.tipo === 'INTERVALO_TURNOS') {
    validarInteiroNoIntervalo(
      erros, 'requisito.intervalo', requisito.intervalo,
      limitesHabilidade.intervaloTurnos, 'INTERVALO_TURNOS_FORA_LIMITE',
    );
    if (habilidade.gatilho !== 'INICIO_TURNO') {
      adicionarErro(erros, 'gatilho', 'INTERVALO_TURNOS_INCOMPATIVEL',
        'A cada X turnos exige o gatilho no início do turno.');
    }
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
  if (habilidade.escala.valor > limiteIncrementoEscala(habilidade.valorBase)) {
    adicionarErro(
      erros, 'escala.valor', 'ESCALA_SALTO_EXCESSIVO',
      `O aumento por vez pode ser de no máximo ${limiteIncrementoEscala(habilidade.valorBase)} para este valor base.`,
    );
  }
  if (habilidade.escala.limite > limiteTotalEscala(habilidade.valorBase)) {
    adicionarErro(
      erros, 'escala.limite', 'LIMITE_ESCALA_DESPROPORCIONAL',
      `O teto da escala pode ser de no máximo ${limiteTotalEscala(habilidade.valorBase)} para este valor base.`,
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
