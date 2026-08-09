"use client";

import { getToken } from "./auth";
import type { ConfigVisualCarta } from "../components/cartaMontada";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type CartaColecao = {
  id: string;
  nome: string;
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  classe: string;
  custo: number;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva: Record<string, unknown>;
  foto: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  quantidade: number;
  obtida: boolean;
};

export type ColecaoResponse = {
  itens: CartaColecao[];
  resumo: {
    totalCartas: number;
    cartasObtidas: number;
    percentual: number;
  };
  jogador: {
    nome: string;
    nivel: number;
    moedas: number;
    rubys: number;
    avatarUrl: string | null;
  };
};

export type CartaDeck = {
  id: string;
  nome: string;
  raridade: string;
  elemento: string;
  classe: string;
  foto: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  posicao: number;
};

export type Deck = {
  id: string;
  nome: string;
  ativo: boolean;
  completo: boolean;
  criadoEm: string;
  atualizadoEm: string;
  cartas: CartaDeck[];
};

type DeckResponse = { message: string; deck: Deck };

async function jogoRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Sessao expirada. Entre novamente.");

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });
  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const details = data?.details
      ?.flatMap((item: { messages?: string[] }) => item.messages ?? [])
      .filter(Boolean);
    throw new Error(
      details?.join(" ") ||
        (Array.isArray(data?.message) ? data.message.join(" ") : data?.message) ||
        "Não foi possível concluir a solicitação.",
    );
  }

  return data as T;
}

export function buscarColecao() {
  return jogoRequest<ColecaoResponse>("/colecao");
}

export function listarDecks() {
  return jogoRequest<Deck[]>("/decks");
}

export function criarDeck(nome: string, cartas: string[], ativar = false) {
  return jogoRequest<DeckResponse>("/decks", {
    method: "POST",
    body: JSON.stringify({ nome, cartas, ativar }),
  });
}

export function atualizarDeck(
  id: string,
  dados: { nome?: string; cartas?: string[]; ativar?: boolean },
) {
  return jogoRequest<DeckResponse>(`/decks/${id}`, {
    method: "PATCH",
    body: JSON.stringify(dados),
  });
}

export function ativarDeck(id: string) {
  return jogoRequest<{ message: string }>(`/decks/${id}/ativar`, {
    method: "POST",
  });
}

export function excluirDeck(id: string) {
  return jogoRequest<{ message: string }>(`/decks/${id}`, {
    method: "DELETE",
  });
}

export type ResultadoPartida = {
  id: string;
  personalidade: string;
  dificuldade: "FACIL" | "MEDIA" | "DIFICIL";
  resultado: "VITORIA" | "DERROTA" | "EMPATE";
  variacaoPontos: number;
  estado: {
    turno: number;
    eventos: { turno: number; tipo: string; texto: string; valor?: number }[];
  };
};

export function buscarProvocacaoBot() {
  return jogoRequest<{ personalidade: string; pergunta: string }>(
    "/partidas/bot/provocacao",
  );
}

export function iniciarPartidaBot(resposta: string) {
  return jogoRequest<ResultadoPartida>("/partidas/bot", {
    method: "POST",
    body: JSON.stringify({ resposta }),
  });
}

export type CartaGachaApi = {
  id: string;
  nome: string;
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  foto: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  taxaDrop?: number;
  quantidade?: number;
  nova?: boolean;
};

export type BannerGacha = {
  id: string;
  nome: string;
  custoGiro: number;
  custoDez: number;
  pity: number;
  limitePity: number;
  diarioDisponivel: boolean;
  cartas: CartaGachaApi[];
};

export type GachaResponse = {
  jogador: { nome: string; nivel: number; rubys: number; moedas: number };
  banners: BannerGacha[];
};

export function buscarGacha() {
  return jogoRequest<GachaResponse>("/gacha/banners");
}

export function girarGacha(idBanner: string, quantidade: 1 | 10) {
  return jogoRequest<{
    cartas: CartaGachaApi[];
    pity: number;
    rubys: number;
    custo: number;
  }>("/gacha/girar", {
    method: "POST",
    body: JSON.stringify({ idBanner, quantidade }),
  });
}

export function resgatarGiroDiario(idBanner: string) {
  return jogoRequest<{ message: string; rubysRecebidos: number }>("/gacha/diario", {
    method: "POST",
    body: JSON.stringify({ idBanner }),
  });
}
