import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class UpdateAdminUsuarioDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(9999)
  nivel?: number;

  @IsOptional()
  @IsBoolean()
  ativo?: boolean;

  @IsOptional()
  @IsBoolean()
  bloqueado?: boolean;

  @IsOptional()
  @IsBoolean()
  emailVerificado?: boolean;
}
