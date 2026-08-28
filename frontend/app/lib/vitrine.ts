import type { ConfigVisualCarta } from "../components/cartaMontada";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type CartaVitrine = {
  id: string;
  nome: string;
  raridade: string;
  elemento: string;
  foto: string | null;
  moldura: string | null;
  config_visual: ConfigVisualCarta | null;
};

export async function listarCartasVitrine() {
  const response = await fetch(`${API_URL}/vitrine/cartas`);
  if (!response.ok) throw new Error("Não foi possível carregar a vitrine.");
  return response.json() as Promise<CartaVitrine[]>;
}
