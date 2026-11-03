"use client";

import {
  faCircleExclamation,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { concluirLoginGoogle } from "../../../lib/auth";
import styles from "../../../styles/googleCallback.module.css";
import { AbstractCubeIsometricLoader } from "../../../../components/ui/abstract-cube-isometric-loader";

const mensagensOAuth: Record<string, string> = {
  cancelado: "Você cancelou a entrada com o Google. Nenhuma alteração foi feita.",
  incompleto: "O Google não retornou os dados necessários para concluir a entrada.",
  oauth: "Não foi possível concluir a entrada com o Google. Tente novamente.",
};

function obterErroInicial() {
  if (typeof window === "undefined") {
    return "";
  }

  const erroOAuth = new URLSearchParams(window.location.hash.slice(1)).get(
    "error",
  );
  return erroOAuth
    ? (mensagensOAuth[erroOAuth] ??
        "Não foi possível concluir a entrada com o Google.")
    : "";
}

export default function GoogleCallbackPage() {
  const router = useRouter();
  const iniciou = useRef(false);
  const [erro, setErro] = useState(obterErroInicial);

  useEffect(() => {
    if (iniciou.current) {
      return;
    }

    iniciou.current = true;
    const parametros = new URLSearchParams(window.location.hash.slice(1));
    const sucesso = parametros.get("success");
    window.history.replaceState(null, "", window.location.pathname);

    if (erro) {
      return;
    }

    const concluir = sucesso === "1"
      ? concluirLoginGoogle()
      : Promise.reject(new Error("O Google não retornou uma sessão válida."));

    concluir
      .then(() => {
        router.replace("/home");
        router.refresh();
      })
      .catch((erroCapturado) => {
        setErro(
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Não foi possível concluir o login com Google.",
        );
      });
  }, [erro, router]);

  return (
    <main className={styles.pagina}>
      <section className={styles.cartao} aria-live="polite">
        {erro ? (
          <>
            <FontAwesomeIcon
              icon={faCircleExclamation}
              className={styles.iconeErro}
            />
            <h1>Não foi possível entrar</h1>
            <p>{erro}</p>
            <Link href="/login">Voltar ao login</Link>
          </>
        ) : (
          <>
            <AbstractCubeIsometricLoader dotSize={7} gap={5} bloom label="Concluindo login com Google" />
            <h1>Concluindo seu login</h1>
            <p>Estamos preparando sua conta com o Google.</p>
          </>
        )}
      </section>
    </main>
  );
}
