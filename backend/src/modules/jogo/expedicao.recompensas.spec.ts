import {
  recompensaAposDerrota,
  recompensaDaRota,
  rubysPerdidosNaDerrota,
} from './expedicao.recompensas';

describe('Recompensas da Expedição', () => {
  it('diferencia a recompensa por dificuldade e reserva 100 Rubys para o chefe', () => {
    expect(recompensaDaRota('FACIL')).toBe(20);
    expect(recompensaDaRota('MEDIA')).toBe(35);
    expect(recompensaDaRota('DIFICIL')).toBe(50);
    expect(recompensaDaRota('CHEFE')).toBe(100);
  });

  it('retém o percentual padrão de 70% da recompensa pendente', () => {
    expect(recompensaAposDerrota(25)).toBe(18);
    expect(rubysPerdidosNaDerrota(25)).toBe(7);
  });
});
