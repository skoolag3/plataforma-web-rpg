import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comToken,
  criarAppRotasCriticas,
  usuarioTeste,
} from '../support/criar-app-rotas-criticas';

describe('Rotas críticas - ranking e histórico', () => {
  let app: INestApplication<App>;
  let partidasService: Awaited<
    ReturnType<typeof criarAppRotasCriticas>
  >['services']['partidasService'];

  beforeAll(async () => {
    const contexto = await criarAppRotasCriticas();
    app = contexto.app;
    partidasService = contexto.services.partidasService;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('retorna o ranking pelo endpoint protegido', async () => {
    const ranking = [{ posicao: 1, nome: 'Gabriel', pontos: 120 }];
    partidasService.ranking.mockResolvedValue(ranking);

    await request(app.getHttpServer())
      .get('/ranking')
      .set(comToken)
      .expect(200)
      .expect(ranking);

    expect(partidasService.ranking).toHaveBeenCalledTimes(1);
  });

  it('retorna somente o histórico do usuário autenticado', async () => {
    const historico = [{ id: 'partida-1', resultado: 'VITORIA', turnos: 4 }];
    partidasService.historico.mockResolvedValue(historico);

    await request(app.getHttpServer())
      .get('/partidas')
      .set(comToken)
      .expect(200)
      .expect(historico);

    expect(partidasService.historico).toHaveBeenCalledWith(usuarioTeste.id);
  });
});
