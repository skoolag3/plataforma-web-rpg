import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { PerfilModule } from '../../modules/perfil/perfil.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [DatabaseModule, AuthModule, PerfilModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
