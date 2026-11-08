"use client";

import { useEffect, useRef } from "react";
import { FlaskConical, Shield, X } from "lucide-react";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import styles from "../../../styles/admin/filtroCartasModal.module.css";

type Props = {
  tipo: string;
  setTipo: (valor: string) => void;
  status: string;
  setStatus: (valor: string) => void;
  tipos: string[];
  aoFechar: () => void;
};

export function FiltroHabilidadesModal({ tipo, setTipo, status, setStatus, tipos, aoFechar }: Props) {
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
    <section ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-habilidades">
      <header className={styles.cabecalho}>
        <div>
          <h2 id="titulo-filtros-habilidades">Filtrar habilidades</h2>
          <p>Combine os filtros. A lista é atualizada automaticamente.</p>
        </div>
        <button ref={btnFecharRef} type="button" onClick={aoFechar} aria-label="Fechar filtros"><X aria-hidden="true" /></button>
      </header>
      <div className={styles.conteudo}>
        <div className={styles.grade}>
          <SelectPadrao className={styles.seletor} rotulo="Tipo" placeholder="Tipo" valor={tipo} aoAlterar={setTipo} opcoes={[
            { valor: "", label: "Todos os tipos", labelCurto: "Todos", icone: <FlaskConical /> },
            ...tipos.map((item) => ({ valor: item, label: item, icone: <FlaskConical /> })),
          ]} />
          <SelectPadrao className={styles.seletor} rotulo="Status" placeholder="Status" valor={status} aoAlterar={setStatus} opcoes={[
            { valor: "", label: "Todos os status", labelCurto: "Todos", icone: <Shield /> },
            { valor: "RASCUNHO", label: "Rascunhos", cor: "#fbbf24", icone: <Shield /> },
            { valor: "PUBLICADA", label: "Publicadas", cor: "#4ade80", icone: <Shield /> },
            { valor: "INATIVA", label: "Inativas", cor: "#94a3b8", icone: <Shield /> },
          ]} />
        </div>
      </div>
      <footer><button type="button" onClick={aoFechar}>Ver habilidades</button></footer>
    </section>
  </div>;
}
