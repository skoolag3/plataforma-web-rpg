import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ColecaoService } from './colecao.service';
import { DecksService } from './decks.service';
import { ListarColecaoDto } from './dto/listar-colecao.dto';
import { AtualizarDeckDto, CriarDeckDto } from './dto/salvar-deck.dto';
import { IniciarPartidaDto } from './dto/iniciar-partida.dto';
import { PartidasService } from './partidas.service';
import { BannerGachaDto, GirarGachaDto } from './dto/gacha.dto';
import { GachaService } from './gacha.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class JogoController {
  constructor(
    private readonly colecaoService: ColecaoService,
    private readonly decksService: DecksService,
    private readonly partidasService: PartidasService,
    private readonly gachaService: GachaService,
  ) {}

  @Get('gacha/banners')
  listarBanners(@CurrentUser() usuario: AuthenticatedUser) {
    return this.gachaService.listar(usuario.id);
  }

  @Post('gacha/girar')
  girarGacha(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: GirarGachaDto,
  ) {
    return this.gachaService.girar(usuario.id, dto.idBanner, dto.quantidade);
  }

  @Post('gacha/diario')
  resgatarDiario(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: BannerGachaDto,
  ) {
    return this.gachaService.resgatarDiario(usuario.id, dto.idBanner);
  }

  @Get('partidas/bot/provocacao')
  provocacaoBot() {
    return this.partidasService.provocacao();
  }

  @Post('partidas/bot')
  iniciarPartidaBot(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: IniciarPartidaDto,
  ) {
    return this.partidasService.iniciarContraBot(usuario.id, dto.resposta);
  }

  @Get('partidas')
  historicoPartidas(@CurrentUser() usuario: AuthenticatedUser) {
    return this.partidasService.historico(usuario.id);
  }

  @Get('colecao')
  listarColecao(
    @CurrentUser() usuario: AuthenticatedUser,
    @Query() filtros: ListarColecaoDto,
  ) {
    return this.colecaoService.listar(usuario.id, filtros);
  }

  @Get('decks')
  listarDecks(@CurrentUser() usuario: AuthenticatedUser) {
    return this.decksService.listar(usuario.id);
  }

  @Get('decks/:id')
  buscarDeck(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.decksService.buscar(usuario.id, id);
  }

  @Post('decks')
  criarDeck(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: CriarDeckDto,
  ) {
    return this.decksService.criar(usuario.id, dto);
  }

  @Patch('decks/:id')
  atualizarDeck(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: AtualizarDeckDto,
  ) {
    return this.decksService.atualizar(usuario.id, id, dto);
  }

  @Post('decks/:id/ativar')
  ativarDeck(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.decksService.ativar(usuario.id, id);
  }

  @Delete('decks/:id')
  excluirDeck(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.decksService.excluir(usuario.id, id);
  }
}
