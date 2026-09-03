import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comToken,
  criarAppRotasCriticas,
  usuarioTeste,
} from '../support/criar-app-rotas-criticas';

describe('Rotas críticas - fluxo HTTP da partida', () => {
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

  it('inicia uma partida usando o deck informado', async () => {
    const idDeck = '98b41c21-22fd-45f6-bcd2-87590328d930';
    partidasService.iniciar.mockResolvedValue({
      id: 'partida-1',
      status: 'EM_ANDAMENTO',
    });

    await request(app.getHttpServer())
      .post('/partidas')
      .set(comToken)
      .send({ idDeck })
      .expect(201)
      .expect({ id: 'partida-1', status: 'EM_ANDAMENTO' });

    expect(partidasService.iniciar).toHaveBeenCalledWith(
      usuarioTeste.id,
      idDeck,
    );
  });

  it('processa um turno pelo endpoint da partida', async () => {
    partidasService.executarTurno.mockResolvedValue({
      id: 'partida-1',
      turno: 2,
      status: 'EM_ANDAMENTO',
    });

    await request(app.getHttpServer())
      .post('/partidas/partida-1/turnos')
      .set(comToken)
      .send({ acao: 'DEFENDER' })
      .expect(201)
      .expect({ id: 'partida-1', turno: 2, status: 'EM_ANDAMENTO' });

    expect(partidasService.executarTurno).toHaveBeenCalledWith(
      usuarioTeste.id,
      'partida-1',
      'DEFENDER',
    );
  });

  it('rejeita uma ação de batalha desconhecida', async () => {
    await request(app.getHttpServer())
      .post('/partidas/partida-1/turnos')
      .set(comToken)
      .send({ acao: 'FUGIR' })
      .expect(400);

    expect(partidasService.executarTurno).not.toHaveBeenCalled();
  });
});
