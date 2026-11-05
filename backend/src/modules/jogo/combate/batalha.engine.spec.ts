import {
  analisarResposta,
  executarTurno,
  iniciarBatalha,
} from './batalha.engine';
import type { ConfiguracaoHabilidade } from '../habilidades/habilidade.types';

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
  it('não entra em recursão com duas passivas de contra-ataque', () => {
    const contraAtaque: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Retaliação',
      tipoEfeito: 'DANO',
      gatilho: 'AO_RECEBER_DANO',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      valorBase: 10,
    };
    const estado = iniciarBatalha(
      [{ ...carta('Jogador', 1, comHabilidade(contraAtaque)), hp: 10000 }],
      [{ ...carta('Bot', 2, comHabilidade(contraAtaque)), hp: 10000 }],
      'MEDIA',
    );

    for (let turno = 1; turno <= 20; turno += 1) {
      executarTurno(estado);
      expect(estado.eventos.length).toBeLessThanOrEqual(turno * 8);
    }
    expect(estado.eventos.filter((evento) => evento.texto.includes('Retaliação'))).toHaveLength(40);
  });

  it('limita dano percentual direto legado a metade do HP máximo do alvo', () => {
    const dano: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      tipoEfeito: 'DANO',
      gatilho: 'INICIO_TURNO',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      unidade: 'PERCENTUAL',
      valorBase: 500,
    };
    const estado = iniciarBatalha(
      [carta('Jogador', 1, comHabilidade(dano))],
      [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
      'MEDIA',
    );

    executarTurno(estado, 'DEFENDER');
    expect(estado.eventos.find((evento) => evento.texto.includes(dano.nome))?.valor).toBe(500);
  });

  it('dispara habilidade no início dos turnos 2 e 4', () => {
    const pulso: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Pulso periódico',
      tipoEfeito: 'DANO',
      gatilho: 'INICIO_TURNO',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      valorBase: 10,
      requisito: { tipo: 'INTERVALO_TURNOS', intervalo: 2 },
    };
    const estado = iniciarBatalha(
      [carta('Jogador', 1, comHabilidade(pulso))],
      [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
      'MEDIA',
    );
    for (let turno = 1; turno <= 4; turno += 1) {
      executarTurno(estado, 'DEFENDER');
      const ativacoes = estado.eventos.filter((evento) => evento.texto.includes('Pulso periódico'));
      expect(ativacoes.map((evento) => evento.turno)).toEqual(
        turno < 2 ? [] : turno < 4 ? [2] : [2, 4],
      );
    }
  });
  it('aplica bônus crítico somente quando a chance é sorteada', () => {
    const critico: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Golpe crítico',
      tipoEfeito: 'CRITICO',
      gatilho: 'AO_ATACAR',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      unidade: 'PERCENTUAL',
      valorBase: 50,
      formaAplicacao: 'ANTES_ACAO',
      requisito: { tipo: 'CHANCE', percentual: 25 },
    };
    const sorteio = jest.spyOn(Math, 'random').mockReturnValue(0.1);
    try {
      const estado = iniciarBatalha(
        [carta('Jogador', 1, comHabilidade(critico))],
        [carta('Bot', 2)],
        'MEDIA',
      );
      executarTurno(estado);
      expect(estado.eventos.find((evento) => evento.tipo === 'DANO')?.valor).toBe(68);
      expect(estado.eventos.some((evento) => evento.texto.includes('crítico'))).toBe(true);

      sorteio.mockReturnValue(0.9);
      const semCritico = iniciarBatalha(
        [carta('Jogador', 1, comHabilidade(critico))],
        [carta('Bot', 2)],
        'MEDIA',
      );
      executarTurno(semCritico);
      expect(semCritico.eventos.find((evento) => evento.tipo === 'DANO')?.valor).toBe(46);
    } finally {
      sorteio.mockRestore();
    }
  });
  it('mantém os atributos básicos das cartas no confronto com o chefe', () => {
    const estado = iniciarBatalha(
      [carta('Jogador', 3)],
      [carta('Chefe', 3)],
      'CHEFE',
    );

    expect(estado.bot.cartas[0]).toEqual(
      expect.objectContaining({ hp: 100, ataque: 50, defesa: 10 }),
    );
  });

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

  it('não deixa a carta substituta atacar no turno em que a anterior foi derrotada', () => {
    const estado = iniciarBatalha(
      [{ ...carta('Jogador', 2), ataque: 100 }],
      [
        { ...carta('Bot derrotado', 3), hp: 50 },
        carta('Bot substituto', 2),
      ],
      'MEDIA',
    );

    executarTurno(estado);

    expect(estado.bot.ativa).toBe(1);
    expect(estado.eventos.filter((evento) => evento.turno === 1 && evento.tipo === 'ATAQUE'))
      .toHaveLength(1);
    expect(estado.jogador.cartas[0].hpAtual).toBe(100);

    executarTurno(estado);
    expect(estado.eventos.some((evento) =>
      evento.turno === 2 && evento.tipo === 'ATAQUE' && evento.texto.startsWith('Bot substituto'),
    )).toBe(true);
  });

  it('também aguarda o próximo turno quando a carta do jogador é substituída', () => {
    const estado = iniciarBatalha(
      [
        { ...carta('Jogador derrotado', 3), hp: 50 },
        carta('Jogador substituto', 2),
      ],
      [{ ...carta('Bot', 2), ataque: 100 }],
      'MEDIA',
    );

    executarTurno(estado);

    expect(estado.jogador.ativa).toBe(1);
    expect(estado.eventos.filter((evento) => evento.turno === 1 && evento.tipo === 'ATAQUE'))
      .toHaveLength(1);
    expect(estado.bot.cartas[0].hpAtual).toBe(100);
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

  it('limita uma escala antiga de dano durante a batalha', () => {
    const dano: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      nome: 'Dano progressivo',
      tipoEfeito: 'DANO',
      gatilho: 'INICIO_TURNO',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      valorBase: 10,
      escala: { tipo: 'POR_TURNO', valor: 90, limite: 100 },
    };
    const estado = iniciarBatalha(
      [{ ...carta('Jogador', 1, comHabilidade(dano)), hp: 1000 }],
      [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
      'MEDIA',
    );

    for (let turno = 1; turno <= 8; turno += 1) executarTurno(estado, 'DEFENDER');
    expect(estado.eventos.filter((evento) => evento.texto.includes('Dano progressivo')).map((evento) => evento.valor))
      .toEqual([10, 15, 20, 25, 30, 30, 30, 30]);
  });

  it('não acumula buff além do dobro do atributo base', () => {
    const buff: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      gatilho: 'INICIO_TURNO',
      valorBase: 30,
    };
    const estado = iniciarBatalha(
      [{ ...carta('Jogador', 1, comHabilidade(buff)), hp: 1000 }],
      [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
      'MEDIA',
    );

    for (let turno = 1; turno <= 8; turno += 1) executarTurno(estado, 'DEFENDER');
    expect(estado.jogador.cartas[0].ataqueAtual).toBe(100);
  });

  it('não acumula escudo além do HP máximo', () => {
    const escudo: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      tipoEfeito: 'ESCUDO',
      gatilho: 'INICIO_TURNO',
      atributo: undefined,
      valorBase: 80,
    };
    const estado = iniciarBatalha(
      [{ ...carta('Jogador', 1, comHabilidade(escudo)), hp: 1000 }],
      [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
      'MEDIA',
    );

    for (let turno = 1; turno <= 20; turno += 1) executarTurno(estado, 'DEFENDER');
    const runtime = estado.jogador.cartas[0].passiva?.estadoHabilidades as { escudo: number };
    expect(runtime.escudo).toBeLessThanOrEqual(estado.jogador.cartas[0].hp);
  });

  it('limita críticos combinados a três vezes o ataque', () => {
    const critico: ConfiguracaoHabilidade = {
      ...habilidadeBase,
      tipoEfeito: 'CRITICO',
      gatilho: 'AO_ATACAR',
      alvo: 'INIMIGO_ATIVO',
      atributo: undefined,
      unidade: 'PERCENTUAL',
      valorBase: 100,
      formaAplicacao: 'ANTES_ACAO',
      requisito: { tipo: 'CHANCE', percentual: 100 },
    };
    const sorteio = jest.spyOn(Math, 'random').mockReturnValue(0);
    try {
      const estado = iniciarBatalha(
        [carta('Jogador', 1, { habilidades: [critico, { ...critico, nome: 'Segundo crítico' }] })],
        [{ ...carta('Bot', 2), hp: 1000, ataque: 1 }],
        'MEDIA',
      );
      executarTurno(estado);
      expect(estado.eventos.find((evento) => evento.tipo === 'DANO')?.valor).toBe(137);
    } finally {
      sorteio.mockRestore();
    }
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
