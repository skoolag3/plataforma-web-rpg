import { IsBoolean } from 'class-validator';

export class AtualizarPreferenciasDto {
  @IsBoolean()
  receberNotificacoes!: boolean;

  @IsBoolean()
  mostrarNoRanking!: boolean;

  @IsBoolean()
  ocultarHistorico!: boolean;
}
