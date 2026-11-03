import { Controller, Get, Query, Req, Res, UseGuards } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  definirCookieOAuthNonce,
  definirCookieSessao,
  extrairCookie,
  NOME_COOKIE_OAUTH_NONCE,
  removerCookieOAuthNonce,
} from '../auth/auth-cookie';
import { GoogleOAuthService } from './google-oauth.service';

@Controller('perfil/google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @Get('url-login')
  gerarUrlLogin(@Res({ passthrough: true }) response: Response) {
    const { url, nonce } = this.googleOAuthService.gerarUrlLogin();
    definirCookieOAuthNonce(response, nonce);
    return { url };
  }

  @UseGuards(JwtAuthGuard)
  @Get('url')
  gerarUrl(
    @CurrentUser() usuario: AuthenticatedUser,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { url, nonce } = this.googleOAuthService.gerarUrlVinculo(usuario.id);
    definirCookieOAuthNonce(response, nonce);
    return { url };
  }

  @Get('callback')
  async callback(
    @Query('code') code: string | undefined,
    @Query('state') state: string | undefined,
    @Query('error') erroOAuth: string | undefined,
    @Req() request: Request,
    @Res() response: Response,
  ) {
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    const callbackFrontend = `${frontendUrl}/login/google-callback`;
    const nonceCookie = extrairCookie(request, NOME_COOKIE_OAUTH_NONCE);
    removerCookieOAuthNonce(response);

    if (erroOAuth) {
      const motivo = erroOAuth === 'access_denied' ? 'cancelado' : 'oauth';
      response.redirect(`${callbackFrontend}#error=${motivo}`);
      return;
    }

    if (!code || !state) {
      response.redirect(`${callbackFrontend}#error=incompleto`);
      return;
    }

    let resultado: Awaited<ReturnType<GoogleOAuthService['processarCallback']>>;
    try {
      resultado = await this.googleOAuthService.processarCallback(
        code,
        state,
        nonceCookie,
      );
    } catch {
      response.redirect(`${callbackFrontend}#error=oauth`);
      return;
    }

    if (resultado.finalidade === 'LOGIN_GOOGLE') {
      definirCookieSessao(response, resultado.sessao.access_token);
      response.redirect(`${frontendUrl}/login/google-callback#success=1`);
      return;
    }

    response.redirect(`${frontendUrl}/perfil?google=vinculado`);
  }
}
