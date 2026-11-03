const tokensRevogados = new Map<string, number>();
const sessoesInvalidasAntesDe = new Map<string, number>();

const TTL_TOKEN_MS = 24 * 60 * 60 * 1000;

function limparExpirados() {
  const agora = Date.now();
  for (const [chave, expiraEm] of tokensRevogados.entries()) {
    if (expiraEm <= agora) {
      tokensRevogados.delete(chave);
    }
  }
  for (const [idUsuario, invalidoAntesDe] of sessoesInvalidasAntesDe.entries()) {
    if (agora - invalidoAntesDe > TTL_TOKEN_MS) {
      sessoesInvalidasAntesDe.delete(idUsuario);
    }
  }
}

export function revogarTokenEspecifico(tokenOuJti: string) {
  limparExpirados();
  tokensRevogados.set(tokenOuJti, Date.now() + TTL_TOKEN_MS);
}

export function revogarSessoesDoUsuario(
  idUsuario: string,
  timestampMs = Date.now(),
) {
  limparExpirados();
  sessoesInvalidasAntesDe.set(idUsuario, timestampMs);
}

export function tokenFoiRevogado(
  idUsuario: string,
  jti: string | undefined,
  iatSegundos: number | undefined,
): boolean {
  if (jti && tokensRevogados.has(jti)) {
    return true;
  }

  const invalidoAntesDe = sessoesInvalidasAntesDe.get(idUsuario);
  if (invalidoAntesDe && iatSegundos !== undefined) {
    if (iatSegundos * 1000 < invalidoAntesDe) {
      return true;
    }
  }

  return false;
}
