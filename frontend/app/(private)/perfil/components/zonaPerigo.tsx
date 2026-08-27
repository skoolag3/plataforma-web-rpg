"use client";

import { Ban, RotateCcw, ShieldAlert, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "../../../styles/perfil/painelPerfil.module.css";
import modalStyles from "../../../styles/perfil/modalPerfil.module.css";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import { ModalEdicao } from "./modalEdicao";
import { SecaoRecolhivel } from "./secaoRecolhivel";

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
  const router = useRouter();
  const [acao, setAcao] = useState<"desativar" | "excluir" | null>(null);
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);

  function cancelarExclusao() {
    setErro("");
    setSalvando(true);
    void aoCancelarExclusao()
      .then((mensagem) => notificarSucesso(mensagem))
      .catch((e) => {
        const mensagem = e instanceof Error ? e.message : "Erro na operação.";
        setErro(mensagem);
        notificarErro(mensagem);
      })
      .finally(() => setSalvando(false));
  }

  return (
    <>
      <SecaoRecolhivel
        titulo="Conta e privacidade"
        descricao="Desativação e exclusão da conta"
        icone={ShieldAlert}
        perigo
      >
        <div className={styles.zonaPerigoConteudo}>
          <p>
            {exclusaoAgendadaPara
              ? `Exclusão agendada para ${exclusaoAgendadaPara}.`
              : "A exclusão é agendada por 30 dias antes da anonimização."}
          </p>
          {erro && !acao ? <p>{erro}</p> : null}
          <button type="button" onClick={() => setAcao("desativar")}>
            <Ban aria-hidden="true" />
            Desativar conta
          </button>
          {exclusaoAgendadaPara ? (
            <button
              type="button"
              onClick={cancelarExclusao}
              disabled={salvando}
            >
              <RotateCcw aria-hidden="true" />
              {salvando ? "Cancelando..." : "Cancelar exclusão"}
            </button>
          ) : (
            <button type="button" onClick={() => setAcao("excluir")}>
              <Trash2 aria-hidden="true" />
              Excluir conta
            </button>
          )}
        </div>
      </SecaoRecolhivel>

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
                .then(() => router.push("/"))
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
