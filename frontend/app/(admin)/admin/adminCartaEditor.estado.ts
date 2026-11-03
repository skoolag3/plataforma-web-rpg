export function formularioCartaAlterado(
  atual: unknown,
  salvo: unknown,
  arquivosPendentes: boolean,
) {
  return arquivosPendentes || JSON.stringify(atual) !== JSON.stringify(salvo);
}
