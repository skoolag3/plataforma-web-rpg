import { Module } from '@nestjs/common';
import { ColecaoService } from './colecao.service';
import { DecksService } from './decks.service';
import { JogoController } from './jogo.controller';
import { PartidasService } from './partidas.service';
import { GachaService } from './gacha.service';

@Module({
  controllers: [JogoController],
  providers: [ColecaoService, DecksService, PartidasService, GachaService],
})
export class JogoModule {}
