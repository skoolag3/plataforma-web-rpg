import { IsString, Length } from 'class-validator';

export class AtualizarNomeDto {
  @IsString()
  @Length(3, 30)
  nome!: string;
}
