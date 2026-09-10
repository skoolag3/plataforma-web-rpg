import { PrismaService } from '../../database/prisma.service';
import { ExpedicoesService } from './expedicoes.service';
import { gerarTrilhaExpedicao } from './expedicao.trilha';
import { PartidasService } from './partidas.service';

function criarExpedicao(
  sobrescrever: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    id: 'expedicao-1',
    id_usuario: 'usuario-1',
    id_deck: 'deck-1',
    seed: 123,
    status: 'EM_ANDAMENTO',
    etapa_atual: 0,
    trilha: gerarTrilhaExpedicao(123),
    escolhas: ['etapa-1-facil'],
    escolha_atual: 'etapa-1-facil',
    criado_em: new Date('2026-09-10T10:00:00Z'),
    atualizado_em: new Date('2026-09-10T10:00:00Z'),
    finalizado_em: null,
    deck: { id: 'deck-1', nome: 'Meu Deck' },
    partidas: [
      {
        id: 'partida-1',
        etapa_expedicao: 0,
        resultado: 'VITORIA',
        recompensa_rubys: 0,
        timestamp_inicio: new Date('2026-09-10T10:00:00Z'),
      },
    ],
    ...sobrescrever,
  };
}

function criarDependencias(expedicoes: Record<string, unknown>[]) {
  const tx = {
    expedicao: { updateMany: jest.fn().mockResolvedValue({ count: 1 }) },
    logPartida: { update: jest.fn().mockResolvedValue({}) },
    ledgerRuby: { create: jest.fn().mockResolvedValue({}) },
  };
  const prisma = {
    expedicao: {
      findFirst: jest
        .fn()
        .mockResolvedValueOnce(expedicoes[0])
        .mockResolvedValueOnce(expedicoes[1]),
    },
    $transaction: jest.fn(
      async (callback: (cliente: typeof tx) => Promise<void>) => callback(tx),
    ),
  } as unknown as PrismaService;
  return { prisma, tx };
}

describe('ExpedicoesService - progressão e recompensas', () => {
  it('assegura a recompensa no checkpoint e libera a próxima etapa', async () => {
    const atual = criarExpedicao();
    const avancada = criarExpedicao({
      etapa_atual: 1,
      escolha_atual: null,
      partidas: [
        {
          id: 'partida-1',
          etapa_expedicao: 0,
          resultado: 'VITORIA',
          recompensa_rubys: 25,
          timestamp_inicio: new Date(),
        },
      ],
    });
    const { prisma, tx } = criarDependencias([atual, avancada]);
    const service = new ExpedicoesService(prisma, {} as PartidasService);

    const res = await service.buscarAtual('usuario-1');

    expect(tx.expedicao.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ etapa_atual: { increment: 1 } }),
      }),
    );
    expect(tx.ledgerRuby.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantidade: 25,
        motivo: 'CHECKPOINT_EXPEDICAO',
      }),
    });
    expect(res).toEqual(
      expect.objectContaining({ etapaAtual: 1, rubysAssegurados: 25 }),
    );
  });

  it('preserva checkpoints anteriores e perde 30% apenas do valor pendente', async () => {
    const trilha = gerarTrilhaExpedicao(123);
    const escolhaDificil = trilha.etapas[1].opcoes.find(
      (opcao) => opcao.dificuldade === 'DIFICIL',
    )!;
    const partidas = [
      {
        id: 'partida-2',
        etapa_expedicao: 1,
        resultado: 'DERROTA',
        recompensa_rubys: 0,
        timestamp_inicio: new Date(),
      },
      {
        id: 'partida-1',
        etapa_expedicao: 0,
        resultado: 'VITORIA',
        recompensa_rubys: 25,
        timestamp_inicio: new Date(),
      },
    ];
    const atual = criarExpedicao({
      etapa_atual: 1,
      trilha,
      escolhas: ['etapa-1-facil', escolhaDificil.id],
      escolha_atual: escolhaDificil.id,
      partidas,
    });
    const falhou = criarExpedicao({
      ...atual,
      status: 'FALHOU',
      partidas: [{ ...partidas[0], recompensa_rubys: 18 }, partidas[1]],
    });
    const { prisma, tx } = criarDependencias([atual, falhou]);
    const service = new ExpedicoesService(prisma, {} as PartidasService);

    const res = await service.buscarAtual('usuario-1');

    expect(tx.logPartida.update).toHaveBeenCalledWith({
      where: { id: 'partida-2' },
      data: { recompensa_rubys: 18 },
    });
    expect(tx.ledgerRuby.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantidade: 18,
        motivo: 'EXPEDICAO_RESGATE_DERROTA',
      }),
    });
    expect(res).toEqual(
      expect.objectContaining({ status: 'FALHOU', rubysAssegurados: 43 }),
    );
  });

  it('conclui a jornada e assegura os 100 Rubys do chefe', async () => {
    const trilha = gerarTrilhaExpedicao(123);
    const atual = criarExpedicao({
      etapa_atual: 3,
      trilha,
      escolhas: [
        'etapa-1-facil',
        'etapa-2-media',
        'etapa-3-dificil',
        'chefe-final',
      ],
      escolha_atual: 'chefe-final',
      partidas: [
        {
          id: 'partida-chefe',
          etapa_expedicao: 3,
          resultado: 'VITORIA',
          recompensa_rubys: 0,
          timestamp_inicio: new Date(),
        },
      ],
    });
    const concluida = criarExpedicao({
      ...atual,
      status: 'CONCLUIDA',
      partidas: [
        {
          ...(atual.partidas as Record<string, unknown>[])[0],
          recompensa_rubys: 100,
        },
      ],
    });
    const { prisma, tx } = criarDependencias([atual, concluida]);
    const service = new ExpedicoesService(prisma, {} as PartidasService);

    const res = await service.buscarAtual('usuario-1');

    expect(tx.ledgerRuby.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        quantidade: 100,
        motivo: 'EXPEDICAO_CONCLUIDA',
      }),
    });
    expect(res).toEqual(
      expect.objectContaining({ status: 'CONCLUIDA', rubysAssegurados: 100 }),
    );
  });
});
