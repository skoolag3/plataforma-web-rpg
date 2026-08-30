import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
  ValidationError,
  ValidationPipe,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { App } from 'supertest/types';
import { CurrentUser } from '../../src/common/decorators/current-user.decorator';
import { HttpExceptionFilter } from '../../src/common/filters/http-exception.filter';
import { AdminGuard } from '../../src/common/guards/admin.guard';
import { JwtAuthGuard } from '../../src/common/guards/jwt-auth.guard';
import { AdminDashboardController } from '../../src/modules/admin/controllers/admin-dashboard.controller';
import { AdminDashboardService } from '../../src/modules/admin/services/admin-dashboard.service';
import { AuthController } from '../../src/modules/auth/controllers/auth.controller';
import { AuthService } from '../../src/modules/auth/services/auth.service';
import { ColecaoService } from '../../src/modules/jogo/colecao.service';
import { DecksService } from '../../src/modules/jogo/decks.service';
import { GachaService } from '../../src/modules/jogo/gacha.service';
import { JogoController } from '../../src/modules/jogo/jogo.controller';
import { PartidasService } from '../../src/modules/jogo/partidas.service';
import { LojaController } from '../../src/modules/loja/loja.controller';
import { LojaService } from '../../src/modules/loja/loja.service';

type ErroValidacao = {
  field: string;
  messages: string[];
};

export const usuarioTeste = {
  id: '700e7777-b3f4-459d-9e96-242493776696',
  email: 'teste@animecards.com',
  isAdmin: false,
};

class JwtTesteGuard implements CanActivate {
  canActivate(contexto: ExecutionContext) {
    const req = contexto.switchToHttp().getRequest();
    if (req.headers.authorization !== 'Bearer token-teste') {
      throw new UnauthorizedException('Token ausente ou inválido.');
    }

    req.user = {
      ...usuarioTeste,
      isAdmin: req.headers['x-admin-teste'] === 'true',
    };
    return true;
  }
}

function formatarErros(erros: ValidationError[]): ErroValidacao[] {
  return erros.flatMap((erro) => {
    const filhos = erro.children?.length
      ? formatarErros(erro.children).map((filho) => ({
          ...filho,
          field: `${erro.property}.${filho.field}`,
        }))
      : [];

    return [
      ...(erro.constraints
        ? [{ field: erro.property, messages: Object.values(erro.constraints) }]
        : []),
      ...filhos,
    ];
  });
}

export async function criarAppRotasCriticas() {
  const authService = {
    registrar: jest.fn(),
    verificarEmail: jest.fn(),
    reenviarVerificacao: jest.fn(),
    solicitarRedefinicaoSenha: jest.fn(),
    redefinirSenha: jest.fn(),
    login: jest.fn(),
    buscarPerfil: jest.fn(),
  };
  const colecaoService = { listar: jest.fn() };
  const decksService = {
    listar: jest.fn(),
    buscar: jest.fn(),
    criar: jest.fn(),
    atualizar: jest.fn(),
    ativar: jest.fn(),
    excluir: jest.fn(),
  };
  const partidasService = {
    iniciar: jest.fn(),
    buscarAtual: jest.fn(),
    buscar: jest.fn(),
    executarTurno: jest.fn(),
    historico: jest.fn(),
    ranking: jest.fn(),
  };
  const gachaService = {
    listar: jest.fn(),
    girar: jest.fn(),
    resgatarDiario: jest.fn(),
  };
  const lojaService = {
    pacotes: jest.fn(),
    criarCheckout: jest.fn(),
    webhook: jest.fn(),
  };
  const adminDashboardService = { resumo: jest.fn() };

  const modulo = await Test.createTestingModule({
    controllers: [
      AuthController,
      JogoController,
      LojaController,
      AdminDashboardController,
    ],
    providers: [
      AdminGuard,
      { provide: AuthService, useValue: authService },
      { provide: ColecaoService, useValue: colecaoService },
      { provide: DecksService, useValue: decksService },
      { provide: PartidasService, useValue: partidasService },
      { provide: GachaService, useValue: gachaService },
      { provide: LojaService, useValue: lojaService },
      { provide: AdminDashboardService, useValue: adminDashboardService },
    ],
  })
    .overrideGuard(JwtAuthGuard)
    .useClass(JwtTesteGuard)
    .compile();

  const app = modulo.createNestApplication<INestApplication<App>>({
    rawBody: true,
  });
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      exceptionFactory: (erros) =>
        new BadRequestException({
          message: 'Dados invalidos.',
          details: formatarErros(erros),
        }),
    }),
  );
  await app.init();

  return {
    app,
    services: {
      authService,
      colecaoService,
      decksService,
      partidasService,
      gachaService,
      lojaService,
      adminDashboardService,
    },
  };
}

export const comToken = { Authorization: 'Bearer token-teste' };
export const comAdmin = {
  ...comToken,
  'x-admin-teste': 'true',
};
