import { IsString, MinLength, Matches } from 'class-validator';
import { emailRegex } from '../../auth/dto/email.regex';

export class AtualizarEmailDto {
  @Matches(emailRegex, {
    message: 'Digite um e-mail valido, sem caracteres especiais.',
  })
  email!: string;

  @IsString()
  @MinLength(6)
  senhaAtual!: string;
}
