import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { emailRegex } from './email.regex';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @Matches(emailRegex, {
    message: 'Digite um e-mail valido, sem caracteres especiais.',
  })
  email!: string;

  @IsString()
  @Length(6, 50)
  senha!: string;
}
