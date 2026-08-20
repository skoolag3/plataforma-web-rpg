import { IsUUID } from 'class-validator';

export class IniciarPartidaDto {
  @IsUUID()
  idDeck: string;
}
