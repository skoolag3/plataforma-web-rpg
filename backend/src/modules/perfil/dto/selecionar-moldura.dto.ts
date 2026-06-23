import { IsUUID } from 'class-validator';

export class SelecionarMolduraDto {
  @IsUUID()
  idMoldura!: string;
}
