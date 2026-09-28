import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsOptional,
  IsIn,
  IsISO8601,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SalvarProdutoExpedicaoDto {
  @IsString() @MaxLength(100) nome!: string;
  @IsString() @MaxLength(300) descricao!: string;
  @IsString() @MaxLength(40) tema!: string;
  @IsIn(['RECORRENTE', 'EVENTO']) tipo!: 'RECORRENTE' | 'EVENTO';
  @IsBoolean() ativo!: boolean;
  @Type(() => Number) @IsInt() @Min(1) @Max(10000) peso!: number;
  @IsOptional() @IsISO8601() inicioEm?: string | null;
  @IsOptional() @IsISO8601() fimEm?: string | null;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) recompensaFacil!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) recompensaMedia!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) recompensaDificil!: number;
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) recompensaChefe!: number;
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentualMantidoDerrota!: number;
  @IsString() @MaxLength(100) bossNome!: string;
  @IsString() @MaxLength(600) bossPersonalidade!: string;
  @IsString() @MaxLength(500) bossProvocacao!: string;
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(250, { each: true })
  bossPerguntas!: string[];
  @IsArray()
  @ArrayMaxSize(24)
  @IsUUID('4', { each: true })
  bossCartas!: string[];
}

export class AtualizarAdminCampanhaDto {
  @IsBoolean()
  ativa!: boolean;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  recompensaFacil!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  recompensaMedia!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  recompensaDificil!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(10000)
  recompensaChefe!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  percentualMantidoDerrota!: number;
}

export class AtualizarBossDto {
  @IsString() @MaxLength(100) nome!: string;
  @IsString() @MaxLength(600) personalidade!: string;
  @IsString() @MaxLength(500) provocacao!: string;
  @IsArray()
  @ArrayMinSize(4)
  @ArrayMaxSize(4)
  @IsString({ each: true })
  @MaxLength(250, { each: true })
  perguntas!: string[];
  @IsArray()
  @ArrayMaxSize(24)
  @IsUUID('4', { each: true })
  cartas!: string[];
}
