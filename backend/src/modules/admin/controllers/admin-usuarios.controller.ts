import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
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
  RemoverAdminUsuarioDto,
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
  buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscar(id);
  }

  @Get(':id/colecao')
  buscarColecao(@Param('id', ParseUUIDPipe) id: string) {
    return this.usuariosService.buscarColecao(id);
  }

  @Get(':id/atividade')
  buscarAtividade(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('limite') limite?: string,
  ) {
    return this.usuariosService.buscarAtividade(id, limite);
  }

  @Get(':id/expedicoes')
  buscarExpedicoes(
    @Param('id', ParseUUIDPipe) id: string,
    @Query('pagina') pagina?: string,
  ) {
    return this.usuariosService.buscarExpedicoes(id, pagina);
  }

  @Get(':id/expedicoes/:idExpedicao/lutas/:idLuta')
  buscarLogLutaExpedicao(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('idExpedicao', ParseUUIDPipe) idExpedicao: string,
    @Param('idLuta', ParseUUIDPipe) idLuta: string,
  ) {
    return this.usuariosService.buscarLogLutaExpedicao(id, idExpedicao, idLuta);
  }

  @Patch(':id/colecao')
  ajustarColecao(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AjustarColecaoUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.ajustarColecao(id, dto, admin.id);
  }

  @Patch(':id/saldos')
  ajustarSaldos(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AjustarSaldoUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.ajustarSaldos(id, dto, admin.id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.atualizar(id, dto, admin.id);
  }

  @Delete(':id')
  remover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoverAdminUsuarioDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.usuariosService.remover(id, dto, admin.id);
  }
}
