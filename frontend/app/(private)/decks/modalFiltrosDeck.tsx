"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

import { FiltrosColecao } from "../cartas/components/filtrosColecao";
import styles from "../../styles/inventario/controls.module.css";

type Props = {
  raridade: string;
  elemento: string;
  classe: string;
  ordenacao: string;
  somenteFavoritas: boolean;
  quantidadeCartas: number;
  setRaridade: (valor: string) => void;
  setElemento: (valor: string) => void;
  setClasse: (valor: string) => void;
  setOrdenacao: (valor: string) => void;
  setSomenteFavoritas: (valor: boolean) => void;
  aoFechar: () => void;
};

export function ModalFiltrosDeck({ raridade, elemento, classe, ordenacao, somenteFavoritas, quantidadeCartas, setRaridade, setElemento, setClasse, setOrdenacao, setSomenteFavoritas, aoFechar }: Props) {

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [aoFechar]);

  return (
    <div className={styles.modalFiltros} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-deck" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) aoFechar(); }}>
      <section className={styles.painelFiltros}>
        <header className={styles.cabecalhoFiltros}>
          <div><span>Minha coleção</span><h2 id="titulo-filtros-deck">Filtros</h2></div>
          <button type="button" onClick={aoFechar} aria-label="Fechar filtros" autoFocus><X aria-hidden="true" /></button>
        </header>
        <FiltrosColecao
          raridade={raridade}
          elemento={elemento}
          classe={classe}
          ordenacao={ordenacao}
          somenteFavoritas={somenteFavoritas}
          aoAlterarRaridade={setRaridade}
          aoAlterarElemento={setElemento}
          aoAlterarClasse={setClasse}
          aoAlterarOrdenacao={setOrdenacao}
          aoAlterarSomenteFavoritas={setSomenteFavoritas}
        />
        <button type="button" className={styles.btnMostrarCartas} onClick={aoFechar}>
          Mostrar {quantidadeCartas} {quantidadeCartas === 1 ? "carta" : "cartas"}
        </button>
      </section>
    </div>
  );
}
