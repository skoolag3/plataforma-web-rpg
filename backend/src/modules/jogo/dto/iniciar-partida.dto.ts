import { IsString, MaxLength, MinLength } from 'class-validator';

export class IniciarPartidaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(500)
  resposta: string;
}
