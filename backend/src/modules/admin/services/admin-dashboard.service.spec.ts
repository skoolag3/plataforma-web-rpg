import { Test, TestingModule } from '@nestjs/testing';
import { AdminDashboardService } from './admin-dashboard.service';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminDashboardService', () => {
  let service: AdminDashboardService;
  let prisma: {
    logGacha: { findMany: jest.Mock };
  };

  beforeEach(async () => {
    prisma = {
      logGacha: {
        findMany: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AdminDashboardService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<AdminDashboardService>(AdminDashboardService);
  });

  describe('listarUltimosPities', () => {
    it('retorna a lista de cartas obtidas no gacha com contador de pity e timestamp', async () => {
      const dataPull = new Date('2026-11-06T07:56:54.000Z');
      prisma.logGacha.findMany.mockResolvedValue([
        {
          id: 'log-1',
          pity_contador: 80,
          rubys_gastos: 300,
          timestamp_pull: dataPull,
          usuario: {
            id: 'user-1',
            nome: 'Gabriel',
            email: 'gabriel@email.com',
            perfil: { avatar_url: 'https://exemplo.com/avatar.png' },
          },
          banner: {
            id: 'banner-1',
            nome: 'Banner Lendário',
            configuracao: {
              pities: [{ raridade: 'UR', limite: 80 }],
            },
          },
          cartaObtida: {
            id: 'carta-1',
            nome: 'Tovan, Punho da Cascata',
            raridade: 'UR',
            elemento: 'AGUA',
            foto: 'https://exemplo.com/tovan.png',
            moldura: null,
            config_visual: null,
          },
        },
      ]);

      const resultado = await service.listarUltimosPities(10);

      expect(resultado).toHaveLength(1);
      expect(resultado[0]).toEqual({
        id: 'log-1',
        pityContador: 80,
        limitePityBanner: 80,
        foiPityGarantido: true,
        rubysGastos: 300,
        dataHora: dataPull.toISOString(),
        jogador: {
          id: 'user-1',
          nome: 'Gabriel',
          email: 'gabriel@email.com',
          avatarUrl: 'https://exemplo.com/avatar.png',
        },
        banner: {
          id: 'banner-1',
          nome: 'Banner Lendário',
        },
        carta: {
          id: 'carta-1',
          nome: 'Tovan, Punho da Cascata',
          raridade: 'UR',
          elemento: 'AGUA',
          foto: 'https://exemplo.com/tovan.png',
          moldura: null,
          configVisual: null,
        },
      });
    });
  });
});
