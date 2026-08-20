import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma.service';
import type { CreateAdminHabilidadeDto } from '../dto/admin-habilidade.dto';
import type {
  ConfiguracaoHabilidade,
  EscalaHabilidade,
  RequisitoHabilidade,
  StatusHabilidade,
} from '../../jogo/habilidades/habilidade.types';
import { validarHabilidade } from '../../jogo/habilidades/habilidade.validator';

@Injectable()
export class AdminHabilidadesService {
  constructor(private readonly prisma: PrismaService) {}

  async listar(filtros: {
    busca?: string;
    tipoEfeito?: string;
    status?: string;
  }) {
    const busca = filtros.busca?.trim();
    const habilidades = await this.prisma.habilidade.findMany({
      where: {
        ...(busca
          ? {
              OR: [
                { nome: { contains: busca, mode: 'insensitive' as const } },
                {
                  descricao: {
                    contains: busca,
                    mode: 'insensitive' as const,
                  },
                },
              ],
            }
          : {}),
        ...(filtros.tipoEfeito ? { tipo_efeito: filtros.tipoEfeito } : {}),
        ...(filtros.status ? { status: filtros.status } : {}),
      },
      orderBy: [{ atualizado_em: 'desc' }, { nome: 'asc' }],
    });

    return habilidades.map((habilidade) => this.toResponse(habilidade));
  }

  async buscar(id: string) {
    const habilidade = await this.prisma.habilidade.findUnique({
      where: { id },
    });
    if (!habilidade) {
      throw new NotFoundException('Habilidade não encontrada.');
    }
    return this.toResponse(habilidade);
  }

  async criar(dto: CreateAdminHabilidadeDto) {
    const configuracao = this.toConfig(dto, 'RASCUNHO');
    this.validar(configuracao, dto);

    try {
      const habilidade = await this.prisma.habilidade.create({
        data: this.toCreateData(configuracao),
      });
      return this.toResponse(habilidade);
    } catch (erro) {
      if (
        erro instanceof Prisma.PrismaClientKnownRequestError &&
        erro.code === 'P2002'
      ) {
        throw new ConflictException('Já existe uma habilidade com este nome.');
      }
      throw erro;
    }
  }

  private validar(
    configuracao: ConfiguracaoHabilidade,
    dto: CreateAdminHabilidadeDto,
  ) {
    const res = validarHabilidade(configuracao);
    const camposExtrasInvalidos = [
      dto.requisitoTipo === 'NENHUM' && dto.requisitoValor !== undefined
        ? 'requisitoValor'
        : null,
      dto.escalaTipo === 'NENHUMA' && dto.escalaValor !== undefined
        ? 'escalaValor'
        : null,
      dto.escalaTipo === 'NENHUMA' && dto.escalaLimite !== undefined
        ? 'escalaLimite'
        : null,
    ].filter((campo): campo is string => Boolean(campo));

    if (!res.valida || camposExtrasInvalidos.length) {
      throw new BadRequestException({
        message: 'Configuração de habilidade inválida.',
        details: [
          ...res.erros,
          ...camposExtrasInvalidos.map((campo) => ({
            campo,
            codigo: 'CAMPO_INCOMPATIVEL',
            mensagem: 'O campo não deve ser informado nesta configuração.',
          })),
        ],
      });
    }
  }

  private toConfig(
    dto: CreateAdminHabilidadeDto,
    status: StatusHabilidade,
  ): ConfiguracaoHabilidade {
    return {
      nome: dto.nome.trim(),
      descricao: dto.descricao?.trim(),
      modoExecucao: 'AUTOMATICA',
      tipoEfeito: dto.tipoEfeito,
      gatilho: dto.gatilho,
      alvo: dto.alvo,
      atributo: dto.atributo,
      unidade: dto.unidade,
      valorBase: dto.valorBase,
      formaAplicacao: dto.formaAplicacao,
      requisito: this.toRequisito(dto),
      escala: this.toEscala(dto),
      duracaoTurnos: dto.duracaoTurnos,
      status,
    };
  }

  private toRequisito(dto: CreateAdminHabilidadeDto): RequisitoHabilidade {
    if (dto.requisitoTipo === 'CONTADOR_ATAQUES') {
      return {
        tipo: dto.requisitoTipo,
        quantidade: dto.requisitoValor ?? Number.NaN,
      };
    }
    if (dto.requisitoTipo === 'HP_ABAIXO') {
      return {
        tipo: dto.requisitoTipo,
        percentual: dto.requisitoValor ?? Number.NaN,
      };
    }
    if (dto.requisitoTipo === 'TURNO_MINIMO') {
      return {
        tipo: dto.requisitoTipo,
        turno: dto.requisitoValor ?? Number.NaN,
      };
    }
    return { tipo: 'NENHUM' };
  }

  private toEscala(dto: CreateAdminHabilidadeDto): EscalaHabilidade {
    if (dto.escalaTipo === 'NENHUMA') return { tipo: 'NENHUMA' };
    return {
      tipo: dto.escalaTipo,
      valor: dto.escalaValor ?? Number.NaN,
      limite: dto.escalaLimite ?? Number.NaN,
    };
  }

  private toCreateData(
    configuracao: ConfiguracaoHabilidade,
  ): Prisma.HabilidadeCreateInput {
    const requisitoValor =
      configuracao.requisito.tipo === 'CONTADOR_ATAQUES'
        ? configuracao.requisito.quantidade
        : configuracao.requisito.tipo === 'HP_ABAIXO'
          ? configuracao.requisito.percentual
          : configuracao.requisito.tipo === 'TURNO_MINIMO'
            ? configuracao.requisito.turno
            : null;
    const escalaValor =
      configuracao.escala.tipo === 'NENHUMA' ? null : configuracao.escala.valor;
    const escalaLimite =
      configuracao.escala.tipo === 'NENHUMA'
        ? null
        : configuracao.escala.limite;

    return {
      nome: configuracao.nome,
      descricao: configuracao.descricao,
      modo_execucao: configuracao.modoExecucao,
      tipo_efeito: configuracao.tipoEfeito,
      gatilho: configuracao.gatilho,
      alvo: configuracao.alvo,
      atributo: configuracao.atributo,
      unidade: configuracao.unidade,
      valor_base: configuracao.valorBase,
      forma_aplicacao: configuracao.formaAplicacao,
      requisito_tipo: configuracao.requisito.tipo,
      requisito_valor: requisitoValor,
      escala_tipo: configuracao.escala.tipo,
      escala_valor: escalaValor,
      escala_limite: escalaLimite,
      duracao_turnos: configuracao.duracaoTurnos,
      status: 'RASCUNHO',
      versao: 1,
    };
  }

  private toResponse(
    habilidade: Prisma.HabilidadeGetPayload<Record<string, never>>,
  ) {
    return {
      id: habilidade.id,
      nome: habilidade.nome,
      descricao: habilidade.descricao,
      modoExecucao: habilidade.modo_execucao,
      tipoEfeito: habilidade.tipo_efeito,
      gatilho: habilidade.gatilho,
      alvo: habilidade.alvo,
      atributo: habilidade.atributo,
      unidade: habilidade.unidade,
      valorBase: habilidade.valor_base,
      formaAplicacao: habilidade.forma_aplicacao,
      requisitoTipo: habilidade.requisito_tipo,
      requisitoValor: habilidade.requisito_valor,
      escalaTipo: habilidade.escala_tipo,
      escalaValor: habilidade.escala_valor,
      escalaLimite: habilidade.escala_limite,
      duracaoTurnos: habilidade.duracao_turnos,
      status: habilidade.status,
      versao: habilidade.versao,
      testadaEm: habilidade.testada_em,
      criadoEm: habilidade.criado_em,
      atualizadoEm: habilidade.atualizado_em,
    };
  }
}
