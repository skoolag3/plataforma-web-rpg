import { IsString, Length, Matches, MinLength } from 'class-validator';
import {
  mensagemSenhaForte,
  senhaForteRegex,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MINIMO_SENHA,
} from '../../../common/validation/senha.validation';

export class AtualizarSenhaDto {
  @IsString()
  @MinLength(6)
  senhaAtual!: string;

  @IsString()
  @Length(TAMANHO_MINIMO_SENHA, TAMANHO_MAXIMO_SENHA)
  @Matches(senhaForteRegex, { message: mensagemSenhaForte })
  novaSenha!: string;

  @IsString()
  @Length(TAMANHO_MINIMO_SENHA, TAMANHO_MAXIMO_SENHA)
  @Matches(senhaForteRegex, { message: mensagemSenhaForte })
  confirmarSenha!: string;
}
