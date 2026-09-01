import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AnexoNoticiaDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  titulo: string;

  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  url: string;
}

export class SalvarAdminNoticiaDto {
  @IsString()
  @MinLength(4)
  @MaxLength(180)
  titulo: string;

  @IsString()
  @MinLength(10)
  @MaxLength(320)
  resumo: string;

  @IsString()
  @MinLength(20)
  @MaxLength(20000)
  conteudo: string;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  @MaxLength(500)
  imagem?: string;

  @IsIn(['NOVIDADE', 'BALANCE', 'EVENTO', 'PROMOCAO', 'AVISO'])
  categoria: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnexoNoticiaDto)
  anexos: AnexoNoticiaDto[];

  @IsBoolean()
  publicada: boolean;
}
