import type { Request, Response } from 'express';

export const NOME_COOKIE_SESSAO = 'animecards_session';
export const NOME_COOKIE_OAUTH_NONCE = 'elusivedeck_oauth_nonce';

const opcoesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

const opcoesCookieOAuth = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 10 * 60 * 1000,
};

export function extrairCookie(request: Request, nome: string): string | null {
  const cookies = request.headers.cookie?.split(';') ?? [];
  const prefixo = `${nome}=`;
  const cookie = cookies.find((item) => item.trim().startsWith(prefixo));
  return cookie
    ? decodeURIComponent(cookie.trim().slice(prefixo.length))
    : null;
}

export function definirCookieSessao(response: Response, token: string) {
  response.cookie(NOME_COOKIE_SESSAO, token, opcoesCookie);
}

export function removerCookieSessao(response: Response) {
  response.clearCookie(NOME_COOKIE_SESSAO, {
    httpOnly: true,
    secure: opcoesCookie.secure,
    sameSite: opcoesCookie.sameSite,
    path: opcoesCookie.path,
  });
}

export function definirCookieOAuthNonce(response: Response, nonce: string) {
  response.cookie(NOME_COOKIE_OAUTH_NONCE, nonce, opcoesCookieOAuth);
}

export function removerCookieOAuthNonce(response: Response) {
  response.clearCookie(NOME_COOKIE_OAUTH_NONCE, {
    httpOnly: true,
    secure: opcoesCookieOAuth.secure,
    sameSite: opcoesCookieOAuth.sameSite,
    path: opcoesCookieOAuth.path,
  });
}
