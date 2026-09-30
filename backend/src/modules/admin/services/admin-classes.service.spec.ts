import { ConflictException } from '@nestjs/common';
import { AdminClassesService } from './admin-classes.service';

describe('AdminClassesService', () => {
  const classe = {
    id: 'classe-id',
    nome: 'Assassino',
    descricao: 'Ataca primeiro.',
    prioridade_ataque: 1,
    modificador_hp: 0,
    modificador_ataque: 15,
    modificador_defesa: -15,
    ativo: true,
    _count: { cartas: 2 },
  };
  const prisma = {
    classeCarta: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };
  let service: AdminClassesService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.classeCarta.findFirst.mockResolvedValue(null);
    prisma.classeCarta.create.mockResolvedValue(classe);
    service = new AdminClassesService(prisma as never);
  });

  it('cria uma classe apenas com prioridade', async () => {
    await expect(
      service.criar({
        nome: 'Assassino',
        descricao: 'Ataca primeiro.',
        prioridadeAtaque: 1,
      }),
    ).resolves.toMatchObject({
      nome: 'Assassino',
      prioridadeAtaque: 1,
      totalCartas: 2,
    });
    expect(prisma.classeCarta.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          prioridade_ataque: 1,
          modificador_hp: 0,
          modificador_ataque: 0,
          modificador_defesa: 0,
        }),
      }),
    );
  });

  it('rejeita nome de classe duplicado', async () => {
    prisma.classeCarta.findFirst.mockResolvedValue(classe);

    await expect(
      service.criar({
        nome: 'assassino',
        prioridadeAtaque: 1,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
