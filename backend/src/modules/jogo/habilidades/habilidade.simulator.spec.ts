import type { ConfiguracaoHabilidade } from './habilidade.types';
import { simularHabilidade } from './habilidade.simulator';

const habilidadeBase: ConfiguracaoHabilidade = {
  nome: 'Golpe flamejante',
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
};

describe('simularHabilidade', () => {
  it('ativa a cada dois turnos, mas não nos turnos intermediários', () => {
    const habilidade = {
      ...habilidadeBase,
      gatilho: 'INICIO_TURNO' as const,
      requisito: { tipo: 'INTERVALO_TURNOS' as const, intervalo: 2 },
    };
    const cenario = { ataquesRealizados: 0, hpAtual: 100, hpMaximo: 100 };
    expect(simularHabilidade(habilidade, { ...cenario, turno: 1 }).acionada).toBe(false);
    expect(simularHabilidade(habilidade, { ...cenario, turno: 2 }).acionada).toBe(true);
    expect(simularHabilidade(habilidade, { ...cenario, turno: 3 }).acionada).toBe(false);
    expect(simularHabilidade(habilidade, { ...cenario, turno: 4 }).acionada).toBe(true);
  });
  it('não ativa antes de alcançar o contador de ataques', () => {
    const res = simularHabilidade(habilidadeBase, {
      turno: 2,
      ataquesRealizados: 2,
      hpAtual: 80,
      hpMaximo: 100,
    });

    expect(res).toMatchObject({
      acionada: false,
      requisitoAtendido: false,
      valorCalculado: 150,
      percentualHp: 80,
    });
  });

  it('ativa ao alcançar o contador de ataques', () => {
    const res = simularHabilidade(habilidadeBase, {
      turno: 3,
      ataquesRealizados: 3,
      hpAtual: 80,
      hpMaximo: 100,
    });

    expect(res.acionada).toBe(true);
  });

  it('aplica escala por turno sem ultrapassar o limite', () => {
    const res = simularHabilidade(
      {
        ...habilidadeBase,
        valorBase: 100,
        requisito: { tipo: 'NENHUM' },
        escala: { tipo: 'POR_TURNO', valor: 25, limite: 150 },
      },
      { turno: 5, ataquesRealizados: 0, hpAtual: 100, hpMaximo: 100 },
    );

    expect(res.valorCalculado).toBe(150);
  });

  it.each([
    ['POR_TURNO', 1, 0, 10],
    ['POR_TURNO', 2, 0, 15],
    ['POR_TURNO', 20, 0, 30],
    ['POR_ATAQUE', 1, 0, 10],
    ['POR_ATAQUE', 1, 1, 15],
    ['POR_ATAQUE', 1, 20, 30],
  ] as const)('não deixa escala %s saltar de 10 para 100', (tipo, turno, ataquesRealizados, esperado) => {
    const res = simularHabilidade(
      {
        ...habilidadeBase,
        valorBase: 10,
        requisito: { tipo: 'NENHUM' },
        escala: { tipo, valor: 90, limite: 100 },
      },
      { turno, ataquesRealizados, hpAtual: 100, hpMaximo: 100 },
    );
    expect(res.valorCalculado).toBe(esperado);
  });

  it('mantém o teto proporcional em combinações de base, incremento, limite e duração', () => {
    for (const tipo of ['POR_TURNO', 'POR_ATAQUE'] as const) {
      for (const valorBase of [1, 2, 3, 10, 100]) {
        for (const incremento of [1, 5, 1000]) {
          for (const limite of [valorBase, valorBase * 3, 9999]) {
            for (const contador of [0, 1, 2, 20, 100]) {
              const resultado = simularHabilidade(
                {
                  ...habilidadeBase,
                  valorBase,
                  requisito: { tipo: 'NENHUM' },
                  escala: { tipo, valor: incremento, limite },
                },
                {
                  turno: tipo === 'POR_TURNO' ? contador + 1 : 1,
                  ataquesRealizados: tipo === 'POR_ATAQUE' ? contador : 0,
                  hpAtual: 100,
                  hpMaximo: 100,
                },
              );

              expect(resultado.valorCalculado).toBeGreaterThanOrEqual(valorBase);
              expect(resultado.valorCalculado).toBeLessThanOrEqual(Math.min(limite, valorBase * 3));
              expect(Number.isFinite(resultado.valorCalculado)).toBe(true);
            }
          }
        }
      }
    }
  });

  it('considera HP exatamente no limite como requisito não atendido', () => {
    const res = simularHabilidade(
      {
        ...habilidadeBase,
        requisito: { tipo: 'HP_ABAIXO', percentual: 50 },
      },
      { turno: 1, ataquesRealizados: 0, hpAtual: 50, hpMaximo: 100 },
    );

    expect(res.acionada).toBe(false);
  });

  it('mostra o bônus quando o crítico é marcado como sim', () => {
    const res = simularHabilidade(
      {
        ...habilidadeBase,
        tipoEfeito: 'CRITICO',
        valorBase: 50,
        requisito: { tipo: 'CHANCE', percentual: 25 },
      },
      { turno: 1, ataquesRealizados: 1, hpAtual: 100, hpMaximo: 100, criticoAtivou: true },
    );

    expect(res).toMatchObject({ acionada: true, valorCalculado: 50 });
    expect(res.resumo).toContain('25% de chance');
  });

  it('não aplica bônus quando o crítico é marcado como não', () => {
    const res = simularHabilidade(
      {
        ...habilidadeBase,
        tipoEfeito: 'CRITICO',
        valorBase: 50,
        requisito: { tipo: 'CHANCE', percentual: 25 },
      },
      { turno: 1, ataquesRealizados: 1, hpAtual: 100, hpMaximo: 100, criticoAtivou: false },
    );

    expect(res).toMatchObject({ acionada: false, valorCalculado: 0 });
    expect(res.resumo).toContain('nenhum bônus');
  });
});
