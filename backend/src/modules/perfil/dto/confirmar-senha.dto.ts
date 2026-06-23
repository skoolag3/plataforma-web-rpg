import { IsString, MinLength } from 'class-validator';

export class ConfirmarSenhaDto {
  @IsString()
  @MinLength(6)
  senhaAtual!: string;
}
