export const TAMANHO_MINIMO_SENHA = 8;
export const TAMANHO_MAXIMO_SENHA = 72;

export const requisitosSenha = [
  {
    id: "tamanho",
    texto: "8 caracteres ou mais",
    validar: (senha: string) => senha.length >= TAMANHO_MINIMO_SENHA,
  },
  {
    id: "letras",
    texto: "Letra maiúscula e minúscula",
    validar: (senha: string) => /[a-z]/.test(senha) && /[A-Z]/.test(senha),
  },
  {
    id: "numero",
    texto: "Um número",
    validar: (senha: string) => /\d/.test(senha),
  },
  {
    id: "simbolo",
    texto: "Um símbolo",
    validar: (senha: string) => /[^A-Za-z0-9]/.test(senha),
  },
] as const;

export function avaliarSenha(senha: string) {
  const requisitos = requisitosSenha.map((item) => ({
    ...item,
    atendido: item.validar(senha),
  }));
  return {
    requisitos,
    pontuacao: requisitos.filter((item) => item.atendido).length,
    valida:
      senha.length <= TAMANHO_MAXIMO_SENHA &&
      requisitos.every((item) => item.atendido),
  };
}
