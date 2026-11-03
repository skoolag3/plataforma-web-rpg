import { calcularContadoresPity, lerConfiguracaoBanner, sortearRaridadeBanner } from './banner-configuracao';

describe('Configuração do banner', () => {
  it('sorteia porcentagens decimais e raridade personalizada', () => {
    const chances = [{ raridade: 'SECRETA', percentual: 0.1 }, { raridade: 'N', percentual: 99.9 }];
    expect(sortearRaridadeBanner(chances, 0)).toBe('SECRETA');
    expect(sortearRaridadeBanner(chances, 0.00099)).toBe('SECRETA');
    expect(sortearRaridadeBanner(chances, 0.001)).toBe('N');
  });

  it('mantém contadores de pity independentes', () => {
    const pities = [{ raridade: 'UR', limite: 80 }, { raridade: 'SECRETA', limite: 20 }];
    expect(calcularContadoresPity(pities, ['N', 'UR', 'N', 'N'])).toEqual([
      { raridade: 'UR', limite: 80, atual: 1 },
      { raridade: 'SECRETA', limite: 20, atual: 4 },
    ]);
  });

  it('mantém o contador no limite seguro até o próximo giro garantido', () => {
    const pities = [{ raridade: 'UR', limite: 3 }, { raridade: 'SSR', limite: 2 }];
    expect(calcularContadoresPity(pities, ['N', 'N', 'N', 'N'])).toEqual([
      { raridade: 'UR', limite: 3, atual: 2 },
      { raridade: 'SSR', limite: 2, atual: 1 },
    ]);
    expect(calcularContadoresPity(pities, ['SSR', 'N', 'UR'])).toEqual([
      { raridade: 'UR', limite: 3, atual: 2 },
      { raridade: 'SSR', limite: 2, atual: 0 },
    ]);
  });

  it('preserva distribuição do banner legado', () => {
    expect(lerConfiguracaoBanner(null, ['UR', 'SSR', 'N']).chances).toEqual([
      { raridade: 'UR', percentual: 1 },
      { raridade: 'SSR', percentual: 4 },
      { raridade: 'N', percentual: 95 },
    ]);
  });
});
