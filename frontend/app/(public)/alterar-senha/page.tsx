"use client";

import {
  faArrowLeft,
  faEye,
  faEyeSlash,
  faKey,
  faShieldHalved,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";
import { IndicadorSenha } from "../../components/indicadorSenha";
import { redefinirSenha } from "../../lib/auth";
import {
  avaliarSenha,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MINIMO_SENHA,
} from "../../lib/senha";
import { Alerta, Campo } from "../authModal";
import styles from "../../styles/authPanel.module.css";

function ConteudoAlterarSenha() {
  const parametrosBusca = useSearchParams();
  const token = parametrosBusca.get("token");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (!token) {
      setErro("Link de redefinicao invalido.");
      return;
    }

    if (!avaliarSenha(senha).valida) {
      setErro("Crie uma senha que atenda a todos os requisitos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await redefinirSenha(token, senha);
      setSucesso(resposta.message);
      setSenha("");
      setConfirmarSenha("");
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível alterar a senha.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className={styles.tela}>
      <section className={styles.gradeTela}>
        <div className={styles.painelTela}>
          <div className={styles.iconeStatus}>
            <FontAwesomeIcon icon={faKey} aria-hidden="true" />
          </div>
          <h1 className={styles.titulo}>Alterar senha</h1>
          <p className={styles.subtitulo}>
            Crie uma nova senha segura para voltar aos seus decks.
          </p>

          <form className={styles.form} onSubmit={aoEnviar}>
            <Campo rotulo="Nova senha">
              <span className={styles.campoSenha}>
                <FontAwesomeIcon
                  icon={faKey}
                  className={styles.iconeEntrada}
                  aria-hidden="true"
                />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  name="senha"
                  value={senha}
                  onChange={(event) => setSenha(event.target.value)}
                  className={[styles.entrada, styles.entradaComIcone].join(" ")}
                  placeholder="Crie uma senha segura"
                  minLength={TAMANHO_MINIMO_SENHA}
                  maxLength={TAMANHO_MAXIMO_SENHA}
                  aria-describedby="requisitos-nova-senha"
                  required
                  disabled={!token}
                />
                <button
                  type="button"
                  onClick={() => setMostrarSenha((valor) => !valor)}
                  aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                  title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
                >
                  <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} aria-hidden="true" />
                </button>
              </span>
            </Campo>

            <IndicadorSenha id="requisitos-nova-senha" senha={senha} />

            <Campo rotulo="Confirmar senha">
              <span className={styles.campoIcone}>
                <FontAwesomeIcon
                  icon={faShieldHalved}
                  className={styles.iconeEntrada}
                  aria-hidden="true"
                />
                <input
                  type={mostrarSenha ? "text" : "password"}
                  name="confirmarSenha"
                  value={confirmarSenha}
                  onChange={(event) => setConfirmarSenha(event.target.value)}
                  className={[styles.entrada, styles.entradaComIcone].join(" ")}
                  placeholder="Repita a nova senha"
                  minLength={TAMANHO_MINIMO_SENHA}
                  maxLength={TAMANHO_MAXIMO_SENHA}
                  required
                  disabled={!token}
                />
              </span>
            </Campo>

          {erro || !token ? <Alerta tom="erro">{erro || "Link de redefinicao invalido."}</Alerta> : null}
          {sucesso ? <Alerta tom="sucesso">{sucesso}</Alerta> : null}
          <button
            type="submit"
            disabled={carregando || !token}
            className={styles.btnEnviar}
          >
            <FontAwesomeIcon icon={faShieldHalved} aria-hidden="true" />
            {carregando ? "Alterando..." : "Alterar senha"}
          </button>
        </form>
        <Link
          href="/login"
          className={styles.voltar}
        >
          <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
          Ir para login
        </Link>
        </div>
      </section>
    </main>
  );
}

export default function AlterarSenhaPage() {
  return (
    <Suspense fallback={null}>
      <ConteudoAlterarSenha />
    </Suspense>
  );
}
