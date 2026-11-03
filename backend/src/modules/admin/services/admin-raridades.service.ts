import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AtualizarAdminRaridadeDto, CriarAdminRaridadeDto } from '../dto/admin-raridade.dto';

@Injectable()
export class AdminRaridadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const raridades = await this.prisma.raridadeCarta.findMany({ orderBy: [{ ordem: 'asc' }, { nome: 'asc' }] });
    const totais = await this.prisma.carta.groupBy({ by: ['raridade'], _count: { _all: true }, where: { excluido_em: null } });
    return raridades.map((item) => ({
      codigo: item.codigo,
      nome: item.nome,
      valorVenda: item.valor_venda,
      cor: item.cor,
      ordem: item.ordem,
      totalCartas: totais.find((total) => total.raridade === item.codigo)?._count._all ?? 0,
    }));
  }

  async criar(dto: CriarAdminRaridadeDto) {
    const nome = dto.nome.trim();
    if (!nome) throw new BadRequestException('Informe o nome da raridade.');
    await this.validarNome(nome);
    const codigo = nome.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 50);
    if (!codigo) throw new BadRequestException('Nome inválido para criar uma raridade.');
    if (await this.prisma.raridadeCarta.findUnique({ where: { codigo } })) throw new ConflictException('Já existe uma raridade com este código.');
    const ultima = await this.prisma.raridadeCarta.aggregate({ _max: { ordem: true } });
    await this.prisma.raridadeCarta.create({ data: { codigo, nome, valor_venda: dto.valorVenda, cor: dto.cor, ordem: (ultima._max.ordem ?? 0) + 1 } });
    return this.listar();
  }

  async atualizar(codigo: string, dto: AtualizarAdminRaridadeDto) {
    const atual = await this.prisma.raridadeCarta.findUnique({ where: { codigo } });
    if (!atual) throw new NotFoundException('Raridade não encontrada.');
    const nome = dto.nome?.trim();
    if (dto.nome !== undefined && !nome) throw new BadRequestException('Informe o nome da raridade.');
    if (nome && nome !== atual.nome) await this.validarNome(nome, codigo);
    await this.prisma.raridadeCarta.update({ where: { codigo }, data: {
      ...(nome ? { nome } : {}),
      ...(dto.valorVenda !== undefined ? { valor_venda: dto.valorVenda } : {}),
      ...(dto.cor ? { cor: dto.cor } : {}),
      atualizado_em: new Date(),
    } });
    return this.listar();
  }

  private async validarNome(nome: string, ignorarCodigo?: string) {
    const existente = await this.prisma.raridadeCarta.findFirst({ where: {
      nome: { equals: nome, mode: 'insensitive' },
      ...(ignorarCodigo ? { codigo: { not: ignorarCodigo } } : {}),
    } });
    if (existente) throw new ConflictException('Já existe uma raridade com este nome.');
  }
}
