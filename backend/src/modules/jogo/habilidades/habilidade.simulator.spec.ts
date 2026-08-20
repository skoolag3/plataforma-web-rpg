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
});
