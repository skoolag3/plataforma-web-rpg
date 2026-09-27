import { Body, Controller, Post } from '@nestjs/common';
import { ConfirmarTrocaEmailDto } from './dto/confirmar-troca-email.dto';
import { PerfilService } from './perfil.service';

@Controller('perfil')
export class TrocaEmailController {
  constructor(private readonly perfilService: PerfilService) {}

  @Post('confirmar-troca-email')
  confirmar(@Body() dto: ConfirmarTrocaEmailDto) {
    return this.perfilService.confirmarTrocaEmail(dto.token);
  }
}
