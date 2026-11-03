import type { ConfigVisualCarta } from "../components/cartaMontada";

export type PreferenciasConta = {
  receberNotificacoes: boolean;
  mostrarNoRanking: boolean;
  ocultarHistorico: boolean;
};

export type PerfilConta = {
  user: string;
  email: string;
  nivel: number;
  idUser: string;
  biografia: string;
  moldura: string;
  molduraClasse: string;
  molduraUrl?: string | null;
  molduraConfig?: ConfigVisualCarta | null;
  avatarUrl?: string | null;
  bannerUrl?: string | null;
  googleVinculado: boolean;
  googleConfigurado: boolean;
  storageConfigurado: boolean;
  vitorias: number;
  derrotas: number;
  ranking: number;
  cartasObtidas: number;
  totalCartas: number;
  decksCriados: number;
  partidasJogadas: number;
  rubys: number;
  ultimoLogin: string;
  exclusaoAgendadaPara: string | null;
  preferencias: PreferenciasConta;
};

export type MolduraConta = {
  id: string;
  nome: string;
  descricao?: string | null;
  classeCss: string;
  imagemUrl?: string | null;
  configVisual?: ConfigVisualCarta | null;
  requisito?: string | null;
  obtida: boolean;
};

export type FotoCartaPerfil = { id: string; nome: string; fotoUrl: string };

export type PerfilPublico = {
  id: string;
  nome: string;
  biografia: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  moldura: string;
  molduraClasse: string;
  molduraUrl: string | null;
  molduraConfig: ConfigVisualCarta | null;
  pontos: number;
  partidas: number;
  vitorias: number;
  derrotas: number;
  cartasObtidas: number;
  totalCartas: number;
  decksCriados: number;
  historicoOculto: boolean;
  historico: Array<{
    id: string;
    resultado: "VITORIA" | "DERROTA" | "EMPATE";
    turnos_jogados: number;
    variacao_pontos: number | null;
    timestamp_inicio: string | null;
    deck: { nome: string } | null;
  }>;
};

export function buscarPerfilPublicoApi(token: string, idUsuario: string) {
  return requisicaoPerfil<PerfilPublico>(token, `/perfil/publico/${encodeURIComponent(idUsuario)}`);
}

export function listarFotosCartasApi(token: string) {
  return requisicaoPerfil<FotoCartaPerfil[]>(token, "/perfil/fotos-cartas");
}

export function selecionarFotoCartaApi(token: string, idCarta: string) {
  return requisicaoPerfil<RespostaMensagem & { avatarUrl: string | null }>(token, "/perfil/foto-carta", {
    method: "PATCH",
    body: JSON.stringify({ idCarta }),
  });
}

type RespostaMensagem = {
  message: string;
};

type RespostaNome = RespostaMensagem & {
  nome: string;
};

type RespostaEmail = RespostaMensagem & {
  emailPendente: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";

async function requisicaoPerfil<T>(
  token: string,
  caminho: string,
  opcoes: RequestInit = {},
): Promise<T> {
  const resposta = await fetch(`${API_URL}${caminho}`, {
    ...opcoes,
    credentials: "include",
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...opcoes.headers,
    },
  });
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    const mensagem =
      dados && typeof dados.message === "string"
        ? dados.message
        : "Não foi possível concluir a alteração.";
    throw new Error(mensagem);
  }

  return dados as T;
}

export function buscarPerfilApi(token: string) {
  return requisicaoPerfil<PerfilConta>(token, "/perfil");
}

export function atualizarNomeApi(token: string, nome: string) {
  return requisicaoPerfil<RespostaNome>(token, "/perfil/nome", {
    method: "PATCH",
    body: JSON.stringify({ nome }),
  });
}

export function atualizarEmailApi(
  token: string,
  email: string,
  senhaAtual: string,
) {
  return requisicaoPerfil<RespostaEmail>(token, "/perfil/email", {
    method: "PATCH",
    body: JSON.stringify({ email, senhaAtual }),
  });
}

export function atualizarSenhaApi(
  token: string,
  senhaAtual: string,
  novaSenha: string,
  confirmarSenha: string,
) {
  return requisicaoPerfil<RespostaMensagem>(token, "/perfil/senha", {
    method: "PATCH",
    body: JSON.stringify({ senhaAtual, novaSenha, confirmarSenha }),
  });
}

export function atualizarPreferenciasApi(
  token: string,
  preferencias: PreferenciasConta,
) {
  return requisicaoPerfil<
    RespostaMensagem & { preferencias: PreferenciasConta }
  >(token, "/perfil/preferencias", {
    method: "PATCH",
    body: JSON.stringify(preferencias),
  });
}

export function atualizarBiografiaApi(token: string, biografia: string) {
  return requisicaoPerfil<
    RespostaMensagem & { biografia: string }
  >(token, "/perfil/biografia", {
    method: "PATCH",
    body: JSON.stringify({ biografia }),
  });
}

export function listarMoldurasApi(token: string) {
  return requisicaoPerfil<MolduraConta[]>(token, "/perfil/molduras");
}

export function selecionarMolduraApi(token: string, idMoldura: string) {
  return requisicaoPerfil<
    RespostaMensagem & {
      moldura: string;
      molduraClasse: string;
      molduraUrl?: string | null;
      molduraConfig?: ConfigVisualCarta | null;
    }
  >(token, "/perfil/moldura", {
    method: "PATCH",
    body: JSON.stringify({ idMoldura }),
  });
}

export async function enviarImagemPerfilApi(
  token: string,
  tipo: "avatar" | "banner",
  arquivo: File,
) {
  const dados = new FormData();
  dados.append("arquivo", arquivo);
  const resposta = await fetch(`${API_URL}/perfil/${tipo}`, {
    method: "POST",
    credentials: "include",
    headers: { Authorization: `Bearer ${token}` },
    body: dados,
  });
  const corpo = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(corpo?.message ?? "Não foi possível enviar a imagem.");
  }

  return corpo as RespostaMensagem & { url: string };
}

export function obterUrlGoogleApi(token: string) {
  return requisicaoPerfil<{ url: string }>(token, "/perfil/google/url");
}

export function desativarContaApi(token: string, senhaAtual: string) {
  return requisicaoPerfil<RespostaMensagem>(token, "/perfil/desativar", {
    method: "PATCH",
    body: JSON.stringify({ senhaAtual }),
  });
}

export function solicitarExclusaoApi(token: string, senhaAtual: string) {
  return requisicaoPerfil<RespostaMensagem & { executarApos: string }>(
    token,
    "/perfil/exclusao",
    {
      method: "POST",
      body: JSON.stringify({ senhaAtual }),
    },
  );
}

export function cancelarExclusaoApi(token: string) {
  return requisicaoPerfil<RespostaMensagem>(token, "/perfil/exclusao/cancelar", {
    method: "PATCH",
  });
}

export async function confirmarTrocaEmailApi(token: string) {
  const resposta = await fetch(`${API_URL}/perfil/confirmar-troca-email`, {
    credentials: "include",
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  const dados = await resposta.json().catch(() => null);

  if (!resposta.ok) {
    throw new Error(
      dados?.message ?? "Não foi possível confirmar a troca de e-mail.",
    );
  }

  return dados as RespostaMensagem;
}
