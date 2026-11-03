import {
  Body,
  Controller,
  DefaultValuePipe,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  AtualizarAdminCampanhaDto,
  AtualizarBossDto,
  SalvarProdutoExpedicaoDto,
  CriarTemaExpedicaoDto,
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

  @Get('expedicoes')
  obterExpedicoes(
    @Query('pagina', new DefaultValuePipe(1), ParseIntPipe) pagina: number,
  ) {
    return this.campanhaService.obterExpedicoes(pagina);
  }

  @Post('temas')
  criarTema(@Body() dto: CriarTemaExpedicaoDto) {
    return this.campanhaService.criarTema(dto);
  }

  @Patch()
  atualizar(@Body() dto: AtualizarAdminCampanhaDto) {
    return this.campanhaService.atualizar(dto);
  }

  @Patch('boss')
  atualizarBoss(@Body() dto: AtualizarBossDto) {
    return this.campanhaService.atualizarBoss(dto);
  }

  @Post('produtos')
  criarProduto(@Body() dto: SalvarProdutoExpedicaoDto) {
    return this.campanhaService.criarProduto(dto);
  }

  @Patch('produtos/:id')
  atualizarProduto(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SalvarProdutoExpedicaoDto,
  ) {
    return this.campanhaService.atualizarProduto(id, dto);
  }

  @Delete('produtos/:id')
  excluirProduto(@Param('id', ParseUUIDPipe) id: string) {
    return this.campanhaService.excluirProduto(id);
  }
}
