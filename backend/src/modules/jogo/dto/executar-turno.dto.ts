import { IsIn } from 'class-validator';
import type { AcaoTurno } from '../batalha.engine';

export class ExecutarTurnoDto {
  @IsIn(['ATACAR', 'DEFENDER'])
  acao!: AcaoTurno;
}
