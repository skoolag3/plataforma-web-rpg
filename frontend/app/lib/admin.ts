"use client";

import { clearSession, getToken } from "./auth";
import type {
  AdminBanner,
  AdminBannersResponse,
  AdminBoss,
  AdminCampanhaConfiguracao,
  AdminCampanhaPainel,
  AdminCarta,
  AdminCartaImpacto,
  AdminCartasHistoricoPainel,
  AdminClasse,
  AdminDashboardResumo,
  AdminExpedicoesPainel,
  AdminHabilidade,
  AdminLogPityGacha,
  AdminNoticia,
  AdminProdutoExpedicao,
  AdminRaridade,
  AdminUsuario,
  AdminUsuarioAtividade,
  AdminUsuarioCarta,
  AdminUsuarioExpedicoesPagina,
  AdminUsuarioLogLuta,
  AjusteSaldoUsuarioPayload,
  CreateAdminCartaPayload,
  PeriodoDashboardAdmin,
  ResultadoTesteAdminHabilidade,
  SalvarAdminBannerPayload,
  SalvarAdminClassePayload,
  SalvarAdminHabilidadePayload,
  SalvarAdminNoticiaPayload,
  SalvarAdminRaridadePayload,
  SalvarProdutoExpedicaoPayload,
  TestarAdminHabilidadePayload,
  UpdateAdminCartaPayload,
  UpdateAdminUsuarioPayload,
  UploadCartaAssetsResponse,
  UploadedAsset,
} from "./adminTipos";

export * from "./adminTipos";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ApiErrorResponse = {
  message?: string | string[];
  details?: { messages?: string[]; mensagem?: string }[];
};

export const ADMIN_DATA_CHANGED_EVENT = "animecards:admin-data-changed";

async function adminRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const metodo = (options.method ?? "GET").toUpperCase();
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
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

  if (typeof window !== "undefined" && metodo !== "GET") {
    window.dispatchEvent(new Event(ADMIN_DATA_CHANGED_EVENT));
  }

  return data as T;
}

export function atualizarAdminBoss(boss: AdminBoss) {
  return adminRequest<{ message: string; boss: AdminBoss }>(
    "/admin/campanha/boss",
    { method: "PATCH", body: JSON.stringify(boss) },
  );
}

export function obterAdminDashboard(periodo: PeriodoDashboardAdmin = "7d") {
  return adminRequest<AdminDashboardResumo>(
    `/admin/dashboard?periodo=${encodeURIComponent(periodo)}`,
  );
}

export function obterAdminPityHistorico(limite = 50) {
  return adminRequest<AdminLogPityGacha[]>(
    `/admin/dashboard/pity?limite=${limite}`,
  );
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
  if (filtros.busca?.trim()) params.set("q", filtros.busca.trim());
  if (filtros.raridade) params.set("raridade", filtros.raridade);
  if (filtros.elemento) params.set("elemento", filtros.elemento);
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.classe) params.set("classe", filtros.classe);
  if (filtros.periodo) params.set("periodo", filtros.periodo);
  if (filtros.ordem) params.set("ordem", filtros.ordem);

  const query = params.toString();
  return adminRequest<AdminCarta[]>(`/admin/cartas${query ? `?${query}` : ""}`);
}

export function listarAdminClasses() {
  return adminRequest<AdminClasse[]>("/admin/classes");
}

export function listarAdminRaridades() {
  return adminRequest<AdminRaridade[]>("/admin/raridades");
}

export function criarAdminRaridade(payload: SalvarAdminRaridadePayload) {
  return adminRequest<AdminRaridade[]>("/admin/raridades", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminRaridade(
  codigo: string,
  payload: SalvarAdminRaridadePayload,
) {
  return adminRequest<AdminRaridade[]>(
    `/admin/raridades/${encodeURIComponent(codigo)}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
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

export function listarHistoricoAdminCartas(filtros: {
  pagina: number;
  busca: string;
  acao: string;
}) {
  const params = new URLSearchParams({ pagina: String(filtros.pagina) });
  if (filtros.busca) params.set("busca", filtros.busca);
  if (filtros.acao) params.set("acao", filtros.acao);
  return adminRequest<AdminCartasHistoricoPainel>(
    `/admin/cartas/historico?${params}`,
  );
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

const uploadsRecentes = new Map<string, UploadedAsset>();

async function fingerprintArquivo(arquivo: File) {
  const bytes = await crypto.subtle.digest(
    "SHA-256",
    await arquivo.arrayBuffer(),
  );
  return Array.from(new Uint8Array(bytes), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function uploadCartaAssets(
  formData: FormData,
): Promise<UploadCartaAssetsResponse> {
  const resultado: UploadCartaAssetsResponse = {
    foto: null,
    fotoPerfil: null,
    moldura: null,
  };
  const tipos = ["foto", "fotoPerfil", "moldura"] as const;

  for (const tipo of tipos) {
    const arquivo = formData.get(tipo);
    if (!(arquivo instanceof File)) continue;
    const fingerprint = await fingerprintArquivo(arquivo);
    const chave = `${tipo}:${fingerprint}`;
    const existente = uploadsRecentes.get(chave);
    if (existente) {
      resultado[tipo] = existente;
      continue;
    }
    const assinatura = await adminRequest<{
      cloudName: string;
      apiKey: string;
      folder: string;
      publicId: string;
      timestamp: number;
      overwrite: boolean;
      signature: string;
    }>("/admin/uploads/cartas/assinatura", {
      method: "POST",
      body: JSON.stringify({ tipo, fingerprint }),
    });
    const dados = new FormData();
    dados.append("file", arquivo);
    dados.append("api_key", assinatura.apiKey);
    dados.append("timestamp", String(assinatura.timestamp));
    dados.append("signature", assinatura.signature);
    dados.append("folder", assinatura.folder);
    dados.append("public_id", assinatura.publicId);
    dados.append("overwrite", String(assinatura.overwrite));

    const resposta = await fetch(
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(assinatura.cloudName)}/image/upload`,
      {
        method: "POST",
        body: dados,
      },
    );
    const dadosImagem = await resposta.json().catch(() => null);
    if (!resposta.ok || !dadosImagem?.secure_url) {
      throw new Error(
        dadosImagem?.error?.message ??
          `Não foi possível enviar ${tipo} ao Cloudinary.`,
      );
    }
    const enviado: UploadedAsset = {
      url: dadosImagem.secure_url,
      publicId: dadosImagem.public_id,
      bytes: dadosImagem.bytes,
      width: dadosImagem.width,
      height: dadosImagem.height,
      format: dadosImagem.format,
    };
    resultado[tipo] = enviado;
    if (uploadsRecentes.size >= 50) {
      uploadsRecentes.delete(uploadsRecentes.keys().next().value!);
    }
    uploadsRecentes.set(chave, enviado);
  }

  return resultado;
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

export function criarAdminBanner(payload: SalvarAdminBannerPayload) {
  return adminRequest<{ message: string; id: string }>("/admin/banners", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function atualizarAdminBanner(
  id: string,
  payload: SalvarAdminBannerPayload,
) {
  return adminRequest<{ message: string }>(`/admin/banners/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function removerAdminBanner(id: string) {
  return adminRequest<{ message: string }>(`/admin/banners/${id}`, {
    method: "DELETE",
  });
}

export function obterAdminCampanha() {
  return adminRequest<AdminCampanhaPainel>("/admin/campanha");
}

export function criarTemaExpedicao(nome: string) {
  return adminRequest<{ message: string; tema: { nome: string } }>(
    "/admin/campanha/temas",
    { method: "POST", body: JSON.stringify({ nome }) },
  );
}

export function obterAdminExpedicoes(pagina: number) {
  return adminRequest<AdminExpedicoesPainel>(
    `/admin/campanha/expedicoes?pagina=${pagina}`,
  );
}

export function atualizarAdminCampanha(
  configuracao: Omit<AdminCampanhaConfiguracao, "atualizadoEm">,
) {
  return adminRequest<{
    message: string;
    configuracao: AdminCampanhaConfiguracao;
  }>("/admin/campanha", {
    method: "PATCH",
    body: JSON.stringify(configuracao),
  });
}

export function criarProdutoExpedicao(payload: SalvarProdutoExpedicaoPayload) {
  return adminRequest<{ message: string; produto: AdminProdutoExpedicao }>(
    "/admin/campanha/produtos",
    { method: "POST", body: JSON.stringify(payload) },
  );
}

export function atualizarProdutoExpedicao(
  id: string,
  payload: SalvarProdutoExpedicaoPayload,
) {
  return adminRequest<{ message: string; produto: AdminProdutoExpedicao }>(
    `/admin/campanha/produtos/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function excluirProdutoExpedicao(id: string) {
  return adminRequest<{ message: string }>(`/admin/campanha/produtos/${id}`, {
    method: "DELETE",
  });
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
  filtros: { busca?: string; status?: string; limite?: number } = {},
) {
  const params = new URLSearchParams();
  if (filtros.busca?.trim()) params.set("q", filtros.busca.trim());
  if (filtros.status) params.set("status", filtros.status);
  if (filtros.limite) params.set("limite", String(filtros.limite));
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

export function removerAdminUsuario(id: string, confirmarNome: string) {
  return adminRequest<{ message: string }>(`/admin/usuarios/${id}`, {
    method: "DELETE",
    body: JSON.stringify({ confirmarNome, confirmarImpacto: true }),
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

export function obterExpedicoesAdminUsuario(id: string, pagina = 1) {
  return adminRequest<AdminUsuarioExpedicoesPagina>(
    `/admin/usuarios/${id}/expedicoes?pagina=${pagina}`,
  );
}

export function obterLogLutaAdminUsuario(
  id: string,
  idExpedicao: string,
  idLuta: string,
) {
  return adminRequest<AdminUsuarioLogLuta>(
    `/admin/usuarios/${id}/expedicoes/${idExpedicao}/lutas/${idLuta}`,
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
