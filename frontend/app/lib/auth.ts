"use client";

export type Usuario = {
  id: string;
  nome: string;
  email: string;
  is_admin?: boolean | null;
  nivel?: number | null;
  pontos_experiencia?: number | null;
  saldo_rubys_cache?: number | null;
};

type AuthResponse = {
  usuario: Usuario;
  access_token: string;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "card_game_rpg_token";
const USER_KEY = "card_game_rpg_user";
const AUTH_EVENT = "card_game_rpg_auth_change";

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const message =
      typeof data?.message === "string"
        ? data.message
        : "Nao foi possivel concluir a solicitacao.";
    throw new Error(message);
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
  const data = await request<AuthResponse>("/auth/register", {
    method: "POST",
    body: JSON.stringify({ nome, email, senha }),
  });

  saveSession(data);
  return data;
}

export async function getProfile(token: string) {
  return request<Usuario>("/auth/me", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function saveSession(data: AuthResponse) {
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
