import {
  analisarResposta,
  executarTurno,
  iniciarBatalha,
} from './batalha.engine';
import type { ConfiguracaoHabilidade } from './habilidades/habilidade.types';

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

const comHabilidade = (habilidade: ConfiguracaoHabilidade) => ({
  habilidades: [habilidade],
});

const habilidadeBase: ConfiguracaoHabilidade = {
  nome: 'Passiva de teste',
  modoExecucao: 'AUTOMATICA',
  tipoEfeito: 'BUFF',
  gatilho: 'AO_ENTRAR',
  alvo: 'PROPRIA_CARTA',
  atributo: 'ATAQUE',
  unidade: 'FIXO',
  valorBase: 10,
  formaAplicacao: 'APOS_ACAO',
  requisito: { tipo: 'NENHUM' },
  escala: { tipo: 'NENHUMA' },
  status: 'PUBLICADA',
};

describe('motor de batalha', () => {
  it('faz a classe com menor prioridade numérica atacar primeiro', () => {
    const estado = iniciarBatalha(
      [carta('Guardião', 5)],
      [carta('Assassino', 1)],
      'MEDIA',
    );
    executarTurno(estado);
    expect(estado.eventos.find((e) => e.tipo === 'ATAQUE')?.texto).toContain(
      'Assassino',
    );
  });

  it('dá o desempate de prioridade ao jogador', () => {
    const estado = iniciarBatalha(
      [carta('Jogador', 3)],
      [carta('Bot', 3)],
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

  it('executa a habilidade publicada vinculada ao entrar em campo', () => {
    const estado = iniciarBatalha(
      [carta('Jogador', 1, comHabilidade(habilidadeBase))],
      [carta('Bot', 2)],
      'MEDIA',
    );

    expect(estado.jogador.cartas[0].ataqueAtual).toBe(60);
    expect(
      estado.eventos.some((evento) =>
        evento.texto.includes('Passiva de teste'),
      ),
    ).toBe(true);
  });

  it('substitui o quarto ataque após cumprir o contador', () => {
    const especial: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Combo real',
      tipoEfeito: 'DANO',
      gatilho: 'AO_ATACAR',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      unidade: 'PERCENTUAL',
      valorBase: 160,
      formaAplicacao: 'SUBSTITUI_ATAQUE',
      requisito: { tipo: 'CONTADOR_ATAQUES', quantidade: 3 },
    };
    const estado = iniciarBatalha(
      [carta('Jogador', 1, comHabilidade(especial))],
      [
        {
          ...carta('Bot', 2),
          hp: 1000,
          ataque: 1,
        },
      ],
      'MEDIA',
    );

    executarTurno(estado);
    executarTurno(estado);
    executarTurno(estado);
    const hpAntes = estado.bot.cartas[0].hpAtual;
    executarTurno(estado);

    expect(hpAntes - estado.bot.cartas[0].hpAtual).toBeGreaterThan(50);
    expect(
      estado.eventos.some((evento) => evento.texto.includes('Combo real')),
    ).toBe(true);
  });

  it('aplica cura no gatilho e requisito configurados', () => {
    const cura: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Segundo fôlego real',
      tipoEfeito: 'CURA',
      gatilho: 'INICIO_TURNO',
      atributo: undefined,
      unidade: 'PERCENTUAL',
      valorBase: 20,
      requisito: { tipo: 'HP_ABAIXO', percentual: 90 },
    };
    const estado = iniciarBatalha(
      [carta('Jogador', 1, comHabilidade(cura))],
      [{ ...carta('Bot', 2), ataque: 1 }],
      'MEDIA',
    );
    estado.jogador.cartas[0].hpAtual = 50;
    executarTurno(estado, 'DEFENDER');

    expect(estado.eventos.some((evento) => evento.tipo === 'CURA')).toBe(true);
    expect(estado.jogador.cartas[0].hpAtual).toBeGreaterThan(50);
  });

  it('reduz o dano recebido quando o jogador defende', () => {
    const ataque = iniciarBatalha(
      [carta('Jogador', 10)],
      [carta('Bot', 10)],
      'MEDIA',
    );
    const defesa = iniciarBatalha(
      [carta('Jogador', 10)],
      [carta('Bot', 10)],
      'MEDIA',
    );

    executarTurno(ataque, 'ATACAR');
    executarTurno(defesa, 'DEFENDER');

    expect(defesa.jogador.cartas[0].hpAtual).toBeGreaterThan(
      ataque.jogador.cartas[0].hpAtual,
    );
    expect(defesa.eventos.some((evento) => evento.tipo === 'DEFESA')).toBe(
      true,
    );
  });

  it('classifica a resposta do jogador', () => {
    expect(
      analisarResposta('Estou pronto para o desafio e vou vencer sem medo!'),
    ).toBe('DIFICIL');
    expect(analisarResposta('Talvez, estou com medo.')).toBe('FACIL');
  });
});
