import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import {
  AtualizarAdminClasseDto,
  CriarAdminClasseDto,
} from '../dto/admin-classe.dto';

@Injectable()
export class AdminClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar() {
    const classes = await this.prisma.classeCarta.findMany({
      orderBy: [{ prioridade_ataque: 'asc' }, { nome: 'asc' }],
      include: { _count: { select: { cartas: true } } },
    });
    return classes.map((classe) => this.formatar(classe));
  }

  async criar(dto: CriarAdminClasseDto) {
    await this.validarNome(dto.nome);
    const classe = await this.prisma.classeCarta.create({
      data: this.mapearDados(dto),
      include: { _count: { select: { cartas: true } } },
    });
    return this.formatar(classe);
  }

  async atualizar(id: string, dto: AtualizarAdminClasseDto) {
    const atual = await this.prisma.classeCarta.findUnique({ where: { id } });
    if (!atual) throw new NotFoundException('Classe não encontrada.');
    await this.validarNome(dto.nome, id);
    const classe = await this.prisma.classeCarta.update({
      where: { id },
      data: {
        ...this.mapearDados(dto),
        ativo: dto.ativo ?? atual.ativo,
        atualizado_em: new Date(),
      },
      include: { _count: { select: { cartas: true } } },
    });
    return this.formatar(classe);
  }

  private async validarNome(nome: string, ignorarId?: string) {
    const existente = await this.prisma.classeCarta.findFirst({
      where: {
        nome: { equals: nome.trim(), mode: 'insensitive' },
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
    });
    if (existente)
      throw new ConflictException('Já existe uma classe com este nome.');
  }

  private mapearDados(dto: CriarAdminClasseDto) {
    return {
      nome: dto.nome.trim(),
      descricao: dto.descricao?.trim() || null,
      prioridade_ataque: dto.prioridadeAtaque,
      modificador_hp: dto.modificadorHp,
      modificador_ataque: dto.modificadorAtaque,
      modificador_defesa: dto.modificadorDefesa,
    };
  }

  private formatar(classe: {
    id: string;
    nome: string;
    descricao: string | null;
    prioridade_ataque: number;
    modificador_hp: number;
    modificador_ataque: number;
    modificador_defesa: number;
    ativo: boolean;
    _count: { cartas: number };
  }) {
    return {
      id: classe.id,
      nome: classe.nome,
      descricao: classe.descricao,
      prioridadeAtaque: classe.prioridade_ataque,
      modificadorHp: classe.modificador_hp,
      modificadorAtaque: classe.modificador_ataque,
      modificadorDefesa: classe.modificador_defesa,
      ativo: classe.ativo,
      totalCartas: classe._count.cartas,
    };
  }
}
