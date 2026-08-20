import {
  analisarResposta,
  executarTurno,
  iniciarBatalha,
} from './batalha.engine';

const carta = (
  nome: string,
  velocidade: number,
  passiva?: Record<string, unknown>,
) => ({
  id: nome,
  nome,
  hp: 100,
  ataque: 50,
  defesa: 10,
  velocidade,
  elemento: 'fogo',
  passiva,
});

describe('motor de batalha', () => {
  it('faz o jogador atacar primeiro independentemente da velocidade', () => {
    const estado = iniciarBatalha(
      [carta('Jogador', 5)],
      [carta('BotRapido', 30)],
      'MEDIA',
    );
    executarTurno(estado);
    expect(estado.eventos.find((e) => e.tipo === 'ATAQUE')?.texto).toContain(
      'Jogador',
    );
  });

  it('aplica passiva de entrada', () => {
    const estado = iniciarBatalha(
      [
        carta('Suporte', 10, {
          gatilho: 'on_enter',
          tipo: 'buff',
          atributo: 'ataque',
          valor: 12,
        }),
      ],
      [carta('Bot', 10)],
      'MEDIA',
    );
    expect(estado.jogador.cartas[0].ataqueAtual).toBe(62);
    expect(estado.eventos.some((e) => e.tipo === 'BUFF')).toBe(true);
  });

  it('classifica a resposta do jogador', () => {
    expect(
      analisarResposta('Estou pronto para o desafio e vou vencer sem medo!'),
    ).toBe('DIFICIL');
    expect(analisarResposta('Talvez, estou com medo.')).toBe('FACIL');
  });
});
