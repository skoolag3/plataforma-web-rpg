import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { SalvarAdminNoticiaDto } from '../dto/admin-noticia.dto';
import { AdminNoticiasService } from '../services/admin-noticias.service';

@Controller('admin/noticias')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminNoticiasController {
  constructor(private readonly noticiasService: AdminNoticiasService) {}

  @Get()
  listar() {
    return this.noticiasService.listar();
  }

  @Post()
  criar(@Body() dto: SalvarAdminNoticiaDto) {
    return this.noticiasService.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: SalvarAdminNoticiaDto) {
    return this.noticiasService.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.noticiasService.remover(id);
  }
}
