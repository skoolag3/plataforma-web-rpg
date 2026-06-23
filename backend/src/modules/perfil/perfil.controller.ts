import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AtualizarEmailDto } from './dto/atualizar-email.dto';
import { AtualizarNomeDto } from './dto/atualizar-nome.dto';
import { AtualizarPreferenciasDto } from './dto/atualizar-preferencias.dto';
import { AtualizarSenhaDto } from './dto/atualizar-senha.dto';
import { AtualizarBiografiaDto } from './dto/atualizar-biografia.dto';
import { ConfirmarSenhaDto } from './dto/confirmar-senha.dto';
import { SelecionarMolduraDto } from './dto/selecionar-moldura.dto';
import { PerfilStorageService } from './perfil-storage.service';
import { PerfilService } from './perfil.service';

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

  @Patch('nome')
  atualizarNome(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarNomeDto,
  ) {
    return this.perfilService.atualizarNome(usuario.id, dto);
  }

  @Patch('email')
  atualizarEmail(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: AtualizarEmailDto,
  ) {
    return this.perfilService.atualizarEmail(usuario.id, dto);
  }

  @Patch('senha')
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

  @Patch('moldura')
  selecionarMoldura(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: SelecionarMolduraDto,
  ) {
    return this.perfilService.selecionarMoldura(usuario.id, dto);
  }

  @Post('avatar')
  @UseInterceptors(FileInterceptor('arquivo'))
  async enviarAvatar(
    @CurrentUser() usuario: AuthenticatedUser,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    const url = await this.storageService.enviar(usuario.id, 'avatar', arquivo);
    return this.perfilService.atualizarImagem(usuario.id, 'avatar', url);
  }

  @Post('banner')
  @UseInterceptors(FileInterceptor('arquivo'))
  async enviarBanner(
    @CurrentUser() usuario: AuthenticatedUser,
    @UploadedFile() arquivo: Express.Multer.File,
  ) {
    const url = await this.storageService.enviar(usuario.id, 'banner', arquivo);
    return this.perfilService.atualizarImagem(usuario.id, 'banner', url);
  }

  @Patch('desativar')
  desativar(
    @CurrentUser() usuario: AuthenticatedUser,
    @Body() dto: ConfirmarSenhaDto,
  ) {
    return this.perfilService.desativarConta(usuario.id, dto);
  }

  @Post('exclusao')
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
