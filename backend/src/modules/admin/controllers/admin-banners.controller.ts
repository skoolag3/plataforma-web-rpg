import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { ForcarAdminBannerDto } from '../dto/admin-banner.dto';
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
}
