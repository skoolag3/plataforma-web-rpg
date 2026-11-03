import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../../common/decorators/current-user.decorator';
import {
  CreateAdminCartaDto,
  RemoveAdminCartaDto,
  UpdateAdminCartaDto,
} from '../dto/admin-carta.dto';
import { AdminCartasService } from '../services/admin-cartas.service';

@Controller('admin/cartas')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCartasController {
  constructor(private readonly cartasService: AdminCartasService) {}

  @Get()
  listar(
    @Query('q') busca?: string,
    @Query('raridade') raridade?: string,
    @Query('elemento') elemento?: string,
    @Query('status') status?: string,
    @Query('classe') classe?: string,
    @Query('periodo') periodo?: string,
    @Query('ordem') ordem?: string,
  ) {
    return this.cartasService.listar({
      busca,
      raridade,
      elemento,
      status,
      classe,
      periodo,
      ordem,
    });
  }

  @Get('historico')
  historico(
    @Query('pagina') pagina?: string,
    @Query('busca') busca?: string,
    @Query('acao') acao?: string,
  ) {
    return this.cartasService.historico({ pagina, busca, acao });
  }

  @Get(':id')
  buscar(@Param('id', ParseUUIDPipe) id: string) {
    return this.cartasService.buscar(id);
  }

  @Get(':id/impacto')
  buscarImpacto(@Param('id', ParseUUIDPipe) id: string) {
    return this.cartasService.buscarImpacto(id);
  }

  @Post()
  criar(
    @Body() dto: CreateAdminCartaDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cartasService.criar(dto, admin.id);
  }

  @Patch(':id')
  atualizar(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminCartaDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cartasService.atualizar(id, dto, admin.id);
  }

  @Delete(':id')
  remover(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RemoveAdminCartaDto,
    @CurrentUser() admin: AuthenticatedUser,
  ) {
    return this.cartasService.remover(
      id,
      dto.confirmarNome,
      dto.confirmarImpacto,
      admin.id,
    );
  }
}
