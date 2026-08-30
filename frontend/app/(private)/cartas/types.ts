import type { CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";

import type { ConfigVisualCarta } from "../../components/cartaMontada";

export type Card = {
  id?: string;
  nome: string;
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  classe: string;
  custo: number;
  elementoIcone: LucideIcon;
  copias: string;
  borda: string;
  elementoCor: string;
  artA: string;
  artB: string;
  quantidade?: number;
  obtida?: boolean;
  foto?: string | null;
  moldura?: string | null;
  configVisual?: ConfigVisualCarta | null;
  hpBase?: number;
  danoBase?: number;
  defesaBase?: number;
  passiva?: Record<string, unknown>;
};

export type CardStyle = CSSProperties & {
  "--borda": string;
  "--elemento": string;
  "--artA": string;
  "--artB": string;
};

export type ResumoColecao = {
  totalCartas: number;
  cartasObtidas: number;
  percentual: number;
};
