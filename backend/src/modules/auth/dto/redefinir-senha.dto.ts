import { IsString, Length } from 'class-validator';

export class RedefinirSenhaDto {
  @IsString()
  token!: string;

  @IsString()
  @Length(6, 50)
  senha!: string;
}
