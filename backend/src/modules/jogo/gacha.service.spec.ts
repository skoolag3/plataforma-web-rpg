import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GachaService } from './gacha.service';

describe('GachaService', () => {
  const prisma = {
    banner: { findFirst: jest.fn() },
    usuarioBannerColeta: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (operacao: (tx: typeof prisma) => unknown) => operacao(prisma),
  );
  const service = new GachaService(prisma as never);

  afterEach(() => jest.restoreAllMocks());

  it('faz sorteio ponderado respeitando a faixa acumulada', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const primeira = { id: 'ur', taxa_drop: new Prisma.Decimal(1) };
    const segunda = { id: 'n', taxa_drop: new Prisma.Decimal(50) };
    expect(service['sortear']([primeira, segunda])).toBe(primeira);
  });

  it('impede resgate diario antes de 24 horas', async () => {
    prisma.banner.findFirst.mockResolvedValue({ id: 'banner', custo_giro: 300 });
    prisma.usuarioBannerColeta.findUnique.mockResolvedValue({
      ultima_coleta: new Date(),
    });
    await expect(service.resgatarDiario('usuario', 'banner')).rejects.toBeInstanceOf(
      ConflictException,
    );
  });
});
