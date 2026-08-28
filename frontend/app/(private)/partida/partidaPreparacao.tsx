"use client";

import { Check, Layers3, Swords } from "lucide-react";
import Link from "next/link";
import { CartaMontada } from "../../components/cartaMontada";
import { CartaVerso } from "../../components/cartaVerso";
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

export function PartidaPreparacao({
  decks,
  idSelecionado,
  carregando,
  erro,
  onSelecionar,
  onIniciar,
}: Props) {
  const deckSelecionado = decks.find((deck) => deck.id === idSelecionado);

  return (
    <section className={styles.preparacao}>
      <header>
        <div>
          <small>Preparação</small>
          <h2>Escolha seu deck</h2>
          <p>A ordem das cartas será respeitada durante toda a batalha.</p>
        </div>
        <Link href="/decks">Gerenciar decks</Link>
      </header>
      {decks.length ? (
        <div className={styles.listaDecks}>
          {decks.map((deck) => (
            <article
              key={deck.id}
              className={`${styles.deckOpcao} ${deck.id === idSelecionado ? styles.deckSelecionado : ""} ${!deck.completo ? styles.deckIndisponivel : ""}`}
            >
              <button
                type="button"
                className={styles.deckSelecionar}
                onClick={() => onSelecionar(deck.id)}
                disabled={!deck.completo}
                aria-pressed={deck.id === idSelecionado}
              >
                <span className={styles.deckTopo}>
                  <span>
                    <Layers3 /> {deck.nome}
                  </span>
                  {deck.id === idSelecionado ? <Check /> : null}
                </span>
                <small>
                  {deck.completo
                    ? `${deck.cartas.length} cartas · pronto`
                    : `${deck.cartas.length}/3 cartas mínimas`}
                </small>
              </button>
              <span className={styles.miniCartas}>
                {deck.cartas.map((carta) => (
                  <span key={carta.id} title={carta.nome}>
                    <CartaMontada
                      arte={carta.foto ?? undefined}
                      moldura={carta.moldura ?? undefined}
                      nome={carta.nome}
                      raridade={carta.raridade}
                      elemento={carta.elemento}
                      config={carta.configVisual ?? undefined}
                      placeholder={<Layers3 aria-hidden="true" />}
                      verso={
                        <CartaVerso
                          nome={carta.nome}
                          raridade={carta.raridade}
                          elemento={carta.elemento}
                          classe={carta.classe}
                          hp={carta.hpBase}
                          ataque={carta.danoBase}
                          defesa={carta.defesaBase}
                        />
                      }
                    />
                  </span>
                ))}
              </span>
            </article>
          ))}
        </div>
      ) : (
        <div className={styles.semDeck}>
          <Layers3 />
          <strong>Nenhum deck criado</strong>
          <p>Monte pelo menos três cartas antes de entrar na arena.</p>
          <Link href="/decks">Criar meu deck</Link>
        </div>
      )}
      {erro ? <p className={styles.erro}>{erro}</p> : null}
      <button
        type="button"
        className={styles.btnIniciar}
        onClick={onIniciar}
        disabled={carregando || !deckSelecionado?.completo}
      >
        <Swords /> {carregando ? "Preparando arena..." : "Entrar na batalha"}
      </button>
    </section>
  );
}
