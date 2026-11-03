import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { AtualizarAdminRaridadeDto, CriarAdminRaridadeDto } from '../dto/admin-raridade.dto';
import { AdminRaridadesService } from '../services/admin-raridades.service';

@Controller('admin/raridades')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminRaridadesController {
  constructor(private readonly raridadesService: AdminRaridadesService) {}

  @Get()
  listar() { return this.raridadesService.listar(); }

  @Post()
  criar(@Body() dto: CriarAdminRaridadeDto) { return this.raridadesService.criar(dto); }

  @Patch(':codigo')
  atualizar(@Param('codigo') codigo: string, @Body() dto: AtualizarAdminRaridadeDto) {
    return this.raridadesService.atualizar(codigo, dto);
  }
}
