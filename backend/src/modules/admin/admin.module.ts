import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminCartasController } from './controllers/admin-cartas.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { AdminCartasService } from './services/admin-cartas.service';
import { AdminCloudinaryService } from './services/admin-cloudinary.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminUsuariosService } from './services/admin-usuarios.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminUploadsController,
    AdminCartasController,
    AdminDashboardController,
    AdminUsuariosController,
  ],
  providers: [
    AdminCloudinaryService,
    AdminCartasService,
    AdminDashboardService,
    AdminUsuariosService,
  ],
})
export class AdminModule { }
