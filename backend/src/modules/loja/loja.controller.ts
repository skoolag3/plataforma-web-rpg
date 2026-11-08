import {
  Controller,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { LojaService } from './loja.service';

@Controller('loja')
export class LojaController {
  constructor(private readonly service: LojaService) {}
  @Get('pacotes') pacotes() {
    return this.service.pacotes();
  }
  @UseGuards(JwtAuthGuard)
  @Post('checkout/:idPacote')
  checkout(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('idPacote', ParseUUIDPipe) idPacote: string,
    @Headers('origin') origin?: string,
    @Headers('referer') referer?: string,
  ) {
    return this.service.criarCheckout(usuario.id, idPacote, origin ?? referer);
  }
  @UseGuards(JwtAuthGuard)
  @Post('confirmar/:sessionId')
  confirmar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.confirmarSessaoCheckout(usuario.id, sessionId);
  }
  @Post('stripe/webhook') webhook(
    @Req() req: Request,
    @Headers('stripe-signature') assinatura?: string,
  ) {
    return this.service.webhook(
      (req as Request & { rawBody?: Buffer }).rawBody ?? Buffer.from(''),
      assinatura,
    );
  }
}
