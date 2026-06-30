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

export type UploadedAsset = {
  kind: "foto" | "moldura";
  url: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
};

export type UploadCartaAssetsResponse = {
  assets: UploadedAsset[];
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

export function listarAdminCartas(busca?: string) {
  const params = new URLSearchParams();

  if (busca?.trim()) {
    params.set("q", busca.trim());
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
