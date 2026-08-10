import { PackagePlus, X } from "lucide-react";

import { cardStyle } from "../cardData";
import { styles } from "../styles";
import type { Card } from "../types";

type ModalDeckProps = {
  aberto: boolean;
  carta?: Card;
  cartas: Card[];
  slots: Array<string | null>;
  aoFechar: () => void;
  aoEquipar: (indice: number) => void;
  aoRemover: () => void;
};

export function ModalDeck({
  aberto,
  carta,
  cartas,
  slots,
  aoFechar,
  aoEquipar,
  aoRemover,
}: ModalDeckProps) {
  if (!aberto || !carta) {
    return null;
  }

  const Elemento = carta.elementoIcone;
  const cartaNoDeck = slots.includes(carta.nome);

  return (
    <div
      className={styles.modalOverlay}
      role="dialog"
      aria-modal="true"
      aria-labelledby="equipar-deck-titulo"
    >
      <section className={styles.modalDeck}>
        <header className={styles.modalTopo}>
          <div>
            <span>Escolher slot</span>
            <h2 id="equipar-deck-titulo">Equipar {carta.nome}</h2>
          </div>
          <button
            type="button"
            className={styles.modalFechar}
            onClick={aoFechar}
            aria-label="Fechar"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.modalCartaResumo}>
          <article className={styles.deckCartaPreview} style={cardStyle(carta)}>
            <span className={styles.arte} aria-hidden="true" />
            <span className={styles.silhueta} aria-hidden="true" />
            <span className={styles.raridade}>{carta.raridade}</span>
            <span className={styles.elemento}>
              <Elemento aria-label={carta.elemento} />
            </span>
          </article>
          <div>
            <strong>{carta.nome}</strong>
            <span>
              {carta.elemento} / {carta.classe}
            </span>
            <p>
              Escolha um dos 6 slots do deck. O conteúdo do slot será
              substituído.
            </p>
          </div>
        </div>

        <div className={styles.deckSlots} aria-label="Slots do deck">
          {slots.map((nomeNoSlot, index) => {
            const cartaNoSlot = cartas.find((item) => item.nome === nomeNoSlot);
            const IconeSlot = cartaNoSlot?.elementoIcone;
            const slotAtual = nomeNoSlot === carta.nome;

            return (
              <button
                key={`slot-${index + 1}`}
                type="button"
                className={[
                  styles.deckSlot,
                  slotAtual ? styles.deckSlotAtivo : "",
                ].join(" ")}
                onClick={() => aoEquipar(index)}
                style={cartaNoSlot ? cardStyle(cartaNoSlot) : undefined}
              >
                <span className={styles.deckSlotNumero}>Slot {index + 1}</span>
                {cartaNoSlot && IconeSlot ? (
                  <>
                    <span className={styles.deckSlotRaridade}>
                      {cartaNoSlot.raridade}
                    </span>
                    <IconeSlot
                      className={styles.deckSlotElemento}
                      aria-hidden="true"
                    />
                    <strong>{cartaNoSlot.nome}</strong>
                    <span>{cartaNoSlot.classe}</span>
                  </>
                ) : (
                  <>
                    <PackagePlus aria-hidden="true" />
                    <strong>Vazio</strong>
                    <span>Equipar aqui</span>
                  </>
                )}
              </button>
            );
          })}
        </div>

        <footer className={styles.modalAcoes}>
          <button
            type="button"
            className={styles.botaoSecundario}
            onClick={aoFechar}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.botaoPrimario}
            onClick={aoRemover}
            disabled={!cartaNoDeck}
          >
            Remover do deck
          </button>
        </footer>
      </section>
    </div>
  );
}
