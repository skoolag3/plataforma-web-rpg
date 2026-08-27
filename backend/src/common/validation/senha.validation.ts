export const TAMANHO_MINIMO_SENHA = 12;
export const TAMANHO_MAXIMO_SENHA = 72;

export const senhaForteRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{12,72}$/;

export const mensagemSenhaForte =
  'A senha deve ter entre 12 e 72 caracteres, com letra maiúscula, letra minúscula, número e símbolo.';
