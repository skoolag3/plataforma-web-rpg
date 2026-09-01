import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

export type ItemCorreio = {
  chave: string;
  tipo: "RECOMPENSA" | "EVENTO" | "PROMOCAO" | "AVISO" | "NOVIDADE";
  titulo: string;
  resumo: string;
  href: string;
  acao: string;
  criadoEm: string;
  expiraEm: string | null;
  lida: boolean;
};

export type CorreioResponse = {
  naoLidas: number;
  itens: ItemCorreio[];
};

async function correioRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");

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
    throw new Error(data?.message ?? "Não foi possível carregar o correio.");
  }
  return data as T;
}

export function buscarCorreio() {
  return correioRequest<CorreioResponse>("/correio");
}

export function marcarMensagemLida(chave: string) {
  return correioRequest<{ message: string }>("/correio/ler", {
    method: "POST",
    body: JSON.stringify({ chave }),
  });
}
