import { IsString, IsUUID, MaxLength } from 'class-validator';

export class IniciarExpedicaoDto {
  @IsUUID()
  idDeck: string;
}

export class EscolherRotaDto {
  @IsString()
  @MaxLength(80)
  idEscolha: string;
}
