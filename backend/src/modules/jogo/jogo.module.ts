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
import { BannerRotacaoService } from './banner-rotacao.service';
import { RecompensasService } from './recompensas.service';
import { CorreioService } from './correio.service';
import { ExpedicoesService } from './expedicoes.service';

@Module({
  controllers: [JogoController, NoticiasController, VitrineController],
  providers: [
    ColecaoService,
    DecksService,
    PartidasService,
    GachaService,
    NoticiasService,
    VitrineService,
    BannerRotacaoService,
    RecompensasService,
    CorreioService,
    ExpedicoesService,
  ],
  exports: [BannerRotacaoService],
})
export class JogoModule {}
