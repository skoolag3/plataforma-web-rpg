export const VALOR_VENDA_POR_RARIDADE = {
  N: 50,
  R: 100,
  SR: 200,
  SSR: 400,
  UR: 800,
} as const;

export type RaridadeComValorVenda = keyof typeof VALOR_VENDA_POR_RARIDADE;

export function obterValorVendaPorRaridade(raridade: string) {
  return (
    VALOR_VENDA_POR_RARIDADE[raridade as RaridadeComValorVenda] ??
    VALOR_VENDA_POR_RARIDADE.N
  );
}
