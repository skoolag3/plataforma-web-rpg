import { PackagePlus } from "lucide-react";

import { CartaMontada } from "../../../components/cartaMontada";
import { cardStyle } from "../cardData";
import { styles } from "../styles";
import type { Card } from "../types";

type GradeCartasProps = {
  cartas: Card[];
  cartaSelecionada: string | null;
  aoSelecionar: (nome: string) => void;
};

export function GradeCartas({
  cartas,
  cartaSelecionada,
  aoSelecionar,
}: GradeCartasProps) {
  if (!cartas.length) {
    return <p className={styles.semResultados}>Nenhuma carta encontrada.</p>;
  }

  return (
    <div className={styles.gridCartas}>
      {cartas.map((card) => {
        const IconeElemento = card.elementoIcone;
        const selecionada = card.nome === cartaSelecionada;
        const classeSelecionada = selecionada
          ? styles.cardArtefatoSelecionado
          : "";

        if (card.foto || card.moldura) {
          return (
            <button
              key={card.nome}
              type="button"
              className={[styles.cardArtefato, classeSelecionada].join(" ")}
              style={cardStyle(card)}
              onClick={() => aoSelecionar(card.nome)}
              aria-pressed={selecionada}
            >
              <CartaMontada
                arte={card.foto ?? undefined}
                moldura={card.moldura ?? undefined}
                config={card.configVisual ?? undefined}
              >
                <span className={styles.cardMontadaInfo}>
                  <span className={styles.cardMontadaTopo}>
                    <span>{card.raridade}</span>
                    <IconeElemento aria-label={card.elemento} />
                  </span>
                  <strong>{card.nome}</strong>
                  <small>
                    <PackagePlus aria-hidden="true" /> {card.copias}
                  </small>
                </span>
              </CartaMontada>
            </button>
          );
        }

        return (
          <button
            key={card.nome}
            type="button"
            className={[
              styles.card,
              selecionada ? styles.cardSelecionado : "",
            ].join(" ")}
            style={cardStyle(card)}
            onClick={() => aoSelecionar(card.nome)}
            aria-pressed={selecionada}
          >
            <span className={styles.arte} aria-hidden="true" />
            <span className={styles.silhueta} aria-hidden="true" />
            <span className={styles.raridade}>{card.raridade}</span>
            <span className={styles.elemento}>
              <IconeElemento aria-label={card.elemento} />
            </span>
            <span className={styles.cardInfo}>
              <strong>{card.nome}</strong>
              <span>
                <PackagePlus aria-hidden="true" />
                {card.copias}
              </span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
