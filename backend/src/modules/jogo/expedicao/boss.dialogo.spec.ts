import {
  multiplicadorBoss,
  perguntaBoss,
  avaliarRespostaBoss,
} from './boss.dialogo';

const boss = {
  nome: 'Yama',
  personalidade: 'Provocador',
  provocacao: 'Venha',
  perguntas: ['A?', 'B?', 'C?', 'D?'],
  cartas: [],
};

describe('diálogo do boss', () => {
  it('seleciona pergunta de modo reprodutível', () => {
    expect(perguntaBoss(boss, 6)).toBe('C?');
  });

  it('limita a escala de recompensa entre 1 e 2', () => {
    expect(multiplicadorBoss(0)).toBe(1);
    expect(multiplicadorBoss(4)).toBe(2);
    expect(multiplicadorBoss(10)).toBe(2);
  });

  it('usa avaliação local sem chave externa', async () => {
    const chave = process.env.OPENAI_API_KEY;
    const chaveGemini = process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    try {
      expect(
        (
          await avaliarRespostaBoss(
            boss,
            'A?',
            'Lutarei até o fim porque meus aliados dependem de mim nesta jornada.',
          )
        ).nota,
      ).toBeGreaterThan(0);
    } finally {
      if (chave) process.env.OPENAI_API_KEY = chave;
      if (chaveGemini) process.env.GEMINI_API_KEY = chaveGemini;
    }
  });

  it('interpreta a resposta estruturada da API sem confiar em nota fora de 0 a 4', async () => {
    const chave = process.env.OPENAI_API_KEY;
    const chaveGemini = process.env.GEMINI_API_KEY;
    const fetchOriginal = global.fetch;
    process.env.OPENAI_API_KEY = 'chave-de-teste';
    delete process.env.GEMINI_API_KEY;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        output: [
          {
            content: [
              {
                type: 'output_text',
                text: JSON.stringify({ nota: 3, reacao: 'Você não recuou.' }),
              },
            ],
          },
        ],
      }),
    }) as typeof fetch;
    try {
      const avaliacao = await avaliarRespostaBoss(
        boss,
        'A?',
        'Lutarei pelos meus aliados até o fim.',
      );
      expect(avaliacao).toEqual({
        nota: 3,
        reacao: 'Você não recuou.',
        modo: 'IA',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/responses',
        expect.objectContaining({ method: 'POST' }),
      );
    } finally {
      global.fetch = fetchOriginal;
      if (chave) process.env.OPENAI_API_KEY = chave;
      else delete process.env.OPENAI_API_KEY;
      if (chaveGemini) process.env.GEMINI_API_KEY = chaveGemini;
    }
  });

  it('prefere Gemini quando a chave está configurada', async () => {
    const chave = process.env.GEMINI_API_KEY;
    const fetchOriginal = global.fetch;
    process.env.GEMINI_API_KEY = 'gemini-de-teste';
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        candidates: [
          {
            content: {
              parts: [
                {
                  text: JSON.stringify({
                    nota: 4,
                    reacao: 'Você tem coragem.',
                  }),
                },
              ],
            },
          },
        ],
      }),
    }) as typeof fetch;
    try {
      const avaliacao = await avaliarRespostaBoss(
        boss,
        'A?',
        'Lutarei pelos meus aliados até o fim.',
      );
      expect(avaliacao).toEqual({
        nota: 4,
        reacao: 'Você tem coragem.',
        modo: 'IA',
      });
      expect(global.fetch).toHaveBeenCalledWith(
        'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent',
        expect.objectContaining({ method: 'POST' }),
      );
    } finally {
      global.fetch = fetchOriginal;
      if (chave) process.env.GEMINI_API_KEY = chave;
      else delete process.env.GEMINI_API_KEY;
    }
  });
});
