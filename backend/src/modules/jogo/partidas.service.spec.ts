import { PrismaService } from '../../database/prisma.service';
import { PartidasService, filtrarCartasPorForca, selecionarCartasAdversario } from './partidas.service';

describe('equilibrio das partidas comuns', () => {
  const carta = (id: number, hp_base: number, dano_base: number) => ({
    id: String(id), hp_base, dano_base, defesa_base: 10,
  });

  it('sorteia adversarios proximos da forca media do deck', () => {
    const deck = [carta(1, 100, 20), carta(2, 120, 22)];
    const candidatas = [carta(3, 40, 5), carta(4, 100, 20), carta(5, 110, 21), carta(6, 900, 150)];
    expect(filtrarCartasPorForca(candidatas, deck).map((item) => item.id).sort()).toEqual(['4', '5']);
  });

  it('usa as mais proximas quando o catalogo nao tem cartas na faixa', () => {
    const deck = [carta(1, 200, 40)];
    const candidatas = [carta(2, 10, 1), carta(3, 800, 100)];
    expect(filtrarCartasPorForca(candidatas, deck)).toHaveLength(2);
  });
});

describe('cartas adversárias da campanha', () => {
  const cartas = ['a', 'b', 'c', 'd', 'e'].map((id) => ({ id }));

  it('respeita a quantidade por caminho no modo aleatório', () => {
    const resultado = selecionarCartasAdversario(cartas, 6, { quantidadeCartas: 2, modoCartas: 'ALEATORIO' });
    expect(resultado).toHaveLength(2);
    expect(resultado.every((carta) => cartas.includes(carta))).toBe(true);
  });

  it('usa a seleção manual fixa na ordem configurada', () => {
    expect(selecionarCartasAdversario(cartas, 6, { quantidadeCartas: 2, modoCartas: 'MANUAL', cartasAdversario: ['d', 'b'], mixed: false }).map((carta) => carta.id)).toEqual(['d', 'b']);
  });

  it('mixed sorteia somente do conjunto manual', () => {
    const resultado = selecionarCartasAdversario(cartas, 6, { quantidadeCartas: 2, modoCartas: 'MANUAL', cartasAdversario: ['a', 'c', 'e'], mixed: true });
    expect(resultado).toHaveLength(2);
    expect(resultado.every((carta) => ['a', 'c', 'e'].includes(carta.id))).toBe(true);
  });

  it('recusa seleção manual insuficiente', () => {
    expect(() => selecionarCartasAdversario(cartas, 6, { quantidadeCartas: 3, modoCartas: 'MANUAL', cartasAdversario: ['a'], mixed: true })).toThrow();
  });
});

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
            perfil: {
              avatar_url: null,
              mostrar_no_ranking: true,
              molduraSelecionada: null,
              cartaMolduraSelecionada: {
                moldura: 'https://exemplo.com/moldura.png',
                config_visual: null,
              },
            },
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
          molduraClasse: 'molduraCarta',
          molduraUrl: 'https://exemplo.com/moldura.png',
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
