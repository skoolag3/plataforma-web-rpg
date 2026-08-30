import { Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LojaService } from './loja.service';

@Controller('loja')
export class LojaController {
  constructor(private readonly service: LojaService) {}
  @Get('pacotes') pacotes() { return this.service.pacotes(); }
  @UseGuards(JwtAuthGuard)
  @Post('checkout/:idPacote') checkout(@CurrentUser() usuario: AuthenticatedUser, @Param('idPacote') idPacote: string) { return this.service.criarCheckout(usuario.id, idPacote); }
  @Post('stripe/webhook') webhook(@Req() req: Request, @Headers('stripe-signature') assinatura?: string) { return this.service.webhook((req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(''), assinatura); }
}
