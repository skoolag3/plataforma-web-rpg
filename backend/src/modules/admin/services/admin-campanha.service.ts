import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma, type ProdutoExpedicao } from '@prisma/client';
import { secoesPadraoCampanha, type SecaoCampanha } from '../../jogo/expedicao/expedicao.trilha';
import { PrismaService } from '../../../database/prisma.service';
import {
  AtualizarAdminCampanhaDto,
  AtualizarBossDto,
  SalvarProdutoExpedicaoDto,
  CriarTemaExpedicaoDto,
} from '../dto/admin-campanha.dto';

@Injectable()
export class AdminCampanhaService {
  constructor(private readonly prisma: PrismaService) {}

  async obterPainel() {
    const [configuracao, produtos, temas, cartas] = await Promise.all([
      this.obterConfiguracao(),
      this.prisma.produtoExpedicao.findMany({
        orderBy: [{ ativo: 'desc' }, { criado_em: 'desc' }],
      }),
      this.prisma.temaExpedicao.findMany({ orderBy: { nome: 'asc' } }),
      this.prisma.carta.findMany({
        where: { ativo: true, excluido_em: null },
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' },
      }),
    ]);

    return {
      configuracao: this.formatarConfiguracao(configuracao),
      boss: this.formatarBoss(configuracao),
      produtos: produtos.map((produto) => this.formatarProduto(produto)),
      temas: temas.map((tema) => ({ nome: tema.nome })),
      cartas,
    };
  }

  async criarTema(dto: CriarTemaExpedicaoDto) {
    const nome = dto.nome.trim().toUpperCase();
    if (!nome) throw new BadRequestException('Informe o nome do tema.');
    const existente = await this.prisma.temaExpedicao.findUnique({
      where: { nome },
    });
    if (existente) throw new BadRequestException('Este tema já existe.');
    const tema = await this.prisma.temaExpedicao.create({ data: { nome } });
    return { message: 'Tema criado.', tema: { nome: tema.nome } };
  }

  async obterExpedicoes(paginaSolicitada: number) {
    const porPagina = 12;
    const [total, ativas, concluidas, falhas, abandonadas] = await Promise.all([
      this.prisma.expedicao.count(),
      this.prisma.expedicao.count({ where: { status: 'EM_ANDAMENTO' } }),
      this.prisma.expedicao.count({ where: { status: 'CONCLUIDA' } }),
      this.prisma.expedicao.count({ where: { status: 'FALHOU' } }),
      this.prisma.expedicao.count({ where: { status: 'ABANDONADA' } }),
    ]);
    const totalPaginas = Math.max(1, Math.ceil(total / porPagina));
    const pagina = Math.min(Math.max(1, paginaSolicitada), totalPaginas);
    const expedicoes = await this.prisma.expedicao.findMany({
      skip: (pagina - 1) * porPagina,
      take: porPagina,
      orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
      include: {
        usuario: { select: { nome: true, email: true } },
        deck: { select: { nome: true } },
        partidas: { select: { recompensa_rubys: true } },
      },
    });

    return {
      metricas: { total, ativas, concluidas, falhas, abandonadas },
      paginacao: { pagina, porPagina, total, totalPaginas },
      expedicoes: expedicoes.map((expedicao) => ({
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
    if (dto.secoes.at(-1)?.tipo !== 'BOSS' || dto.secoes.slice(0, -1).some(
      (secao) => secao.tipo !== 'BATALHA' || !secao.caminhos?.length,
    )) throw new BadRequestException('Configure caminhos de batalha e deixe o boss na última seção.');
    for (const secao of dto.secoes.slice(0, -1)) {
      for (const caminho of secao.caminhos ?? []) {
        if (caminho.modoCartas !== 'MANUAL') continue;
        const quantidade = caminho.quantidadeCartas ?? 3;
        if (new Set(caminho.cartas).size !== caminho.cartas.length ||
          (caminho.mixed ? caminho.cartas.length < quantidade : caminho.cartas.length !== quantidade)) {
          throw new BadRequestException('A seleção manual deve ter a quantidade configurada; no mixed, pelo menos essa quantidade.');
        }
      }
    }
    if (!dto.nome.trim() || !dto.descricao.trim() || !dto.tema.trim())
      throw new BadRequestException('Preencha nome, descrição e tema.');
    const tema = await this.prisma.temaExpedicao.findUnique({
      where: { nome: dto.tema.trim().toUpperCase() },
    });
    if (!tema) throw new BadRequestException('Escolha um tema cadastrado.');
    if (
      dto.inicioEm &&
      dto.fimEm &&
      new Date(dto.inicioEm) >= new Date(dto.fimEm)
    )
      throw new BadRequestException(
        'O fim do evento deve ocorrer depois do início.',
      );
    const ids = [...new Set([
      ...dto.bossCartas,
      ...dto.secoes.flatMap((secao) => secao.caminhos?.flatMap((caminho) => caminho.cartas) ?? []),
    ])];
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
      secoes: dto.secoes as unknown as Prisma.InputJsonValue,
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
      secoes: Array.isArray(produto.secoes) && produto.secoes.length
        ? produto.secoes as SecaoCampanha[]
        : secoesPadraoCampanha({
            percentualMantidoDerrota: produto.percentual_mantido_derrota,
            recompensas: {
              FACIL: produto.recompensa_facil, MEDIA: produto.recompensa_media,
              DIFICIL: produto.recompensa_dificil, CHEFE: produto.recompensa_chefe,
            },
          }),
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
