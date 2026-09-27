import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  AtualizarAdminCampanhaDto,
  AtualizarBossDto,
} from '../dto/admin-campanha.dto';
import { AdminCampanhaService } from '../services/admin-campanha.service';

@Controller('admin/campanha')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCampanhaController {
  constructor(private readonly campanhaService: AdminCampanhaService) {}

  @Get()
  obterPainel() {
    return this.campanhaService.obterPainel();
  }

  @Patch()
  atualizar(@Body() dto: AtualizarAdminCampanhaDto) {
    return this.campanhaService.atualizar(dto);
  }

  @Patch('boss')
  atualizarBoss(@Body() dto: AtualizarBossDto) {
    return this.campanhaService.atualizarBoss(dto);
  }
}
