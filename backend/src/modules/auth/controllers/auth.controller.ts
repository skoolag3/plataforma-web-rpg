import { Body, Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { LoginDto } from '../dto/login.dto';
import { RedefinirSenhaDto } from '../dto/redefinir-senha.dto';
import { RegisterDto } from '../dto/register.dto';
import { ReenviarVerificacaoDto } from '../dto/reenviar-verificacao.dto';
import { SolicitarRedefinicaoSenhaDto } from '../dto/solicitar-redefinicao-senha.dto';
import { VerifyEmailDto } from '../dto/verify-email.dto';
import { AuthService } from '../services/auth.service';
import { definirCookieSessao, removerCookieSessao } from '../auth-cookie';
import { extrairJwt } from '../strategies/jwt.strategy';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async register(@Body() dto: RegisterDto) {
    return this.authService.registrar(dto);
  }

  @Post('verify-email')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verificarEmail(dto);
  }

  @Post('reenviar-verificacao')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async reenviarVerificacao(@Body() dto: ReenviarVerificacaoDto) {
    return this.authService.reenviarVerificacao(dto);
  }

  @Post('solicitar-redefinicao-senha')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async solicitarRedefinicaoSenha(@Body() dto: SolicitarRedefinicaoSenhaDto) {
    return this.authService.solicitarRedefinicaoSenha(dto);
  }

  @Post('redefinir-senha')
  @Throttle({ default: { limit: 4, ttl: 60_000 } })
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto);
  }

  @Post('login')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const sessao = await this.authService.login(dto);
    definirCookieSessao(res, sessao.access_token);
    return { usuario: sessao.usuario };
  }

  @Post('logout')
  logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    this.authService.revogarTokenSessao(extrairJwt(req));
    removerCookieSessao(res);
    return { message: 'Sessão encerrada.' };
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() usuario: AuthenticatedUser) {
    return this.authService.buscarPerfil(usuario.id);
  }
}
