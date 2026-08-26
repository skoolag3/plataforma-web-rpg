import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { EmailModule } from '../email/email.module';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { obterJwtSecret } from './jwt.config';

@Module({
  imports: [
    UsuariosModule,
    EmailModule,
    PassportModule,
    JwtModule.register({
      global: true,
      secret: obterJwtSecret(),
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
})
export class AuthModule {}
