import {
  recompensaAposDerrota,
  recompensaDaRota,
  rubysPerdidosNaDerrota,
} from './expedicao.recompensas';

describe('Recompensas da Expedição', () => {
  it('preserva a recompensa comum e reserva 100 Rubys para o chefe', () => {
    expect(recompensaDaRota('FACIL')).toBe(25);
    expect(recompensaDaRota('MEDIA')).toBe(25);
    expect(recompensaDaRota('DIFICIL')).toBe(25);
    expect(recompensaDaRota('CHEFE')).toBe(100);
  });

  it('retém 30% da recompensa pendente quando ocorre derrota', () => {
    expect(recompensaAposDerrota(25)).toBe(18);
    expect(rubysPerdidosNaDerrota(25)).toBe(7);
  });
});
