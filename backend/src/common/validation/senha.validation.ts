export const TAMANHO_MINIMO_SENHA = 8;
export const TAMANHO_MAXIMO_SENHA = 72;

export const senhaForteRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,72}$/;

export const mensagemSenhaForte =
  'A senha deve ter entre 8 e 72 caracteres, com letra maiúscula, letra minúscula, número e símbolo.';
