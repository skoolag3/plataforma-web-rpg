import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../../modules/admin/admin.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { PerfilModule } from '../../modules/perfil/perfil.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [DatabaseModule, AuthModule, PerfilModule, AdminModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
