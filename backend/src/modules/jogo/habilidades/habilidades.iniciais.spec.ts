import { validarHabilidade } from './habilidade.validator';
import { habilidadesIniciais } from './habilidades.iniciais';

describe('habilidadesIniciais', () => {
  it.each(habilidadesIniciais)(
    '$nome possui uma configuração válida',
    (item) => {
      expect(validarHabilidade(item)).toEqual({ valida: true, erros: [] });
    },
  );

  it('não repete nomes', () => {
    const nomes = habilidadesIniciais.map((item) => item.nome);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('deixa todas prontas para vinculação', () => {
    expect(
      habilidadesIniciais.every((item) => item.status === 'PUBLICADA'),
    ).toBe(true);
  });
});
