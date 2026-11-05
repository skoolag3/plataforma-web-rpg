import { gerarTrilhaExpedicao, percentualMantidoNaEtapa, type SecaoCampanha } from './expedicao.trilha';

describe('perda por seção da expedição', () => {
  const caminho = { dificuldade: 'FACIL' as const, recompensa: 100, cartas: [] };
  const secoes: SecaoCampanha[] = [
    { tipo: 'BATALHA', grupo: 1, percentualMantidoDerrota: 60, caminhos: [caminho] },
    { tipo: 'BATALHA', grupo: 2, percentualMantidoDerrota: 10, caminhos: [caminho] },
    { tipo: 'BOSS', percentualMantidoDerrota: 25 },
  ];

  it('usa o percentual da etapa e do chefe na trilha salva', () => {
    const trilha = gerarTrilhaExpedicao(123, undefined, undefined, secoes);
    expect(percentualMantidoNaEtapa(trilha, 0)).toBe(60);
    expect(percentualMantidoNaEtapa(trilha, 1)).toBe(10);
    expect(percentualMantidoNaEtapa(trilha, 2)).toBe(25);
  });

  it('preserva o percentual da campanha em trilhas anteriores', () => {
    const trilha = gerarTrilhaExpedicao(123, undefined, undefined, [
      { tipo: 'BATALHA', caminhos: [caminho] },
      { tipo: 'BOSS' },
    ]);
    expect(percentualMantidoNaEtapa(trilha, 0)).toBe(70);
    expect(percentualMantidoNaEtapa(trilha, 1)).toBe(70);
  });
});
