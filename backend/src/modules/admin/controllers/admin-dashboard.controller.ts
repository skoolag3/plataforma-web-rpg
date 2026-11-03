import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AdminGuard } from '../../../common/guards/admin.guard';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import {
  AdminDashboardService,
  type PeriodoDashboard,
} from '../services/admin-dashboard.service';

@Controller('admin/dashboard')
@UseGuards(JwtAuthGuard, AdminGuard)
export class AdminDashboardController {
  constructor(private readonly dashboardService: AdminDashboardService) {}

  @Get()
  resumo(@Query('periodo') periodo?: string) {
    const periodoNormalizado: PeriodoDashboard =
      periodo === '7d' || periodo === '30d' || periodo === 'tudo'
        ? periodo
        : '7d';
    return this.dashboardService.resumo(periodoNormalizado);
  }
}
