import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { AdminCloudinaryService } from './admin-cloudinary.service';
import { obterValorVendaPorRaridade } from '../../jogo/cartas/valor-venda-raridade';
import {
  CreateAdminCartaDto,
  UpdateAdminCartaDto,
} from '../dto/admin-carta.dto';

const cartaInclude = {
  classe: true,
  habilidades: {
    orderBy: { ordem: 'asc' as const },
    include: { habilidade: true },
  },
} satisfies Prisma.CartaInclude;

type CartaComHabilidades = Prisma.CartaGetPayload<{
  include: typeof cartaInclude;
}>;

@Injectable()
export class AdminCartasService {
  constructor(private readonly prisma: PrismaService, private readonly imagens: AdminCloudinaryService) {}

  async historico(filtros: { pagina?: string; busca?: string; acao?: string }) {
    const pagina = Math.max(1, Math.min(100000, Number.parseInt(filtros.pagina ?? '1', 10) || 1));
    const porPagina = 20;
    const acao = ['CRIADA', 'ALTERADA', 'REMOVIDA', 'RESTAURADA'].includes(filtros.acao ?? '')
      ? filtros.acao
      : undefined;
    const where: Prisma.LogAdminCartaWhereInput = {
      ...(acao ? { acao } : {}),
      ...(filtros.busca?.trim()
        ? { nome_carta: { contains: filtros.busca.trim().slice(0, 150), mode: 'insensitive' } }
        : {}),
    };
    const [total, registros] = await Promise.all([
      this.prisma.logAdminCarta.count({ where }),
      this.prisma.logAdminCarta.findMany({
        where,
        orderBy: [{ criado_em: 'desc' }, { id: 'desc' }],
        skip: (pagina - 1) * porPagina,
        take: porPagina,
        include: { admin: { select: { nome: true, email: true } } },
      }),
    ]);
    return {
      registros: registros.map((item) => ({
        id: item.id,
        idCarta: item.id_carta,
        nomeCarta: item.nome_carta,
        acao: item.acao,
        alteracoes: item.alteracoes,
        criadoEm: item.criado_em,
        autor: item.admin ? { nome: item.admin.nome, email: item.admin.email } : null,
      })),
      paginacao: { pagina, porPagina, total, totalPaginas: Math.max(1, Math.ceil(total / porPagina)) },
    };
  }

  async listar(filtros: {
    busca?: string;
    raridade?: string;
    elemento?: string;
    status?: string;
    classe?: string;
    periodo?: string;
    ordem?: string;
  }) {
    const q = filtros.busca?.trim();
    const status = filtros.status?.trim();
    const classe = filtros.classe?.trim();
    const criadoDepoisDe = this.obterInicioPeriodo(filtros.periodo);
    const orderBy = this.obterOrdenacao(filtros.ordem);
    const cartas = await this.prisma.carta.findMany({
      where: {
        ...(status === 'removidas'
          ? { excluido_em: { not: null } }
          : { excluido_em: null }),
        ...(filtros.raridade ? { raridade: filtros.raridade } : {}),
        ...(filtros.elemento ? { elemento: filtros.elemento } : {}),
        ...(classe
          ? { classe: { nome: { equals: classe, mode: 'insensitive' } } }
          : {}),
        ...(criadoDepoisDe ? { criado_em: { gte: criadoDepoisDe } } : {}),
        ...(status === 'ativas' ? { ativo: true } : {}),
        ...(status === 'inativas' ? { ativo: false } : {}),
        ...(q
          ? {
              OR: [
                { nome: { contains: q, mode: 'insensitive' } },
                { elemento: { contains: q, mode: 'insensitive' } },
                { raridade: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy,
      include: cartaInclude,
    });

    const configuracoes = await this.prisma.raridadeCarta.findMany({ select: { codigo: true, valor_venda: true } });
    const valoresVenda = new Map(configuracoes.map((item) => [item.codigo, item.valor_venda]));
    return Promise.all(cartas.map((carta) => this.toResponse(carta, valoresVenda.get(carta.raridade))));
  }

  private obterInicioPeriodo(periodo?: string) {
    const agora = new Date();

    switch (periodo) {
      case '1a':
        agora.setFullYear(agora.getFullYear() - 1);
        return agora;
      case '6m':
        agora.setMonth(agora.getMonth() - 6);
        return agora;
      case '1m':
        agora.setMonth(agora.getMonth() - 1);
        return agora;
      case '1s':
        agora.setDate(agora.getDate() - 7);
        return agora;
      case '24h':
        agora.setHours(agora.getHours() - 24);
        return agora;
      default:
        return undefined;
    }
  }

  private obterOrdenacao(
    ordem?: string,
  ): Prisma.CartaOrderByWithRelationInput[] {
    switch (ordem) {
      case 'antigas':
        return [{ criado_em: 'asc' }, { nome: 'asc' }];
      case 'az':
        return [{ nome: 'asc' }];
      case 'za':
        return [{ nome: 'desc' }];
      default:
        return [{ criado_em: 'desc' }, { nome: 'asc' }];
    }
  }

  async buscar(id: string) {
    const carta = await this.prisma.carta.findFirst({
      where: { id, excluido_em: null },
      include: cartaInclude,
    });

    if (!carta) {
      throw new NotFoundException('Carta não encontrada.');
    }

    return this.toResponse(carta);
  }

  async buscarImpacto(id: string) {
    await this.buscar(id);

    const usuariosComCarta = await this.prisma.inventario.count({
      where: {
        id_carta: id,
        id_usuario: { not: null },
        quantidade: { gt: 0 },
      },
    });

    return { usuariosComCarta };
  }

  async criar(dto: CreateAdminCartaDto, idAdmin?: string) {
    const raridade = await this.validarRaridade(dto.raridade);
    await this.validarHabilidades(dto.habilidadesIds);
    const classe = await this.resolverClasse(dto.idClasse, dto.classe);
    if (!classe) throw new BadRequestException('Selecione uma classe para a carta.');
    const carta = await this.prisma.$transaction(async (tx) => {
      const criada = await tx.carta.create({
        data: this.toCreateData(dto, classe, raridade.valor_venda),
        include: cartaInclude,
      });
      await tx.logAdminCarta.create({
        data: { id_carta: criada.id, nome_carta: criada.nome, acao: 'CRIADA', id_admin: idAdmin },
      });
      return criada;
    });

    return this.toResponse(carta);
  }

  async atualizar(id: string, dto: UpdateAdminCartaDto, idAdmin?: string) {
    const atual = await this.buscar(id);
    const raridade = await this.validarRaridade(dto.raridade ?? atual.raridade);
    await this.validarHabilidades(dto.habilidadesIds);
    const classe =
      dto.idClasse !== undefined || dto.classe !== undefined
        ? await this.resolverClasse(dto.idClasse, dto.classe)
        : undefined;
    if (classe === null || (classe === undefined && !atual.idClasse)) {
      throw new BadRequestException('Selecione uma classe para a carta.');
    }

    if (atual.ativo && dto.ativo === false && !dto.confirmarImpacto) {
      throw new BadRequestException(
        'Confirme o impacto nos usuários antes de desativar a carta.',
      );
    }

    const carta = await this.prisma.$transaction(async (tx) => {
      const editada = await tx.carta.update({
        where: { id },
        data: {
          ...this.toUpdateData(dto, atual.raridade, atual.passiva, classe, raridade.valor_venda),
          atualizado_em: new Date(),
        },
        include: cartaInclude,
      });
      const depois = await this.toResponse(editada);
      const alteracoes = this.obterAlteracoes(atual, depois);
      if (Object.keys(alteracoes).length) {
        await tx.logAdminCarta.create({
          data: { id_carta: id, nome_carta: editada.nome, acao: 'ALTERADA', id_admin: idAdmin, alteracoes: alteracoes as Prisma.InputJsonValue },
        });
      }
      return editada;
    });

    const resposta = await this.toResponse(carta);
    const antigas = new Set([[atual.foto, resposta.foto], [atual.fotoPerfil, resposta.fotoPerfil], [atual.moldura, resposta.moldura]]
      .filter(([antiga, nova]) => antiga && antiga !== nova)
      .map(([antiga]) => antiga as string));
    for (const antiga of antigas) await this.imagens.removerImagemSeNaoUsada(antiga);
    return resposta;
  }

  async remover(id: string, confirmarNome: string, confirmarImpacto: boolean, idAdmin?: string) {
    const atual = await this.buscar(id);

    if (confirmarNome !== atual.nome) {
      throw new BadRequestException(
        'O nome informado não corresponde à carta que será removida.',
      );
    }

    if (!confirmarImpacto) {
      throw new BadRequestException(
        'Confirme o impacto nos usuários antes de remover a carta.',
      );
    }

    const carta = await this.prisma.$transaction(async (tx) => {
      const removida = await tx.carta.update({
        where: { id },
        data: { ativo: false, excluido_em: new Date(), atualizado_em: new Date() },
        include: cartaInclude,
      });
      await tx.logAdminCarta.create({
        data: { id_carta: id, nome_carta: removida.nome, acao: 'REMOVIDA', id_admin: idAdmin },
      });
      return removida;
    });

    return {
      message: 'Carta removida.',
      carta: await this.toResponse(carta),
    };
  }

  private obterAlteracoes(antes: Awaited<ReturnType<AdminCartasService['toResponse']>>, depois: Awaited<ReturnType<AdminCartasService['toResponse']>>) {
    const campos = ['nome', 'elemento', 'raridade', 'idClasse', 'hpBase', 'danoBase', 'defesaBase', 'passiva', 'foto', 'moldura', 'configVisual', 'ativo', 'habilidades'] as const;
    const alteracoes: Record<string, { antes: unknown; depois: unknown }> = {};
    for (const campo of campos) {
      if (JSON.stringify(antes[campo]) !== JSON.stringify(depois[campo])) {
        alteracoes[campo] = { antes: antes[campo] ?? null, depois: depois[campo] ?? null };
      }
    }
    return alteracoes;
  }

  private toCreateData(
    dto: CreateAdminCartaDto,
    classe: { id: string; nome: string } | null,
    valorVenda: number,
  ): Prisma.CartaCreateInput {
    return {
      nome: dto.nome.trim(),
      elemento: dto.elemento,
      raridade: dto.raridade,
      hp_base: dto.hpBase,
      dano_base: dto.danoBase,
      defesa_base: dto.defesaBase,
      passiva: this.buildPassiva(dto, dto.raridade, {}, classe?.nome, valorVenda),
      ...(classe ? { classe: { connect: { id: classe.id } } } : {}),
      foto: dto.foto,
      foto_perfil: dto.fotoPerfil,
      moldura: dto.moldura,
      config_visual: dto.configVisual as Prisma.InputJsonValue | undefined,
      ativo: dto.ativo ?? true,
      habilidades: this.toHabilidadesCreate(dto.habilidadesIds),
    };
  }

  private toUpdateData(
    dto: UpdateAdminCartaDto,
    raridadeAtual: string,
    passivaAtual: Record<string, unknown>,
    classe?: { id: string; nome: string } | null,
    valorVenda?: number,
  ): Prisma.CartaUpdateInput {
    return {
      ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
      ...(dto.elemento !== undefined ? { elemento: dto.elemento } : {}),
      ...(dto.raridade !== undefined ? { raridade: dto.raridade } : {}),
      ...(dto.hpBase !== undefined ? { hp_base: dto.hpBase } : {}),
      ...(dto.danoBase !== undefined ? { dano_base: dto.danoBase } : {}),
      ...(dto.defesaBase !== undefined ? { defesa_base: dto.defesaBase } : {}),
      ...(dto.passiva !== undefined ||
      dto.classe !== undefined ||
      dto.idClasse !== undefined ||
      dto.custo !== undefined ||
      dto.raridade !== undefined
        ? {
            passiva: this.buildPassiva(
              dto,
              dto.raridade ?? raridadeAtual,
              passivaAtual,
              classe?.nome,
              valorVenda,
            ),
          }
        : {}),
      ...(classe !== undefined
        ? classe
          ? { classe: { connect: { id: classe.id } } }
          : { classe: { disconnect: true } }
        : {}),
      ...(dto.foto !== undefined ? { foto: dto.foto } : {}),
      ...(dto.fotoPerfil !== undefined ? { foto_perfil: dto.fotoPerfil } : {}),
      ...(dto.moldura !== undefined ? { moldura: dto.moldura } : {}),
      ...(dto.configVisual !== undefined
        ? { config_visual: dto.configVisual as Prisma.InputJsonValue }
        : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
      ...(dto.habilidadesIds !== undefined
        ? {
            habilidades: {
              deleteMany: {},
              create: this.toHabilidadesCreateItems(dto.habilidadesIds),
            },
          }
        : {}),
    };
  }

  private async validarHabilidades(habilidadesIds?: string[]) {
    if (!habilidadesIds?.length) return;

    const habilidades = await this.prisma.habilidade.findMany({
      where: {
        id: { in: habilidadesIds },
        status: 'PUBLICADA',
      },
      select: { id: true },
    });

    if (habilidades.length !== habilidadesIds.length) {
      throw new BadRequestException(
        'Todas as habilidades da carta precisam existir e estar publicadas.',
      );
    }
  }

  private async validarRaridade(codigo: string) {
    const raridade = await this.prisma.raridadeCarta.findUnique({ where: { codigo } });
    if (!raridade) throw new BadRequestException('Raridade não cadastrada.');
    return raridade;
  }

  private toHabilidadesCreate(habilidadesIds?: string[]) {
    if (habilidadesIds === undefined) return undefined;
    return { create: this.toHabilidadesCreateItems(habilidadesIds) };
  }

  private toHabilidadesCreateItems(habilidadesIds: string[]) {
    return habilidadesIds.map((id, index) => ({
      ordem: index + 1,
      habilidade: { connect: { id } },
    }));
  }

  private buildPassiva(
    dto: {
      passiva?: Record<string, unknown>;
      classe?: string;
      idClasse?: string | null;
    },
    raridade = 'N',
    passivaAtual: Record<string, unknown> = {},
    nomeClasse?: string,
    valorVenda?: number,
  ) {
    return {
      ...passivaAtual,
      ...(dto.passiva ?? {}),
      ...(dto.classe !== undefined || dto.idClasse !== undefined
        ? { classe: nomeClasse ?? null }
        : {}),
      custo: valorVenda ?? obterValorVendaPorRaridade(raridade),
    };
  }

  private async toResponse(carta: CartaComHabilidades, valorVenda?: number) {
    const configuracaoRaridade = valorVenda === undefined
      ? await this.prisma.raridadeCarta.findUnique({ where: { codigo: carta.raridade } })
      : { valor_venda: valorVenda };
    const passiva =
      carta.passiva &&
      typeof carta.passiva === 'object' &&
      !Array.isArray(carta.passiva)
        ? (carta.passiva as Record<string, unknown>)
        : {};

    return {
      id: carta.id,
      nome: carta.nome,
      elemento: carta.elemento,
      raridade: carta.raridade,
      classe:
        carta.classe?.nome ??
        (typeof passiva.classe === 'string' ? passiva.classe : null),
      idClasse: carta.id_classe,
      classeDetalhes: carta.classe
        ? {
            id: carta.classe.id,
            nome: carta.classe.nome,
            prioridadeAtaque: carta.classe.prioridade_ataque,
            modificadorHp: carta.classe.modificador_hp,
            modificadorAtaque: carta.classe.modificador_ataque,
            modificadorDefesa: carta.classe.modificador_defesa,
          }
        : null,
      custo: configuracaoRaridade?.valor_venda ?? obterValorVendaPorRaridade(carta.raridade),
      hpBase: carta.hp_base,
      danoBase: carta.dano_base,
      defesaBase: carta.defesa_base,
      passiva: { ...passiva, custo: configuracaoRaridade?.valor_venda ?? obterValorVendaPorRaridade(carta.raridade) },
      foto: carta.foto,
      fotoPerfil: carta.foto_perfil,
      moldura: carta.moldura,
      configVisual: carta.config_visual,
      ativo: Boolean(carta.ativo),
      excluidoEm: carta.excluido_em,
      criadoEm: carta.criado_em,
      atualizadoEm: carta.atualizado_em,
      habilidades: (carta.habilidades ?? []).map((vinculo) => ({
        id: vinculo.habilidade.id,
        nome: vinculo.habilidade.nome,
        descricao: vinculo.habilidade.descricao,
        tipoEfeito: vinculo.habilidade.tipo_efeito,
        gatilho: vinculo.habilidade.gatilho,
        alvo: vinculo.habilidade.alvo,
        status: vinculo.habilidade.status,
        versao: vinculo.habilidade.versao,
        ordem: vinculo.ordem,
      })),
    };
  }

  private async resolverClasse(idClasse?: string | null, nomeClasse?: string) {
    if (!idClasse && !nomeClasse?.trim()) return null;
    const classe = await this.prisma.classeCarta.findFirst({
      where: idClasse
        ? { id: idClasse, ativo: true }
        : {
            nome: { equals: nomeClasse!.trim(), mode: 'insensitive' },
            ativo: true,
          },
      select: { id: true, nome: true },
    });
    if (!classe) throw new BadRequestException('Selecione uma classe ativa.');
    return classe;
  }
}
