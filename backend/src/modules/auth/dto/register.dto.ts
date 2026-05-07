import { IsEmail, IsString, MinLength } from 'class-validator';
export class RegisterDto {
  @IsString()
  @MinLength(3)
  nome: string;
  @IsEmail()
  email: string;
  @IsString()
  @MinLength(6)
  senha: string;
}