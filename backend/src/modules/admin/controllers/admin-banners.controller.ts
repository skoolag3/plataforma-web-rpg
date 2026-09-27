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
import {
  AtualizarAdminBannerDto,
  CriarAdminBannerDto,
  ForcarAdminBannerDto,
} from '../dto/admin-banner.dto';
import { AdminBannersService } from '../services/admin-banners.service';

@Controller('admin/banners')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminBannersController {
  constructor(private readonly bannersService: AdminBannersService) {}

  @Get()
  listar() {
    return this.bannersService.listar();
  }

  @Post('forcar')
  forcar(@Body() dto: ForcarAdminBannerDto) {
    return this.bannersService.forcar(dto.idBanner);
  }

  @Post()
  criar(@Body() dto: CriarAdminBannerDto) {
    return this.bannersService.criar(dto);
  }

  @Patch(':id')
  atualizar(@Param('id') id: string, @Body() dto: AtualizarAdminBannerDto) {
    return this.bannersService.atualizar(id, dto);
  }

  @Delete(':id')
  remover(@Param('id') id: string) {
    return this.bannersService.remover(id);
  }
}
