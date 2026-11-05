import { ConflictException } from '@nestjs/common';
import {
  obterProximaRecompensaSemanal,
  RECOMPENSA_SEMANAL_RUBYS,
  recompensaSemanalDisponivel,
} from './recompensas.config';
import { RecompensasService } from './recompensas.service';

describe('RecompensasService', () => {
  const prisma = {
    usuario: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    ledgerRuby: { create: jest.fn() },
    $transaction: jest.fn(),
  };
  prisma.$transaction.mockImplementation(
    (operacao: (tx: typeof prisma) => unknown) => operacao(prisma),
  );
  const service = new RecompensasService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('renova globalmente toda segunda-feira às 13:00 UTC', () => {
    const ultimoResgate = new Date('2026-08-24T13:00:00.000Z');
    const antes = new Date('2026-08-31T12:59:59.999Z').getTime();
    const noHorario = new Date('2026-08-31T13:00:00.000Z').getTime();

    expect(recompensaSemanalDisponivel(ultimoResgate, antes)).toBe(false);
    expect(recompensaSemanalDisponivel(ultimoResgate, noHorario)).toBe(true);
    expect(obterProximaRecompensaSemanal(noHorario)).toEqual(
      new Date('2026-09-07T13:00:00.000Z'),
    );
  });

  it('registra 500 Rubys no ledger ao resgatar', async () => {
    prisma.usuario.updateMany.mockResolvedValue({ count: 1 });
    prisma.ledgerRuby.create.mockResolvedValue({ id: 'ledger' });

    await expect(service.resgatarSemanal('usuario')).resolves.toMatchObject({
      rubysRecebidos: RECOMPENSA_SEMANAL_RUBYS,
    });
    expect(prisma.ledgerRuby.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id_usuario: 'usuario',
        quantidade: 500,
        motivo: 'RECOMPENSA_SEMANAL',
      }),
    });
  });

  it('impede um segundo resgate na mesma semana', async () => {
    prisma.usuario.updateMany.mockResolvedValue({ count: 0 });
    prisma.usuario.findUnique.mockResolvedValue({ id: 'usuario' });

    await expect(service.resgatarSemanal('usuario')).rejects.toBeInstanceOf(
      ConflictException,
    );
    expect(prisma.ledgerRuby.create).not.toHaveBeenCalled();
  });
});
