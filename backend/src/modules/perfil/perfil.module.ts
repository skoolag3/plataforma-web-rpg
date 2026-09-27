import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { PerfilController } from './perfil.controller';
import { PerfilStorageService } from './perfil-storage.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { PerfilService } from './perfil.service';
import { TrocaEmailController } from './troca-email.controller';

@Module({
  imports: [AuthModule, EmailModule],
  controllers: [PerfilController, GoogleOAuthController, TrocaEmailController],
  providers: [PerfilService, PerfilStorageService, GoogleOAuthService],
  exports: [PerfilService],
})
export class PerfilModule {}
