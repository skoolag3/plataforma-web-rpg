import { CorreioService } from './correio.service';

describe('CorreioService', () => {
  const prisma = {
    usuario: { findUnique: jest.fn() },
    banner: { findFirst: jest.fn() },
    noticia: { findMany: jest.fn() },
    correioLeitura: { findMany: jest.fn(), upsert: jest.fn() },
  };
  const bannerRotacao = { obterAtual: jest.fn() };
  const service = new CorreioService(prisma as never, bannerRotacao as never);

  beforeEach(() => {
    jest.clearAllMocks();
    bannerRotacao.obterAtual.mockResolvedValue({ idBanner: 'banner' });
    prisma.usuario.findUnique.mockResolvedValue({
      ultima_recompensa_semanal_em: null,
    });
    prisma.banner.findFirst.mockResolvedValue({ usuarioColetas: [] });
    prisma.noticia.findMany.mockResolvedValue([
      {
        id: 'noticia',
        titulo: 'Evento de setembro',
        resumo: 'Novas recompensas por tempo limitado.',
        categoria: 'EVENTO',
        criado_em: new Date('2026-09-01T13:00:00.000Z'),
      },
    ]);
    prisma.correioLeitura.findMany.mockResolvedValue([]);
  });

  it('reúne recompensas disponíveis e comunicados publicados', async () => {
    const res = await service.listar('usuario');

    expect(res.itens).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tipo: 'RECOMPENSA', href: '/gacha' }),
        expect.objectContaining({
          chave: 'noticia:noticia',
          tipo: 'EVENTO',
        }),
      ]),
    );
    expect(res.naoLidas).toBe(res.itens.length);
  });

  it('preserva a leitura do usuário', async () => {
    prisma.correioLeitura.findMany.mockResolvedValue([
      { chave: 'noticia:noticia' },
    ]);

    const res = await service.listar('usuario');

    expect(
      res.itens.find((item) => item.chave === 'noticia:noticia')?.lida,
    ).toBe(true);
  });

  it('marca uma mensagem como lida com upsert', async () => {
    prisma.correioLeitura.upsert.mockResolvedValue({});

    await service.marcarComoLida('usuario', 'noticia:noticia');

    expect(prisma.correioLeitura.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id_usuario_chave: {
            id_usuario: 'usuario',
            chave: 'noticia:noticia',
          },
        },
      }),
    );
  });
});
