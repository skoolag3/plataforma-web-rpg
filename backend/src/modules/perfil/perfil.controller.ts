import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Throttle } from '@nestjs/throttler';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { validarConteudoImagem } from '../../common/validation/imagem.validation';
import { AtualizarEmailDto } from './dto/atualizar-email.dto';
import { AtualizarNomeDto } from './dto/atualizar-nome.dto';
import { AtualizarPreferenciasDto } from './dto/atualizar-preferencias.dto';
import { AtualizarSenhaDto } from './dto/atualizar-senha.dto';
import { AtualizarBiografiaDto } from './dto/atualizar-biografia.dto';
import { ConfirmarSenhaDto } from './dto/confirmar-senha.dto';
import { SelecionarMolduraDto } from './dto/selecionar-moldura.dto';
import { SelecionarFotoCartaDto } from './dto/selecionar-foto-carta.dto';
import { PerfilStorageService } from './perfil-storage.service';
import { PerfilService } from './perfil.service';

const tiposImagemPermitidos = ['image/jpeg', 'image/png', 'image/webp'];

function filtrarImagemPerfil(
  _request: unknown,
  arquivo: Express.Multer.File,
  callback: (error: Error | null, aceitarArquivo: boolean) => void,
) {
  if (tiposImagemPermitidos.includes(arquivo.mimetype)) {
    callback(null, true);
    return;
  }

  callback(new BadRequestException('Use uma imagem JPG, PNG ou WebP.'), false);
}

const opcoesUploadBanner = {
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
  fileFilter: filtrarImagemPerfil,
};

@UseGuards(JwtAuthGuard)
@Controller('perfil')
export class PerfilController {
  constructor(
    private readonly perfilService: PerfilService,
    private readonly storageService: PerfilStorageService,
  ) {}

  @Get()
  buscarPerfil(@CurrentUser() usuario: AuthenticatedUser) {
    return this.perfilService.buscarPerfil(usuario.id);
  }

  @Get('publico/:id')
  buscarPerfilPublico(@Param('id', ParseUUIDPipe) id: string) {
    return this.perfilService.buscarPerfilPublico(id);
  }

  @Patch('nome')
  atualizarNome(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarNomeDto,
  ) {
    return this.perfilService.atualizarNome(usuario.id, dto);
  }

  @Patch('email')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  atualizarEmail(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarEmailDto,
  ) {
    return this.perfilService.atualizarEmail(usuario.id, dto);
  }

  @Patch('senha')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  atualizarSenha(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarSenhaDto,
  ) {
    return this.perfilService.atualizarSenha(usuario.id, dto);
  }

  @Patch('preferencias')
  atualizarPreferencias(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarPreferenciasDto,
  ) {
    return this.perfilService.atualizarPreferencias(usuario.id, dto);
  }

  @Patch('biografia')
  atualizarBiografia(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarBiografiaDto,
  ) {
    return this.perfilService.atualizarBiografia(usuario.id, dto);
  }

  @Get('molduras')
  listarMolduras(@CurrentUser() usuario: AuthenticatedUser) {
    return this.perfilService.listarMolduras(usuario.id);
  }

  @Get('fotos-cartas')
  listarFotosCartas(@CurrentUser() usuario: AuthenticatedUser) {
    return this.perfilService.listarFotosCartas(usuario.id);
  }

  @Patch('foto-carta')
  selecionarFotoCarta(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: SelecionarFotoCartaDto,
  ) {
    return this.perfilService.selecionarFotoCarta(usuario.id, dto.idCarta);
  }

  @Patch('moldura')
  selecionarMoldura(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: SelecionarMolduraDto,
  ) {
    return this.perfilService.selecionarMoldura(usuario.id, dto);
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('arquivo', opcoesUploadBanner))
  async enviarBanner(
    @CurrentUser() usuario: AuthenticatedUser,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    validarConteudoImagem(arquivo, ['image/jpeg', 'image/png', 'image/webp']);
    const url = await this.storageService.enviar(usuario.id, 'banner', arquivo);
    return this.perfilService.atualizarImagem(usuario.id, 'banner', url);
  }

  @Patch('desativar')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  desativar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: ConfirmarSenhaDto,
  ) {
    return this.perfilService.desativarConta(usuario.id, dto);
  }

  @Post('exclusao')
  @Throttle({ default: { limit: 6, ttl: 60_000 } })
  solicitarExclusao(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: ConfirmarSenhaDto,
  ) {
    return this.perfilService.solicitarExclusao(usuario.id, dto);
  }

  @Patch('exclusao/cancelar')
  cancelarExclusao(@CurrentUser() usuario: AuthenticatedUser) {
    return this.perfilService.cancelarExclusao(usuario.id);
  }
}
