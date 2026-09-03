import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  AtualizarAdminClasseDto,
  CriarAdminClasseDto,
} from '../dto/admin-classe.dto';
import { AdminClassesService } from '../services/admin-classes.service';

@Controller('admin/classes')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminClassesController {
  constructor(private readonly classesService: AdminClassesService) {}

  @Get()
  listar() {
    return this.classesService.listar();
  }

  @Post()
  criar(@Body() dto: CriarAdminClasseDto) {
    return this.classesService.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarAdminClasseDto) {
    return this.classesService.atualizar(id, dto);
  }
}
