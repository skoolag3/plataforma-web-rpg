"use client";

import { Check, Layers3, Swords } from "lucide-react";
import Link from "next/link";
import type { Deck } from "../../lib/jogo";
import styles from "../../styles/partida.module.css";

type Props = {
  decks: Deck[];
  idSelecionado: string;
  carregando: boolean;
  erro: string;
  onSelecionar: (id: string) => void;
  onIniciar: () => void;
};

export function PartidaPreparacao({ decks, idSelecionado, carregando, erro, onSelecionar, onIniciar }: Props) {
  const deckSelecionado = decks.find((deck) => deck.id === idSelecionado);

  return (
    <section className={styles.preparacao}>
      <header><div><small>Preparação</small><h2>Escolha seu deck</h2><p>A ordem das cartas será respeitada durante toda a batalha.</p></div><Link href="/decks">Gerenciar decks</Link></header>
      {decks.length ? (
        <div className={styles.listaDecks}>
          {decks.map((deck) => (
            <button key={deck.id} type="button" className={deck.id === idSelecionado ? styles.deckSelecionado : ""} onClick={() => onSelecionar(deck.id)} disabled={!deck.completo}>
              <span className={styles.deckTopo}><span><Layers3 /> {deck.nome}</span>{deck.id === idSelecionado ? <Check /> : null}</span>
              <span className={styles.miniCartas}>{deck.cartas.map((carta) => <span key={carta.id} style={carta.foto ? { backgroundImage: `url("${carta.foto}")` } : undefined} title={carta.nome} />)}</span>
              <small>{deck.completo ? `${deck.cartas.length} cartas · pronto` : `${deck.cartas.length}/3 cartas mínimas`}</small>
            </button>
          ))}
        </div>
      ) : <div className={styles.semDeck}><Layers3 /><strong>Nenhum deck criado</strong><p>Monte pelo menos três cartas antes de entrar na arena.</p><Link href="/decks">Criar meu deck</Link></div>}
      {erro ? <p className={styles.erro}>{erro}</p> : null}
      <button type="button" className={styles.btnIniciar} onClick={onIniciar} disabled={carregando || !deckSelecionado?.completo}><Swords /> {carregando ? "Preparando arena..." : "Entrar na batalha"}</button>
    </section>
  );
}
