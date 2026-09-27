import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from '../../database/database.module';
import { AdminModule } from '../../modules/admin/admin.module';
import { AuthModule } from '../../modules/auth/auth.module';
import { PerfilModule } from '../../modules/perfil/perfil.module';
import { JogoModule } from '../../modules/jogo/jogo.module';
import { LojaModule } from '../../modules/loja/loja.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60_000,
        limit: 120,
      },
    ]),
    DatabaseModule,
    AuthModule,
    PerfilModule,
    AdminModule,
    JogoModule,
    LojaModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
