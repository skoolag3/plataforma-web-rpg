"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { solicitarRedefinicaoSenha } from "../../lib/auth";
import { Alerta, Campo } from "../authModal";
import styles from "../authPanel.module.css";

export default function EsqueciSenhaPage() {
  const [email, setEmail] = useState("");
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");
    setCarregando(true);

    try {
      const resposta = await solicitarRedefinicaoSenha(email);
      setSucesso(resposta.message);
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Nao foi possivel solicitar a alteracao de senha.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className={styles.tela}>
      <section className={styles.gradeTela}>
        <div className={styles.textoTela}>
          <h1 className={styles.tituloTela}>Recupere seu acesso</h1>
          <p>
            Informe o e-mail da conta. Se ele existir na plataforma, o servidor
            envia um link para alterar a senha.
          </p>
        </div>

        <div className={styles.painelTela}>
          <h2 className={styles.titulo}>Esqueci minha senha</h2>
          <p className={styles.subtitulo}>Receba um link seguro para criar uma nova senha.</p>

          <form className={styles.form} onSubmit={aoEnviar}>
          <Campo rotulo="E-mail">
            <input
              type="email"
              name="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={styles.entrada}
              placeholder="voce@email.com"
              autoComplete="email"
              required
            />
          </Campo>

          {erro ? <Alerta tom="erro">{erro}</Alerta> : null}
          {sucesso ? <Alerta tom="sucesso">{sucesso}</Alerta> : null}

          <button type="submit" disabled={carregando} className={styles.btnEnviar}>
            {carregando ? "Enviando..." : "Enviar link"}
          </button>
          </form>

          <Link href="/login" className={styles.voltar}>
            Voltar para login
          </Link>
        </div>
      </section>
    </main>
  );
}
