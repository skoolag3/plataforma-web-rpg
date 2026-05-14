"use client";

import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  KeyRound,
  LockKeyhole,
  LogIn,
  Mail,
  Send,
  ShieldCheck,
  User,
  UserPlus,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { login, register, solicitarRedefinicaoSenha } from "../lib/auth";
import styles from "./authPanel.module.css";

type TipoModal = "login" | "cadastro" | "forgot" | null;

type PropsModal = {
  aoFechar: () => void;
  aoTrocar: (modal: TipoModal) => void;
};

type PropsCampo = {
  rotulo: string;
  children: ReactNode;
};

type PropsAlerta = {
  tom: "erro" | "sucesso";
  children: ReactNode;
};

export function Campo({ rotulo, children }: PropsCampo) {
  return (
    <label className={styles.campo}>
      <span className={styles.rotulo}>{rotulo}</span>
      {children}
    </label>
  );
}

export function Alerta({ tom, children }: PropsAlerta) {
  const classe = tom === "erro" ? styles.erro : styles.sucesso;
  const Icone = tom === "erro" ? AlertCircle : CheckCircle2;

  return (
    <p className={[styles.alerta, classe].join(" ")}>
      <Icone size={18} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function EstruturaModal({
  children,
  aoFechar,
}: {
  children: ReactNode;
  aoFechar: () => void;
}) {
  const router = useRouter();

  function fechar() {
    aoFechar();
    router.push("/");
  }

  return (
    <div className={styles.fundoModal} onMouseDown={fechar}>
      <section
        className={styles.modal}
        aria-modal="true"
        role="dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className={styles.btnFechar}
          onClick={fechar}
          aria-label="Fechar"
        >
          <X size={19} aria-hidden="true" />
        </button>
        {children}
      </section>
    </div>
  );
}

function Separador() {
  return (
    <div className={styles.separador}>
      <span />
      <small>ou</small>
      <span />
    </div>
  );
}

export function ModalLogin({ aoFechar, aoTrocar }: PropsModal) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setCarregando(true);

    try {
      await login(email, senha);
      router.push("/dashboard");
      router.refresh();
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro ao fazer login.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <EstruturaModal aoFechar={aoFechar}>
      <h2 className={styles.titulo}>Entrar</h2>

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <Mail
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </span>
        </Campo>

        <Campo rotulo="Senha">
          <span className={styles.campoSenha}>
            <LockKeyhole
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Sua senha"
              autoComplete="current-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((valor) => !valor)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </span>
        </Campo>

        <button
          type="button"
          className={styles.btnTexto}
          onClick={() => aoTrocar("forgot")}
        >
          Esqueci minha senha
        </button>

        {erro ? <Alerta tom="erro">{erro}</Alerta> : null}

        <button
          type="submit"
          className={styles.btnEnviar}
          disabled={carregando}
        >
          <LogIn size={18} aria-hidden="true" />
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <Separador />
      <button type="button" className={styles.btnGoogle}>
        <Globe2 size={18} aria-hidden="true" />
        Google
      </button>

      <p className={styles.rodape}>
        Nao tem conta?{" "}
        <button type="button" onClick={() => aoTrocar("cadastro")}>
          Registrar
        </button>
      </p>
    </EstruturaModal>
  );
}

export function ModalCadastro({ aoFechar, aoTrocar }: PropsModal) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [aceitou, setAceitou] = useState(false);
  const [erro, setErro] = useState("");
  const [sucesso, setSucesso] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function aoEnviar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErro("");
    setSucesso("");

    if (senha !== confirmarSenha) {
      setErro("As senhas nao conferem.");
      return;
    }

    if (!aceitou) {
      setErro("Aceite os termos para criar sua conta.");
      return;
    }

    setCarregando(true);

    try {
      const resposta = await register(nome, email, senha);
      setSucesso(resposta.message);
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Erro ao criar conta.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <EstruturaModal aoFechar={aoFechar}>
      <h2 className={styles.titulo}>Criar conta</h2>

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Nome de usuario">
          <span className={styles.campoIcone}>
            <User
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type="text"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Seu nome"
              autoComplete="username"
              minLength={3}
              required
            />
          </span>
        </Campo>

        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <Mail
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </span>
        </Campo>

        <Campo rotulo="Senha">
          <span className={styles.campoSenha}>
            <KeyRound
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type={mostrarSenha ? "text" : "password"}
              value={senha}
              onChange={(event) => setSenha(event.target.value)}
              placeholder="Minimo de 6 caracteres"
              autoComplete="new-password"
              minLength={6}
              required
            />
            <button
              type="button"
              onClick={() => setMostrarSenha((valor) => !valor)}
              aria-label={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
              title={mostrarSenha ? "Ocultar senha" : "Mostrar senha"}
            >
              {mostrarSenha ? (
                <EyeOff size={18} aria-hidden="true" />
              ) : (
                <Eye size={18} aria-hidden="true" />
              )}
            </button>
          </span>
        </Campo>

        <Campo rotulo="Confirmar senha">
          <span className={styles.campoSenha}>
            <ShieldCheck
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type={mostrarSenha ? "text" : "password"}
              value={confirmarSenha}
              onChange={(event) => setConfirmarSenha(event.target.value)}
              placeholder="Repita sua senha"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </span>
        </Campo>

        <label className={styles.rotuloCheck}>
          <input
            type="checkbox"
            checked={aceitou}
            onChange={(event) => setAceitou(event.target.checked)}
          />
          <span>Aceito os termos.</span>
        </label>

        {erro ? <Alerta tom="erro">{erro}</Alerta> : null}
        {sucesso ? <Alerta tom="sucesso">{sucesso}</Alerta> : null}

        <button
          type="submit"
          className={styles.btnEnviar}
          disabled={carregando}
        >
          <UserPlus size={18} aria-hidden="true" />
          {carregando ? "Criando..." : "Criar conta"}
        </button>
      </form>

      <p className={styles.rodape}>
        Ja tem conta?{" "}
        <button type="button" onClick={() => aoTrocar("login")}>
          Entrar
        </button>
      </p>
    </EstruturaModal>
  );
}

export function ModalEsqueciSenha({ aoFechar, aoTrocar }: PropsModal) {
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
      setSucesso(resposta.message || "Verifique seu e-mail.");
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Nao foi possivel enviar o link.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <EstruturaModal aoFechar={aoFechar}>
      <div className={styles.iconeStatus}>
        <KeyRound size={25} aria-hidden="true" />
      </div>
      <h2 className={styles.titulo}>Recuperar senha</h2>
      <p className={styles.subtitulo}>
        Informe seu email para receber um link de redefinicao.
      </p>

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <Mail
              className={styles.iconeEntrada}
              size={18}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu@email.com"
              autoComplete="email"
              required
            />
          </span>
        </Campo>

        {erro ? <Alerta tom="erro">{erro}</Alerta> : null}
        {sucesso ? (
          <Alerta tom="sucesso">Verifique seu e-mail. {sucesso}</Alerta>
        ) : null}

        <button
          type="submit"
          className={styles.btnEnviar}
          disabled={carregando}
        >
          <Send size={18} aria-hidden="true" />
          {carregando ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <button
        type="button"
        className={styles.btnVoltar}
        onClick={() => aoTrocar("login")}
      >
        <ArrowLeft size={17} aria-hidden="true" />
        Voltar ao login
      </button>
    </EstruturaModal>
  );
}
