import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comToken,
  criarAppRotasCriticas,
  usuarioTeste,
} from '../support/criar-app-rotas-criticas';

const cartasValidas = [
  '98b41c21-22fd-45f6-bcd2-87590328d930',
  'df111ac4-dddf-4870-a509-5106f8794b64',
  '457e2264-a2d7-482d-a79a-b46265dc231e',
];

describe('Rotas críticas - criação e validação de decks', () => {
  let app: INestApplication<App>;
  let decksService: Awaited<
    ReturnType<typeof criarAppRotasCriticas>
  >['services']['decksService'];

  beforeAll(async () => {
    const contexto = await criarAppRotasCriticas();
    app = contexto.app;
    decksService = contexto.services.decksService;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('cria um deck autenticado com dados válidos', async () => {
    const dto = { nome: 'Deck Eclipse', cartas: cartasValidas, ativar: true };
    decksService.criar.mockResolvedValue({ id: 'deck-1', ...dto });

    await request(app.getHttpServer())
      .post('/decks')
      .set(comToken)
      .send(dto)
      .expect(201)
      .expect({ id: 'deck-1', ...dto });

    expect(decksService.criar).toHaveBeenCalledWith(usuarioTeste.id, dto);
  });

  it('rejeita UUID inválido e cartas repetidas', async () => {
    await request(app.getHttpServer())
      .post('/decks')
      .set(comToken)
      .send({ nome: 'Deck inválido', cartas: ['invalido', 'invalido'] })
      .expect(400);

    expect(decksService.criar).not.toHaveBeenCalled();
  });

  it('rejeita decks acima do limite de seis cartas', async () => {
    const cartas = Array.from(
      { length: 7 },
      (_, indice) =>
        `00000000-0000-4000-8000-${String(indice).padStart(12, '0')}`,
    );

    await request(app.getHttpServer())
      .post('/decks')
      .set(comToken)
      .send({ nome: 'Deck grande', cartas })
      .expect(400);

    expect(decksService.criar).not.toHaveBeenCalled();
  });
});
