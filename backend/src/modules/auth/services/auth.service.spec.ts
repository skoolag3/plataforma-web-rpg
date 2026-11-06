import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../../../database/prisma.service';
import { EmailService } from '../../email/email.service';

describe('AuthService.registrar', () => {
  const prismaMock = {
    usuario: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    provedorUsuario: {
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn((promessas: Promise<unknown>[]) =>
      Promise.all(promessas),
    ),
  };

  const jwtServiceMock = {} as unknown as JwtService;
  const emailServiceMock = {
    sendVerificationEmail: jest.fn().mockResolvedValue(undefined),
  } as unknown as EmailService;

  let service: AuthService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new AuthService(
      prismaMock as unknown as PrismaService,
      jwtServiceMock,
      emailServiceMock,
    );
    // Mock para validarEmailEntregavel não fazer chamadas de rede no teste
    jest.spyOn(service as any, 'validarEmailEntregavel').mockResolvedValue(undefined);
  });

  it('libera o e-mail e permite novo cadastro caso pertença a uma conta já excluída', async () => {
    const usuarioExcluido = {
      id: 'usuario-antigo-uuid',
      email: 'skulege167@gmail.com',
      excluido_em: new Date('2026-11-06T00:00:00.000Z'),
      email_verificado: true,
    };

    const novoUsuarioCriado = {
      id: 'novo-usuario-uuid',
      nome: 'Skulege',
      email: 'skulege167@gmail.com',
      email_verificado: false,
      token_verificacao_email: 'token-123',
    };

    prismaMock.usuario.findUnique.mockResolvedValue(usuarioExcluido);
    prismaMock.provedorUsuario.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.usuario.update.mockResolvedValue({});
    prismaMock.usuario.create.mockResolvedValue(novoUsuarioCriado);

    const resultado = await service.registrar({
      nome: 'Skulege',
      email: 'skulege167@gmail.com',
      senha: 'Password123!',
    });

    expect(resultado).toBeDefined();
    expect(prismaMock.provedorUsuario.deleteMany).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-antigo-uuid' },
    });
    expect(prismaMock.usuario.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'usuario-antigo-uuid' },
        data: expect.objectContaining({
          email: 'excluido-usuarioantigouuid@anon.invalid',
        }),
      }),
    );
    expect(prismaMock.usuario.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          email: 'skulege167@gmail.com',
          nome: 'Skulege',
        }),
      }),
    );
  });

  it('lança ConflictException se a conta já existe e está ativa e verificada', async () => {
    const usuarioAtivo = {
      id: 'usuario-ativo-uuid',
      email: 'skulege167@gmail.com',
      excluido_em: null,
      email_verificado: true,
    };

    prismaMock.usuario.findUnique.mockResolvedValue(usuarioAtivo);

    await expect(
      service.registrar({
        nome: 'Skulege',
        email: 'skulege167@gmail.com',
        senha: 'Password123!',
      }),
    ).rejects.toBeInstanceOf(ConflictException);
  });
});
