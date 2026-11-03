import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

export class LerCorreioDto {
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  @Matches(
    /^(?:giro:\d{4}-\d{2}-\d{2}T[\d:.]+Z|semanal:\d{4}-\d{2}-\d{2}T[\d:.]+Z|noticia:[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})$/i,
    { message: 'Chave de mensagem do correio inválida.' },
  )
  chave!: string;
}
