import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminCartasController } from './controllers/admin-cartas.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminHabilidadesController } from './controllers/admin-habilidades.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { AdminNoticiasController } from './controllers/admin-noticias.controller';
import { AdminCartasService } from './services/admin-cartas.service';
import { AdminCloudinaryService } from './services/admin-cloudinary.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminHabilidadesService } from './services/admin-habilidades.service';
import { AdminUsuariosService } from './services/admin-usuarios.service';
import { AdminNoticiasService } from './services/admin-noticias.service';

@Module({
  imports: [DatabaseModule],
  controllers: [
    AdminUploadsController,
    AdminCartasController,
    AdminDashboardController,
    AdminHabilidadesController,
    AdminUsuariosController,
    AdminNoticiasController,
  ],
  providers: [
    AdminCloudinaryService,
    AdminCartasService,
    AdminDashboardService,
    AdminHabilidadesService,
    AdminUsuariosService,
    AdminNoticiasService,
  ],
})
export class AdminModule {}
