import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminCartasController } from './controllers/admin-cartas.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { AdminCartasService } from './services/admin-cartas.service';
import { AdminCloudinaryService } from './services/admin-cloudinary.service';
import { AdminDashboardService } from './services/admin-dashboard.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminUploadsController,
    AdminCartasController,
    AdminDashboardController,
  ],
  providers: [
    AdminCloudinaryService,
    AdminCartasService,
    AdminDashboardService,
  ],
})
export class AdminModule {}
