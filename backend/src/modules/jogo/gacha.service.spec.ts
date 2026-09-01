import { ConflictException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { GachaService } from './gacha.service';
import {
  giroGratuitoDisponivel,
  obterProximaRotacaoBanner,
  obterProximoGiroGratuito,
} from './gacha.config';

describe('GachaService', () => {
  const prisma = {
    banner: { findFirst: jest.fn() },
    usuarioBannerColeta: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (operacao: (tx: typeof prisma) => unknown) => operacao(prisma),
  );
  const service = new GachaService(prisma as never, {} as never);

  afterEach(() => jest.restoreAllMocks());

  it('faz sorteio ponderado respeitando a faixa acumulada', () => {
    jest.spyOn(Math, 'random').mockReturnValue(0);
    const primeira = { id: 'ur', taxa_drop: new Prisma.Decimal(1) };
    const segunda = { id: 'n', taxa_drop: new Prisma.Decimal(50) };
    expect(service['sortear']([primeira, segunda])).toBe(primeira);
  });

  it.each([
    [0, 'UR'],
    [0.01, 'SSR'],
    [0.05, 'SR'],
    [0.2, 'R'],
    [0.5, 'N'],
  ])('sorteia a raridade pela faixa percentual %s', (aleatorio, raridade) => {
    jest.spyOn(Math, 'random').mockReturnValue(aleatorio);
    expect(service['sortearRaridade']()).toBe(raridade);
  });

  it('informa a chance efetiva quando faltam raridades no banner', () => {
    const cartas = [
      { carta: { raridade: 'UR' } },
      { carta: { raridade: 'SSR' } },
      { carta: { raridade: 'N' } },
    ];

    expect(service['calcularProbabilidadesEfetivas'](cartas)).toEqual([
      { raridade: 'UR', percentual: 1 },
      { raridade: 'SSR', percentual: 4 },
      { raridade: 'N', percentual: 95 },
    ]);
  });

  it('impede giro gratuito antes de 12 horas', async () => {
    prisma.banner.findFirst.mockResolvedValue({
      id: 'banner',
      custo_giro: 300,
    });
    prisma.usuarioBannerColeta.findUnique.mockResolvedValue({
      ultima_coleta: new Date(),
    });
    await expect(
      service.resgatarDiario('usuario', 'banner'),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('renova o giro gratuito nas janelas globais de 01:00 e 13:00 UTC', () => {
    const antesDaJanela = new Date('2026-08-30T12:59:59.999Z').getTime();
    const inicioDaJanela = new Date('2026-08-30T13:00:00.000Z').getTime();
    const coletaAnterior = new Date('2026-08-30T01:00:00.000Z');

    expect(giroGratuitoDisponivel(coletaAnterior, antesDaJanela)).toBe(false);
    expect(giroGratuitoDisponivel(coletaAnterior, inicioDaJanela)).toBe(true);
    expect(obterProximoGiroGratuito(inicioDaJanela)).toEqual(
      new Date('2026-08-31T01:00:00.000Z'),
    );
  });

  it.each([
    ['2026-08-30T12:02:15.000Z', '2026-08-30T12:30:00.000Z'],
    ['2026-08-30T12:30:00.000Z', '2026-08-30T13:00:00.000Z'],
    ['2026-08-30T23:48:00.000Z', '2026-08-31T00:00:00.000Z'],
  ])('alinha a rotação global de %s para %s', (agora, proxima) => {
    expect(obterProximaRotacaoBanner(new Date(agora).getTime())).toEqual(
      new Date(proxima),
    );
  });
});
