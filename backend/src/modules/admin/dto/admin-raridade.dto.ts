import { IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';

export class CriarAdminRaridadeDto {
  @IsString()
  @MaxLength(80)
  nome: string;

  @IsInt()
  @Min(0)
  @Max(1000000)
  valorVenda: number;

  @Matches(/^#[0-9a-fA-F]{6}$/)
  cor: string;
}

export class AtualizarAdminRaridadeDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  nome?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(1000000)
  valorVenda?: number;

  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/)
  cor?: string;
}
