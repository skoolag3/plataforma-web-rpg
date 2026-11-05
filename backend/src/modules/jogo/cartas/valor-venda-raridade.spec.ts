import {
  obterValorVendaPorRaridade,
  VALOR_VENDA_POR_RARIDADE,
} from './valor-venda-raridade';

describe('valor de venda por raridade', () => {
  it('aumenta o valor em Rubys conforme a raridade da carta', () => {
    expect(VALOR_VENDA_POR_RARIDADE).toEqual({
      N: 50,
      R: 100,
      SR: 200,
      SSR: 400,
      UR: 800,
    });
  });

  it('usa o valor comum para uma raridade legada desconhecida', () => {
    expect(obterValorVendaPorRaridade('DESCONHECIDA')).toBe(50);
  });
});
