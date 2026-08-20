import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CreateAdminHabilidadeDto } from '../dto/admin-habilidade.dto';
import { AdminHabilidadesService } from '../services/admin-habilidades.service';

@Controller('admin/habilidades')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminHabilidadesController {
  constructor(private readonly habilidadesService: AdminHabilidadesService) {}

  @Get()
  listar(
    @Query('q') busca?: string,
    @Query('tipoEfeito') tipoEfeito?: string,
    @Query('status') status?: string,
  ) {
    return this.habilidadesService.listar({ busca, tipoEfeito, status });
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.habilidadesService.buscar(id);
  }

  @Post()
  criar(@Body() dto: CreateAdminHabilidadeDto) {
    return this.habilidadesService.criar(dto);
  }
}
