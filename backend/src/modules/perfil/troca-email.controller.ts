import { Body, Controller, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ConfirmarTrocaEmailDto } from './dto/confirmar-troca-email.dto';
import { PerfilService } from './perfil.service';

@Controller('perfil')
export class TrocaEmailController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post('confirmar-troca-email')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  confirmar(@Body() dto: ConfirmarTrocaEmailDto) {
    return this.perfilService.confirmarTrocaEmail(dto.token);
  }
}
