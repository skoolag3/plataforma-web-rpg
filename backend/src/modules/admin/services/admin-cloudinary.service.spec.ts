import { v2 as cloudinary } from 'cloudinary';
import { AdminCloudinaryService } from './admin-cloudinary.service';

describe('AdminCloudinaryService: limpeza de imagens', () => {
  const url = 'https://res.cloudinary.com/conta-teste/image/upload/v123/anime-cards/cartas/fotos/flare.png';
  const prisma = { carta: { count: jest.fn() } };
  const service = new AdminCloudinaryService(prisma as never);
  const cloudNameAnterior = process.env.CLOUDINARY_CLOUD_NAME;
  const urlAnterior = process.env.CLOUDINARY_URL;
  const apiKeyAnterior = process.env.CLOUDINARY_API_KEY;
  const apiSecretAnterior = process.env.CLOUDINARY_API_SECRET;

  beforeEach(() => {
    jest.resetAllMocks();
    delete process.env.CLOUDINARY_URL;
    process.env.CLOUDINARY_CLOUD_NAME = 'conta-teste';
    process.env.CLOUDINARY_API_KEY = 'teste';
    process.env.CLOUDINARY_API_SECRET = 'teste';
  });

  afterAll(() => {
    if (cloudNameAnterior === undefined) delete process.env.CLOUDINARY_CLOUD_NAME;
    else process.env.CLOUDINARY_CLOUD_NAME = cloudNameAnterior;
    if (urlAnterior === undefined) delete process.env.CLOUDINARY_URL;
    else process.env.CLOUDINARY_URL = urlAnterior;
    if (apiKeyAnterior === undefined) delete process.env.CLOUDINARY_API_KEY;
    else process.env.CLOUDINARY_API_KEY = apiKeyAnterior;
    if (apiSecretAnterior === undefined) delete process.env.CLOUDINARY_API_SECRET;
    else process.env.CLOUDINARY_API_SECRET = apiSecretAnterior;
  });

  it('preserva imagem ainda usada por outra carta', async () => {
    prisma.carta.count.mockResolvedValue(1);
    const remover = jest.spyOn(cloudinary.uploader, 'destroy').mockResolvedValue({ result: 'ok' } as never);
    await service.removerImagemSeNaoUsada(url);
    expect(remover).not.toHaveBeenCalled();
    remover.mockRestore();
  });

  it('ignora URLs externas e não consulta o banco', async () => {
    await service.removerImagemSeNaoUsada('https://outro-site.com/flare.png');
    expect(prisma.carta.count).not.toHaveBeenCalled();
  });

  it('exclui arquivo próprio sem referências e invalida o cache', async () => {
    prisma.carta.count.mockResolvedValue(0);
    const remover = jest.spyOn(cloudinary.uploader, 'destroy').mockResolvedValue({ result: 'ok' } as never);
    await service.removerImagemSeNaoUsada(url);
    expect(remover).toHaveBeenCalledWith('anime-cards/cartas/fotos/flare', { invalidate: true });
    remover.mockRestore();
  });

  it('assina upload direto em pasta isolada sem expor o segredo', () => {
    const assinatura = service.assinarUploadCarta('moldura');
    expect(assinatura).toEqual(expect.objectContaining({
      cloudName: 'conta-teste',
      apiKey: 'teste',
      folder: 'anime-cards/cartas/molduras',
      overwrite: false,
      signature: expect.any(String),
    }));
    expect(JSON.stringify(assinatura)).not.toContain('apiSecret');
  });
});
