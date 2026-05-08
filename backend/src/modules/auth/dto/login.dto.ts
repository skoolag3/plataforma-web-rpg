import { IsString, Matches, MinLength } from 'class-validator';
import { emailRegex } from './email.regex';

export class LoginDto {
  @Matches(emailRegex, {
    message: 'Digite um e-mail valido, sem caracteres especiais.',
  })
  email!: string;

  @IsString()
  @MinLength(6)
  senha!: string;
}
