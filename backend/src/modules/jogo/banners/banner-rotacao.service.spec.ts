import { BannerRotacaoService } from './banner-rotacao.service';

describe('BannerRotacaoService', () => {
  const padrao = { id: 'padrao', inicio_em: null, fim_em: null };
  const agendado = { id: 'agendado', inicio_em: new Date('2020-01-01T00:00:00Z'), fim_em: new Date('2099-01-01T00:00:00Z') };

  afterEach(() => jest.useRealTimers());

  function preparar(banners: Array<{ id: string; inicio_em: Date | null; fim_em: Date | null }>, idAtual: string) {
    const tx = {
      $executeRaw: jest.fn(),
      banner: { findMany: jest.fn().mockResolvedValue(banners), findFirst: jest.fn() },
      bannerRotacao: {
        findUnique: jest.fn().mockResolvedValue({ id: 1, id_banner: idAtual, proxima_rotacao_em: new Date('2099-01-01T00:00:00Z'), forcado_por_admin: false }),
        upsert: jest.fn().mockImplementation(({ update }: { update: { id_banner: string; proxima_rotacao_em: Date; forcado_por_admin: boolean } }) => Promise.resolve(update)),
      },
    };
    const prisma = { $transaction: jest.fn((callback: (valor: typeof tx) => unknown) => callback(tx)) };
    return { service: new BannerRotacaoService(prisma as never), tx };
  }

  it('mantém o banner padrão sem rodízio aleatório', async () => {
    const { service, tx } = preparar([padrao], 'padrao');
    expect((await service.obterAtual())?.idBanner).toBe('padrao');
    expect(tx.bannerRotacao.upsert).not.toHaveBeenCalled();
  });

  it('ativa o agendado enquanto a janela está aberta', async () => {
    const { service } = preparar([padrao, agendado], 'padrao');
    expect((await service.obterAtual())?.idBanner).toBe('agendado');
  });

  it('retorna ao padrão quando o agendado termina', async () => {
    const expirado = { ...agendado, fim_em: new Date('2020-01-02T00:00:00Z') };
    const { service } = preparar([padrao, expirado], 'agendado');
    expect((await service.obterAtual())?.idBanner).toBe('padrao');
  });

  it.each([
    ['2026-10-08T11:59:59.999Z', 'padrao'],
    ['2026-10-08T12:00:00.000Z', 'agendado'],
    ['2026-10-08T13:00:00.000Z', 'padrao'],
  ])('respeita início inclusivo e fim exclusivo em %s', async (agora, esperado) => {
    jest.useFakeTimers().setSystemTime(new Date(agora));
    const janela = { ...agendado, inicio_em: new Date('2026-10-08T12:00:00Z'), fim_em: new Date('2026-10-08T13:00:00Z') };
    const { service } = preparar([padrao, janela], 'padrao');
    expect((await service.obterAtual())?.idBanner).toBe(esperado);
  });

  it('prioriza o agendamento mais recente quando as janelas se sobrepõem', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:30:00Z'));
    const primeiro = { ...agendado, id: 'primeiro', inicio_em: new Date('2026-10-08T12:00:00Z') };
    const segundo = { ...agendado, id: 'segundo', inicio_em: new Date('2026-10-08T12:15:00Z') };
    const { service } = preparar([padrao, primeiro, segundo], 'padrao');
    expect((await service.obterAtual())?.idBanner).toBe('segundo');
  });

  it('não permite forçar banner antes do início ou depois do fim', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-08T12:00:00Z'));
    const futuro = { ...agendado, inicio_em: new Date('2026-10-08T13:00:00Z') };
    const { service, tx } = preparar([futuro], 'padrao');
    tx.banner.findFirst.mockResolvedValue(futuro);
    await expect(service.forcar('agendado')).rejects.toThrow('fora do período agendado');
    expect(tx.bannerRotacao.upsert).not.toHaveBeenCalled();
  });
});
