import { Module } from '@nestjs/common';
import { ColecaoService } from './colecao.service';
import { DecksService } from './decks.service';
import { JogoController } from './jogo.controller';
import { PartidasService } from './partidas.service';
import { GachaService } from './gacha.service';
import { NoticiasController } from './noticias.controller';
import { NoticiasService } from './noticias.service';
import { VitrineController } from './vitrine.controller';
import { VitrineService } from './vitrine.service';

@Module({
  controllers: [JogoController, NoticiasController, VitrineController],
  providers: [
    ColecaoService,
    DecksService,
    PartidasService,
    GachaService,
    NoticiasService,
    VitrineService,
  ],
})
export class JogoModule {}
