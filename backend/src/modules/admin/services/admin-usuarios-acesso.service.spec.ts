import { BadRequestException } from '@nestjs/common';
import { AdminUsuariosService } from './admin-usuarios.service';
import { PrismaService } from '../../../database/prisma.service';

const usuario = {
  id: 'usuario-1', nome: 'Jogador', email: 'jogador@teste.com', nivel: 1,
  saldo_rubys_cache: 0, ativo: true, bloqueado: false, is_admin: false,
  email_verificado: true, criado_em: new Date(), ultimo_login_em: null,
  _count: { partidas: 0 }, perfil: null,
};

describe('AdminUsuariosService: acesso e coleção', () => {
  const tx = {
    usuario: { update: jest.fn() },
    inventario: { findUnique: jest.fn(), create: jest.fn(), updateMany: jest.fn() },
    logAdminUsuario: { create: jest.fn() },
  };
  const prisma = {
    usuario: { findFirst: jest.fn() },
    carta: { findFirst: jest.fn() },
    $transaction: jest.fn((callback: (cliente: typeof tx) => Promise<unknown>) => callback(tx)),
  };
  const service = new AdminUsuariosService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.usuario.findFirst.mockResolvedValue(usuario);
    prisma.carta.findFirst.mockResolvedValue({ id: 'carta-1', nome: 'Flare' });
    tx.usuario.update.mockResolvedValue({ ...usuario, is_admin: true });
    tx.logAdminUsuario.create.mockResolvedValue({});
  });

  it('concede admin, ativa e desbloqueia a conta com auditoria', async () => {
    const atualizado = await service.atualizar('usuario-1', { admin: true }, 'admin-1');
    expect(atualizado.admin).toBe(true);
    expect(tx.usuario.update).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ is_admin: true, ativo: true, bloqueado: false }),
    }));
    expect(tx.logAdminUsuario.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ acao: 'ADMIN_CONCEDIDO', id_admin: 'admin-1' }),
    }));
  });

  it('recusa conceder admin e inativar a conta ao mesmo tempo', async () => {
    await expect(service.atualizar('usuario-1', { admin: true, ativo: false }, 'admin-1'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.update).not.toHaveBeenCalled();
  });

  it('recusa adicionar uma segunda cópia da mesma carta', async () => {
    tx.inventario.findUnique.mockResolvedValue({ quantidade: 1 });
    await expect(service.ajustarColecao('usuario-1', { idCarta: 'carta-1', quantidade: 1 }, 'admin-1'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(tx.inventario.create).not.toHaveBeenCalled();
    expect(tx.inventario.updateMany).not.toHaveBeenCalled();
    expect(tx.logAdminUsuario.create).not.toHaveBeenCalled();
  });

  it('recusa adicionar mais de uma cópia numa chamada', async () => {
    await expect(service.ajustarColecao('usuario-1', { idCarta: 'carta-1', quantidade: 2 }, 'admin-1'))
      .rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});
