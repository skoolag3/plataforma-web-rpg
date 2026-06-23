import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { PerfilController } from './perfil.controller';
import { PerfilStorageService } from './perfil-storage.service';
import { GoogleOAuthController } from './google-oauth.controller';
import { GoogleOAuthService } from './google-oauth.service';
import { PerfilService } from './perfil.service';
import { TrocaEmailController } from './troca-email.controller';

@Module({
  imports: [EmailModule],
  controllers: [PerfilController, GoogleOAuthController, TrocaEmailController],
  providers: [PerfilService, PerfilStorageService, GoogleOAuthService],
  exports: [PerfilService],
})
export class PerfilModule {}
