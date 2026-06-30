import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminCartasController } from './controllers/admin-cartas.controller';
import { AdminUploadsController } from './controllers/admin-uploads.controller';
import { AdminCartasService } from './services/admin-cartas.service';
import { AdminCloudinaryService } from './services/admin-cloudinary.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminUploadsController, AdminCartasController],
  providers: [AdminCloudinaryService, AdminCartasService],
})
export class AdminModule {}
