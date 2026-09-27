import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsInt,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

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
