import { Flame, Leaf, Moon, Waves, Zap } from "lucide-react";

import type { CartaColecao } from "../../lib/jogo";
import { obterValorVendaCarta } from "../../lib/valorVendaCarta";
import type { Card, CardStyle } from "./types";

export const CARTAS_POR_PAGINA = 10;
export const RARIDADES = ["Todas", "UR", "SSR", "SR", "R", "N"];
export const ELEMENTOS = ["Todos", "natureza", "agua", "fogo", "sombra", "luz"];
export const CLASSES = [
  "Todas",
  "Mago",
  "Guerreiro",
  "Cacador",
  "Guardiao",
  "Vidente",
];
export const VALORES_VENDA = ["Todos", "50", "100", "200", "400", "800"];

const elementoVisual: Record<
  CartaColecao["elemento"],
  Pick<Card, "elementoIcone" | "elementoCor" | "artA" | "artB">
> = {
  natureza: {
    elementoIcone: Leaf,
    elementoCor: "#7ee757",
    artA: "#0f2d1f",
    artB: "#172554",
  },
  agua: {
    elementoIcone: Waves,
    elementoCor: "#38bdf8",
    artA: "#0c4a6e",
    artB: "#172554",
  },
  fogo: {
    elementoIcone: Flame,
    elementoCor: "#ef4444",
    artA: "#7f1d1d",
    artB: "#111827",
  },
  sombra: {
    elementoIcone: Moon,
    elementoCor: "#a855f7",
    artA: "#3b0764",
    artB: "#020617",
  },
  luz: {
    elementoIcone: Zap,
    elementoCor: "#facc15",
    artA: "#713f12",
    artB: "#1f2937",
  },
};

const bordaRaridade: Record<Card["raridade"], string> = {
  UR: "#a78bfa",
  SSR: "#f59e0b",
  SR: "#c084fc",
  R: "#60a5fa",
  N: "#64748b",
};

const fallbackBase: Array<
  Pick<Card, "nome" | "raridade" | "elemento" | "classe" | "copias">
> = [
  {
    nome: "Kael Arcano",
    raridade: "UR",
    elemento: "natureza",
    classe: "Mago",
    copias: "1 / 1",
  },
  {
    nome: "Lyria da Luz",
    raridade: "SSR",
    elemento: "agua",
    classe: "Mago",
    copias: "1 / 1",
  },
  {
    nome: "Riven Duelista",
    raridade: "SSR",
    elemento: "fogo",
    classe: "Guerreiro",
    copias: "2 / 3",
  },
  {
    nome: "Mira Sombria",
    raridade: "SR",
    elemento: "sombra",
    classe: "Vidente",
    copias: "1 / 2",
  },
  {
    nome: "Eron Guardiao",
    raridade: "SR",
    elemento: "luz",
    classe: "Guardiao",
    copias: "3 / 3",
  },
  {
    nome: "Sylva Cacadora",
    raridade: "SR",
    elemento: "natureza",
    classe: "Cacador",
    copias: "0 / 2",
  },
  {
    nome: "Dren Mercenario",
    raridade: "R",
    elemento: "agua",
    classe: "Guerreiro",
    copias: "2 / 4",
  },
  {
    nome: "Zed Pirotecnico",
    raridade: "R",
    elemento: "fogo",
    classe: "Cacador",
    copias: "1 / 4",
  },
  {
    nome: "Luna Vidente",
    raridade: "R",
    elemento: "sombra",
    classe: "Vidente",
    copias: "0 / 4",
  },
  {
    nome: "Soldado Real",
    raridade: "R",
    elemento: "luz",
    classe: "Guardiao",
    copias: "4 / 4",
  },
  {
    nome: "Taro Aprendiz",
    raridade: "N",
    elemento: "natureza",
    classe: "Cacador",
    copias: "4 / 8",
  },
  {
    nome: "Nilo Errante",
    raridade: "N",
    elemento: "agua",
    classe: "Guerreiro",
    copias: "5 / 8",
  },
  {
    nome: "Asha Rubra",
    raridade: "N",
    elemento: "fogo",
    classe: "Mago",
    copias: "2 / 8",
  },
  {
    nome: "Noct Vigia",
    raridade: "N",
    elemento: "sombra",
    classe: "Vidente",
    copias: "1 / 8",
  },
  {
    nome: "Theo Escudeiro",
    raridade: "N",
    elemento: "luz",
    classe: "Guardiao",
    copias: "6 / 8",
  },
];

export const FALLBACK_CARDS: Card[] = fallbackBase.map((card) => ({
  ...card,
  custo: obterValorVendaCarta(card.raridade),
  ...elementoVisual[card.elemento],
  borda: bordaRaridade[card.raridade],
}));

export function mapearCarta(carta: CartaColecao): Card {
  return {
    ...carta,
    ...elementoVisual[carta.elemento],
    copias: String(carta.quantidade),
    borda: bordaRaridade[carta.raridade],
  };
}

export function cardStyle(card: Card): CardStyle {
  return {
    "--borda": card.borda,
    "--elemento": card.elementoCor,
    "--artA": card.artA,
    "--artB": card.artB,
    ...(card.foto
      ? {
          backgroundImage: `linear-gradient(180deg, transparent 38%, rgba(2, 6, 23, 0.92) 86%), url("${card.foto}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }
      : {}),
  };
}
