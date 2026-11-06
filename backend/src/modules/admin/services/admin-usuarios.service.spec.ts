import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AdminUsuariosService } from './admin-usuarios.service';
import { PrismaService } from '../../../database/prisma.service';

describe('AdminUsuariosService.remover', () => {
  const usuario = {
    nome: 'Jogador Teste',
    email: 'jogador@teste.com',
    is_admin: false,
  };
  const tx = {
    usuario: {
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
    provedorUsuario: { deleteMany: jest.fn() },
    perfilUsuario: { updateMany: jest.fn() },
    logAdminUsuario: { create: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn(
      (callback: (cliente: typeof tx) => Promise<unknown>) => callback(tx),
    ),
  };
  const service = new AdminUsuariosService(prisma as unknown as PrismaService);
  const dto = { confirmarNome: usuario.nome, confirmarImpacto: true };

  beforeEach(() => {
    jest.clearAllMocks();
    tx.usuario.findFirst.mockResolvedValue(usuario);
    tx.usuario.updateMany.mockResolvedValue({ count: 1 });
    tx.provedorUsuario.deleteMany.mockResolvedValue({ count: 0 });
    tx.perfilUsuario.updateMany.mockResolvedValue({ count: 1 });
    tx.logAdminUsuario.create.mockResolvedValue({});
  });

  it('marca a conta como excluída sem apagar dados e audita a ação', async () => {
    await expect(service.remover('usuario-1', dto, 'admin-1')).resolves.toEqual(
      { message: 'Usuário removido.' },
    );
    const chamadasAtualizacao = tx.usuario.updateMany.mock.calls as unknown as [
      {
        where: { id: string; excluido_em: null; is_admin: { not: boolean } };
        data: {
          email: string;
          ativo: boolean;
          bloqueado: boolean;
          excluido_em: Date;
        };
      },
    ][];
    const atualizacao = chamadasAtualizacao[0][0];
    expect(atualizacao.where).toEqual({
      id: 'usuario-1',
      excluido_em: null,
      is_admin: { not: true },
    });
    expect(atualizacao.data.email).toBe('excluido-usuario1@anon.invalid');
    expect(atualizacao.data.ativo).toBe(false);
    expect(atualizacao.data.bloqueado).toBe(true);
    expect(atualizacao.data.excluido_em).toBeInstanceOf(Date);
    expect(tx.provedorUsuario.deleteMany).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-1' },
    });

    const chamadasLog = tx.logAdminUsuario.create.mock.calls as unknown as [
      {
        data: { id_admin: string; id_usuario: string; acao: string };
      },
    ][];
    const log = chamadasLog[0][0];
    expect(log.data).toMatchObject({
      id_admin: 'admin-1',
      id_usuario: 'usuario-1',
      acao: 'CONTA_REMOVIDA',
    });
  });

  it('impede a remoção da própria conta', async () => {
    await expect(
      service.remover('admin-1', dto, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('impede a remoção de outros administradores', async () => {
    tx.usuario.findFirst.mockResolvedValue({ ...usuario, is_admin: true });
    await expect(
      service.remover('usuario-1', dto, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });

  it('exige confirmação do impacto e nome exato', async () => {
    await expect(
      service.remover(
        'usuario-1',
        { ...dto, confirmarImpacto: false },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      service.remover(
        'usuario-1',
        { ...dto, confirmarNome: 'Outro' },
        'admin-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });

  it('não remove conta já excluída', async () => {
    tx.usuario.findFirst.mockResolvedValue(null);
    await expect(
      service.remover('usuario-1', dto, 'admin-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(tx.usuario.updateMany).not.toHaveBeenCalled();
  });

  it('reverte a transação se a conta for alterada antes da atualização', async () => {
    tx.usuario.updateMany.mockResolvedValue({ count: 0 });
    await expect(
      service.remover('usuario-1', dto, 'admin-1'),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(tx.logAdminUsuario.create).not.toHaveBeenCalled();
  });
});
