import { gerarSeedExpedicao, gerarTrilhaExpedicao } from './expedicao.trilha';

describe('trilha da expedição', () => {
  it('gera um seed compatível com INTEGER do PostgreSQL', () => {
    const seed = gerarSeedExpedicao('usuario:deck', 1_756_857_600_000);

    expect(seed).toBeGreaterThan(0);
    expect(seed).toBeLessThanOrEqual(2_147_483_647);
  });

  it('gera três escolhas em cada uma das três etapas e um chefe', () => {
    const trilha = gerarTrilhaExpedicao(12345);

    expect(trilha.etapas).toHaveLength(3);
    expect(trilha.etapas.every((etapa) => etapa.opcoes.length === 3)).toBe(
      true,
    );
    expect(trilha.chefe.id).toBe('chefe-final');
    expect(trilha.chefe.dificuldade).toBe('CHEFE');
  });

  it('repete a mesma trilha quando a seed é igual', () => {
    expect(gerarTrilhaExpedicao(9876)).toEqual(gerarTrilhaExpedicao(9876));
  });

  it('mantém uma opção de cada dificuldade em toda etapa', () => {
    const trilha = gerarTrilhaExpedicao(42);

    for (const etapa of trilha.etapas) {
      expect(etapa.opcoes.map((opcao) => opcao.dificuldade).sort()).toEqual([
        'DIFICIL',
        'FACIL',
        'MEDIA',
      ]);
    }
  });

  it('varia os caminhos mantendo os identificadores usados na progressão', () => {
    const trilhas = [11, 22, 33, 44].map((seed) => gerarTrilhaExpedicao(seed));
    const titulos = new Set(
      trilhas.flatMap((trilha) =>
        trilha.etapas.flatMap((etapa) =>
          etapa.opcoes.map((opcao) => opcao.titulo),
        ),
      ),
    );

    expect(titulos.size).toBeGreaterThan(3);
    expect(trilhas[0].etapas[0].opcoes.map((opcao) => opcao.id).sort()).toEqual(
      ['etapa-1-dificil', 'etapa-1-facil', 'etapa-1-media'],
    );
  });
});
