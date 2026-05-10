import { Matches } from 'class-validator';
import { emailRegex } from './email.regex';

export class SolicitarRedefinicaoSenhaDto {
  @Matches(emailRegex, {
    message: 'Digite um e-mail valido, sem caracteres especiais.',
  })
  email!: string;
}
