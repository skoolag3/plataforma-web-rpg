"use client";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  email_verificado?: boolean;
  bloqueado?: boolean | null;
  tentativas_login?: number | null;
  is_admin?: boolean | null;
  nivel?: number | null;
  pontos_experiencia?: number | null;
  saldo_rubys_cache?: number | null;
  criado_em?: string | null;
  atualizado_em?: string | null;
  excluido_em?: string | null;
  token_verificacao_expira_em?: string | null;
  token_redefinicao_expira_em?: string | null;
};

type AuthResponse = {
  usuario: Usuario;
  access_token?: string;
  message?: string;
};

type MessageResponse = {
  message: string;
  usuario?: Usuario;
};

type ApiErrorDetail = {
  field?: string;
  messages?: string[];
};

type ApiErrorResponse = {
  statusCode?: number;
  message?: string | string[];
  details?: ApiErrorDetail[];
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "/api";
const TOKEN_KEY = "card_game_rpg_token";
const USER_KEY = "card_game_rpg_user";
const AUTH_EVENT = "card_game_rpg_auth_change";

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(formatApiError(data));
  }

  return data as T;
}

export async function login(email: string, senha: string) {
  const data = await request<AuthResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, senha }),
  });

  saveSession(data);
  return data;
}

export async function register(nome: string, email: string, senha: string) {
  return request<MessageResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nome, email, senha }),
  });
}

export async function verifyEmail(token: string) {
  return request<MessageResponse>("/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export async function reenviarVerificacao(email: string) {
  return request<MessageResponse>("/auth/reenviar-verificacao", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function solicitarRedefinicaoSenha(email: string) {
  return request<MessageResponse>("/auth/solicitar-redefinicao-senha", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export async function redefinirSenha(token: string, senha: string) {
  return request<MessageResponse>("/auth/redefinir-senha", {
    method: "POST",
    body: JSON.stringify({ token, senha }),
  });
}

export async function getProfile(token: string) {
  return request<Usuario>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function saveSession(data: AuthResponse) {
  if (!data.access_token) {
    return;
  }

  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
  notifyAuthChange();
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser() {
  const storedUser = localStorage.getItem(USER_KEY);

  if (!storedUser) {
    return null;
  }

  try {
    return JSON.parse(storedUser) as Usuario;
  } catch {
    clearSession();
    return null;
  }
}

export function clearSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  notifyAuthChange();
}

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(getToken() && getStoredUser());
}

export function subscribeAuthChange(callback: () => void) {
  window.addEventListener(AUTH_EVENT, callback);
  window.addEventListener("storage", callback);

  return () => {
    window.removeEventListener(AUTH_EVENT, callback);
    window.removeEventListener("storage", callback);
  };
}

function notifyAuthChange() {
  window.dispatchEvent(new Event(AUTH_EVENT));
}

function formatApiError(data: ApiErrorResponse | null) {
  const fallback = "Nao foi possivel concluir a solicitacao.";

  if (!data) {
    return fallback;
  }

  const message = Array.isArray(data.message)
    ? data.message.join(" ")
    : data.message;

  const details = data.details
    ?.flatMap(
      (detail) => detail.messages?.map((detailMessage) => detailMessage) ?? [],
    )
    .filter(Boolean);

  if (details?.length) {
    return details.join("\n");
  }

  return message ?? fallback;
}
