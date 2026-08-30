import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
export type PacoteRuby = { id: string; nome: string; quantidade_rubys: number; preco_brl: string | number };

async function lojaRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const resposta = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...options.headers } });
  const dados = await resposta.json().catch(() => null);
  if (!resposta.ok) throw new Error(dados?.message ?? "Não foi possível concluir a operação.");
  return dados as T;
}

export function listarPacotesRuby() { return lojaRequest<PacoteRuby[]>("/loja/pacotes"); }
export function iniciarCheckoutRuby(idPacote: string) { return lojaRequest<{ url: string }>(`/loja/checkout/${idPacote}`, { method: "POST" }); }
