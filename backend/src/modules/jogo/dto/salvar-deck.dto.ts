import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CriarDeckDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome: string;

  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartas: string[];

  @IsOptional()
  @IsBoolean()
  ativar?: boolean;
}

export class AtualizarDeckDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(6)
  @ArrayUnique()
  @IsUUID('4', { each: true })
  cartas?: string[];

  @IsOptional()
  @IsBoolean()
  ativar?: boolean;
}
