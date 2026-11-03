import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ChanceBannerDto {
  @IsString()
  raridade: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(100)
  percentual: number;
}

export class PityBannerDto {
  @IsString()
  raridade: string;

  @IsInt()
  @Min(1)
  @Max(10000)
  limite: number;
}

export class ForcarAdminBannerDto {
  @IsUUID('4')
  idBanner: string;
}

export class CriarAdminBannerDto {
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nome: string;

  @IsInt()
  @Min(1)
  @Max(100_000)
  custoGiro: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartasIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChanceBannerDto)
  chances: ChanceBannerDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PityBannerDto)
  pities: PityBannerDto[];

  @IsOptional()
  @IsDateString()
  inicioEm?: string | null;

  @IsOptional()
  @IsDateString()
  fimEm?: string | null;
}

export class AtualizarAdminBannerDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  nome?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100_000)
  custoGiro?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartasIds?: string[];

  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ChanceBannerDto)
  chances?: ChanceBannerDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PityBannerDto)
  pities?: PityBannerDto[];

  @IsOptional()
  @IsDateString()
  inicioEm?: string | null;

  @IsOptional()
  @IsDateString()
  fimEm?: string | null;
}
