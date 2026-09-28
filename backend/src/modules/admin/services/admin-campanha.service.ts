import { BadRequestException, Injectable } from '@nestjs/common';
import type { ProdutoExpedicao } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  AtualizarAdminCampanhaDto,
  AtualizarBossDto,
  SalvarProdutoExpedicaoDto,
} from '../dto/admin-campanha.dto';

@Injectable()
export class AdminCampanhaService {
  constructor(private readonly prisma: PrismaService) {}

  async obterPainel() {
    const [
      configuracao,
      total,
      ativas,
      concluidas,
      falhas,
      abandonadas,
      recentes,
      produtos,
    ] = await Promise.all([
      this.obterConfiguracao(),
      this.prisma.expedicao.count(),
      this.prisma.expedicao.count({ where: { status: 'EM_ANDAMENTO' } }),
      this.prisma.expedicao.count({ where: { status: 'CONCLUIDA' } }),
      this.prisma.expedicao.count({ where: { status: 'FALHOU' } }),
      this.prisma.expedicao.count({ where: { status: 'ABANDONADA' } }),
      this.prisma.expedicao.findMany({
        take: 12,
        orderBy: { criado_em: 'desc' },
        include: {
          usuario: { select: { nome: true, email: true } },
          deck: { select: { nome: true } },
          partidas: { select: { recompensa_rubys: true } },
        },
      }),
      this.prisma.produtoExpedicao.findMany({
        orderBy: [{ ativo: 'desc' }, { criado_em: 'desc' }],
      }),
    ]);

    return {
      configuracao: this.formatarConfiguracao(configuracao),
      boss: this.formatarBoss(configuracao),
      metricas: { total, ativas, concluidas, falhas, abandonadas },
      recentes: recentes.map((expedicao) => ({
        id: expedicao.id,
        jogador: expedicao.usuario.nome,
        email: expedicao.usuario.email,
        deck: expedicao.deck.nome,
        status: expedicao.status,
        etapaAtual: expedicao.etapa_atual,
        rubys: expedicao.partidas.reduce(
          (soma, partida) => soma + partida.recompensa_rubys,
          0,
        ),
        criadoEm: expedicao.criado_em,
        finalizadoEm: expedicao.finalizado_em,
      })),
      produtos: produtos.map((produto) => this.formatarProduto(produto)),
    };
  }

  async criarProduto(dto: SalvarProdutoExpedicaoDto) {
    await this.validarProduto(dto);
    const produto = await this.prisma.produtoExpedicao.create({
      data: this.dadosProduto(dto),
    });
    return {
      message: 'Produto de expedição criado.',
      produto: this.formatarProduto(produto),
    };
  }

  async atualizarProduto(id: string, dto: SalvarProdutoExpedicaoDto) {
    await this.validarProduto(dto);
    const existe = await this.prisma.produtoExpedicao.findUnique({
      where: { id },
    });
    if (!existe)
      throw new BadRequestException('Produto de expedição não encontrado.');
    if (existe.ativo && !dto.ativo) await this.validarOutroProdutoAtivo(id);
    const produto = await this.prisma.produtoExpedicao.update({
      where: { id },
      data: { ...this.dadosProduto(dto), atualizado_em: new Date() },
    });
    return {
      message: 'Produto de expedição atualizado.',
      produto: this.formatarProduto(produto),
    };
  }

  async excluirProduto(id: string) {
    const produto = await this.prisma.produtoExpedicao.findUnique({
      where: { id },
    });
    if (!produto)
      throw new BadRequestException('Produto de expedição não encontrado.');
    if (produto.ativo) await this.validarOutroProdutoAtivo(id);
    await this.prisma.produtoExpedicao.delete({ where: { id } });
    return { message: 'Produto de expedição excluído.' };
  }

  private async validarOutroProdutoAtivo(id: string) {
    const outros = await this.prisma.produtoExpedicao.count({
      where: { ativo: true, id: { not: id } },
    });
    if (!outros)
      throw new BadRequestException(
        'Mantenha ao menos um produto de expedição ativo.',
      );
  }

  private async validarProduto(dto: SalvarProdutoExpedicaoDto) {
    if (!dto.nome.trim() || !dto.descricao.trim() || !dto.tema.trim())
      throw new BadRequestException('Preencha nome, descrição e tema.');
    if (
      dto.inicioEm &&
      dto.fimEm &&
      new Date(dto.inicioEm) >= new Date(dto.fimEm)
    )
      throw new BadRequestException(
        'O fim do evento deve ocorrer depois do início.',
      );
    const ids = [...new Set(dto.bossCartas)];
    const total = await this.prisma.carta.count({
      where: { id: { in: ids }, ativo: true, excluido_em: null },
    });
    if (total !== ids.length)
      throw new BadRequestException('O boss contém cartas indisponíveis.');
  }

  private dadosProduto(dto: SalvarProdutoExpedicaoDto) {
    return {
      nome: dto.nome.trim(),
      descricao: dto.descricao.trim(),
      tema: dto.tema.trim().toUpperCase(),
      tipo: dto.tipo,
      ativo: dto.ativo,
      peso: dto.peso,
      inicio_em: dto.inicioEm ? new Date(dto.inicioEm) : null,
      fim_em: dto.fimEm ? new Date(dto.fimEm) : null,
      recompensa_facil: dto.recompensaFacil,
      recompensa_media: dto.recompensaMedia,
      recompensa_dificil: dto.recompensaDificil,
      recompensa_chefe: dto.recompensaChefe,
      percentual_mantido_derrota: dto.percentualMantidoDerrota,
      boss_nome: dto.bossNome.trim(),
      boss_personalidade: dto.bossPersonalidade.trim(),
      boss_provocacao: dto.bossProvocacao.trim(),
      boss_perguntas: dto.bossPerguntas.map((item) => item.trim()),
      boss_cartas: [...new Set(dto.bossCartas)],
    };
  }

  private formatarProduto(produto: ProdutoExpedicao) {
    return {
      id: produto.id,
      nome: produto.nome,
      descricao: produto.descricao,
      tema: produto.tema,
      tipo: produto.tipo,
      ativo: produto.ativo,
      peso: produto.peso,
      inicioEm: produto.inicio_em,
      fimEm: produto.fim_em,
      recompensaFacil: produto.recompensa_facil,
      recompensaMedia: produto.recompensa_media,
      recompensaDificil: produto.recompensa_dificil,
      recompensaChefe: produto.recompensa_chefe,
      percentualMantidoDerrota: produto.percentual_mantido_derrota,
      bossNome: produto.boss_nome,
      bossPersonalidade: produto.boss_personalidade,
      bossProvocacao: produto.boss_provocacao,
      bossPerguntas: produto.boss_perguntas,
      bossCartas: produto.boss_cartas,
      criadoEm: produto.criado_em,
      atualizadoEm: produto.atualizado_em,
    };
  }

  async atualizar(dto: AtualizarAdminCampanhaDto) {
    const configuracao = await this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        ativa: dto.ativa,
        recompensa_facil: dto.recompensaFacil,
        recompensa_media: dto.recompensaMedia,
        recompensa_dificil: dto.recompensaDificil,
        recompensa_chefe: dto.recompensaChefe,
        percentual_mantido_derrota: dto.percentualMantidoDerrota,
      },
      update: {
        ativa: dto.ativa,
        recompensa_facil: dto.recompensaFacil,
        recompensa_media: dto.recompensaMedia,
        recompensa_dificil: dto.recompensaDificil,
        recompensa_chefe: dto.recompensaChefe,
        percentual_mantido_derrota: dto.percentualMantidoDerrota,
        atualizado_em: new Date(),
      },
    });

    return {
      message: 'Configuração da campanha atualizada.',
      configuracao: this.formatarConfiguracao(configuracao),
    };
  }

  async atualizarBoss(dto: AtualizarBossDto) {
    const ids = [...new Set(dto.cartas)];
    if (ids.length > 0 && ids.length < 6)
      throw new BadRequestException(
        'Selecione pelo menos seis cartas ou deixe vazio para usar todas as cartas ativas.',
      );
    if (
      !dto.nome.trim() ||
      !dto.personalidade.trim() ||
      !dto.provocacao.trim() ||
      dto.perguntas.some((item) => !item.trim())
    )
      throw new BadRequestException(
        'Preencha nome, personalidade, provocação e as quatro perguntas.',
      );
    const total = await this.prisma.carta.count({
      where: { id: { in: ids }, ativo: true, excluido_em: null },
    });
    if (total !== ids.length)
      throw new BadRequestException('A seleção contém cartas indisponíveis.');
    const configuracao = await this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: {
        id: 1,
        boss_nome: dto.nome.trim(),
        boss_personalidade: dto.personalidade.trim(),
        boss_provocacao: dto.provocacao.trim(),
        boss_perguntas: dto.perguntas.map((item) => item.trim()),
        boss_cartas: ids,
      },
      update: {
        boss_nome: dto.nome.trim(),
        boss_personalidade: dto.personalidade.trim(),
        boss_provocacao: dto.provocacao.trim(),
        boss_perguntas: dto.perguntas.map((item) => item.trim()),
        boss_cartas: ids,
        atualizado_em: new Date(),
      },
    });
    return {
      message: 'Boss final atualizado.',
      boss: this.formatarBoss(configuracao),
    };
  }

  private obterConfiguracao() {
    return this.prisma.configuracaoCampanha.upsert({
      where: { id: 1 },
      create: { id: 1 },
      update: {},
    });
  }

  private formatarConfiguracao(configuracao: {
    ativa: boolean;
    recompensa_facil: number;
    recompensa_media: number;
    recompensa_dificil: number;
    recompensa_chefe: number;
    percentual_mantido_derrota: number;
    atualizado_em: Date;
  }) {
    return {
      ativa: configuracao.ativa,
      recompensaFacil: configuracao.recompensa_facil,
      recompensaMedia: configuracao.recompensa_media,
      recompensaDificil: configuracao.recompensa_dificil,
      recompensaChefe: configuracao.recompensa_chefe,
      percentualMantidoDerrota: configuracao.percentual_mantido_derrota,
      atualizadoEm: configuracao.atualizado_em,
    };
  }

  private formatarBoss(configuracao: {
    boss_nome: string;
    boss_personalidade: string;
    boss_provocacao: string;
    boss_perguntas: string[];
    boss_cartas: string[];
  }) {
    return {
      nome: configuracao.boss_nome,
      personalidade: configuracao.boss_personalidade,
      provocacao: configuracao.boss_provocacao,
      perguntas: configuracao.boss_perguntas,
      cartas: configuracao.boss_cartas,
    };
  }
}
