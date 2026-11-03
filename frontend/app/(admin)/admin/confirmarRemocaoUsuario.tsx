"use client";

import { Trash2, X } from "lucide-react";
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
