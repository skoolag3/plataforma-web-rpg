"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2, CircleOff, Gem, Shapes, Shield, Trash2, X } from "lucide-react";
import Slider06, { type OpcaoPeriodo } from "@/components/ui/slider-06";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import type { AdminClasse, AdminRaridade } from "../../../lib/admin";
import { elementos } from "./adminCartaVisual";
import styles from "../../../styles/admin/filtroCartasModal.module.css";

type Props = {
  raridades: AdminRaridade[];
  raridade: string;
  setRaridade: (valor: string) => void;
  elemento: string;
  setElemento: (valor: string) => void;
  status: string;
  setStatus: (valor: string) => void;
  classe: string;
  setClasse: (valor: string) => void;
  periodo: string;
  setPeriodo: (valor: string) => void;
  periodos: readonly OpcaoPeriodo[];
  classes: AdminClasse[];
  aoFechar: () => void;
};

export function FiltroCartasModal({
  raridades, raridade, setRaridade, elemento, setElemento,
  status, setStatus, classe, setClasse, periodo, setPeriodo,
  periodos, classes, aoFechar,
}: Props) {
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
      const focaveis = modalRef.current?.querySelectorAll<HTMLElement>('button:not(:disabled), input:not(:disabled), [role="slider"]');
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
    <section ref={modalRef} className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-cartas">
      <header className={styles.cabecalho}>
        <div>
          <h2 id="titulo-filtros-cartas">Filtrar cartas</h2>
          <p>Combine os filtros. A lista é atualizada automaticamente.</p>
        </div>
        <button ref={btnFecharRef} type="button" onClick={aoFechar} aria-label="Fechar filtros"><X aria-hidden="true" /></button>
      </header>

      <div className={styles.conteudo}>
        <div className={styles.grade}>
          <SelectPadrao className={styles.seletor} rotulo="Raridade" placeholder="Raridade" valor={raridade} aoAlterar={setRaridade} opcoes={[
            { valor: "", label: "Todas as raridades", labelCurto: "Todas", icone: <Gem /> },
            ...raridades.map((item) => ({ valor: item.codigo, label: item.nome, icone: <Gem />, cor: item.cor })),
          ]} />
          <SelectPadrao className={styles.seletor} rotulo="Elemento" placeholder="Elemento" valor={elemento} aoAlterar={setElemento} opcoes={[
            { valor: "", label: "Todos os elementos", labelCurto: "Todos", icone: <Shapes /> },
            ...elementos.map((item) => ({ valor: item.value, label: item.label, cor: item.cor,
              icone: <span className={styles.iconeElemento} style={{ backgroundImage: `url("${item.icone}")` }} /> })),
          ]} />
          <SelectPadrao className={styles.seletor} rotulo="Status" placeholder="Status" valor={status} aoAlterar={setStatus} opcoes={[
            { valor: "", label: "Todos os status", labelCurto: "Todos", icone: <Shield /> },
            { valor: "ativas", label: "Ativas", cor: "#4ade80", icone: <CheckCircle2 /> },
            { valor: "inativas", label: "Inativas", cor: "#fbbf24", icone: <CircleOff /> },
            { valor: "removidas", label: "Removidas", cor: "#f87171", icone: <Trash2 /> },
          ]} />
          <SelectPadrao className={styles.seletor} rotulo="Classe" placeholder="Classe" valor={classe} aoAlterar={setClasse} opcoes={[
            { valor: "", label: "Todas as classes", labelCurto: "Todas", icone: <Shield /> },
            ...classes.map((item) => ({ valor: item.nome, label: item.nome, icone: <Shield /> })),
          ]} />
        </div>
        <Slider06 opcoes={periodos} valor={periodo} aoAlterar={setPeriodo} />
      </div>
      <footer><button type="button" onClick={aoFechar}>Ver cartas</button></footer>
    </section>
  </div>;
}
