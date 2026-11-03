import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
    inventario: {
      findFirst: jest.fn(),
      count: jest.fn(),
    },
    carta: { count: jest.fn() },
    deck: { count: jest.fn() },
    logPartida: {
      groupBy: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
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

  it('não expõe o perfil de quem saiu do ranking', async () => {
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'usuario-id',
      nome: 'Jogador',
      perfil: { mostrar_no_ranking: false },
    });

    await expect(service.buscarPerfilPublico('usuario-id')).rejects.toBeInstanceOf(NotFoundException);
    expect(prisma.inventario.count).not.toHaveBeenCalled();
  });

  it('mostra somente dados públicos do jogador do ranking', async () => {
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'usuario-id',
      nome: 'Jogador',
      pontos_experiencia: 10,
      perfil: {
        mostrar_no_ranking: true,
        ocultar_historico: false,
        biografia: 'Gosto de cartas.',
        avatar_url: null,
        banner_url: null,
        molduraSelecionada: null,
        cartaMolduraSelecionada: null,
      },
    });
    prisma.inventario.count.mockResolvedValue(2);
    prisma.carta.count.mockResolvedValue(4);
    prisma.deck.count.mockResolvedValue(1);
    prisma.logPartida.groupBy.mockResolvedValue([{ resultado: 'VITORIA', _count: { _all: 1 } }]);
    prisma.logPartida.aggregate.mockResolvedValue({ _sum: { variacao_pontos: 25 } });
    prisma.logPartida.findMany.mockResolvedValue([{ id: 'partida-id', resultado: 'VITORIA', turnos_jogados: 4, variacao_pontos: 25, timestamp_inicio: new Date('2026-10-09T10:00:00Z'), deck: { nome: 'Principal' } }]);

    const perfil = await service.buscarPerfilPublico('usuario-id');

    expect(perfil).toMatchObject({ nome: 'Jogador', pontos: 25, partidas: 1, vitorias: 1, cartasObtidas: 2, totalCartas: 4, decksCriados: 1 });
    expect(perfil).not.toHaveProperty('email');
    expect(perfil).not.toHaveProperty('rubys');
    expect(perfil).not.toHaveProperty('ultimoLogin');
    expect(perfil.historico).toHaveLength(1);
  });

  it('oculta o histórico público quando o jogador desativa a exibição', async () => {
    prisma.usuario.findFirst.mockResolvedValue({
      id: 'usuario-id',
      nome: 'Jogador',
      pontos_experiencia: 0,
      perfil: { mostrar_no_ranking: true, ocultar_historico: true },
    });
    prisma.inventario.count.mockResolvedValue(0);
    prisma.carta.count.mockResolvedValue(0);
    prisma.deck.count.mockResolvedValue(0);
    prisma.logPartida.groupBy.mockResolvedValue([]);
    prisma.logPartida.aggregate.mockResolvedValue({ _sum: { variacao_pontos: null } });

    const perfil = await service.buscarPerfilPublico('usuario-id');

    expect(perfil.historicoOculto).toBe(true);
    expect(perfil.historico).toEqual([]);
    expect(prisma.logPartida.findMany).not.toHaveBeenCalled();
  });

  it('impede selecionar moldura que o jogador não possui', async () => {
    prisma.usuarioMoldura.findUnique.mockResolvedValue(null);

    await expect(
      service.selecionarMoldura('usuario-id', {
        idMoldura: 'd42bc48e-406f-4cb6-9786-66f5573d505a',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('restaura a moldura padrão sem exigir item no inventário', async () => {
    await service.selecionarMoldura('usuario-id', { idMoldura: 'padrao' });

    expect(prisma.perfilUsuario.upsert).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-id' },
      create: { id_usuario: 'usuario-id', id_moldura: null, id_carta_moldura: null },
      update: { id_moldura: null, id_carta_moldura: null },
    });
    expect(prisma.usuarioMoldura.findUnique).not.toHaveBeenCalled();
  });

  it('restaura a foto padrão sem consultar as cartas', async () => {
    const resposta = await service.selecionarFotoCarta('usuario-id', 'padrao');

    expect(prisma.perfilUsuario.upsert).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-id' },
      create: { id_usuario: 'usuario-id', avatar_url: null },
      update: { avatar_url: null },
    });
    expect(prisma.inventario.findFirst).not.toHaveBeenCalled();
    expect(resposta.avatarUrl).toBeNull();
  });

  it('impede usar foto de carta fora do inventário', async () => {
    prisma.inventario.findFirst.mockResolvedValue(null);

    await expect(service.selecionarFotoCarta('usuario-id', '81ca9b78-93ca-46eb-bc41-e29327724f2f'))
      .rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.perfilUsuario.upsert).not.toHaveBeenCalled();
    expect(prisma.inventario.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        id_usuario: 'usuario-id',
        id_carta: '81ca9b78-93ca-46eb-bc41-e29327724f2f',
        quantidade: { gt: 0 },
      }),
    }));
  });

  it('salva somente a foto da carta possuída', async () => {
    prisma.inventario.findFirst.mockResolvedValue({ carta: { foto_perfil: 'https://cdn.exemplo.com/foto-quadrada.png' } });
    prisma.perfilUsuario.upsert.mockResolvedValue({});

    const resposta = await service.selecionarFotoCarta('usuario-id', '81ca9b78-93ca-46eb-bc41-e29327724f2f');

    expect(prisma.perfilUsuario.upsert).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-id' },
      create: { id_usuario: 'usuario-id', avatar_url: 'https://cdn.exemplo.com/foto-quadrada.png' },
      update: { avatar_url: 'https://cdn.exemplo.com/foto-quadrada.png' },
    });
    expect(resposta.avatarUrl).toBe('https://cdn.exemplo.com/foto-quadrada.png');
  });

  it('usa a arte da carta quando ainda não há recorte de perfil', async () => {
    prisma.inventario.findFirst.mockResolvedValue({ carta: { foto: 'https://cdn.exemplo.com/arte.png', foto_perfil: null } });
    prisma.perfilUsuario.upsert.mockResolvedValue({});

    const resposta = await service.selecionarFotoCarta('usuario-id', '81ca9b78-93ca-46eb-bc41-e29327724f2f');

    expect(resposta.avatarUrl).toBe('https://cdn.exemplo.com/arte.png');
  });

  it('libera a moldura da carta presente no inventário', async () => {
    prisma.inventario.findFirst.mockResolvedValue({
      carta: {
        id: '81ca9b78-93ca-46eb-bc41-e29327724f2f',
        nome: 'Flare',
        moldura: 'https://cdn.exemplo.com/flare.png',
        config_visual: {
          molduraPerfil: { escalaX: 1.1, escalaY: 0.9, x: 2, y: -1 },
        },
      },
    });
    prisma.perfilUsuario.upsert.mockResolvedValue({});

    const resposta = await service.selecionarMoldura('usuario-id', {
      idMoldura: 'carta:81ca9b78-93ca-46eb-bc41-e29327724f2f',
    });

    expect(prisma.perfilUsuario.upsert).toHaveBeenCalledWith({
      where: { id_usuario: 'usuario-id' },
      create: {
        id_usuario: 'usuario-id',
        id_moldura: null,
        id_carta_moldura: '81ca9b78-93ca-46eb-bc41-e29327724f2f',
      },
      update: {
        id_moldura: null,
        id_carta_moldura: '81ca9b78-93ca-46eb-bc41-e29327724f2f',
      },
    });
    expect(resposta).toEqual(
      expect.objectContaining({
        moldura: 'Moldura de Flare',
        molduraUrl: 'https://cdn.exemplo.com/flare.png',
        molduraConfig: expect.objectContaining({
          molduraPerfil: expect.objectContaining({ escalaX: 1.1 }),
        }),
      }),
    );
  });

  it('mantém bloqueada a moldura de carta não obtida', async () => {
    prisma.inventario.findFirst.mockResolvedValue(null);

    await expect(
      service.selecionarMoldura('usuario-id', {
        idMoldura: 'carta:81ca9b78-93ca-46eb-bc41-e29327724f2f',
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

  it('rejeita token inválido de troca de e-mail', async () => {
    prisma.usuario.findUnique.mockResolvedValue(null);

    await expect(service.confirmarTrocaEmail('a'.repeat(64))).rejects.toThrow(
      'Link de confirmação inválido.',
    );
  });

  it('primeira confirmação preserva o e-mail atual', async () => {
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
    expect(resposta.message).toContain('confirmação final');
  });

  it('segunda confirmação efetiva o novo e-mail', async () => {
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
