import {
  TAMANHO_MAXIMO_SENHA,
  senhaForteRegex,
} from './senha.validation';

describe('senhaForteRegex', () => {
  it('aceita uma senha que atende a todos os requisitos', () => {
    expect(senhaForteRegex.test('AnimeCards#2026')).toBe(true);
  });

  it.each([
    ['curta', 'Cards#1A'],
    ['sem maiúscula', 'animecards#2026'],
    ['sem minúscula', 'ANIMECARDS#2026'],
    ['sem número', 'AnimeCards#Senha'],
    ['sem símbolo', 'AnimeCards2026'],
    ['acima do limite', `Aa1#${'x'.repeat(TAMANHO_MAXIMO_SENHA - 3)}`],
  ])('rejeita senha %s', (_caso, senha) => {
    expect(senhaForteRegex.test(senha)).toBe(false);
  });
});
