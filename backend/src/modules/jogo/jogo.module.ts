import { Module } from '@nestjs/common';
import { ColecaoService } from './cartas/colecao.service';
import { DecksService } from './cartas/decks.service';
import { JogoController } from './jogo.controller';
import { PartidasService } from './combate/partidas.service';
import { GachaService } from './gacha/gacha.service';
import { NoticiasController } from './noticias/noticias.controller';
import { NoticiasService } from './noticias/noticias.service';
import { VitrineController } from './vitrine/vitrine.controller';
import { VitrineService } from './vitrine/vitrine.service';
import { BannerRotacaoService } from './banners/banner-rotacao.service';
import { RecompensasService } from './recompensas/recompensas.service';
import { CorreioService } from './correio/correio.service';
import { ExpedicoesService } from './expedicao/expedicoes.service';

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
