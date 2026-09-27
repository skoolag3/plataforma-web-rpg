import type { LucideIcon } from "lucide-react";
import type { ConfigVisualCarta } from "../../components/cartaMontada";

export type RaridadeCarta = "UR" | "SSR" | "SR" | "R" | "N";

export type CartaGachaVisual = {
  id?: string;
  nome: string;
  raridade: RaridadeCarta;
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  icon: LucideIcon;
  foto?: string | null;
  moldura?: string | null;
  configVisual?: ConfigVisualCarta | null;
  quantidade?: number;
  nova?: boolean;
  valorVenda?: number;
};

export type EstadoGacha = "selecao" | "carregando" | "revelacao" | "resultado";
