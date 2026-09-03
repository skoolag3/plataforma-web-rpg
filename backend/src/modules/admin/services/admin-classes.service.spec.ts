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

  it('cria uma classe com prioridade e modificadores', async () => {
    await expect(
      service.criar({
        nome: 'Assassino',
        descricao: 'Ataca primeiro.',
        prioridadeAtaque: 1,
        modificadorHp: 0,
        modificadorAtaque: 15,
        modificadorDefesa: -15,
      }),
    ).resolves.toMatchObject({
      nome: 'Assassino',
      prioridadeAtaque: 1,
      modificadorAtaque: 15,
      totalCartas: 2,
    });
  });

  it('rejeita nome de classe duplicado', async () => {
    prisma.classeCarta.findFirst.mockResolvedValue(classe);

    await expect(
      service.criar({
        nome: 'assassino',
        prioridadeAtaque: 1,
        modificadorHp: 0,
        modificadorAtaque: 0,
        modificadorDefesa: 0,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
