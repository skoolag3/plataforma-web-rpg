import { BadRequestException, NotFoundException } from '@nestjs/common';
import type { CreateAdminHabilidadeDto } from '../dto/admin-habilidade.dto';
import { AdminHabilidadesService } from './admin-habilidades.service';

const habilidade = {
  id: 'habilidade-id',
  nome: 'Golpe flamejante',
  descricao: 'O quarto ataque causa dano especial.',
  modo_execucao: 'AUTOMATICA',
  tipo_efeito: 'DANO',
  gatilho: 'AO_ATACAR',
  alvo: 'INIMIGO_ATIVO',
  atributo: null,
  unidade: 'PERCENTUAL',
  valor_base: 150,
  forma_aplicacao: 'SUBSTITUI_ATAQUE',
  requisito_tipo: 'CONTADOR_ATAQUES',
  requisito_valor: 3,
  escala_tipo: 'NENHUMA',
  escala_valor: null,
  escala_limite: null,
  duracao_turnos: null,
  status: 'RASCUNHO',
  versao: 1,
  testada_em: null,
  criado_em: new Date('2026-08-20T10:00:00Z'),
  atualizado_em: new Date('2026-08-20T10:00:00Z'),
};

function criarDto(
  parcial: Partial<CreateAdminHabilidadeDto> = {},
): CreateAdminHabilidadeDto {
  return {
    nome: habilidade.nome,
    descricao: habilidade.descricao,
    tipoEfeito: 'DANO',
    gatilho: 'AO_ATACAR',
    alvo: 'INIMIGO_ATIVO',
    unidade: 'PERCENTUAL',
    valorBase: 150,
    formaAplicacao: 'SUBSTITUI_ATAQUE',
    requisitoTipo: 'CONTADOR_ATAQUES',
    requisitoValor: 3,
    escalaTipo: 'NENHUMA',
    ...parcial,
  };
}

describe('AdminHabilidadesService', () => {
  const prisma = {
    habilidade: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };
  let service: AdminHabilidadesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.habilidade.findMany.mockResolvedValue([]);
    prisma.habilidade.findUnique.mockResolvedValue(habilidade);
    prisma.habilidade.create.mockResolvedValue(habilidade);
    service = new AdminHabilidadesService(prisma as never);
  });

  it('aplica busca, tipo e status na listagem', async () => {
    await service.listar({
      busca: 'flamejante',
      tipoEfeito: 'DANO',
      status: 'RASCUNHO',
    });

    expect(prisma.habilidade.findMany).toHaveBeenCalledWith({
      where: {
        OR: [
          { nome: { contains: 'flamejante', mode: 'insensitive' } },
          { descricao: { contains: 'flamejante', mode: 'insensitive' } },
        ],
        tipo_efeito: 'DANO',
        status: 'RASCUNHO',
      },
      orderBy: [{ atualizado_em: 'desc' }, { nome: 'asc' }],
    });
  });

  it('informa quando a habilidade não existe', async () => {
    prisma.habilidade.findUnique.mockResolvedValue(null);

    await expect(service.buscar('inexistente')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('cria habilidade sempre como rascunho', async () => {
    await service.criar(criarDto());

    expect(prisma.habilidade.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        nome: habilidade.nome,
        modo_execucao: 'AUTOMATICA',
        tipo_efeito: 'DANO',
        requisito_tipo: 'CONTADOR_ATAQUES',
        requisito_valor: 3,
        status: 'RASCUNHO',
        versao: 1,
      }),
    });
  });

  it('rejeita valor percentual fora do limite do domínio', async () => {
    await expect(
      service.criar(criarDto({ valorBase: 501 })),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.habilidade.create).not.toHaveBeenCalled();
  });

  it('rejeita valor de requisito quando o requisito é nenhum', async () => {
    await expect(
      service.criar(
        criarDto({
          requisitoTipo: 'NENHUM',
          requisitoValor: 3,
          formaAplicacao: 'APOS_ACAO',
        }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.habilidade.create).not.toHaveBeenCalled();
  });
});
