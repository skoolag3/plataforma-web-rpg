import {
  IsBoolean,
  IsIn,
  IsInt,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const elementos = ['natureza', 'agua', 'fogo', 'sombra', 'luz'] as const;
const raridades = ['UR', 'SSR', 'SR', 'R', 'N'] as const;

export class CreateAdminCartaDto {
  @IsString()
  @MaxLength(150)
  nome: string;

  @IsIn(elementos)
  elemento: (typeof elementos)[number];

  @IsIn(raridades)
  raridade: (typeof raridades)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  classe?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  custo?: number;

  @IsInt()
  @Min(0)
  @Max(99999)
  hpBase: number;

  @IsInt()
  @Min(0)
  @Max(99999)
  danoBase: number;

  @IsInt()
  @Min(0)
  @Max(99999)
  defesaBase: number;

  @IsOptional()
  @IsObject()
  passiva?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moldura?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}

export class UpdateAdminCartaDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  nome?: string;

  @IsOptional()
  @IsIn(elementos)
  elemento?: (typeof elementos)[number];

  @IsOptional()
  @IsIn(raridades)
  raridade?: (typeof raridades)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  classe?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(20)
  custo?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  hpBase?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  danoBase?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(99999)
  defesaBase?: number;

  @IsOptional()
  @IsObject()
  passiva?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  foto?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  moldura?: string;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;
}
