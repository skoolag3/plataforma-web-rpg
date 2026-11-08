"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import styles from "../../../styles/admin/filtroCartasModal.module.css";
import bannerStyles from "../../../styles/admin/adminBanners.module.css";

type Props = {
  status: string;
  setStatus: (valor: string) => void;
  aoFechar: () => void;
};

const opcoes = [
  { valor: "", label: "Todos" },
  { valor: "destaque", label: "Em destaque" },
  { valor: "ativos", label: "Ativos" },
  { valor: "inativos", label: "Inativos" },
];

export function FiltroBannersModal({ status, setStatus, aoFechar }: Props) {
  const modalRef = useRef<HTMLElement>(null);
  const aoFecharRef = useRef(aoFechar);
  useEffect(() => { aoFecharRef.current = aoFechar; }, [aoFechar]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    modalRef.current?.querySelector("button")?.focus();
    function handleTecla(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFecharRef.current();
      if (evento.key !== "Tab") return;
      const focaveis = modalRef.current?.querySelectorAll<HTMLButtonElement>("button");
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

  return <div className={styles.fundo} role="presentation" onMouseDown={(evento) => {
    if (evento.target === evento.currentTarget) aoFechar();
  }}>
    <section ref={modalRef} className={`${styles.modal} ${styles.modalCompacto}`} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-banners">
      <header className={styles.cabecalho}>
        <div><h2 id="titulo-filtros-banners">Filtrar banners</h2><p>Selecione o status. A lista é atualizada automaticamente.</p></div>
        <button type="button" onClick={aoFechar} aria-label="Fechar filtros"><X aria-hidden="true" /></button>
      </header>
      <div className={styles.conteudo}>
        <div className={bannerStyles.opcoesStatus} role="group" aria-label="Status do banner">
          {opcoes.map((opcao) => <button key={opcao.valor} type="button" aria-pressed={status === opcao.valor} onClick={() => setStatus(opcao.valor)}>{opcao.label}</button>)}
        </div>
      </div>
      <footer><button type="button" onClick={aoFechar}>Ver banners</button></footer>
    </section>
  </div>;
}
