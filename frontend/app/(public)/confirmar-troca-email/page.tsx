"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { confirmarTrocaEmailApi } from "../../lib/perfil";
import styles from "../../styles/authPanel.module.css";

function ConteudoConfirmacao() {
  const parametros = useSearchParams();
  const token = parametros.get("token");
  const [mensagem, setMensagem] = useState(
    token ? "Confirmando a troca de e-mail..." : "",
  );
  const [erro, setErro] = useState(
    token ? "" : "Link de confirmação inválido.",
  );

  useEffect(() => {
    if (!token) {
      return;
    }

    confirmarTrocaEmailApi(token)
      .then((resposta) => {
        setMensagem(resposta.message);
        setErro("");
      })
      .catch((erroCapturado) => {
        setMensagem("");
        setErro(
          erroCapturado instanceof Error
            ? erroCapturado.message
            : "Não foi possível confirmar a troca.",
        );
      });
  }, [token]);

  return (
    <main className={styles.tela}>
      <section className={styles.gradeTela}>
        <div className={styles.painelTela}>
          <h1 className={styles.titulo}>Confirmar troca de e-mail</h1>
          <p className={styles.subtitulo}>
            A troca só será concluída depois da confirmação nos dois endereços.
          </p>
          {mensagem ? (
            <p className={[styles.alerta, styles.sucesso].join(" ")}>
              {mensagem}
            </p>
          ) : null}
          {erro ? (
            <p className={[styles.alerta, styles.erro].join(" ")}>{erro}</p>
          ) : null}
          <Link href="/login" className={styles.voltar}>
            Ir para login
          </Link>
        </div>
      </section>
    </main>
  );
}

export default function ConfirmarTrocaEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoConfirmacao />
    </Suspense>
  );
}
