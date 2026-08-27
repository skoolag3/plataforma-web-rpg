import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { emailRegex } from './email.regex';
import {
  mensagemSenhaForte,
  senhaForteRegex,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MINIMO_SENHA,
} from '../../../common/validation/senha.validation';

export class RegisterDto {
  @IsString()
  @IsNotEmpty()
  nome!: string;

  @Matches(emailRegex, {
    message: 'Digite um e-mail valido, sem caracteres especiais.',
  })
  email!: string;

  @IsString()
  @Length(TAMANHO_MINIMO_SENHA, TAMANHO_MAXIMO_SENHA)
  @Matches(senhaForteRegex, { message: mensagemSenhaForte })
  senha!: string;
}
