"use client";

import { Ban, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useState } from "react";
import styles from "../../../styles/perfil/painelPerfil.module.css";
import modalStyles from "../../../styles/perfil/modalPerfil.module.css";
import { ModalEdicao } from "./modalEdicao";

type PropsZonaPerigo = {
  exclusaoAgendadaPara: string | null;
  aoDesativar: (senha: string) => Promise<string>;
  aoExcluir: (senha: string) => Promise<string>;
  aoCancelarExclusao: () => Promise<string>;
};

export function ZonaPerigo({
  exclusaoAgendadaPara,
  aoDesativar,
  aoExcluir,
  aoCancelarExclusao,
}: PropsZonaPerigo) {
  const [acao, setAcao] = useState<"desativar" | "excluir" | null>(null);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [salvando, setSalvando] = useState(false);

  function cancelarExclusao() {
    setErro("");
    setMensagem("");
    setSalvando(true);
    void aoCancelarExclusao()
      .then(setMensagem)
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Erro na operação."),
      )
      .finally(() => setSalvando(false));
  }

  return (
    <>
      <section className={styles.zonaPerigo}>
        <h2>
          <ShieldAlert aria-hidden="true" />
          Zona de perigo
        </h2>
        <p>
          {exclusaoAgendadaPara
            ? `Exclusão agendada para ${exclusaoAgendadaPara}.`
            : "A exclusão é agendada por 30 dias antes da anonimização."}
        </p>
        {mensagem ? <p>{mensagem}</p> : null}
        {erro && !acao ? <p>{erro}</p> : null}
        <button type="button" onClick={() => setAcao("desativar")}>
          <Ban aria-hidden="true" />
          Desativar conta
        </button>
        {exclusaoAgendadaPara ? (
          <button type="button" onClick={cancelarExclusao} disabled={salvando}>
            <RotateCcw aria-hidden="true" />
            {salvando ? "Cancelando..." : "Cancelar exclusão"}
          </button>
        ) : (
          <button type="button" onClick={() => setAcao("excluir")}>
            <Trash2 aria-hidden="true" />
            Excluir conta
          </button>
        )}
      </section>

      {acao ? (
        <ModalEdicao
          titulo={acao === "desativar" ? "Desativar conta" : "Agendar exclusão"}
          descricao={
            acao === "desativar"
              ? "A conta deixará de aceitar novos logins."
              : "Os dados pessoais serão anonimizados após 30 dias."
          }
          aoFechar={() => setAcao(null)}
        >
          <form
            className={modalStyles.formModal}
            onSubmit={(evento) => {
              evento.preventDefault();
              const senha = String(
                new FormData(evento.currentTarget).get("senhaAtual") ?? "",
              );
              setErro("");
              setSalvando(true);
              const operacao =
                acao === "desativar" ? aoDesativar(senha) : aoExcluir(senha);
              operacao
                .then(() => window.location.assign("/"))
                .catch((e) =>
                  setErro(e instanceof Error ? e.message : "Erro na operação."),
                )
                .finally(() => setSalvando(false));
            }}
          >
            <label>
              Confirme sua senha
              <input
                type="password"
                name="senhaAtual"
                autoComplete="current-password"
                required
              />
            </label>
            {erro ? <p className={modalStyles.erroForm}>{erro}</p> : null}
            <div className={modalStyles.acoesModal}>
              <button type="button" onClick={() => setAcao(null)}>
                Cancelar
              </button>
              <button type="submit" disabled={salvando}>
                {salvando ? "Confirmando..." : "Confirmar"}
              </button>
            </div>
          </form>
        </ModalEdicao>
      ) : null}
    </>
  );
}
