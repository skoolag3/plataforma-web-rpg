"use client";

import {
  faArrowLeft,
  faCircleCheck,
  faCircleExclamation,
  faCircleInfo,
  faEnvelope,
  faEye,
  faEyeSlash,
  faKey,
  faLock,
  faPaperPlane,
  faWandSparkles,
  faRightToBracket,
  faShieldHalved,
  faUser,
  faUserPlus,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import type { FormEvent, ReactNode } from "react";
import { useState } from "react";
import { IndicadorSenha } from "../components/indicadorSenha";
import { login, register, solicitarRedefinicaoSenha } from "../lib/auth";
import {
  avaliarSenha,
  TAMANHO_MAXIMO_SENHA,
  TAMANHO_MINIMO_SENHA,
} from "../lib/senha";
import styles from "../styles/authPanel.module.css";
import { AuthTabs } from "./authTabs";

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
  tom: "erro" | "sucesso" | "aviso";
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
  const classes = {
    erro: styles.erro,
    sucesso: styles.sucesso,
    aviso: styles.aviso,
  };
  const icones = {
    erro: faCircleExclamation,
    sucesso: faCircleCheck,
    aviso: faCircleInfo,
  };

  return (
    <p className={[styles.alerta, classes[tom]].join(" ")}>
      <FontAwesomeIcon icon={icones[tom]} aria-hidden="true" />
      <span>{children}</span>
    </p>
  );
}

function EstruturaModal({
  children,
  aoFechar,
  variante,
}: {
  children: ReactNode;
  aoFechar: () => void;
  variante?: "cadastro";
}) {
  const router = useRouter();

  function fechar() {
    aoFechar();
    router.push("/");
  }

  return (
    <div className={styles.fundoModal} data-modal-overlay onMouseDown={fechar}>
      <section
        data-modal-panel
        className={[styles.modal, variante === "cadastro" ? styles.modalCadastro : ""].join(" ")}
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
          <FontAwesomeIcon icon={faXmark} aria-hidden="true" />
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
      router.push("/home");
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
      <header className={styles.cabecalhoModal}>
        <span className={styles.seloModal}><FontAwesomeIcon icon={faWandSparkles} aria-hidden="true" /> Bem-vindo de volta</span>
        <h2 className={styles.titulo}>Entre na arena</h2>
        <p className={styles.subtitulo}>Acesse seus decks e continue sua jornada.</p>
      </header>

      <AuthTabs ativa="login" aoTrocar={aoTrocar} />

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <FontAwesomeIcon
              icon={faEnvelope}
              className={styles.iconeEntrada}
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
            <FontAwesomeIcon
              icon={faLock}
              className={styles.iconeEntrada}
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
              <FontAwesomeIcon icon={mostrarSenha ? faEyeSlash : faEye} aria-hidden="true" />
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
          <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </form>

      <Separador />
      <button type="button" className={styles.btnGoogle}>
        <span className={styles.googleMark} aria-hidden="true">G</span>
        Continuar com Google
      </button>

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

    if (!avaliarSenha(senha).valida) {
      setErro("Crie uma senha que atenda a todos os requisitos.");
      return;
    }

    if (senha !== confirmarSenha) {
      setErro("As senhas não conferem.");
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
    <EstruturaModal aoFechar={aoFechar} variante="cadastro">
      <header className={styles.cabecalhoModal}>
        <span className={styles.seloModal}><FontAwesomeIcon icon={faWandSparkles} aria-hidden="true" /> Novo duelista</span>
        <h2 className={styles.titulo}>Crie sua conta</h2>
        <p className={styles.subtitulo}>Monte seu primeiro deck e entre na arena gratuitamente.</p>
      </header>

      <AuthTabs ativa="cadastro" aoTrocar={aoTrocar} />

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Nome no jogo">
          <span className={styles.campoIcone}>
            <FontAwesomeIcon
              icon={faUser}
              className={styles.iconeEntrada}
              aria-hidden="true"
            />
            <input
              className={[styles.entrada, styles.entradaComIcone].join(" ")}
              type="text"
              name="nomeExibicao"
              value={nome}
              onChange={(event) => setNome(event.target.value)}
              placeholder="Como quer ser chamado?"
              autoComplete="nickname"
              minLength={3}
              required
            />
          </span>
        </Campo>

        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <FontAwesomeIcon
              icon={faEnvelope}
              className={styles.iconeEntrada}
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

        <div className={styles.linhaCampos}>
          <Campo rotulo="Senha">
            <span className={styles.campoSenha}>
              <FontAwesomeIcon icon={faKey} className={styles.iconeEntrada} aria-hidden="true" />
              <input
                className={[styles.entrada, styles.entradaComIcone].join(" ")}
                type={mostrarSenha ? "text" : "password"}
                value={senha}
                onChange={(event) => setSenha(event.target.value)}
                placeholder="Crie uma senha segura"
                autoComplete="new-password"
                minLength={TAMANHO_MINIMO_SENHA}
                maxLength={TAMANHO_MAXIMO_SENHA}
                aria-describedby="requisitos-senha-cadastro"
                required
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

          <Campo rotulo="Confirmar senha">
            <span className={styles.campoSenha}>
              <FontAwesomeIcon icon={faShieldHalved} className={styles.iconeEntrada} aria-hidden="true" />
              <input
                className={[styles.entrada, styles.entradaComIcone].join(" ")}
                type={mostrarSenha ? "text" : "password"}
                value={confirmarSenha}
                onChange={(event) => setConfirmarSenha(event.target.value)}
                placeholder="Repita a senha"
                autoComplete="new-password"
                minLength={TAMANHO_MINIMO_SENHA}
                maxLength={TAMANHO_MAXIMO_SENHA}
                required
              />
            </span>
          </Campo>
        </div>

        <IndicadorSenha id="requisitos-senha-cadastro" senha={senha} />

        <label className={styles.rotuloCheck}>
          <input
            type="checkbox"
            checked={aceitou}
            onChange={(event) => setAceitou(event.target.checked)}
          />
          <span>Li e aceito os <strong>termos de uso</strong>.</span>
        </label>

        {erro ? <Alerta tom="erro">{erro}</Alerta> : null}
        {sucesso ? <Alerta tom="aviso">{sucesso}</Alerta> : null}

        <button
          type="submit"
          className={styles.btnEnviar}
          disabled={carregando}
        >
          <FontAwesomeIcon icon={faUserPlus} aria-hidden="true" />
          {carregando ? "Criando..." : "Criar conta"}
        </button>
      </form>

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
      setSucesso(resposta.message || "Enviamos um link para alterar a senha.");
    } catch (erroCapturado) {
      setErro(
        erroCapturado instanceof Error
          ? erroCapturado.message
          : "Não foi possível enviar o link.",
      );
    } finally {
      setCarregando(false);
    }
  }

  return (
    <EstruturaModal aoFechar={aoFechar}>
      <div className={styles.iconeStatus}>
        <FontAwesomeIcon icon={faKey} aria-hidden="true" />
      </div>
      <h2 className={styles.titulo}>Recuperar senha</h2>
      <p className={styles.subtitulo}>
        Informe seu email para receber um link de redefinição.
      </p>

      <form className={styles.form} onSubmit={aoEnviar}>
        <Campo rotulo="Email">
          <span className={styles.campoIcone}>
            <FontAwesomeIcon
              icon={faEnvelope}
              className={styles.iconeEntrada}
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
        {sucesso ? <Alerta tom="sucesso">{sucesso}</Alerta> : null}

        <button
          type="submit"
          className={styles.btnEnviar}
          disabled={carregando}
        >
          <FontAwesomeIcon icon={faPaperPlane} aria-hidden="true" />
          {carregando ? "Enviando..." : "Enviar link"}
        </button>
      </form>

      <button
        type="button"
        className={styles.btnVoltar}
        onClick={() => aoTrocar("login")}
      >
        <FontAwesomeIcon icon={faArrowLeft} aria-hidden="true" />
        Voltar ao login
      </button>
    </EstruturaModal>
  );
}
