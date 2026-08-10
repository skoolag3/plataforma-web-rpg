import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { UpdateAdminUsuarioDto } from '../dto/admin-usuario.dto';
import { AdminUsuariosService } from '../services/admin-usuarios.service';

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsuariosController {
  constructor(private readonly usuariosService: AdminUsuariosService) { }

  @Get()
  listar(@Query('q') busca?: string, @Query('status') status?: string) {
    return this.usuariosService.listar({ busca, status });
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.usuariosService.buscar(id);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateAdminUsuarioDto) {
    return this.usuariosService.atualizar(id, dto);
  }
}
