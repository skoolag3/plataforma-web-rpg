import { PrismaService } from '../../prisma/prisma.service';
import { PartidasService } from './partidas.service';

describe('PartidasService - ranking', () => {
  it('inclui jogador sem partidas e conta cartas únicas possuídas', async () => {
    const prisma = {
      usuario: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'usuario-1',
            nome: 'Gabriel',
            nivel: 1,
            pontos_experiencia: 0,
            perfil: { avatar_url: null, mostrar_no_ranking: true },
          },
        ]),
      },
      logPartida: { groupBy: jest.fn().mockResolvedValue([]) },
      inventario: {
        groupBy: jest
          .fn()
          .mockResolvedValue([{ id_usuario: 'usuario-1', _count: { id: 3 } }]),
      },
    } as unknown as PrismaService;

    const service = new PartidasService(prisma);

    await expect(service.ranking()).resolves.toEqual({
      jogadores: [
        {
          posicao: 1,
          id: 'usuario-1',
          nome: 'Gabriel',
          nivel: 1,
          pontos: 0,
          partidas: 0,
          cartasColecionadas: 3,
          avatarUrl: null,
        },
      ],
    });
  });
});
