import { BadRequestException, ConflictException } from '@nestjs/common';
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
      carta: { count: jest.fn(), findMany: jest.fn() },
      raridadeCarta: { count: jest.fn() },
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

  it('impede raridade selecionada sem carta no banner', async () => {
    const { service, tx } = prepararServico();
    tx.carta.count.mockResolvedValue(1);
    tx.carta.findMany.mockResolvedValue([{ raridade: 'SECRETA' }]);
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'UR', percentual: 100 }], [])).rejects.toBeInstanceOf(BadRequestException);
  });

  it('impede percentuais que não somam 100%', async () => {
    const { service, tx } = prepararServico();
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'UR', percentual: 99.9 }], [])).rejects.toThrow('somar exatamente 100%');
  });

  it('aceita raridade secreta com carta e chance configurada', async () => {
    const { service, tx } = prepararServico();
    tx.carta.count.mockResolvedValue(1);
    tx.carta.findMany.mockResolvedValue([{ raridade: 'SECRETA' }]);
    tx.raridadeCarta.count.mockResolvedValue(1);
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'SECRETA', percentual: 100 }], [{ raridade: 'SECRETA', limite: 20 }])).resolves.toBeUndefined();
  });

  it.each([
    ['2026-10-08T12:00:00Z', '2026-10-08T12:00:00Z'],
    ['2026-10-08T13:00:00Z', '2026-10-08T12:00:00Z'],
  ])('recusa janela inválida de %s até %s', async (inicio, fim) => {
    const { service, tx } = prepararServico();
    await expect(service['validarConfiguracao'](tx as never, [], [], [], inicio, fim)).rejects.toThrow('posterior ao início');
    expect(tx.carta.count).not.toHaveBeenCalled();
  });

  it('recusa raridades e garantias repetidas antes de consultar cartas', async () => {
    const { service, tx } = prepararServico();
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'UR', percentual: 50 }, { raridade: 'UR', percentual: 50 }], [])).rejects.toBeInstanceOf(BadRequestException);
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'UR', percentual: 100 }], [{ raridade: 'UR', limite: 5 }, { raridade: 'UR', limite: 10 }])).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.carta.count).not.toHaveBeenCalled();
  });

  it('recusa carta inativa ou excluída e garantia de raridade ausente', async () => {
    const { service, tx } = prepararServico();
    tx.carta.count.mockResolvedValueOnce(0).mockResolvedValueOnce(1);
    tx.carta.findMany.mockResolvedValue([{ raridade: 'N' }]);
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'N', percentual: 100 }], [])).rejects.toThrow('cartas ativas');
    await expect(service['validarConfiguracao'](tx as never, ['carta-id'], [{ raridade: 'N', percentual: 100 }], [{ raridade: 'UR', limite: 10 }])).rejects.toThrow('toda carta e garantia');
  });
});
