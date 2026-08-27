import { IsString, Length, Matches } from 'class-validator';
import {
  mensagemSenhaForte,
  senhaForteRegex,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MINIMO_SENHA,
} from '../../../common/validation/senha.validation';

export class RedefinirSenhaDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(TAMANHO_MINIMO_SENHA, TAMANHO_MAXIMO_SENHA)
  @Matches(senhaForteRegex, { message: mensagemSenhaForte })
  senha!: string;
}
