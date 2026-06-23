import {
  Controller,
  Get,
  Query,
  Res,
  ServiceUnavailableException,
  UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { GoogleOAuthService } from './google-oauth.service';

@Controller('perfil/google')
export class GoogleOAuthController {
  constructor(private readonly googleOAuthService: GoogleOAuthService) {}

  @UseGuards(JwtAuthGuard)
  @Get('url')
  gerarUrl(@CurrentUser() usuario: AuthenticatedUser) {
    return this.googleOAuthService.gerarUrlVinculo(usuario.id);
  }

  @Get('callback')
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Res() response: Response,
  ) {
    if (!code || !state) {
      throw new ServiceUnavailableException('Resposta OAuth incompleta.');
    }

    await this.googleOAuthService.processarCallback(code, state);
    const frontendUrl = process.env.FRONTEND_URL ?? 'http://localhost:3000';
    response.redirect(`${frontendUrl}/perfil?google=vinculado`);
  }
}
