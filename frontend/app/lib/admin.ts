"use client";

import { clearSession, getToken } from "./auth";
import type { ConfigVisualCarta } from "../components/cartaMontada";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ApiErrorResponse = {
  message?: string | string[];
  details?: { messages?: string[]; mensagem?: string }[];
};

export type TipoEfeitoHabilidade =
  "BUFF" | "DEBUFF" | "DANO" | "CURA" | "ESCUDO" | "ROUBO_VIDA" | "EVASAO";

export type AdminHabilidade = {
  id: string;
  nome: string;
  descricao: string | null;
  modoExecucao: "AUTOMATICA";
  tipoEfeito: TipoEfeitoHabilidade;
  gatilho:
    | "AO_ENTRAR"
    | "AO_ATACAR"
    | "AO_RECEBER_DANO"
    | "INICIO_TURNO"
    | "FIM_TURNO";
  alvo: "PROPRIA_CARTA" | "ALIADO_ATIVO" | "INIMIGO_ATIVO";
  atributo: "ATAQUE" | "DEFESA" | "VELOCIDADE" | null;
  unidade: "FIXO" | "PERCENTUAL";
  valorBase: number;
  formaAplicacao: "ANTES_ACAO" | "APOS_ACAO" | "SUBSTITUI_ATAQUE";
  requisitoTipo: "NENHUM" | "CONTADOR_ATAQUES" | "HP_ABAIXO" | "TURNO_MINIMO";
  requisitoValor: number | null;
  escalaTipo: "NENHUMA" | "POR_TURNO" | "POR_ATAQUE";
  escalaValor: number | null;
  escalaLimite: number | null;
  duracaoTurnos: number | null;
  status: "RASCUNHO" | "PUBLICADA" | "INATIVA";
  versao: number;
  testadaEm: string | null;
  criadoEm: string;
  atualizadoEm: string;
};

export type SalvarAdminHabilidadePayload = {
  nome: string;
  descricao?: string;
  tipoEfeito: AdminHabilidade["tipoEfeito"];
  gatilho: AdminHabilidade["gatilho"];
  alvo: AdminHabilidade["alvo"];
  atributo?: Exclude<AdminHabilidade["atributo"], null>;
  unidade: AdminHabilidade["unidade"];
  valorBase: number;
  formaAplicacao: AdminHabilidade["formaAplicacao"];
  requisitoTipo: AdminHabilidade["requisitoTipo"];
  requisitoValor?: number;
  escalaTipo: AdminHabilidade["escalaTipo"];
  escalaValor?: number;
  escalaLimite?: number;
  duracaoTurnos?: number;
};

export type TestarAdminHabilidadePayload = {
  turno: number;
  ataquesRealizados: number;
  hpAtual: number;
  hpMaximo: number;
};

export type ResultadoTesteAdminHabilidade = {
  habilidade: AdminHabilidade;
  resultado: {
    acionada: boolean;
    requisitoAtendido: boolean;
    valorCalculado: number;
    percentualHp: number;
    resumo: string;
  };
};

export type AdminCarta = {
  id: string;
  nome: string;
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  classe: string | null;
  idClasse: string | null;
  classeDetalhes: AdminClasse | null;
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
  habilidades: AdminCartaHabilidade[];
};

export type AdminCartaHabilidade = {
  id: string;
  nome: string;
  descricao: string | null;
  tipoEfeito: TipoEfeitoHabilidade;
  gatilho: AdminHabilidade["gatilho"];
  alvo: AdminHabilidade["alvo"];
  status: AdminHabilidade["status"];
  versao: number;
  ordem: number;
};

export type CreateAdminCartaPayload = {
  nome: string;
  elemento: AdminCarta["elemento"];
  raridade: AdminCarta["raridade"];
  classe?: string;
  idClasse?: string | null;
  custo?: number;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva?: Record<string, unknown>;
  foto?: string;
  moldura?: string;
  configVisual?: ConfigVisualCarta;
  ativo?: boolean;
  habilidadesIds?: string[];
};

export type UpdateAdminCartaPayload = Partial<CreateAdminCartaPayload> & {
  confirmarImpacto?: boolean;
};

export type AdminCartaImpacto = {
  usuariosComCarta: number;
};

export type AdminClasse = {
  id: string;
  nome: string;
  descricao: string | null;
  prioridadeAtaque: number;
  modificadorHp: number;
  modificadorAtaque: number;
  modificadorDefesa: number;
  ativo: boolean;
  totalCartas: number;
};

export type SalvarAdminClassePayload = {
  nome: string;
  descricao?: string;
  prioridadeAtaque: number;
  modificadorHp: number;
  modificadorAtaque: number;
  modificadorDefesa: number;
  ativo?: boolean;
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
  avatarUrl: string | null;
  molduraId: string | null;
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

export type AnexoNoticia = { titulo: string; url: string };

export type AdminNoticia = {
  id: string;
  titulo: string;
  resumo: string;
  conteudo: string;
  imagem: string | null;
  categoria: "NOVIDADE" | "BALANCE" | "EVENTO" | "PROMOCAO" | "AVISO";
  anexos: AnexoNoticia[] | null;
  publicada: boolean;
  criado_em: string;
  atualizado_em: string;
};

export type SalvarAdminNoticiaPayload = Omit<
  AdminNoticia,
  "id" | "criado_em" | "atualizado_em" | "anexos" | "imagem"
> & {
  anexos: AnexoNoticia[];
  imagem?: string;
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

export type ProbabilidadeGacha = {
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  percentual: number;
};

export type AdminBanner = {
  id: string;
  nome: string;
  custoGiro: number;
  ativo: boolean;
  totalCartas: number;
  raridades: { raridade: string; total: number }[];
};

export type AdminBannersResponse = {
  probabilidades: ProbabilidadeGacha[];
  rotacao: {
    bannerAtualId: string;
    proximaRotacaoEm: string;
    forcadoPorAdmin: boolean;
  } | null;
  banners: AdminBanner[];
};

async function adminRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(options.body instanceof FormData
        ? {}
        : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (typeof window !== "undefined" && response.status === 401) {
      clearSession();
      window.location.replace("/login");
    } else if (typeof window !== "undefined" && response.status === 403) {
      window.location.replace("/home");
    }

    throw new Error(formatApiError(data));
  }

  return data as T;
}

export function obterAdminDashboard() {
  return adminRequest<AdminDashboardResumo>("/admin/dashboard");
}

export function listarAdminHabilidades() {
  return adminRequest<AdminHabilidade[]>("/admin/habilidades");
}

export function criarAdminHabilidade(payload: SalvarAdminHabilidadePayload) {
  return adminRequest<AdminHabilidade>("/admin/habilidades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminHabilidade(
  id: string,
  payload: SalvarAdminHabilidadePayload,
) {
  return adminRequest<AdminHabilidade>(`/admin/habilidades/${id}`, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function inativarAdminHabilidade(id: string, confirmarNome: string) {
  return adminRequest<AdminHabilidade>(`/admin/habilidades/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmarNome }),
  });
}

export function testarAdminHabilidade(
  id: string,
  payload: TestarAdminHabilidadePayload,
) {
  return adminRequest<ResultadoTesteAdminHabilidade>(
    `/admin/habilidades/${id}/testar`,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function publicarAdminHabilidade(id: string) {
  return adminRequest<AdminHabilidade>(`/admin/habilidades/${id}/publicar`, {
    method: "POST",
  });
}

export function listarAdminCartas(
  filtros: {
    busca?: string;
    raridade?: string;
    elemento?: string;
    status?: string;
    classe?: string;
    periodo?: string;
    ordem?: string;
  } = {},
) {
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

export function listarAdminClasses() {
  return adminRequest<AdminClasse[]>("/admin/classes");
}

export function criarAdminClasse(payload: SalvarAdminClassePayload) {
  return adminRequest<AdminClasse>("/admin/classes", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminClasse(
  id: string,
  payload: SalvarAdminClassePayload,
) {
  return adminRequest<AdminClasse>(`/admin/classes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function criarAdminCarta(payload: CreateAdminCartaPayload) {
  return adminRequest<AdminCarta>("/admin/cartas", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminCarta(
  id: string,
  payload: UpdateAdminCartaPayload,
) {
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
  return adminRequest<{ message: string; carta: AdminCarta }>(
    `/admin/cartas/${id}`,
    {
      method: "DELETE",
      body: JSON.stringify({ confirmarNome, confirmarImpacto }),
    },
  );
}

export function uploadCartaAssets(formData: FormData) {
  return adminRequest<UploadCartaAssetsResponse>("/admin/uploads/cartas", {
    method: "POST",
    body: formData,
  });
}

export function listarAdminNoticias() {
  return adminRequest<AdminNoticia[]>("/admin/noticias");
}

export function criarAdminNoticia(payload: SalvarAdminNoticiaPayload) {
  return adminRequest<AdminNoticia>("/admin/noticias", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminNoticia(
  id: string,
  payload: SalvarAdminNoticiaPayload,
) {
  return adminRequest<AdminNoticia>(`/admin/noticias/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removerAdminNoticia(id: string) {
  return adminRequest<{ message: string }>(`/admin/noticias/${id}`, {
    method: "DELETE",
  });
}

export function uploadNoticiaImagem(formData: FormData) {
  return adminRequest<UploadedAsset>("/admin/uploads/noticias", {
    method: "POST",
    body: formData,
  });
}

export function listarAdminBanners() {
  return adminRequest<AdminBannersResponse>("/admin/banners");
}

export function forcarAdminBanner(idBanner: string) {
  return adminRequest<{
    message: string;
    bannerAtualId: string;
    proximaRotacaoEm: string;
  }>("/admin/banners/forcar", {
    method: "POST",
    body: JSON.stringify({ idBanner }),
  });
}

export function listarAdminUsuarios(
  filtros: { busca?: string; status?: string } = {},
) {
  const params = new URLSearchParams();
  if (filtros.busca?.trim()) params.set("q", filtros.busca.trim());
  if (filtros.status) params.set("status", filtros.status);
  const query = params.toString();
  return adminRequest<AdminUsuario[]>(
    `/admin/usuarios${query ? `?${query}` : ""}`,
  );
}

export function atualizarAdminUsuario(
  id: string,
  payload: UpdateAdminUsuarioPayload,
) {
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

  const message = Array.isArray(data.message)
    ? data.message.join(" ")
    : data.message;
  const details = data.details
    ?.flatMap((detail) => detail.messages ?? detail.mensagem ?? [])
    .filter(Boolean);

  if (details?.length) {
    return details.join("\n");
  }

  return message ?? fallback;
}
