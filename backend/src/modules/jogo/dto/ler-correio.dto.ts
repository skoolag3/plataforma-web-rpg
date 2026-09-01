import { IsString, MaxLength, MinLength } from 'class-validator';

export class LerCorreioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  chave!: string;
}
