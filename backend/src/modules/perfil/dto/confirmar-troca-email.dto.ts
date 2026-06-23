import { IsString, Length } from 'class-validator';

export class ConfirmarTrocaEmailDto {
  @IsString()
  @Length(64, 64)
  token!: string;
}
