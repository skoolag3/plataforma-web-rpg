import {
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

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
}
