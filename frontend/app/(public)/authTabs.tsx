"use client";

import { useRouter } from "next/navigation";
import styles from "../styles/authTabs.module.css";

type AbaAuth = "login" | "cadastro";

type PropsAuthTabs = {
  ativa: AbaAuth;
  aoTrocar: (aba: AbaAuth) => void;
};

export function AuthTabs({ ativa, aoTrocar }: PropsAuthTabs) {
  const router = useRouter();

  function selecionar(aba: AbaAuth) {
    if (aba === ativa) return;

    router.replace(aba === "login" ? "/login" : "/cadastro", {
      scroll: false,
    });
    aoTrocar(aba);
  }

  return (
    <div className={styles.abas} aria-label="Acesso à conta">
      <button
        type="button"
        className={ativa === "login" ? styles.ativa : undefined}
        aria-pressed={ativa === "login"}
        onClick={() => selecionar("login")}
      >
        Entrar
      </button>
      <button
        type="button"
        className={ativa === "cadastro" ? styles.ativa : undefined}
        aria-pressed={ativa === "cadastro"}
        onClick={() => selecionar("cadastro")}
      >
        Criar conta
      </button>
    </div>
  );
}
