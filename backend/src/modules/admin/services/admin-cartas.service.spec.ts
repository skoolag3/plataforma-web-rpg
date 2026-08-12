import { BadRequestException } from '@nestjs/common';
import { AdminCartasService } from './admin-cartas.service';

describe('AdminCartasService', () => {
  const carta = {
    id: 'carta-id',
    nome: 'Flare',
    elemento: 'fogo',
    raridade: 'UR',
    hp_base: 320,
    dano_base: 190,
    defesa_base: 120,
    passiva: {},
    foto: null,
    moldura: null,
    config_visual: null,
    ativo: true,
    criado_em: new Date(),
    atualizado_em: new Date(),
    excluido_em: null,
  };
  const prisma = {
    carta: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    inventario: {
      count: jest.fn(),
    },
  };
  let service: AdminCartasService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.carta.findFirst.mockResolvedValue(carta);
    prisma.carta.findMany.mockResolvedValue([]);
    service = new AdminCartasService(prisma as never);
  });

  it('recusa a remoção quando o nome de confirmação não corresponde', async () => {
    await expect(
      service.remover(carta.id, 'Outra carta', true),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.carta.update).not.toHaveBeenCalled();
  });

  it('recusa a remoção sem confirmação do impacto nos usuários', async () => {
    await expect(
      service.remover(carta.id, carta.nome, false),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.carta.update).not.toHaveBeenCalled();
  });

  it('informa quantos usuários possuem a carta', async () => {
    prisma.inventario.count.mockResolvedValue(3);

    await expect(service.buscarImpacto(carta.id)).resolves.toEqual({
      usuariosComCarta: 3,
    });
    expect(prisma.inventario.count).toHaveBeenCalledWith({
      where: {
        id_carta: carta.id,
        id_usuario: { not: null },
        quantidade: { gt: 0 },
      },
    });
  });

  it('recusa desativação sem confirmação do impacto', async () => {
    await expect(
      service.atualizar(carta.id, { ativo: false }),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.carta.update).not.toHaveBeenCalled();
  });

  it('permite desativação depois da confirmação do impacto', async () => {
    prisma.carta.update.mockResolvedValue({ ...carta, ativo: false });

    await service.atualizar(carta.id, {
      ativo: false,
      confirmarImpacto: true,
    });

    expect(prisma.carta.update).toHaveBeenCalledWith({
      where: { id: carta.id },
      data: expect.objectContaining({
        ativo: false,
        atualizado_em: expect.any(Date),
      }),
    });
  });

  it('faz soft delete quando o nome é confirmado', async () => {
    prisma.carta.update.mockImplementation(({ data }) => ({
      ...carta,
      ...data,
      excluido_em: data.excluido_em,
    }));

    await service.remover(carta.id, carta.nome, true);

    expect(prisma.carta.update).toHaveBeenCalledWith({
      where: { id: carta.id },
      data: expect.objectContaining({
        ativo: false,
        excluido_em: expect.any(Date),
        atualizado_em: expect.any(Date),
      }),
    });
  });

  it('aplica classe, período e ordenação à consulta administrativa', async () => {
    await service.listar({
      classe: 'Mago',
      periodo: '24h',
      ordem: 'az',
    });

    expect(prisma.carta.findMany).toHaveBeenCalledWith({
      where: expect.objectContaining({
        excluido_em: null,
        passiva: { path: ['classe'], equals: 'Mago' },
        criado_em: { gte: expect.any(Date) },
      }),
      orderBy: [{ nome: 'asc' }],
    });
  });
});
