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
  ValidateNested,
} from 'class-validator';

export class CaminhoCampanhaDto {
  @IsOptional() @IsString() @MaxLength(80) titulo?: string;
  @IsOptional() @IsString() @MaxLength(240) descricao?: string;
  @IsIn(['FACIL', 'MEDIA', 'DIFICIL']) dificuldade!: 'FACIL' | 'MEDIA' | 'DIFICIL';
  @Type(() => Number) @IsInt() @Min(0) @Max(10000) recompensa!: number;
  @IsArray() @ArrayMaxSize(24) @IsUUID('4', { each: true }) cartas!: string[];
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(6) quantidadeCartas?: number;
  @IsOptional() @IsIn(['ALEATORIO', 'MANUAL']) modoCartas?: 'ALEATORIO' | 'MANUAL';
  @IsOptional() @IsBoolean() mixed?: boolean;
}

export class SecaoCampanhaDto {
  @IsIn(['BATALHA', 'BOSS']) tipo!: 'BATALHA' | 'BOSS';
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(8) grupo?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) @Max(100) percentualMantidoDerrota?: number;
  @IsOptional() @IsArray() @ArrayMinSize(1) @ArrayMaxSize(3)
  @ValidateNested({ each: true }) @Type(() => CaminhoCampanhaDto)
  caminhos?: CaminhoCampanhaDto[];
}

export class SalvarProdutoExpedicaoDto {
  @IsArray() @ArrayMinSize(2) @ArrayMaxSize(8)
  @ValidateNested({ each: true }) @Type(() => SecaoCampanhaDto)
  secoes!: SecaoCampanhaDto[];
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

export class CriarTemaExpedicaoDto {
  @IsString() @MaxLength(40) nome!: string;
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
