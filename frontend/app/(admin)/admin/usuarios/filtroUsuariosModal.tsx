"use client";

import { useEffect, useRef } from "react";
import { CircleOff, Lock, Shield, UserCog, X } from "lucide-react";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import styles from "../../../styles/admin/filtroCartasModal.module.css";

type Props = {
  status: string;
  setStatus: (valor: string) => void;
  aoFechar: () => void;
};

export function FiltroUsuariosModal({ status, setStatus, aoFechar }: Props) {
  const btnFecharRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLElement>(null);
  const aoFecharRef = useRef(aoFechar);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    btnFecharRef.current?.focus();

    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        aoFecharRef.current();
        return;
      }
      if (evento.key !== "Tab") return;
      const focaveis = modalRef.current?.querySelectorAll<HTMLElement>("button:not(:disabled)");
      if (!focaveis?.length) return;
      const primeiro = focaveis[0];
      const ultimo = focaveis[focaveis.length - 1];
      if (evento.shiftKey && document.activeElement === primeiro) {
        evento.preventDefault();
        ultimo.focus();
      } else if (!evento.shiftKey && document.activeElement === ultimo) {
        evento.preventDefault();
        primeiro.focus();
      }
    }

    document.addEventListener("keydown", handleTecla);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleTecla);
    };
  }, []);

  return <div className={styles.fundo} role="presentation" onMouseDown={(evento) => {
    if (evento.target === evento.currentTarget) aoFechar();
  }}>
    <section ref={modalRef} className={`${styles.modal} ${styles.modalCompacto}`} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-usuarios">
      <header className={styles.cabecalho}>
        <div>
          <h2 id="titulo-filtros-usuarios">Filtrar usuários</h2>
          <p>Selecione o status. A lista é atualizada automaticamente.</p>
        </div>
        <button ref={btnFecharRef} type="button" onClick={aoFechar} aria-label="Fechar filtros"><X aria-hidden="true" /></button>
      </header>
      <div className={styles.conteudo}>
        <div className={`${styles.grade} ${styles.gradeUnica}`}>
          <SelectPadrao className={styles.seletor} rotulo="Status" placeholder="Status" valor={status} aoAlterar={setStatus} opcoes={[
            { valor: "", label: "Todos os status", labelCurto: "Todos", icone: <Shield /> },
            { valor: "ativos", label: "Ativos", cor: "#4ade80", icone: <Shield /> },
            { valor: "bloqueados", label: "Bloqueados", cor: "#f87171", icone: <Lock /> },
            { valor: "inativos", label: "Inativos", cor: "#fbbf24", icone: <CircleOff /> },
            { valor: "admins", label: "Administradores", cor: "#c4b5fd", icone: <UserCog /> },
          ]} />
        </div>
      </div>
      <footer><button type="button" onClick={aoFechar}>Ver usuários</button></footer>
    </section>
  </div>;
}
