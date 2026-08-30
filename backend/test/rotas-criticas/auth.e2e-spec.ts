import type { INestApplication } from '@nestjs/common';
import request from 'supertest';
import type { App } from 'supertest/types';
import {
  comToken,
  criarAppRotasCriticas,
  usuarioTeste,
} from '../support/criar-app-rotas-criticas';

describe('Rotas críticas - login e autenticação', () => {
  let app: INestApplication<App>;
  let authService: Awaited<
    ReturnType<typeof criarAppRotasCriticas>
  >['services']['authService'];

  beforeAll(async () => {
    const contexto = await criarAppRotasCriticas();
    app = contexto.app;
    authService = contexto.services.authService;
  });

  beforeEach(() => jest.clearAllMocks());
  afterAll(async () => app.close());

  it('realiza login com credenciais válidas', async () => {
    authService.login.mockResolvedValue({ access_token: 'jwt-valido' });

    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: usuarioTeste.email, senha: 'Senha@123' })
      .expect(201)
      .expect({ access_token: 'jwt-valido' });

    expect(authService.login).toHaveBeenCalledWith({
      email: usuarioTeste.email,
      senha: 'Senha@123',
    });
  });

  it('rejeita dados de login inválidos antes de chamar o service', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email: 'email-invalido', senha: '123' })
      .expect(400);

    expect(authService.login).not.toHaveBeenCalled();
  });

  it('protege o perfil e aceita uma sessão autenticada', async () => {
    await request(app.getHttpServer()).get('/auth/me').expect(401);

    authService.buscarPerfil.mockResolvedValue(usuarioTeste);
    await request(app.getHttpServer())
      .get('/auth/me')
      .set(comToken)
      .expect(200)
      .expect(usuarioTeste);

    expect(authService.buscarPerfil).toHaveBeenCalledWith(usuarioTeste.id);
  });
});
