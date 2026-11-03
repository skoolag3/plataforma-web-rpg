import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma.service';
import { AdminUsuariosService } from './admin-usuarios.service';

describe('AdminUsuariosService: expedições e lutas', () => {
  const prisma = {
    usuario: { findFirst: jest.fn() },
    expedicao: { count: jest.fn(), findMany: jest.fn() },
    logPartida: { findFirst: jest.fn() },
  };
  const service = new AdminUsuariosService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'usuario-1', nome: 'Jogador', email: 'jogador@teste.com',
      nivel: 1, saldo_rubys_cache: 0, ativo: true, bloqueado: false,
      is_admin: false, email_verificado: true, criado_em: new Date(),
      ultimo_login_em: null, _count: { partidas: 0 }, perfil: null,
    });
  });

  it('retorna 10 expedições por página e inclui as lutas da página', async () => {
    prisma.expedicao.count.mockResolvedValue(15);
    prisma.expedicao.findMany.mockResolvedValue([{
      id: 'expedicao-11', deck: { nome: 'Meu deck' }, status: 'CONCLUIDA',
      etapa_atual: 4, criado_em: new Date(), finalizado_em: new Date(),
      partidas: [{
        id: 'luta-1', etapa_expedicao: 0, resultado: 'VITORIA',
        turnos_jogados: 3, recompensa_rubys: 25,
        timestamp_inicio: new Date(), timestamp_fim: new Date(),
      }],
    }]);

    const resposta = await service.buscarExpedicoes('usuario-1', '2');
    expect(resposta).toMatchObject({
      total: 15, pagina: 2, porPagina: 10, totalPaginas: 2,
      itens: [{ id: 'expedicao-11', rubys: 25, lutas: [{ id: 'luta-1', turnos: 3 }] }],
    });
    expect(prisma.expedicao.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_usuario: 'usuario-1' }, skip: 10, take: 10,
      include: expect.objectContaining({
        partidas: expect.objectContaining({ where: { id_usuario: 'usuario-1' } }),
      }),
    }));
  });

  it('limita a busca do chatlog ao usuário e à expedição da luta', async () => {
    prisma.logPartida.findFirst.mockResolvedValue({
      id: 'luta-1', etapa_expedicao: 0, resultado: 'VITORIA',
      turnos_jogados: 3, recompensa_rubys: 25, timestamp_inicio: new Date(),
      timestamp_fim: new Date(), eventos: [{
        id: 'evento-1', sequencia: 1, turno: 1, tipo: 'ATAQUE',
        origem: 'JOGADOR', texto: 'Flare atacou.', valor: 30, criado_em: new Date(),
      }],
    });
    const resposta = await service.buscarLogLutaExpedicao('usuario-1', 'expedicao-1', 'luta-1');
    expect(resposta.eventos[0].texto).toBe('Flare atacou.');
    expect(prisma.logPartida.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        id: 'luta-1', id_expedicao: 'expedicao-1',
        id_usuario: 'usuario-1', expedicao: { id_usuario: 'usuario-1' },
      },
    }));
  });

  it('não revela uma luta fora da expedição do usuário', async () => {
    prisma.logPartida.findFirst.mockResolvedValue(null);
    await expect(service.buscarLogLutaExpedicao('usuario-1', 'outra-expedicao', 'luta-1'))
      .rejects.toBeInstanceOf(NotFoundException);
  });
});
