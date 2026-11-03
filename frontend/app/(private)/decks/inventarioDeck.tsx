"use client";

import { type RefObject } from "react";
import { Check, Layers, Plus, Search, SlidersHorizontal } from "lucide-react";

import { CartaMontada } from "../../components/cartaMontada";
import { obterRaridadeJogo, useRaridadesJogo } from "../../components/raridadesJogo";
import type { CartaColecao } from "../../lib/jogo";
import styles from "../../styles/decks.module.css";

type Props = {
  cartas: CartaColecao[];
  cartasNoDeck: Set<string>;
  busca: string;
  setBusca: (valor: string) => void;
  filtrosAtivos: boolean;
  btnFiltros: RefObject<HTMLButtonElement | null>;
  aoAbrirFiltros: () => void;
  aoSelecionar: (carta: CartaColecao) => void;
  emModal?: boolean;
};

export function InventarioDeck({ cartas, cartasNoDeck, busca, setBusca, filtrosAtivos, btnFiltros, aoAbrirFiltros, aoSelecionar, emModal = false }: Props) {
  const raridades = useRaridadesJogo();

  return (
    <section className={`${styles.colecao} ${emModal ? styles.colecaoModal : styles.colecaoExpandida}`} aria-label="Inventário de cartas">
      <header className={styles.colecaoCabecalho}>
        <div className={styles.colecaoTitulo}>
          <div><h2>Sua coleção</h2><span>{cartas.length} {cartas.length === 1 ? "carta" : "cartas"}</span></div>
          <button ref={btnFiltros} type="button" className={styles.btnFiltrosColecao} onClick={aoAbrirFiltros} aria-haspopup="dialog">
            <SlidersHorizontal aria-hidden="true" /> Filtros
            {filtrosAtivos && <span>Ativos</span>}
          </button>
        </div>
        <label className={styles.busca}>
          <Search aria-hidden="true" />
          <input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar carta..." aria-label="Buscar carta" autoFocus={emModal} />
        </label>
      </header>
      <div className={styles.cartas}>
        {cartas.map((carta) => {
          const usada = cartasNoDeck.has(carta.id);
          return (
            <button type="button" key={carta.id} disabled={usada} onClick={() => aoSelecionar(carta)} aria-label={`${usada ? "Carta já no deck" : "Adicionar ao deck"}: ${carta.nome}`}>
              <span className={styles.cartaColecaoVisual}>
                <CartaMontada arte={carta.foto ?? undefined} moldura={carta.moldura ?? undefined} nome={carta.nome} raridade={carta.raridade} elemento={carta.elemento} config={carta.configVisual ?? undefined} placeholder={<Layers aria-hidden="true" />} />
                <span className={styles.cartaColecaoMarca}>{usada ? <Check aria-hidden="true" /> : <Plus aria-hidden="true" />}</span>
              </span>
              <span className={styles.cartaColecaoNome}>
                <strong>{carta.nome}</strong>
                <small>{obterRaridadeJogo(raridades, carta.raridade)?.nome ?? carta.raridade} · {carta.classe}</small>
              </span>
            </button>
          );
        })}
        {!cartas.length && <p className={styles.vazio}>Nenhuma carta obtida corresponde aos filtros.</p>}
      </div>
    </section>
  );
}
