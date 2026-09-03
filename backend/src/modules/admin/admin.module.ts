import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { JogoModule } from '../jogo/jogo.module';
import { AdminCartasController } from './controllers/admin-cartas.controller';
import { AdminDashboardController } from './controllers/admin-dashboard.controller';
import { AdminHabilidadesController } from './controllers/admin-habilidades.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { AdminUsuariosController } from './controllers/admin-usuarios.controller';
import { AdminNoticiasController } from './controllers/admin-noticias.controller';
import { AdminBannersController } from './controllers/admin-banners.controller';
import { AdminClassesController } from './controllers/admin-classes.controller';
import { AdminCartasService } from './services/admin-cartas.service';
import { AdminCloudinaryService } from './services/admin-cloudinary.service';
import { AdminDashboardService } from './services/admin-dashboard.service';
import { AdminHabilidadesService } from './services/admin-habilidades.service';
import { AdminUsuariosService } from './services/admin-usuarios.service';
import { AdminNoticiasService } from './services/admin-noticias.service';
import { AdminBannersService } from './services/admin-banners.service';
import { AdminClassesService } from './services/admin-classes.service';

@Module({
  imports: [DatabaseModule, JogoModule],
  controllers: [
    AdminUploadsController,
    AdminCartasController,
    AdminDashboardController,
    AdminHabilidadesController,
    AdminUsuariosController,
    AdminNoticiasController,
    AdminBannersController,
    AdminClassesController,
  ],
  providers: [
    AdminCloudinaryService,
    AdminCartasService,
    AdminDashboardService,
    AdminHabilidadesService,
    AdminUsuariosService,
    AdminNoticiasService,
    AdminBannersService,
    AdminClassesService,
  ],
})
export class AdminModule {}
