import { ConflictException } from '@nestjs/common';
import { AdminBannersService } from './admin-banners.service';

describe('AdminBannersService', () => {
  const idBanner = '11111111-1111-4111-8111-111111111111';

  function prepararServico() {
    const tx = {
      $executeRaw: jest.fn(),
      banner: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
      bannerRotacao: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      carta: { count: jest.fn() },
    };
    const prisma = {
      $transaction: jest.fn(
        async (callback: (transacao: typeof tx) => Promise<unknown>) =>
          callback(tx),
      ),
    };
    const service = new AdminBannersService(prisma as never, {} as never);

    return { service, tx };
  }

  it('impede excluir o único banner ativo', async () => {
    const { service, tx } = prepararServico();
    tx.banner.findUnique.mockResolvedValue({
      id: idBanner,
      nome: 'Eclipse Roxo',
      ativo: true,
      _count: { gachaLogs: 0 },
    });
    tx.banner.count.mockResolvedValue(0);

    await expect(service.remover(idBanner)).rejects.toThrow(
      new ConflictException('É obrigatório manter pelo menos um banner ativo.'),
    );
    expect(tx.banner.delete).not.toHaveBeenCalled();
  });

  it('impede desativar o único banner ativo', async () => {
    const { service, tx } = prepararServico();
    tx.banner.findUnique.mockResolvedValue({ id: idBanner, ativo: true });
    tx.banner.count.mockResolvedValue(0);

    await expect(service.atualizar(idBanner, { ativo: false })).rejects.toThrow(
      'É obrigatório manter pelo menos um banner ativo.',
    );
    expect(tx.banner.update).not.toHaveBeenCalled();
  });

  it('exclui um banner sem histórico quando há outro ativo', async () => {
    const { service, tx } = prepararServico();
    tx.banner.findUnique.mockResolvedValue({
      id: idBanner,
      nome: 'Eclipse Roxo',
      ativo: true,
      _count: { gachaLogs: 0 },
    });
    tx.banner.count.mockResolvedValue(1);
    tx.banner.findFirst.mockResolvedValue({ id: 'banner-substituto' });
    tx.bannerRotacao.findUnique.mockResolvedValue({
      id: 1,
      id_banner: idBanner,
    });
    tx.banner.delete.mockResolvedValue({ id: idBanner });

    await expect(service.remover(idBanner)).resolves.toEqual({
      message: 'Eclipse Roxo excluído.',
    });
    expect(tx.bannerRotacao.update).toHaveBeenCalledTimes(1);
    expect(tx.banner.delete).toHaveBeenCalledWith({
      where: { id: idBanner },
    });
  });
});
