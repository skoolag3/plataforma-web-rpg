import { UnauthorizedException } from '@nestjs/common';
import type { PrismaService } from '../../../database/prisma.service';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  const findFirst = jest.fn();
  const prisma = {
    usuario: { findFirst },
  } as unknown as PrismaService;
  const strategy = new JwtStrategy(prisma);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it('usa o estado e a permissão atuais do usuário', async () => {
    findFirst.mockResolvedValue({
      id: 'usuario-id',
      email: 'jogador@exemplo.com',
      is_admin: false,
    });

    await expect(strategy.validate({ sub: 'usuario-id' })).resolves.toEqual({
      id: 'usuario-id',
      email: 'jogador@exemplo.com',
      isAdmin: false,
    });
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'usuario-id',
          ativo: true,
          bloqueado: false,
          email_verificado: true,
          excluido_em: null,
        }),
      }),
    );
  });

  it('rejeita token de uma conta que não está mais disponível', async () => {
    findFirst.mockResolvedValue(null);

    await expect(
      strategy.validate({ sub: 'usuario-id' }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
