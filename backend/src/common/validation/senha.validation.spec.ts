import { TAMANHO_MAXIMO_SENHA, senhaForteRegex } from './senha.validation';

describe('senhaForteRegex', () => {
  it('aceita senha com exatamente 8 caracteres e todos os requisitos', () => {
    expect(senhaForteRegex.test('Abcde1#x')).toBe(true);
  });

  it.each([
    ['com menos de 8 caracteres', 'Abcd1#x'],
    ['sem letra maiúscula', 'abcdef1#'],
    ['sem letra minúscula', 'ABCDEF1#'],
    ['sem número', 'Abcdefg#'],
    ['sem caractere especial', 'Abcdefg1'],
    ['acima do limite', `Aa1#${'x'.repeat(TAMANHO_MAXIMO_SENHA - 3)}`],
  ])('rejeita senha %s', (_caso, senha) => {
    expect(senhaForteRegex.test(senha)).toBe(false);
  });
});
