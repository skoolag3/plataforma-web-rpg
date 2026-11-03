import { BadRequestException, ConflictException } from '@nestjs/common';
import { AdminRaridadesService } from './admin-raridades.service';

describe('AdminRaridadesService', () => {
  const prisma = {
    raridadeCarta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      aggregate: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    carta: { groupBy: jest.fn() },
  };
  const service = new AdminRaridadesService(prisma as never);

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.raridadeCarta.findMany.mockResolvedValue([]);
    prisma.raridadeCarta.findFirst.mockResolvedValue(null);
    prisma.raridadeCarta.findUnique.mockResolvedValue(null);
    prisma.raridadeCarta.aggregate.mockResolvedValue({ _max: { ordem: 6 } });
    prisma.carta.groupBy.mockResolvedValue([]);
  });

  it('mantém código e cartas ao editar nome e valor', async () => {
    prisma.raridadeCarta.findUnique.mockResolvedValue({ codigo: 'UR', nome: 'Mítica' });
    await service.atualizar('UR', { nome: 'Suprema', valorVenda: 900 });
    expect(prisma.raridadeCarta.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { codigo: 'UR' }, data: expect.objectContaining({ nome: 'Suprema', valor_venda: 900 }),
    }));
  });

  it('gera código estável para nova raridade', async () => {
    await service.criar({ nome: 'Ultra Secreta', valorVenda: 2000, cor: '#fb7185' });
    expect(prisma.raridadeCarta.create).toHaveBeenCalledWith({ data: {
      codigo: 'ULTRA_SECRETA', nome: 'Ultra Secreta', valor_venda: 2000, cor: '#fb7185', ordem: 7,
    } });
  });

  it('impede nome repetido', async () => {
    prisma.raridadeCarta.findFirst.mockResolvedValue({ codigo: 'N' });
    await expect(service.criar({ nome: 'Comum', valorVenda: 50, cor: '#94a3b8' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('impede nome vazio', async () => {
    await expect(service.criar({ nome: ' ', valorVenda: 50, cor: '#94a3b8' })).rejects.toBeInstanceOf(BadRequestException);
  });
});
