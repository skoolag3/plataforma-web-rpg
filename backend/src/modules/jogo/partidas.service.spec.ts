import { PrismaService } from '../../prisma/prisma.service';
import { PartidasService } from './partidas.service';

describe('PartidasService - ranking', () => {
  it('exige e-mail verificado e não inclui jogador sem pontos', async () => {
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

    await expect(service.ranking()).resolves.toEqual({ jogadores: [] });
    expect(prisma.usuario.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ email_verificado: true }),
      }),
    );
  });

  it('inclui jogador verificado somente depois de pontuar', async () => {
    const prisma = {
      usuario: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'usuario-1',
            nome: 'Gabriel',
            nivel: 1,
            pontos_experiencia: 10,
            perfil: { avatar_url: null, mostrar_no_ranking: true },
          },
        ]),
      },
      logPartida: {
        groupBy: jest.fn().mockResolvedValue([
          {
            id_usuario: 'usuario-1',
            _sum: { variacao_pontos: 10 },
            _count: { id: 1 },
          },
        ]),
      },
      inventario: {
        groupBy: jest.fn().mockResolvedValue([]),
      },
    } as unknown as PrismaService;

    const service = new PartidasService(prisma);

    await expect(service.ranking()).resolves.toEqual({
      jogadores: [
        expect.objectContaining({
          posicao: 1,
          id: 'usuario-1',
          pontos: 10,
          partidas: 1,
        }),
      ],
    });
  });
});

describe('PartidasService - atributos da classe', () => {
  it('usa atributos base e conserva apenas a prioridade da classe', () => {
    const service = new PartidasService({} as PrismaService);
    const carta = service['mapearCarta']({
      id: 'carta-1',
      nome: 'Carta teste',
      hp_base: 100,
      dano_base: 20,
      defesa_base: 10,
      elemento: 'fogo',
      passiva: null,
      classe: {
        nome: 'Assassino',
        prioridade_ataque: 1,
        modificador_hp: 50,
        modificador_ataque: 50,
        modificador_defesa: 50,
      },
      habilidades: [],
    } as never);

    expect(carta).toMatchObject({
      hp: 100,
      ataque: 20,
      defesa: 10,
      velocidade: 1,
    });
  });
});
