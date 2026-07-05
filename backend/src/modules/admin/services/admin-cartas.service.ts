import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import {
  CreateAdminCartaDto,
  UpdateAdminCartaDto,
} from '../dto/admin-carta.dto';

@Injectable()
export class AdminCartasService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: {
    busca?: string;
    raridade?: string;
    elemento?: string;
    status?: string;
  }) {
    const q = filtros.busca?.trim();
    const status = filtros.status?.trim();
    const cartas = await this.prisma.carta.findMany({
      where: {
        ...(status === 'removidas'
          ? { excluido_em: { not: null } }
          : { excluido_em: null }),
        ...(filtros.raridade ? { raridade: filtros.raridade } : {}),
        ...(filtros.elemento ? { elemento: filtros.elemento } : {}),
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
      orderBy: [{ criado_em: 'desc' }, { nome: 'asc' }],
    });

    return cartas.map((carta) => this.toResponse(carta));
  }

  async buscar(id: string) {
    const carta = await this.prisma.carta.findFirst({
      where: { id, excluido_em: null },
    });

    if (!carta) {
      throw new NotFoundException('Carta nao encontrada.');
    }

    return this.toResponse(carta);
  }

  async criar(dto: CreateAdminCartaDto) {
    const carta = await this.prisma.carta.create({
      data: this.toCreateData(dto),
    });

    return this.toResponse(carta);
  }

  async atualizar(id: string, dto: UpdateAdminCartaDto) {
    await this.buscar(id);

    const carta = await this.prisma.carta.update({
      where: { id },
      data: {
        ...this.toUpdateData(dto),
        atualizado_em: new Date(),
      },
    });

    return this.toResponse(carta);
  }

  async remover(id: string) {
    await this.buscar(id);

    const carta = await this.prisma.carta.update({
      where: { id },
      data: {
        ativo: false,
        excluido_em: new Date(),
        atualizado_em: new Date(),
      },
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
      passiva: this.buildPassiva(dto),
      foto: dto.foto,
      moldura: dto.moldura,
      ativo: dto.ativo ?? true,
    };
  }

  private toUpdateData(dto: UpdateAdminCartaDto): Prisma.CartaUpdateInput {
    return {
      ...(dto.nome !== undefined ? { nome: dto.nome.trim() } : {}),
      ...(dto.elemento !== undefined ? { elemento: dto.elemento } : {}),
      ...(dto.raridade !== undefined ? { raridade: dto.raridade } : {}),
      ...(dto.hpBase !== undefined ? { hp_base: dto.hpBase } : {}),
      ...(dto.danoBase !== undefined ? { dano_base: dto.danoBase } : {}),
      ...(dto.defesaBase !== undefined ? { defesa_base: dto.defesaBase } : {}),
      ...(dto.passiva !== undefined ||
      dto.classe !== undefined ||
      dto.custo !== undefined
        ? { passiva: this.buildPassiva(dto) }
        : {}),
      ...(dto.foto !== undefined ? { foto: dto.foto } : {}),
      ...(dto.moldura !== undefined ? { moldura: dto.moldura } : {}),
      ...(dto.ativo !== undefined ? { ativo: dto.ativo } : {}),
    };
  }

  private buildPassiva(dto: {
    passiva?: Record<string, unknown>;
    classe?: string;
    custo?: number;
  }) {
    return {
      ...(dto.passiva ?? {}),
      ...(dto.classe !== undefined ? { classe: dto.classe } : {}),
      ...(dto.custo !== undefined ? { custo: dto.custo } : {}),
    };
  }

  private toResponse(carta: Prisma.CartaGetPayload<Record<string, never>>) {
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
      custo: typeof passiva.custo === 'number' ? passiva.custo : null,
      hpBase: carta.hp_base,
      danoBase: carta.dano_base,
      defesaBase: carta.defesa_base,
      passiva,
      foto: carta.foto,
      moldura: carta.moldura,
      ativo: Boolean(carta.ativo),
      criadoEm: carta.criado_em,
      atualizadoEm: carta.atualizado_em,
    };
  }
}
