import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  CreateAdminCartaDto,
  RemoveAdminCartaDto,
  UpdateAdminCartaDto,
} from '../dto/admin-carta.dto';
import { AdminCartasService } from '../services/admin-cartas.service';

@Controller('admin/cartas')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminCartasController {
  constructor(private readonly cartasService: AdminCartasService) { }

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

  @Get(':id')
  buscar(@Param('id') id: string) {
    return this.cartasService.buscar(id);
  }

  @Get(':id/impacto')
  buscarImpacto(@Param('id') id: string) {
    return this.cartasService.buscarImpacto(id);
  }

  @Post()
  criar(@Body() dto: CreateAdminCartaDto) {
    return this.cartasService.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: UpdateAdminCartaDto) {
    return this.cartasService.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string, @Body() dto: RemoveAdminCartaDto) {
    return this.cartasService.remover(
      id,
      dto.confirmarNome,
      dto.confirmarImpacto,
    );
  }
}
