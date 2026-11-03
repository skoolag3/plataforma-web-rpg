export type ModalAuth = "login" | "cadastro" | "forgot" | null;

export const eventoModalAuth = "modal-auth-alterado";

export function obterModalAuth(): ModalAuth {
  if (typeof window === "undefined") return null;
  const modal = new URLSearchParams(window.location.search).get("auth");
  return modal === "login" || modal === "cadastro" || modal === "forgot"
    ? modal
    : null;
}

export function alterarModalAuth(modal: ModalAuth, substituir = false) {
  const url = new URL(window.location.href);
  if (modal) url.searchParams.set("auth", modal);
  else url.searchParams.delete("auth");

  const metodo = substituir ? "replaceState" : "pushState";
  window.history[metodo](window.history.state, "", url);
  window.dispatchEvent(new Event(eventoModalAuth));
}
