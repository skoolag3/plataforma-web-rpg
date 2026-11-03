import {
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

export class UpdateAdminUsuarioDto {
  @IsOptional()
  @IsBoolean()
  admin?: boolean;

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

export class RemoverAdminUsuarioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  confirmarNome: string;

  @IsBoolean()
  confirmarImpacto: boolean;
}

export class AjustarSaldoUsuarioDto {
  @IsInt()
  @Min(-1000000)
  @Max(1000000)
  rubys: number;

  @IsString()
  @MinLength(3)
  @MaxLength(180)
  motivo: string;
}

export class AjustarColecaoUsuarioDto {
  @IsUUID()
  idCarta: string;

  @IsInt()
  @Min(-999)
  @Max(999)
  quantidade: number;
}
