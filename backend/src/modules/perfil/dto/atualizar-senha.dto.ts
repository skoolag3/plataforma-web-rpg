import { IsString, Length, MinLength } from 'class-validator';

export class AtualizarSenhaDto {
  @IsString()
  @MinLength(6)
  senhaAtual!: string;

  @IsString()
  @Length(6, 50)
  novaSenha!: string;

  @IsString()
  @Length(6, 50)
  confirmarSenha!: string;
}
