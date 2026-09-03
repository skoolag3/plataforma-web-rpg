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
import { RecompensasService } from './recompensas.service';
import { CorreioService } from './correio.service';
import { LerCorreioDto } from './dto/ler-correio.dto';
import { EscolherRotaDto, IniciarExpedicaoDto } from './dto/expedicao.dto';
import { ExecutarTurnoDto } from './dto/executar-turno.dto';
import { ExpedicoesService } from './expedicoes.service';

@UseGuards(JwtAuthGuard)
@Controller()
export class JogoController {
  constructor(
    private readonly colecaoService: ColecaoService,
    private readonly decksService: DecksService,
    private readonly partidasService: PartidasService,
    private readonly gachaService: GachaService,
    private readonly recompensasService: RecompensasService,
    private readonly correioService: CorreioService,
    private readonly expedicoesService: ExpedicoesService,
  ) {}

  @Get('expedicoes/atual')
  buscarExpedicaoAtual(@CurrentUser() usuario: AuthenticatedUser) {
    return this.expedicoesService.buscarAtual(usuario.id);
  }

  @Post('expedicoes')
  iniciarExpedicao(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: IniciarExpedicaoDto,
  ) {
    return this.expedicoesService.criar(usuario.id, dto.idDeck);
  }

  @Post('expedicoes/:id/escolhas')
  escolherRota(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: EscolherRotaDto,
  ) {
    return this.expedicoesService.escolher(usuario.id, id, dto.idEscolha);
  }

  @Post('expedicoes/:id/abandonar')
  abandonarExpedicao(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.expedicoesService.abandonar(usuario.id, id);
  }

  @Get('correio')
  listarCorreio(@CurrentUser() usuario: AuthenticatedUser) {
    return this.correioService.listar(usuario.id);
  }

  @Post('correio/ler')
  marcarCorreioComoLido(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: LerCorreioDto,
  ) {
    return this.correioService.marcarComoLida(usuario.id, dto.chave);
  }

  @Get('recompensas')
  obterRecompensas(@CurrentUser() usuario: AuthenticatedUser) {
    return this.recompensasService.obterStatus(usuario.id);
  }

  @Post('recompensas/semanal')
  resgatarRecompensaSemanal(@CurrentUser() usuario: AuthenticatedUser) {
    return this.recompensasService.resgatarSemanal(usuario.id);
  }

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

  @Post('partidas')
  iniciarPartida(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: IniciarPartidaDto,
  ) {
    return this.partidasService.iniciar(usuario.id, dto.idDeck);
  }

  @Get('partidas/atual')
  buscarPartidaAtual(@CurrentUser() usuario: AuthenticatedUser) {
    return this.partidasService.buscarAtual(usuario.id);
  }

  @Get('partidas/:id')
  buscarPartida(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.partidasService.buscar(usuario.id, id);
  }

  @Post('partidas/:id/turnos')
  executarTurno(
    @CurrentUser() usuario: AuthenticatedUser,
    @Param('id') id: string,
    @Body() dto: ExecutarTurnoDto,
  ) {
    return this.partidasService.executarTurno(usuario.id, id, dto.acao);
  }

  @Get('partidas')
  historicoPartidas(@CurrentUser() usuario: AuthenticatedUser) {
    return this.partidasService.historico(usuario.id);
  }

  @Get('ranking')
  ranking() {
    return this.partidasService.ranking();
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
