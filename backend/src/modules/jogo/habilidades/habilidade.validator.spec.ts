import { limitesHabilidade } from './habilidade.limites';
import type { ConfiguracaoHabilidade } from './habilidade.types';
import { validarHabilidade } from './habilidade.validator';

function criarHabilidade(
  parcial: Partial<ConfiguracaoHabilidade> = {},
): ConfiguracaoHabilidade {
  return {
    nome: 'Golpe flamejante',
    descricao: 'Depois de três ataques normais, substitui o próximo ataque.',
    modoExecucao: 'AUTOMATICA',
    tipoEfeito: 'DANO',
    gatilho: 'AO_ATACAR',
    alvo: 'INIMIGO_ATIVO',
    unidade: 'PERCENTUAL',
    valorBase: 150,
    formaAplicacao: 'SUBSTITUI_ATAQUE',
    requisito: { tipo: 'CONTADOR_ATAQUES', quantidade: 3 },
    escala: { tipo: 'NENHUMA' },
    status: 'RASCUNHO',
    ...parcial,
  };
}

function codigos(habilidade: ConfiguracaoHabilidade) {
  return validarHabilidade(habilidade).erros.map((erro) => erro.codigo);
}

describe('validador de habilidades', () => {
  it('aceita o especial executado depois de três ataques', () => {
    expect(validarHabilidade(criarHabilidade())).toEqual({
      valida: true,
      erros: [],
    });
  });

  it.each([
    limitesHabilidade.ataquesNecessarios.minimo,
    limitesHabilidade.ataquesNecessarios.maximo,
  ])('aceita contador de ataques no limite %i', (quantidade) => {
    const res = validarHabilidade(
      criarHabilidade({
        requisito: { tipo: 'CONTADOR_ATAQUES', quantidade },
      }),
    );

    expect(res.valida).toBe(true);
  });

  it.each([
    limitesHabilidade.ataquesNecessarios.minimo - 1,
    limitesHabilidade.ataquesNecessarios.maximo + 1,
  ])('rejeita contador de ataques fora do limite: %i', (quantidade) => {
    expect(
      codigos(
        criarHabilidade({
          requisito: { tipo: 'CONTADOR_ATAQUES', quantidade },
        }),
      ),
    ).toContain('CONTADOR_ATAQUES_FORA_LIMITE');
  });

  it('aceita o valor percentual máximo', () => {
    const res = validarHabilidade(
      criarHabilidade({
        valorBase: limitesHabilidade.valorPercentual.maximo,
      }),
    );

    expect(res.valida).toBe(true);
  });

  it('rejeita valor percentual acima do máximo', () => {
    expect(
      codigos(
        criarHabilidade({
          valorBase: limitesHabilidade.valorPercentual.maximo + 1,
        }),
      ),
    ).toContain('VALOR_FORA_LIMITE');
  });

  it('exige AO_ATACAR para o contador de ataques', () => {
    expect(codigos(criarHabilidade({ gatilho: 'INICIO_TURNO' }))).toEqual(
      expect.arrayContaining([
        'FORMA_APLICACAO_INCOMPATIVEL',
        'REQUISITO_INCOMPATIVEL',
      ]),
    );
  });

  it('exige atributo em buffs e debuffs', () => {
    expect(
      codigos(
        criarHabilidade({
          tipoEfeito: 'BUFF',
          formaAplicacao: 'APOS_ACAO',
          requisito: { tipo: 'NENHUM' },
        }),
      ),
    ).toContain('ATRIBUTO_OBRIGATORIO');
  });

  it('rejeita escala com limite menor que o valor base', () => {
    expect(
      codigos(
        criarHabilidade({
          valorBase: 100,
          escala: { tipo: 'POR_TURNO', valor: 5, limite: 90 },
        }),
      ),
    ).toContain('LIMITE_ESCALA_MENOR_QUE_BASE');
  });

  it('limita evasão a noventa e cinco por cento', () => {
    const habilidade = criarHabilidade({
      tipoEfeito: 'EVASAO',
      alvo: 'PROPRIA_CARTA',
      valorBase: limitesHabilidade.percentualEvasao.maximo + 1,
      formaAplicacao: 'ANTES_ACAO',
      requisito: { tipo: 'NENHUM' },
    });

    expect(codigos(habilidade)).toContain('VALOR_FORA_LIMITE');
  });

  it('rejeita duração em efeitos instantâneos', () => {
    expect(codigos(criarHabilidade({ duracaoTurnos: 2 }))).toContain(
      'DURACAO_INCOMPATIVEL',
    );
  });
});
