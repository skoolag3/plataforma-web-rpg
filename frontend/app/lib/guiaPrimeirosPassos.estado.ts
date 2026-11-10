export const chaveSessaoGuia = "animecards_guia_sessao";

export function obterPassoInicialGuia(
  idUsuario: string,
  pathname: string,
  armazenamentoLocal: Pick<Storage, "getItem" | "setItem">,
  armazenamentoSessao: Pick<Storage, "getItem" | "setItem">,
  totalEtapas: number,
) {
  const chaveGuia = `animecards_guia_inicial_${idUsuario}`;
  const estado = armazenamentoLocal.getItem(chaveGuia);
  if (estado === "concluido") return null;

  const passoPorRota =
    pathname === "/banners"
      ? 2
      : pathname === "/decks"
        ? 3
        : pathname === "/expedicao"
          ? 4
          : pathname === "/home"
            ? 0
            : null;
  if (passoPorRota === null) return null;

  if (armazenamentoSessao.getItem(chaveSessaoGuia) !== idUsuario) {
    if (estado === "iniciado") return null;
    armazenamentoLocal.setItem(chaveGuia, "iniciado");
    armazenamentoSessao.setItem(chaveSessaoGuia, idUsuario);
  }

  const etapaSalva = armazenamentoSessao.getItem(`animecards_guia_etapa_${idUsuario}`);
  const passoSalvo = etapaSalva !== null ? Number(etapaSalva) : NaN;
  return Number.isInteger(passoSalvo) && passoSalvo >= 0 && passoSalvo < totalEtapas
    ? Math.max(passoSalvo, passoPorRota)
    : passoPorRota;
}
