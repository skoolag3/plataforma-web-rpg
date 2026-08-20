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
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import {
  AjustarColecaoUsuarioDto,
  AjustarSaldoUsuarioDto,
  UpdateAdminUsuarioDto,
} from '../dto/admin-usuario.dto';
import { AdminUsuariosService } from '../services/admin-usuarios.service';

@Controller('admin/usuarios')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminUsuariosController {
  constructor(private readonly usuariosService: AdminUsuariosService) {}

  @Get()
  listar(@Query('q') busca?: string, @Query('status') status?: string) {
    return this.usuariosService.listar({ busca, status });
  }

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.usuariosService.buscar(id);
  }

  @Get(':id/colecao')
  buscarColecao(@Param('id') id: string) {
    return this.usuariosService.buscarColecao(id);
  }

  @Get(':id/atividade')
  buscarAtividade(@Param('id') id: string, @Query('limite') limite?: string) {
    return this.usuariosService.buscarAtividade(id, limite);
  }

  @Patch(':id/colecao')
  ajustarColecao(
    @Param('id') id: string,
    @Body() dto: AjustarColecaoUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.ajustarColecao(id, dto, admin.id);
  }

  @Patch(':id/saldos')
  ajustarSaldos(
    @Param('id') id: string,
    @Body() dto: AjustarSaldoUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.ajustarSaldos(id, dto, admin.id);
  }

  @Patch(':id')
  atualizar(
    @Param('id') id: string,
    @Body() dto: UpdateAdminUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.atualizar(id, dto, admin.id);
  }
}
