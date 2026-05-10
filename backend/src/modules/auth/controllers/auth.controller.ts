import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
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

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() dto: RegisterDto) {
    return this.authService.registrar(dto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verificarEmail(dto);
  }

  @Post('reenviar-verificacao')
  async reenviarVerificacao(@Body() dto: ReenviarVerificacaoDto) {
    return this.authService.reenviarVerificacao(dto);
  }

  @Post('solicitar-redefinicao-senha')
  async solicitarRedefinicaoSenha(@Body() dto: SolicitarRedefinicaoSenhaDto) {
    return this.authService.solicitarRedefinicaoSenha(dto);
  }

  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: RedefinirSenhaDto) {
    return this.authService.redefinirSenha(dto);
  }

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@CurrentUser() usuario: AuthenticatedUser) {
    return this.authService.buscarPerfil(usuario.id);
  }
}
