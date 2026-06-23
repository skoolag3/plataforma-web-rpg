import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import type { Usuario } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../database/prisma.service';
import { EmailService } from '../email/email.service';
import { AtualizarEmailDto } from './dto/atualizar-email.dto';
import { AtualizarBiografiaDto } from './dto/atualizar-biografia.dto';
import { AtualizarNomeDto } from './dto/atualizar-nome.dto';
import { AtualizarPreferenciasDto } from './dto/atualizar-preferencias.dto';
import { AtualizarSenhaDto } from './dto/atualizar-senha.dto';
import { ConfirmarSenhaDto } from './dto/confirmar-senha.dto';
import { SelecionarMolduraDto } from './dto/selecionar-moldura.dto';

@Injectable()
export class PerfilService implements OnModuleInit, OnModuleDestroy {
  private processadorExclusao?: NodeJS.Timeout;

  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  onModuleInit() {
    void this.processarExclusoesPendentes();
    this.processadorExclusao = setInterval(
      () => void this.processarExclusoesPendentes(),
      60 * 60 * 1000,
    );
    this.processadorExclusao.unref();
  }

  onModuleDestroy() {
    if (this.processadorExclusao) {
      clearInterval(this.processadorExclusao);
    }
  }

  async buscarPerfil(idUsuario: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: {
        id: idUsuario,
        excluido_em: null,
      },
      include: {
        perfil: { include: { molduraSelecionada: true } },
        provedores: { where: { provedor: 'GOOGLE' } },
      },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario nao encontrado.');
    }

    const [cartasObtidas, totalCartas, decksCriados, partidas, ranking] =
      await Promise.all([
        this.prisma.inventario.count({
          where: {
            id_usuario: idUsuario,
            quantidade: { gt: 0 },
          },
        }),
        this.prisma.carta.count({
          where: {
            ativo: true,
            excluido_em: null,
          },
        }),
        this.prisma.deck.count({
          where: {
            id_usuario: idUsuario,
            excluido_em: null,
          },
        }),
        this.prisma.logPartida.groupBy({
          by: ['resultado'],
          where: { id_usuario: idUsuario },
          _count: { _all: true },
        }),
        this.prisma.logPartida.aggregate({
          where: { id_usuario: idUsuario },
          _sum: { variacao_pontos: true },
        }),
      ]);

    const perfil =
      usuario.perfil ??
      (await this.prisma.perfilUsuario.create({
        data: { id_usuario: idUsuario },
        include: { molduraSelecionada: true },
      }));

    const quantidadePartidas = (resultado: string) =>
      partidas.find((partida) => partida.resultado === resultado)?._count
        ._all ?? 0;

    return {
      user: usuario.nome,
      email: usuario.email,
      nivel: usuario.nivel ?? 1,
      idUser: this.formatarIdUsuario(usuario.id),
      biografia: perfil.biografia,
      moldura: perfil.molduraSelecionada?.nome ?? 'Padrão',
      molduraClasse: perfil.molduraSelecionada?.classe_css ?? 'molduraPadrao',
      avatarUrl: perfil.avatar_url,
      bannerUrl: perfil.banner_url,
      googleVinculado: usuario.provedores.length > 0,
      googleConfigurado: Boolean(
        process.env.GOOGLE_CLIENT_ID &&
        process.env.GOOGLE_CLIENT_SECRET &&
        process.env.GOOGLE_CALLBACK_URL,
      ),
      storageConfigurado: Boolean(
        process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
      ),
      vitorias: quantidadePartidas('VITORIA'),
      derrotas: quantidadePartidas('DERROTA'),
      ranking: ranking._sum.variacao_pontos ?? usuario.pontos_experiencia ?? 0,
      cartasObtidas,
      totalCartas,
      decksCriados,
      partidasJogadas: partidas.reduce(
        (total, partida) => total + partida._count._all,
        0,
      ),
      rubys: usuario.saldo_rubys_cache ?? 0,
      moedas: usuario.saldo_moedas_cache ?? 0,
      ultimoLogin: usuario.ultimo_login_em
        ? this.formatarDataBrasil(usuario.ultimo_login_em)
        : 'Primeiro acesso',
      preferencias: {
        receberNotificacoes: perfil.receber_notificacoes,
        mostrarNoRanking: perfil.mostrar_no_ranking,
        ocultarHistorico: perfil.ocultar_historico,
      },
    };
  }

  async atualizarNome(idUsuario: string, dto: AtualizarNomeDto) {
    const nome = dto.nome.trim();

    if (nome.length < 3) {
      throw new BadRequestException('O nome deve ter pelo menos 3 caracteres.');
    }

    await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: { nome },
    });

    return {
      message: 'Nome atualizado com sucesso.',
      nome,
    };
  }

  async atualizarEmail(idUsuario: string, dto: AtualizarEmailDto) {
    const email = dto.email.toLowerCase().trim();
    const usuario = await this.buscarUsuarioComSenha(idUsuario);
    await this.validarSenha(usuario.senha_hash, dto.senhaAtual);

    if (email === usuario.email) {
      throw new BadRequestException(
        'O novo e-mail deve ser diferente do atual.',
      );
    }

    const emailEmUso = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true },
    });

    if (emailEmUso) {
      throw new ConflictException('Este e-mail ja esta em uso.');
    }

    const token = randomBytes(32).toString('hex');
    await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: {
        email_pendente: email,
        token_confirmacao_troca_email: token,
        token_troca_email_expira_em: new Date(Date.now() + 30 * 60 * 1000),
        token_verificacao_email_pendente: null,
        token_email_pendente_expira_em: null,
      },
    });

    await this.emailService.sendEmailChangeConfirmation({
      email: usuario.email,
      nome: usuario.nome,
      token,
      novoEmail: email,
    });

    return {
      message: 'Enviamos uma confirmacao para o seu e-mail atual.',
      emailPendente: email,
    };
  }

  async confirmarTrocaEmail(token: string) {
    const usuarioAtual = await this.prisma.usuario.findUnique({
      where: { token_confirmacao_troca_email: token },
    });

    if (usuarioAtual) {
      return this.confirmarEmailAtual(usuarioAtual);
    }

    const usuarioNovo = await this.prisma.usuario.findUnique({
      where: { token_verificacao_email_pendente: token },
    });

    if (usuarioNovo) {
      return this.confirmarEmailNovo(usuarioNovo);
    }

    throw new BadRequestException('Link de confirmacao invalido.');
  }

  private async confirmarEmailAtual(usuario: Usuario) {
    if (!usuario.email_pendente || !usuario.token_troca_email_expira_em) {
      throw new BadRequestException('Solicitacao de troca invalida.');
    }

    if (usuario.token_troca_email_expira_em.getTime() < Date.now()) {
      throw new BadRequestException('Link de autorizacao expirado.');
    }

    const emailEmUso = await this.prisma.usuario.findFirst({
      where: {
        email: usuario.email_pendente,
        id: { not: usuario.id },
      },
      select: { id: true },
    });

    if (emailEmUso) {
      throw new ConflictException('O novo e-mail ja esta em uso.');
    }

    const tokenNovoEmail = randomBytes(32).toString('hex');
    const novoEmail = usuario.email_pendente;
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        token_confirmacao_troca_email: null,
        token_troca_email_expira_em: null,
        token_verificacao_email_pendente: tokenNovoEmail,
        token_email_pendente_expira_em: new Date(Date.now() + 30 * 60 * 1000),
      },
    });

    await this.emailService.sendPendingEmailVerification({
      email: novoEmail,
      nome: usuario.nome,
      token: tokenNovoEmail,
      emailAtual: usuario.email,
    });

    return {
      message:
        'Troca autorizada. Enviamos a confirmacao final para o novo e-mail.',
    };
  }

  private async confirmarEmailNovo(usuario: Usuario) {
    if (!usuario.email_pendente || !usuario.token_email_pendente_expira_em) {
      throw new BadRequestException('Verificacao do novo e-mail invalida.');
    }

    if (usuario.token_email_pendente_expira_em.getTime() < Date.now()) {
      throw new BadRequestException('Link do novo e-mail expirado.');
    }

    const emailEmUso = await this.prisma.usuario.findFirst({
      where: {
        email: usuario.email_pendente,
        id: { not: usuario.id },
      },
      select: { id: true },
    });

    if (emailEmUso) {
      throw new ConflictException('O novo e-mail ja esta em uso.');
    }

    const novoEmail = usuario.email_pendente;
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: {
        email: novoEmail,
        email_verificado: true,
        email_pendente: null,
        token_confirmacao_troca_email: null,
        token_troca_email_expira_em: null,
        token_verificacao_email_pendente: null,
        token_email_pendente_expira_em: null,
      },
    });

    return {
      message: 'Novo e-mail confirmado e alterado com sucesso.',
    };
  }

  async atualizarSenha(idUsuario: string, dto: AtualizarSenhaDto) {
    if (dto.novaSenha !== dto.confirmarSenha) {
      throw new BadRequestException('As novas senhas nao conferem.');
    }

    const usuario = await this.buscarUsuarioComSenha(idUsuario);
    await this.validarSenha(usuario.senha_hash, dto.senhaAtual);

    if (await bcrypt.compare(dto.novaSenha, usuario.senha_hash)) {
      throw new BadRequestException(
        'A nova senha deve ser diferente da senha atual.',
      );
    }

    await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: {
        senha_hash: await bcrypt.hash(dto.novaSenha, 10),
        bloqueado: false,
        tentativas_login: 0,
        token_redefinicao_senha: null,
        token_redefinicao_expira_em: null,
      },
    });

    return { message: 'Senha atualizada com sucesso.' };
  }

  async atualizarPreferencias(
    idUsuario: string,
    dto: AtualizarPreferenciasDto,
  ) {
    const preferencias = await this.prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: {
        id_usuario: idUsuario,
        receber_notificacoes: dto.receberNotificacoes,
        mostrar_no_ranking: dto.mostrarNoRanking,
        ocultar_historico: dto.ocultarHistorico,
      },
      update: {
        receber_notificacoes: dto.receberNotificacoes,
        mostrar_no_ranking: dto.mostrarNoRanking,
        ocultar_historico: dto.ocultarHistorico,
      },
    });

    return {
      message: 'Preferencias atualizadas.',
      preferencias: {
        receberNotificacoes: preferencias.receber_notificacoes,
        mostrarNoRanking: preferencias.mostrar_no_ranking,
        ocultarHistorico: preferencias.ocultar_historico,
      },
    };
  }

  async atualizarBiografia(idUsuario: string, dto: AtualizarBiografiaDto) {
    const perfil = await this.prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: { id_usuario: idUsuario, biografia: dto.biografia.trim() },
      update: { biografia: dto.biografia.trim() },
    });

    return {
      message: 'Biografia atualizada.',
      biografia: perfil.biografia,
    };
  }

  async listarMolduras(idUsuario: string) {
    const molduras = await this.prisma.moldura.findMany({
      where: { ativo: true },
      include: {
        usuarios: {
          where: { id_usuario: idUsuario },
          select: { id_usuario: true },
        },
      },
      orderBy: [{ preco_moedas: 'asc' }, { nome: 'asc' }],
    });

    return molduras.map((moldura) => ({
      id: moldura.id,
      nome: moldura.nome,
      descricao: moldura.descricao,
      classeCss: moldura.classe_css,
      precoMoedas: moldura.preco_moedas,
      obtida: moldura.usuarios.length > 0,
    }));
  }

  async selecionarMoldura(idUsuario: string, dto: SelecionarMolduraDto) {
    const posse = await this.prisma.usuarioMoldura.findUnique({
      where: {
        id_usuario_id_moldura: {
          id_usuario: idUsuario,
          id_moldura: dto.idMoldura,
        },
      },
      include: { moldura: true },
    });

    if (!posse) {
      throw new ForbiddenException('Esta moldura nao pertence ao jogador.');
    }

    await this.prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: { id_usuario: idUsuario, id_moldura: dto.idMoldura },
      update: { id_moldura: dto.idMoldura },
    });

    return {
      message: 'Moldura selecionada.',
      moldura: posse.moldura.nome,
      molduraClasse: posse.moldura.classe_css,
    };
  }

  async atualizarImagem(
    idUsuario: string,
    tipo: 'avatar' | 'banner',
    url: string,
  ) {
    await this.prisma.perfilUsuario.upsert({
      where: { id_usuario: idUsuario },
      create: {
        id_usuario: idUsuario,
        ...(tipo === 'avatar' ? { avatar_url: url } : { banner_url: url }),
      },
      update: tipo === 'avatar' ? { avatar_url: url } : { banner_url: url },
    });

    return {
      message: tipo === 'avatar' ? 'Avatar atualizado.' : 'Banner atualizado.',
      url,
    };
  }

  async desativarConta(idUsuario: string, dto: ConfirmarSenhaDto) {
    const usuario = await this.buscarUsuarioComSenha(idUsuario);
    await this.validarSenha(usuario.senha_hash, dto.senhaAtual);

    await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: {
        ativo: false,
        desativado_em: new Date(),
      },
    });

    return { message: 'Conta desativada. Entre em contato para reativar.' };
  }

  async solicitarExclusao(idUsuario: string, dto: ConfirmarSenhaDto) {
    const usuario = await this.buscarUsuarioComSenha(idUsuario);
    await this.validarSenha(usuario.senha_hash, dto.senhaAtual);
    const executarApos = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.prisma.$transaction([
      this.prisma.solicitacaoExclusao.updateMany({
        where: { id_usuario: idUsuario, status: 'AGENDADA' },
        data: { status: 'CANCELADA', cancelada_em: new Date() },
      }),
      this.prisma.solicitacaoExclusao.create({
        data: {
          id_usuario: idUsuario,
          executar_apos: executarApos,
        },
      }),
      this.prisma.usuario.update({
        where: { id: idUsuario },
        data: { exclusao_agendada_em: executarApos },
      }),
    ]);

    return {
      message: 'Exclusao agendada. Voce tem 30 dias para cancelar.',
      executarApos: this.formatarDataBrasil(executarApos),
    };
  }

  async cancelarExclusao(idUsuario: string) {
    const resultado = await this.prisma.solicitacaoExclusao.updateMany({
      where: { id_usuario: idUsuario, status: 'AGENDADA' },
      data: { status: 'CANCELADA', cancelada_em: new Date() },
    });

    if (!resultado.count) {
      throw new BadRequestException('Nao existe exclusao agendada.');
    }

    await this.prisma.usuario.update({
      where: { id: idUsuario },
      data: { exclusao_agendada_em: null },
    });

    return { message: 'Exclusao cancelada.' };
  }

  private async processarExclusoesPendentes() {
    const solicitacoes = await this.prisma.solicitacaoExclusao.findMany({
      where: {
        status: 'AGENDADA',
        executar_apos: { lte: new Date() },
      },
      select: { id: true, id_usuario: true },
      take: 100,
    });

    for (const solicitacao of solicitacoes) {
      const identificador = solicitacao.id_usuario.replaceAll('-', '');
      const senhaAleatoria = await bcrypt.hash(
        randomBytes(48).toString('hex'),
        10,
      );

      await this.prisma.$transaction([
        this.prisma.provedorUsuario.deleteMany({
          where: { id_usuario: solicitacao.id_usuario },
        }),
        this.prisma.perfilUsuario.updateMany({
          where: { id_usuario: solicitacao.id_usuario },
          data: {
            biografia: '',
            avatar_url: null,
            banner_url: null,
            receber_notificacoes: false,
            mostrar_no_ranking: false,
            ocultar_historico: true,
          },
        }),
        this.prisma.usuario.update({
          where: { id: solicitacao.id_usuario },
          data: {
            nome: 'Usuario excluido',
            email: `excluido-${identificador}@anon.invalid`,
            senha_hash: senhaAleatoria,
            email_verificado: false,
            token_verificacao_email: null,
            token_verificacao_expira_em: null,
            token_redefinicao_senha: null,
            token_redefinicao_expira_em: null,
            email_pendente: null,
            token_confirmacao_troca_email: null,
            token_troca_email_expira_em: null,
            token_verificacao_email_pendente: null,
            token_email_pendente_expira_em: null,
            ativo: false,
            excluido_em: new Date(),
            exclusao_agendada_em: null,
          },
        }),
        this.prisma.solicitacaoExclusao.update({
          where: { id: solicitacao.id },
          data: { status: 'EXECUTADA', executada_em: new Date() },
        }),
      ]);
    }
  }

  private buscarUsuarioComSenha(idUsuario: string) {
    return this.prisma.usuario
      .findFirstOrThrow({
        where: {
          id: idUsuario,
          excluido_em: null,
        },
        select: {
          id: true,
          nome: true,
          email: true,
          senha_hash: true,
        },
      })
      .catch(() => {
        throw new NotFoundException('Usuario nao encontrado.');
      });
  }

  private async validarSenha(senhaHash: string, senha: string) {
    if (!(await bcrypt.compare(senha, senhaHash))) {
      throw new UnauthorizedException('Senha atual incorreta.');
    }
  }

  private formatarIdUsuario(id: string) {
    return `#AOD-${id.replaceAll('-', '').slice(-4).toUpperCase()}`;
  }

  private formatarDataBrasil(data: Date) {
    return new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })
      .format(data)
      .replace(',', '');
  }
}
