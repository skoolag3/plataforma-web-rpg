import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResponderBossDto {
  @IsString()
  @MinLength(20)
  @MaxLength(600)
  resposta!: string;
}
