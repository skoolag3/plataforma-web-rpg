import { IsString, MaxLength } from 'class-validator';

export class AtualizarBiografiaDto {
  @IsString()
  @MaxLength(280)
  biografia!: string;
}
