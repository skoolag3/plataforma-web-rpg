import type { Response } from 'express';

export const NOME_COOKIE_SESSAO = 'animecards_session';

const opcoesCookie = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: 24 * 60 * 60 * 1000,
};

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
