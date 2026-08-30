import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comAdmin,
  comToken,
  criarAppRotasCriticas,
} from '../support/criar-app-rotas-criticas';

describe('Rotas críticas - acesso administrativo', () => {
  let app: INestApplication<App>;
  let dashboardService: Awaited<
    ReturnType<typeof criarAppRotasCriticas>
  >['services']['adminDashboardService'];

  beforeAll(async () => {
    const contexto = await criarAppRotasCriticas();
    app = contexto.app;
    dashboardService = contexto.services.adminDashboardService;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('rejeita visitante sem sessão', async () => {
    await request(app.getHttpServer()).get('/admin/dashboard').expect(401);
    expect(dashboardService.resumo).not.toHaveBeenCalled();
  });

  it('rejeita usuário autenticado sem permissão administrativa', async () => {
    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set(comToken)
      .expect(403);

    expect(dashboardService.resumo).not.toHaveBeenCalled();
  });

  it('libera somente o usuário administrativo', async () => {
    dashboardService.resumo.mockResolvedValue({ usuarios: 3, cartas: 12 });

    await request(app.getHttpServer())
      .get('/admin/dashboard')
      .set(comAdmin)
      .expect(200)
      .expect({ usuarios: 3, cartas: 12 });

    expect(dashboardService.resumo).toHaveBeenCalledTimes(1);
  });
});
