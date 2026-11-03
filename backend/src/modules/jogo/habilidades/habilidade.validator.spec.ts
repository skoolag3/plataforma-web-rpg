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
  it('impede dano em aliado e cura no inimigo', () => {
    expect(codigos(criarHabilidade({ alvo: 'ALIADO_ATIVO' }))).toContain('ALVO_INCOMPATIVEL');
    expect(codigos(criarHabilidade({ tipoEfeito: 'CURA', alvo: 'INIMIGO_ATIVO' }))).toContain('ALVO_INCOMPATIVEL');
  });
  it('aceita intervalo no início do turno e rejeita valores inválidos', () => {
    const habilidade = criarHabilidade({
      gatilho: 'INICIO_TURNO',
      formaAplicacao: 'APOS_ACAO',
      valorBase: 50,
      requisito: { tipo: 'INTERVALO_TURNOS', intervalo: 2 },
    });
    expect(validarHabilidade(habilidade).valida).toBe(true);
    expect(codigos({ ...habilidade, requisito: { tipo: 'INTERVALO_TURNOS', intervalo: 1 } })).toContain('INTERVALO_TURNOS_FORA_LIMITE');
    expect(codigos({ ...habilidade, gatilho: 'AO_ATACAR' })).toContain('INTERVALO_TURNOS_INCOMPATIVEL');
  });
  it('aceita crítico com chance e rejeita chance fora do limite', () => {
    const critico = criarHabilidade({
      tipoEfeito: 'CRITICO',
      gatilho: 'AO_ATACAR',
      alvo: 'INIMIGO_ATIVO',
      unidade: 'PERCENTUAL',
      valorBase: 50,
      formaAplicacao: 'ANTES_ACAO',
      requisito: { tipo: 'CHANCE', percentual: 25 },
    });
    expect(validarHabilidade(critico).valida).toBe(true);
    expect(codigos({ ...critico, requisito: { tipo: 'CHANCE', percentual: 0 } })).toContain('CHANCE_FORA_LIMITE');
  });
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
        valorBase: limitesHabilidade.percentualAtaqueSubstituto.maximo,
      }),
    );

    expect(res.valida).toBe(true);
  });

  it('rejeita valor percentual acima do máximo', () => {
    expect(
      codigos(
        criarHabilidade({
          valorBase: limitesHabilidade.percentualAtaqueSubstituto.maximo + 1,
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

  it('rejeita dano fixo configurado para substituir ataque', () => {
    expect(codigos(criarHabilidade({ unidade: 'FIXO' })))
      .toContain('UNIDADE_SUBSTITUICAO_INCOMPATIVEL');
  });

  it.each([
    ['DANO', 'INIMIGO_ATIVO', undefined, 'APOS_ACAO', limitesHabilidade.percentualDanoDireto.maximo],
    ['DANO', 'INIMIGO_ATIVO', undefined, 'SUBSTITUI_ATAQUE', limitesHabilidade.percentualAtaqueSubstituto.maximo],
    ['CURA', 'PROPRIA_CARTA', undefined, 'APOS_ACAO', limitesHabilidade.percentualEfeito.maximo],
    ['ESCUDO', 'PROPRIA_CARTA', undefined, 'APOS_ACAO', limitesHabilidade.percentualEfeito.maximo],
    ['BUFF', 'PROPRIA_CARTA', 'ATAQUE', 'APOS_ACAO', limitesHabilidade.percentualEfeito.maximo],
    ['DEBUFF', 'INIMIGO_ATIVO', 'DEFESA', 'APOS_ACAO', limitesHabilidade.percentualEfeito.maximo],
    ['ROUBO_VIDA', 'PROPRIA_CARTA', undefined, 'APOS_ACAO', limitesHabilidade.percentualRouboVida.maximo],
    ['EVASAO', 'PROPRIA_CARTA', undefined, 'APOS_ACAO', limitesHabilidade.percentualEvasao.maximo],
  ] as const)('usa teto percentual próprio para %s (%s)', (tipoEfeito, alvo, atributo, formaAplicacao, maximo) => {
    const habilidade = criarHabilidade({
      tipoEfeito, alvo, atributo, formaAplicacao,
      unidade: 'PERCENTUAL',
      requisito: { tipo: 'NENHUM' },
      valorBase: maximo,
    });
    expect(validarHabilidade(habilidade).valida).toBe(true);
    expect(codigos({ ...habilidade, valorBase: maximo + 1 })).toContain('VALOR_FORA_LIMITE');
  });

  it('limita crítico a cem por cento de bônus', () => {
    const habilidade = criarHabilidade({
      tipoEfeito: 'CRITICO',
      valorBase: limitesHabilidade.percentualCritico.maximo,
      requisito: { tipo: 'CHANCE', percentual: 25 },
      formaAplicacao: 'ANTES_ACAO',
    });
    expect(validarHabilidade(habilidade).valida).toBe(true);
    expect(codigos({ ...habilidade, valorBase: limitesHabilidade.percentualCritico.maximo + 1 }))
      .toContain('VALOR_FORA_LIMITE');
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

  it.each([
    ['DANO', 'INIMIGO_ATIVO', undefined, 'FIXO'],
    ['CURA', 'PROPRIA_CARTA', undefined, 'FIXO'],
    ['ESCUDO', 'PROPRIA_CARTA', undefined, 'FIXO'],
    ['BUFF', 'PROPRIA_CARTA', 'ATAQUE', 'FIXO'],
    ['DEBUFF', 'INIMIGO_ATIVO', 'DEFESA', 'FIXO'],
    ['ROUBO_VIDA', 'PROPRIA_CARTA', undefined, 'PERCENTUAL'],
    ['EVASAO', 'PROPRIA_CARTA', undefined, 'PERCENTUAL'],
  ] as const)('limita a escala proporcional de %s', (tipoEfeito, alvo, atributo, unidade) => {
    const habilidade = criarHabilidade({
      tipoEfeito, alvo, atributo, unidade,
      formaAplicacao: 'APOS_ACAO',
      requisito: { tipo: 'NENHUM' },
      valorBase: 10,
      escala: { tipo: 'POR_TURNO', valor: 5, limite: 30 },
    });

    expect(validarHabilidade(habilidade).valida).toBe(true);
    expect(codigos({ ...habilidade, escala: { tipo: 'POR_TURNO', valor: 6, limite: 30 } }))
      .toContain('ESCALA_SALTO_EXCESSIVO');
    expect(codigos({ ...habilidade, escala: { tipo: 'POR_TURNO', valor: 5, limite: 100 } }))
      .toContain('LIMITE_ESCALA_DESPROPORCIONAL');
  });

  it('aceita o menor valor base com incremento mínimo de um', () => {
    const habilidade = criarHabilidade({
      formaAplicacao: 'APOS_ACAO',
      requisito: { tipo: 'NENHUM' },
      valorBase: 1,
      escala: { tipo: 'POR_ATAQUE', valor: 1, limite: 3 },
    });
    expect(validarHabilidade(habilidade).valida).toBe(true);
    expect(codigos({ ...habilidade, escala: { tipo: 'POR_ATAQUE', valor: 1, limite: 4 } }))
      .toContain('LIMITE_ESCALA_DESPROPORCIONAL');
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
