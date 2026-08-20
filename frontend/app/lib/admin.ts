"use client";

import { getToken } from "./auth";
import type { ConfigVisualCarta } from "../components/cartaMontada";

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
  configVisual: ConfigVisualCarta | null;
  ativo: boolean;
  excluidoEm?: string | null;
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
  configVisual?: ConfigVisualCarta;
  ativo?: boolean;
};

export type UpdateAdminCartaPayload = Partial<CreateAdminCartaPayload> & {
  confirmarImpacto?: boolean;
};

export type AdminCartaImpacto = {
  usuariosComCarta: number;
};

export type AdminUsuario = {
  id: string;
  nome: string;
  email: string;
  nivel: number;
  partidas: number;
  rubys: number;
  ativo: boolean;
  bloqueado: boolean;
  admin: boolean;
  emailVerificado: boolean;
  criadoEm: string | null;
  ultimoLoginEm: string | null;
};

export type UpdateAdminUsuarioPayload = {
  nome?: string;
  nivel?: number;
  ativo?: boolean;
  bloqueado?: boolean;
  emailVerificado?: boolean;
};

export type AdminUsuarioCarta = {
  id: string;
  nome: string;
  raridade: string;
  elemento: string;
  foto: string | null;
  moldura: string | null;
  configVisual: ConfigVisualCarta | null;
  quantidade: number;
};

export type AdminUsuarioAtividade = {
  id: string;
  tipo: "RUBY" | "COMPRA" | "GACHA" | "ADMIN";
  titulo: string;
  descricao: string | null;
  valor: number | null;
  unidade: "RUBYS" | "BRL" | null;
  natureza: "ENTRADA" | "SAIDA" | "NEUTRO";
  criadoEm: string | null;
  autoria: { id: string; nome: string; email: string } | null;
  detalhes: Record<string, unknown> | null;
};

export type AjusteSaldoUsuarioPayload = {
  rubys: number;
  motivo: string;
};

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
  classe?: string;
  periodo?: string;
  ordem?: string;
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

  if (filtros.classe) {
    params.set("classe", filtros.classe);
  }

  if (filtros.periodo) {
    params.set("periodo", filtros.periodo);
  }

  if (filtros.ordem) {
    params.set("ordem", filtros.ordem);
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

export function obterImpactoAdminCarta(id: string) {
  return adminRequest<AdminCartaImpacto>(`/admin/cartas/${id}/impacto`);
}

export function removerAdminCarta(
  id: string,
  confirmarNome: string,
  confirmarImpacto: boolean,
) {
  return adminRequest<{ message: string; carta: AdminCarta }>(`/admin/cartas/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmarNome, confirmarImpacto }),
  });
}

export function uploadCartaAssets(formData: FormData) {
  return adminRequest<UploadCartaAssetsResponse>("/admin/uploads/cartas", {
    method: "POST",
    body: formData,
  });
}

export function listarAdminUsuarios(filtros: { busca?: string; status?: string } = {}) {
  const params = new URLSearchParams();
  if (filtros.busca?.trim()) params.set("q", filtros.busca.trim());
  if (filtros.status) params.set("status", filtros.status);
  const query = params.toString();
  return adminRequest<AdminUsuario[]>(`/admin/usuarios${query ? `?${query}` : ""}`);
}

export function atualizarAdminUsuario(id: string, payload: UpdateAdminUsuarioPayload) {
  return adminRequest<AdminUsuario>(`/admin/usuarios/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function obterColecaoAdminUsuario(id: string) {
  return adminRequest<AdminUsuarioCarta[]>(`/admin/usuarios/${id}/colecao`);
}

export function obterAtividadeAdminUsuario(id: string, limite = 50) {
  return adminRequest<AdminUsuarioAtividade[]>(
    `/admin/usuarios/${id}/atividade?limite=${limite}`,
  );
}

export function ajustarColecaoAdminUsuario(
  id: string,
  idCarta: string,
  quantidade: number,
) {
  return adminRequest<AdminUsuarioCarta[]>(`/admin/usuarios/${id}/colecao`, {
    method: "PATCH",
    body: JSON.stringify({ idCarta, quantidade }),
  });
}

export function ajustarSaldoAdminUsuario(
  id: string,
  payload: AjusteSaldoUsuarioPayload,
) {
  return adminRequest<AdminUsuario>(`/admin/usuarios/${id}/saldos`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

function formatApiError(data: ApiErrorResponse | null) {
  const fallback = "Não foi possível concluir a solicitação.";

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
