import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import { obterValorVendaPorRaridade } from '../../jogo/valor-venda-raridade';
import {
  CreateAdminCartaDto,
  UpdateAdminCartaDto,
} from '../dto/admin-carta.dto';

const cartaInclude = {
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
  constructor(private readonly prisma: PrismaService) {}

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
        ...(classe ? { passiva: { path: ['classe'], equals: classe } } : {}),
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

    return cartas.map((carta) => this.toResponse(carta));
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

  async criar(dto: CreateAdminCartaDto) {
    await this.validarHabilidades(dto.habilidadesIds);
    const carta = await this.prisma.carta.create({
      data: this.toCreateData(dto),
      include: cartaInclude,
    });

    return this.toResponse(carta);
  }

  async atualizar(id: string, dto: UpdateAdminCartaDto) {
    const atual = await this.buscar(id);
    await this.validarHabilidades(dto.habilidadesIds);

    if (atual.ativo && dto.ativo === false && !dto.confirmarImpacto) {
      throw new BadRequestException(
        'Confirme o impacto nos usuários antes de desativar a carta.',
      );
    }

    const carta = await this.prisma.carta.update({
      where: { id },
      data: {
        ...this.toUpdateData(dto, atual.raridade, atual.passiva),
        atualizado_em: new Date(),
      },
      include: cartaInclude,
    });

    return this.toResponse(carta);
  }

  async remover(id: string, confirmarNome: string, confirmarImpacto: boolean) {
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

    const carta = await this.prisma.carta.update({
      where: { id },
      data: {
        ativo: false,
        excluido_em: new Date(),
        atualizado_em: new Date(),
      },
      include: cartaInclude,
    });

    return {
      message: 'Carta removida.',
      carta: this.toResponse(carta),
    };
  }

  private toCreateData(dto: CreateAdminCartaDto): Prisma.CartaCreateInput {
    return {
      nome: dto.nome.trim(),
      elemento: dto.elemento,
      raridade: dto.raridade,
      hp_base: dto.hpBase,
      dano_base: dto.danoBase,
      defesa_base: dto.defesaBase,
      passiva: this.buildPassiva(dto, dto.raridade),
      foto: dto.foto,
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
      dto.custo !== undefined ||
      dto.raridade !== undefined
        ? {
            passiva: this.buildPassiva(
              dto,
              dto.raridade ?? raridadeAtual,
              passivaAtual,
            ),
          }
        : {}),
      ...(dto.foto !== undefined ? { foto: dto.foto } : {}),
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
    },
    raridade = 'N',
    passivaAtual: Record<string, unknown> = {},
  ) {
    return {
      ...passivaAtual,
      ...(dto.passiva ?? {}),
      ...(dto.classe !== undefined ? { classe: dto.classe } : {}),
      custo: obterValorVendaPorRaridade(raridade),
    };
  }

  private toResponse(carta: CartaComHabilidades) {
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
      classe: typeof passiva.classe === 'string' ? passiva.classe : null,
      custo: obterValorVendaPorRaridade(carta.raridade),
      hpBase: carta.hp_base,
      danoBase: carta.dano_base,
      defesaBase: carta.defesa_base,
      passiva,
      foto: carta.foto,
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
}
