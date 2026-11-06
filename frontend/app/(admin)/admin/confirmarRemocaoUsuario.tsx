"use client";

import { Lock, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import type { AdminUsuario } from "../../lib/admin";
import styles from "../../styles/admin/confirmarRemocaoUsuario.module.css";

type Props = {
  usuario: AdminUsuario;
  removendo: boolean;
  erro: string | null;
  aoFechar: () => void;
  aoConfirmar: () => void;
};

export function ConfirmarRemocaoUsuario({ usuario, removendo, erro, aoFechar, aoConfirmar }: Props) {
  const [nome, setNome] = useState("");
  const [ciente, setCiente] = useState(false);
  const campoRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLFormElement>(null);
  const aoFecharRef = useRef(aoFechar);
  const removendoRef = useRef(removendo);

  useEffect(() => { aoFecharRef.current = aoFechar; removendoRef.current = removendo; }, [aoFechar, removendo]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    campoRef.current?.focus();
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !removendoRef.current) aoFecharRef.current();
      if (evento.key !== "Tab") return;
      const focaveis = modalRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled), input:not(:disabled)");
      if (!focaveis?.length) return;
      if (evento.shiftKey && document.activeElement === focaveis[0]) {
        evento.preventDefault();
        focaveis[focaveis.length - 1].focus();
      } else if (!evento.shiftKey && document.activeElement === focaveis[focaveis.length - 1]) {
        evento.preventDefault();
        focaveis[0].focus();
      }
    }
    document.addEventListener("keydown", handleTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleTecla);
    };
  }, []);

  function confirmar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (nome.trim() === usuario.nome && ciente && !removendo) aoConfirmar();
  }

  return <div className={styles.fundo} role="presentation" onMouseDown={(evento) => {
    if (evento.target === evento.currentTarget && !removendo) aoFechar();
  }}>
    <form ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-remover-usuario" onSubmit={confirmar}>
      <header className={styles.cabecalho}>
        <span className={styles.icone}><Trash2 aria-hidden="true" /></span>
        <div>
          <h2 id="titulo-remover-usuario">Remover usuário</h2>
          <p>Esta conta perderá o acesso imediatamente e sairá da lista. Os dados e o histórico permanecem no banco.</p>
        </div>
        <button type="button" onClick={aoFechar} disabled={removendo} aria-label="Fechar"><X aria-hidden="true" /></button>
      </header>
      <div className={styles.conteudo}>
        <div className={styles.conta}><strong>{usuario.nome}</strong><span>{usuario.email}</span></div>
        <label className={styles.campo}>
          <span>Digite <strong>{usuario.nome}</strong> para confirmar</span>
          <input ref={campoRef} value={nome} onChange={(evento) => setNome(evento.target.value)} disabled={removendo} autoComplete="off" required />
        </label>
        <label className={styles.ciente}>
          <input type="checkbox" checked={ciente} onChange={(evento) => setCiente(evento.target.checked)} disabled={removendo} />
          <span>Entendo que a conta será desativada e o usuário perderá o acesso.</span>
        </label>
        {erro ? <p className={styles.erro} role="alert">{erro}</p> : null}
      </div>
      <footer>
        <button type="button" onClick={aoFechar} disabled={removendo}>Cancelar</button>
        <button type="submit" disabled={removendo || nome.trim() !== usuario.nome || !ciente}><Trash2 aria-hidden="true" />{removendo ? "Removendo..." : "Remover usuário"}</button>
      </footer>
    </form>
  </div>;
}

type ConfirmarBloqueioProps = {
  usuario: AdminUsuario;
  bloqueando: boolean;
  erro: string | null;
  aoFechar: () => void;
  aoConfirmar: () => void;
};

export function ConfirmarBloqueioUsuario({
  usuario,
  bloqueando,
  erro,
  aoFechar,
  aoConfirmar,
}: ConfirmarBloqueioProps) {
  const [passo, setPasso] = useState<1 | 2>(1);
  const [nome, setNome] = useState("");
  const campoRef = useRef<HTMLInputElement>(null);
  const okBtnRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLFormElement>(null);
  const aoFecharRef = useRef(aoFechar);
  const bloqueandoRef = useRef(bloqueando);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
    bloqueandoRef.current = bloqueando;
  }, [aoFechar, bloqueando]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (passo === 1) {
      okBtnRef.current?.focus();
    } else {
      campoRef.current?.focus();
    }
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !bloqueandoRef.current) aoFecharRef.current();
      if (evento.key !== "Tab") return;
      const focaveis = modalRef.current?.querySelectorAll<HTMLElement>(
        "button:not(:disabled), input:not(:disabled)"
      );
      if (!focaveis?.length) return;
      if (evento.shiftKey && document.activeElement === focaveis[0]) {
        evento.preventDefault();
        focaveis[focaveis.length - 1].focus();
      } else if (!evento.shiftKey && document.activeElement === focaveis[focaveis.length - 1]) {
        evento.preventDefault();
        focaveis[0].focus();
      }
    }
    document.addEventListener("keydown", handleTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleTecla);
    };
  }, [passo]);

  const nomeValido =
    nome.trim() === usuario.nome ||
    nome.trim().toLowerCase() === usuario.nome.trim().toLowerCase();

  function onSubmit(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (passo === 1) {
      setPasso(2);
      return;
    }
    if (nomeValido && !bloqueando) {
      aoConfirmar();
    }
  }

  return (
    <div
      className={styles.fundo}
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget && !bloqueando) aoFechar();
      }}
    >
      <form
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-bloquear-usuario"
        onSubmit={onSubmit}
      >
        <header className={styles.cabecalho}>
          <span className={styles.icone}>
            <Lock aria-hidden="true" />
          </span>
          <div>
            <h2 id="titulo-bloquear-usuario">Bloquear usuário</h2>
            <p>
              {passo === 1
                ? "Esta conta perderá o acesso à plataforma até ser desbloqueada."
                : "Confirme a ação digitando o nome do usuário abaixo."}
            </p>
          </div>
          <button
            type="button"
            onClick={aoFechar}
            disabled={bloqueando}
            aria-label="Fechar"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.conteudo}>
          <div className={styles.conta}>
            <strong>{usuario.nome}</strong>
            <span>{usuario.email}</span>
          </div>

          {passo === 1 ? (
            <p className={styles.pergunta}>
              Você deseja bloquear esse usuário?
            </p>
          ) : (
            <label className={styles.campo}>
              <span>
                Escreva o nome do usuário para bloquear o usuário:
              </span>
              <input
                ref={campoRef}
                value={nome}
                onChange={(evento) => setNome(evento.target.value)}
                placeholder={usuario.nome}
                disabled={bloqueando}
                autoComplete="off"
                autoCapitalize="none"
                autoCorrect="off"
                required
              />
            </label>
          )}

          {erro ? (
            <p className={styles.erro} role="alert">
              {erro}
            </p>
          ) : null}
        </div>

        <footer>
          <button type="button" onClick={aoFechar} disabled={bloqueando}>
            Cancelar
          </button>
          {passo === 1 ? (
            <button
              ref={okBtnRef}
              type="submit"
              disabled={bloqueando}
            >
              OK
            </button>
          ) : (
            <button
              type="submit"
              disabled={bloqueando || !nomeValido}
            >
              <Lock aria-hidden="true" />
              {bloqueando ? "Bloqueando..." : "Bloquear usuário"}
            </button>
          )}
        </footer>
      </form>
    </div>
  );
}
