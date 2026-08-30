import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

const raridades = ['UR', 'SSR', 'SR', 'R', 'N'] as const;
const elementos = ['natureza', 'agua', 'fogo', 'sombra', 'luz'] as const;

export class ListarColecaoDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  busca?: string;

  @IsOptional()
  @IsIn(raridades)
  raridade?: (typeof raridades)[number];

  @IsOptional()
  @IsIn(elementos)
  elemento?: (typeof elementos)[number];

  @IsOptional()
  @IsString()
  @MaxLength(80)
  classe?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(50)
  @Max(800)
  custo?: number;

  @IsOptional()
  @IsIn(['todas', 'obtidas', 'nao-obtidas'])
  posse?: 'todas' | 'obtidas' | 'nao-obtidas';
}
