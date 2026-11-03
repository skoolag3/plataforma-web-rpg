"use client";

import { clearSession, getToken } from "./auth";
import type { ConfigVisualCarta } from "../components/cartaMontada";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

type ApiErrorResponse = {
  message?: string | string[];
  details?: { messages?: string[]; mensagem?: string }[];
};

export type TipoEfeitoHabilidade =
  | "BUFF"
  | "DEBUFF"
  | "DANO"
  | "CURA"
  | "ESCUDO"
  | "ROUBO_VIDA"
  | "EVASAO"
  | "CRITICO";

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
  requisitoTipo: "NENHUM" | "CHANCE" | "CONTADOR_ATAQUES" | "HP_ABAIXO" | "TURNO_MINIMO" | "INTERVALO_TURNOS";
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
  criticoAtivou?: boolean;
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
  raridade: string;
  classe: string | null;
  idClasse: string | null;
  classeDetalhes: AdminClasse | null;
  custo: number | null;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  passiva: Record<string, unknown>;
  foto: string | null;
  fotoPerfil: string | null;
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
  fotoPerfil?: string;
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

export type AdminCartaHistorico = {
  id: string;
  idCarta: string;
  nomeCarta: string;
  acao: 'CRIADA' | 'ALTERADA' | 'REMOVIDA' | 'RESTAURADA';
  alteracoes: Record<string, { antes: unknown; depois: unknown }> | null;
  criadoEm: string;
  autor: { nome: string; email: string } | null;
};

export type AdminCartasHistoricoPainel = {
  registros: AdminCartaHistorico[];
  paginacao: { pagina: number; porPagina: number; total: number; totalPaginas: number };
};

export type AdminClasse = {
  id: string;
  nome: string;
  descricao: string | null;
  prioridadeAtaque: number;
  ativo: boolean;
  totalCartas: number;
};

export type SalvarAdminClassePayload = {
  nome: string;
  descricao?: string;
  prioridadeAtaque: number;
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
  molduraClasse?: string;
  molduraUrl?: string | null;
  molduraConfig?: ConfigVisualCarta | null;
};

export type UpdateAdminUsuarioPayload = {
  nome?: string;
  nivel?: number;
  ativo?: boolean;
  bloqueado?: boolean;
  emailVerificado?: boolean;
  admin?: boolean;
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

export type AdminUsuarioExpedicao = {
  id: string;
  deck: string;
  status: string;
  etapaAtual: number;
  rubys: number;
  criadoEm: string;
  finalizadoEm: string | null;
  lutas: AdminUsuarioLuta[];
};

export type AdminUsuarioLuta = {
  id: string;
  etapa: number | null;
  resultado: string;
  turnos: number;
  rubys: number;
  iniciadoEm: string | null;
  finalizadoEm: string | null;
};

export type AdminUsuarioLogLuta = AdminUsuarioLuta & {
  eventos: {
    id: string;
    sequencia: number;
    turno: number;
    tipo: string;
    origem: string | null;
    texto: string;
    valor: number | null;
    criadoEm: string;
  }[];
};

export type AdminUsuarioExpedicoesPagina = {
  itens: AdminUsuarioExpedicao[];
  total: number;
  pagina: number;
  porPagina: number;
  totalPaginas: number;
};

export type AjusteSaldoUsuarioPayload = {
  rubys: number;
  motivo: string;
};

export type PeriodoDashboardAdmin = "7d" | "30d" | "tudo";

export type AdminDashboardResumo = {
  periodo: PeriodoDashboardAdmin;
  metricas: {
    usuarios: number;
    usuariosAtivos: number;
    usuariosBloqueados: number;
    usuariosNaoVerificados: number;
    usuariosNovosPeriodo: number;
    usuariosLoginPeriodo: number;
    cartas: number;
    cartasAtivas: number;
    partidas: number;
    partidasPeriodo: number;
    rubysEmCirculacao: number;
  };
  combate: {
    partidasPeriodo: number;
    vitorias: number;
    derrotas: number;
    abandonosPartida: number;
    taxaVitoria: number;
    mediaTurnos: number;
    rubysRecompensados: number;
    expedicoes: {
      total: number;
      ativas: number;
      concluidas: number;
      falhas: number;
      abandonadas: number;
      taxaConclusao: number;
    };
  };
  economia: {
    rubysEmCirculacao: number;
    rubysEmitidosPeriodo: number;
    rubysConsumidosPeriodo: number;
    saldoLiquidoPeriodo: number;
    girosGachaPeriodo: number;
    rubysGastosGachaPeriodo: number;
    pityMedio: number;
    comprasPagasPeriodo: number;
    receitaBrlPeriodo: number;
    bannersMaisGirados: {
      id: string;
      nome: string;
      ativo: boolean;
      giros: number;
      rubysGastos: number;
    }[];
  };
  saudeCatalogo: {
    cartasSemHabilidade: number;
    nomesSemHabilidade?: string[];
    cartasForaDeBanner: number;
    nomesForaDeBanner?: string[];
    habilidadesRascunho: number;
    nomesSkillsRascunho?: string[];
    habilidadesNaoTestadas: number;
    bannersAtivos: number;
    noticiasPublicadas: number;
    noticiasRascunho: number;
  };
  alertas: {
    id: string;
    severidade: "critico" | "atencao" | "ok";
    pergunta: string;
    resposta: string;
    acaoLabel: string;
    href: string;
  }[];
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
    elemento?: string;
    quantidade: number;
  }[];
  topDecks: {
    id: string | null;
    nome: string;
    raridade: string;
    elemento?: string;
    decks: number;
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
  fotoPerfil: UploadedAsset | null;
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
  cartas: Pick<AdminCarta, "id" | "nome" | "raridade" | "elemento">[];
  raridades: { raridade: string; total: number }[];
  chances: { raridade: string; percentual: number }[];
  pities: { raridade: string; limite: number }[];
  inicioEm: string | null;
  fimEm: string | null;
};

export type SalvarAdminBannerPayload = {
  nome: string;
  custoGiro: number;
  ativo: boolean;
  cartasIds: string[];
  chances: { raridade: string; percentual: number }[];
  pities: { raridade: string; limite: number }[];
  inicioEm: string | null;
  fimEm: string | null;
};

export type AdminBannersResponse = {
  probabilidades: ProbabilidadeGacha[];
  raridadesDisponiveis: { codigo: string; nome: string; cor: string }[];
  rotacao: {
    bannerAtualId: string;
    proximaRotacaoEm: string | null;
    forcadoPorAdmin: boolean;
  } | null;
  banners: AdminBanner[];
};

export type AdminCampanhaConfiguracao = {
  ativa: boolean;
  recompensaFacil: number;
  recompensaMedia: number;
  recompensaDificil: number;
  recompensaChefe: number;
  percentualMantidoDerrota: number;
  atualizadoEm: string;
};

export type AdminCampanhaPainel = {
  configuracao: AdminCampanhaConfiguracao;
  boss: AdminBoss;
  produtos: AdminProdutoExpedicao[];
  temas: { nome: string }[];
  cartas: { id: string; nome: string }[];
};

export type CaminhoCampanha = {
  dificuldade: "FACIL" | "MEDIA" | "DIFICIL";
  recompensa: number;
    cartas: string[];
    quantidadeCartas?: number;
    modoCartas?: "ALEATORIO" | "MANUAL";
    mixed?: boolean;
  titulo?: string;
  descricao?: string;
};

export type SecaoCampanha =
  | { tipo: "BATALHA"; caminhos: CaminhoCampanha[]; grupo?: number; percentualMantidoDerrota?: number }
  | { tipo: "BOSS"; percentualMantidoDerrota?: number };

export type AdminExpedicoesPainel = {
  metricas: {
    total: number;
    ativas: number;
    concluidas: number;
    falhas: number;
    abandonadas: number;
  };
  paginacao: {
    pagina: number;
    porPagina: number;
    total: number;
    totalPaginas: number;
  };
  expedicoes: {
    id: string;
    jogador: string;
    email: string;
    deck: string;
    status: string;
    etapaAtual: number;
    rubys: number;
    criadoEm: string;
    finalizadoEm: string | null;
  }[];
};

export type AdminProdutoExpedicao = {
  id: string;
  nome: string;
  descricao: string;
  tema: string;
  tipo: "RECORRENTE" | "EVENTO";
  ativo: boolean;
  peso: number;
  inicioEm: string | null;
  fimEm: string | null;
  recompensaFacil: number;
  recompensaMedia: number;
  recompensaDificil: number;
  recompensaChefe: number;
  percentualMantidoDerrota: number;
  bossNome: string;
  bossPersonalidade: string;
  bossProvocacao: string;
  bossPerguntas: string[];
  bossCartas: string[];
  secoes: SecaoCampanha[];
  criadoEm: string;
  atualizadoEm: string;
};

export type SalvarProdutoExpedicaoPayload = Omit<
  AdminProdutoExpedicao,
  "id" | "criadoEm" | "atualizadoEm"
>;

export type AdminBoss = {
  nome: string;
  personalidade: string;
  provocacao: string;
  perguntas: string[];
  cartas: string[];
};

export function atualizarAdminBoss(boss: AdminBoss) {
  return adminRequest<{ message: string; boss: AdminBoss }>(
    "/admin/campanha/boss",
    { method: "PATCH", body: JSON.stringify(boss) },
  );
}

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

export function obterAdminDashboard(periodo: PeriodoDashboardAdmin = "7d") {
  return adminRequest<AdminDashboardResumo>(
    `/admin/dashboard?periodo=${encodeURIComponent(periodo)}`,
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

export type AdminRaridade = {
  codigo: string;
  nome: string;
  valorVenda: number;
  cor: string;
  ordem: number;
  totalCartas: number;
};

export type SalvarAdminRaridadePayload = { nome: string; valorVenda: number; cor: string };

export function listarAdminRaridades() {
  return adminRequest<AdminRaridade[]>("/admin/raridades");
}

export function criarAdminRaridade(payload: SalvarAdminRaridadePayload) {
  return adminRequest<AdminRaridade[]>("/admin/raridades", { method: "POST", body: JSON.stringify(payload) });
}

export function atualizarAdminRaridade(codigo: string, payload: SalvarAdminRaridadePayload) {
  return adminRequest<AdminRaridade[]>(`/admin/raridades/${encodeURIComponent(codigo)}`, { method: "PATCH", body: JSON.stringify(payload) });
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

export function listarHistoricoAdminCartas(filtros: { pagina: number; busca: string; acao: string }) {
  const params = new URLSearchParams({ pagina: String(filtros.pagina) });
  if (filtros.busca) params.set('busca', filtros.busca);
  if (filtros.acao) params.set('acao', filtros.acao);
  return adminRequest<AdminCartasHistoricoPainel>(`/admin/cartas/historico?${params}`);
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
  return adminRequest<AdminExpedicoesPainel>(`/admin/campanha/expedicoes?pagina=${pagina}`);
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

export function atualizarProdutoExpedicao(id: string, payload: SalvarProdutoExpedicaoPayload) {
  return adminRequest<{ message: string; produto: AdminProdutoExpedicao }>(
    `/admin/campanha/produtos/${id}`,
    { method: "PATCH", body: JSON.stringify(payload) },
  );
}

export function excluirProdutoExpedicao(id: string) {
  return adminRequest<{ message: string }>(`/admin/campanha/produtos/${id}`, { method: "DELETE" });
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
  return adminRequest<AdminUsuarioExpedicoesPagina>(`/admin/usuarios/${id}/expedicoes?pagina=${pagina}`);
}

export function obterLogLutaAdminUsuario(id: string, idExpedicao: string, idLuta: string) {
  return adminRequest<AdminUsuarioLogLuta>(`/admin/usuarios/${id}/expedicoes/${idExpedicao}/lutas/${idLuta}`);
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
