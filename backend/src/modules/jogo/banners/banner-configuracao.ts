import { Prisma } from '@prisma/client';
import { LIMITE_PITY, PROBABILIDADES_RARIDADE } from '../gacha/gacha.config';

export type ChanceBanner = { raridade: string; percentual: number };
export type PityBanner = { raridade: string; limite: number };
export type ConfiguracaoBanner = { chances: ChanceBanner[]; pities: PityBanner[] };

export function lerConfiguracaoBanner(valor: Prisma.JsonValue | null, raridades: string[]): ConfiguracaoBanner {
  if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
    const objeto = valor as Record<string, Prisma.JsonValue>;
    if (Array.isArray(objeto.chances) && Array.isArray(objeto.pities)) {
      return {
        chances: objeto.chances as ChanceBanner[],
        pities: objeto.pities as PityBanner[],
      };
    }
  }

  const presentes = new Set(raridades);
  const chances = PROBABILIDADES_RARIDADE.filter((item) => presentes.has(item.raridade)).map((item) => ({ ...item, percentual: Number(item.percentual) }));
  for (let indice = 0; indice < PROBABILIDADES_RARIDADE.length; indice += 1) {
    const item = PROBABILIDADES_RARIDADE[indice];
    if (presentes.has(item.raridade)) continue;
    const destino = chances.find((chance) => PROBABILIDADES_RARIDADE.findIndex((padrao) => padrao.raridade === chance.raridade) > indice) ?? [...chances].reverse().find((chance) => PROBABILIDADES_RARIDADE.findIndex((padrao) => padrao.raridade === chance.raridade) < indice);
    if (destino) destino.percentual += item.percentual;
  }
  return {
    chances,
    pities: presentes.has('UR') ? [{ raridade: 'UR', limite: LIMITE_PITY }] : [],
  };
}

export function calcularContadoresPity(pities: PityBanner[], historico: string[]) {
  return pities.map((item) => {
    const indice = historico.findIndex((raridade) => raridade === item.raridade);
    return { ...item, atual: indice < 0 ? Math.min(historico.length, item.limite - 1) : Math.min(indice, item.limite - 1) };
  });
}

export function sortearRaridadeBanner(chances: ChanceBanner[], aleatorio: number) {
  let alvo = aleatorio * 100;
  for (const chance of chances) {
    alvo -= chance.percentual;
    if (alvo < 0) return chance.raridade;
  }
  return chances[chances.length - 1]?.raridade;
}
