import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PerfilService } from './perfil.service';

describe('PerfilService', () => {
  const prisma = {
    perfilUsuario: {
      upsert: jest.fn(),
    },
    usuarioMoldura: {
      findUnique: jest.fn(),
    },
    usuario: {
      findFirstOrThrow: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    solicitacaoExclusao: {
      findMany: jest.fn().mockResolvedValue([]),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };
  const emailService = {
    sendPendingEmailVerification: jest.fn(),
  };
  let service: PerfilService;

  beforeEach(() => {
    jest.resetAllMocks();
    prisma.solicitacaoExclusao.findMany.mockResolvedValue([]);
    service = new PerfilService(prisma as never, emailService as never);
  });

  it('atualiza e normaliza a biografia', async () => {
    prisma.perfilUsuario.upsert.mockResolvedValue({
      biografia: 'Nova biografia',
    });

    const resultado = await service.atualizarBiografia('usuario-id', {
      biografia: '  Nova biografia  ',
    });

    expect(prisma.perfilUsuario.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { biografia: 'Nova biografia' },
      }),
    );
    expect(resultado.biografia).toBe('Nova biografia');
  });

  it('impede selecionar moldura que o jogador nao possui', async () => {
    prisma.usuarioMoldura.findUnique.mockResolvedValue(null);

    await expect(
      service.selecionarMoldura('usuario-id', {
        idMoldura: 'd42bc48e-406f-4cb6-9786-66f5573d505a',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('rejeita senha atual incorreta ao desativar', async () => {
    prisma.usuario.findFirstOrThrow.mockResolvedValue({
      id: 'usuario-id',
      nome: 'Jogador',
      email: 'jogador@email.com',
      senha_hash: await bcrypt.hash('senha-correta', 4),
    });

    await expect(
      service.desativarConta('usuario-id', {
        senhaAtual: 'senha-incorreta',
      }),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejeita token invalido de troca de e-mail', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.confirmarTrocaEmail('a'.repeat(64))).rejects.toThrow(
      'Link de confirmacao invalido.',
    );
  });

  it('primeira confirmacao preserva o e-mail atual', async () => {
    prisma.usuario.findUnique
      .mockResolvedValueOnce({
        id: 'usuario-id',
        nome: 'Jogador',
        email: 'atual@email.com',
        email_pendente: 'novo@email.com',
        token_troca_email_expira_em: new Date(Date.now() + 60_000),
      })
      .mockResolvedValueOnce(null);
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.update.mockResolvedValue({});

    const resposta = await service.confirmarTrocaEmail('a'.repeat(64));

    expect(prisma.usuario.update).toHaveBeenCalledWith({
      where: { id: 'usuario-id' },
      data: expect.not.objectContaining({ email: 'novo@email.com' }),
    });
    expect(emailService.sendPendingEmailVerification).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'novo@email.com',
        emailAtual: 'atual@email.com',
      }),
    );
    expect(resposta.message).toContain('confirmacao final');
  });

  it('segunda confirmacao efetiva o novo e-mail', async () => {
    prisma.usuario.findUnique
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'usuario-id',
        nome: 'Jogador',
        email: 'atual@email.com',
        email_pendente: 'novo@email.com',
        token_email_pendente_expira_em: new Date(Date.now() + 60_000),
      });
    prisma.usuario.findFirst.mockResolvedValue(null);
    prisma.usuario.update.mockResolvedValue({});

    await service.confirmarTrocaEmail('b'.repeat(64));

    expect(prisma.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usuario-id' },
        data: expect.objectContaining({
          email: 'novo@email.com',
          email_verificado: true,
          email_pendente: null,
        }),
      }),
    );
  });
});
