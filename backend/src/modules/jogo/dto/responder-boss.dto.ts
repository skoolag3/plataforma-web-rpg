import { IsString, MaxLength, MinLength } from 'class-validator';

export class ResponderBossDto {
  @IsString()
  @MinLength(5)
  @MaxLength(200)
  resposta!: string;
}
