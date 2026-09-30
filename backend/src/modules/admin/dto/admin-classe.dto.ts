import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CriarAdminClasseDto {
  @IsString()
  @MaxLength(80)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  descricao?: string;

  @IsInt()
  @Min(1)
  @Max(99)
  prioridadeAtaque!: number;

}

export class AtualizarAdminClasseDto extends CriarAdminClasseDto {
  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
