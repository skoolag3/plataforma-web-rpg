import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comToken,
  criarAppRotasCriticas,
  usuarioTeste,
} from '../support/criar-app-rotas-criticas';

describe('Rotas críticas - Stripe e webhook', () => {
  let app: INestApplication<App>;
  let lojaService: Awaited<
    ReturnType<typeof criarAppRotasCriticas>
  >['services']['lojaService'];

  beforeAll(async () => {
    const contexto = await criarAppRotasCriticas();
    app = contexto.app;
    lojaService = contexto.services.lojaService;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('lista os pacotes disponíveis', async () => {
    lojaService.pacotes.mockResolvedValue([
      { id: 'pacote-1', nome: 'Pacote Médio', quantidadeRubys: 1400 },
    ]);

    await request(app.getHttpServer())
      .get('/loja/pacotes')
      .expect(200)
      .expect([
        { id: 'pacote-1', nome: 'Pacote Médio', quantidadeRubys: 1400 },
      ]);
  });

  it('cria checkout somente para usuário autenticado', async () => {
    await request(app.getHttpServer())
      .post('/loja/checkout/pacote-1')
      .expect(401);

    lojaService.criarCheckout.mockResolvedValue({
      url: 'https://checkout.test',
    });
    await request(app.getHttpServer())
      .post('/loja/checkout/pacote-1')
      .set(comToken)
      .expect(201)
      .expect({ url: 'https://checkout.test' });

    expect(lojaService.criarCheckout).toHaveBeenCalledWith(
      usuarioTeste.id,
      'pacote-1',
    );
  });

  it('encaminha o corpo bruto e a assinatura do webhook', async () => {
    lojaService.webhook.mockResolvedValue({ recebido: true });

    await request(app.getHttpServer())
      .post('/loja/stripe/webhook')
      .set('stripe-signature', 'assinatura-teste')
      .send({ id: 'evt_teste', type: 'checkout.session.completed' })
      .expect(201)
      .expect({ recebido: true });

    expect(lojaService.webhook).toHaveBeenCalledWith(
      expect.any(Buffer),
      'assinatura-teste',
    );
    const payload = lojaService.webhook.mock.calls[0][0] as Buffer;
    expect(JSON.parse(payload.toString('utf-8'))).toEqual({
      id: 'evt_teste',
      type: 'checkout.session.completed',
    });
  });
});
