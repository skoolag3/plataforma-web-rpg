"use client";

import { CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import styles from "./notificacoesGlobais.module.css";

export type TipoNotificacao = "sucesso" | "erro" | "aviso" | "info";

type DadosNotificacao = {
  mensagem: string;
  titulo?: string;
  tipo?: TipoNotificacao;
};

type Notificacao = Required<Omit<DadosNotificacao, "titulo">> & {
  id: number;
  titulo: string;
};

const EVENTO_NOTIFICACAO = "animecards:notificacao";
const DURACAO_NOTIFICACAO = 5000;

export function notificar(dados: DadosNotificacao) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent<DadosNotificacao>(EVENTO_NOTIFICACAO, { detail: dados }),
  );
}

export function notificarSucesso(mensagem: string, titulo = "Tudo certo") {
  notificar({ mensagem, titulo, tipo: "sucesso" });
}

export function notificarErro(mensagem: string, titulo = "Algo deu errado") {
  notificar({ mensagem, titulo, tipo: "erro" });
}

function ItemNotificacao({
  notificacao,
  aoFechar,
}: {
  notificacao: Notificacao;
  aoFechar: (id: number) => void;
}) {
  const [saindo, setSaindo] = useState(false);
  const Icone =
    notificacao.tipo === "sucesso"
      ? CircleCheck
      : notificacao.tipo === "erro"
        ? TriangleAlert
        : Info;

  useEffect(() => {
    const timerSaida = window.setTimeout(
      () => setSaindo(true),
      DURACAO_NOTIFICACAO - 260,
    );
    const timerFechar = window.setTimeout(
      () => aoFechar(notificacao.id),
      DURACAO_NOTIFICACAO,
    );
    return () => {
      window.clearTimeout(timerSaida);
      window.clearTimeout(timerFechar);
    };
  }, [aoFechar, notificacao.id]);

  function fecharComAnimacao() {
    setSaindo(true);
    window.setTimeout(() => aoFechar(notificacao.id), 180);
  }

  return (
    <article
      className={`${styles.notificacao} ${styles[notificacao.tipo]} ${saindo ? styles.saindo : ""}`}
      role={notificacao.tipo === "erro" ? "alert" : "status"}
    >
      <Icone className={styles.icone} aria-hidden="true" />
      <span className={styles.texto}>
        <strong>{notificacao.titulo}</strong>
        <small>{notificacao.mensagem}</small>
      </span>
      <button
        type="button"
        onClick={fecharComAnimacao}
        aria-label="Fechar notificação"
      >
        <X aria-hidden="true" />
      </button>
      <span className={styles.progresso} aria-hidden="true" />
    </article>
  );
}

export function NotificacoesGlobais() {
  const [notificacoes, setNotificacoes] = useState<Notificacao[]>([]);

  const fechar = useCallback((id: number) => {
    setNotificacoes((atuais) => atuais.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    function receber(evento: Event) {
      const dados = (evento as CustomEvent<DadosNotificacao>).detail;
      if (!dados?.mensagem) return;

      setNotificacoes((atuais) => [
        ...atuais.slice(-2),
        {
          id: Date.now() + Math.random(),
          mensagem: dados.mensagem,
          tipo: dados.tipo ?? "info",
          titulo: dados.titulo ?? "AnimeCards",
        },
      ]);
    }

    window.addEventListener(EVENTO_NOTIFICACAO, receber);
    return () => window.removeEventListener(EVENTO_NOTIFICACAO, receber);
  }, []);

  return (
    <aside className={styles.areaNotificacoes} aria-live="polite">
      {notificacoes.map((notificacao) => (
        <ItemNotificacao
          key={notificacao.id}
          notificacao={notificacao}
          aoFechar={fechar}
        />
      ))}
    </aside>
  );
}
