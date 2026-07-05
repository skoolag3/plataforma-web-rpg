"use client";

import { getToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ApiErrorResponse = {
  message?: string | string[];
  details?: { messages?: string[] }[];
};

export type AdminCarta = {
  id: string;
  nome: string;
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  classe: string | null;
  custo: number | null;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva: Record<string, unknown>;
  foto: string | null;
  moldura: string | null;
  ativo: boolean;
  criadoEm?: string;
  atualizadoEm?: string;
};

export type CreateAdminCartaPayload = {
  nome: string;
  elemento: AdminCarta["elemento"];
  raridade: AdminCarta["raridade"];
  classe?: string;
  custo?: number;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva?: Record<string, unknown>;
  foto?: string;
  moldura?: string;
  ativo?: boolean;
};

export type UpdateAdminCartaPayload = Partial<CreateAdminCartaPayload>;

export type AdminDashboardResumo = {
  metricas: {
    usuarios: number;
    usuariosAtivos: number;
    cartas: number;
    cartasAtivas: number;
    partidas: number;
    rubysEmCirculacao: number;
  };
  raridades: { raridade: AdminCarta["raridade"] | string; total: number }[];
  atividadeRecente: {
    tipo: string;
    texto: string;
    data: string | null;
    status: string;
    detalhe: string;
  }[];
  topCartas: {
    id: string | null;
    nome: string;
    raridade: string;
    quantidade: number;
  }[];
};

export type UploadedAsset = {
  url: string;
  publicId: string;
  bytes: number;
  width: number;
  height: number;
  format: string;
};

export type UploadCartaAssetsResponse = {
  foto: UploadedAsset | null;
  moldura: UploadedAsset | null;
};

async function adminRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatApiError(data));
  }

  return data as T;
}

export function obterAdminDashboard() {
  return adminRequest<AdminDashboardResumo>("/admin/dashboard");
}

export function listarAdminCartas(filtros: {
  busca?: string;
  raridade?: string;
  elemento?: string;
  status?: string;
} = {}) {
  const params = new URLSearchParams();

  if (filtros.busca?.trim()) {
    params.set("q", filtros.busca.trim());
  }

  if (filtros.raridade) {
    params.set("raridade", filtros.raridade);
  }

  if (filtros.elemento) {
    params.set("elemento", filtros.elemento);
  }

  if (filtros.status) {
    params.set("status", filtros.status);
  }

  const query = params.toString();
  return adminRequest<AdminCarta[]>(`/admin/cartas${query ? `?${query}` : ""}`);
}

export function criarAdminCarta(payload: CreateAdminCartaPayload) {
  return adminRequest<AdminCarta>("/admin/cartas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminCarta(id: string, payload: UpdateAdminCartaPayload) {
  return adminRequest<AdminCarta>(`/admin/cartas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removerAdminCarta(id: string) {
  return adminRequest<{ message: string; carta: AdminCarta }>(`/admin/cartas/${id}`, {
    method: "DELETE",
  });
}

export function uploadCartaAssets(formData: FormData) {
  return adminRequest<UploadCartaAssetsResponse>("/admin/uploads/cartas", {
    method: "POST",
    body: formData,
  });
}

function formatApiError(data: ApiErrorResponse | null) {
  const fallback = "Nao foi possivel concluir a solicitacao.";

  if (!data) {
    return fallback;
  }

  const message = Array.isArray(data.message) ? data.message.join(" ") : data.message;
  const details = data.details
    ?.flatMap((detail) => detail.messages ?? [])
    .filter(Boolean);

  if (details?.length) {
    return details.join("\n");
  }

  return message ?? fallback;
}
