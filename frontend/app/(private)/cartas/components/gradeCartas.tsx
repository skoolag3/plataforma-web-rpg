import { nomeElementoCarta } from "../../../components/elementosCarta";
import { PackagePlus } from "lucide-react";

import { CartaMontada } from "../../../components/cartaMontada";
import { cardStyle } from "../cardData";
import { styles } from "../styles";
import type { Card, CardStyle } from "../types";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";

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
  const raridades = useRaridadesJogo();
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
        const corRaridade = obterRaridadeJogo(raridades, card.raridade)?.cor ?? card.borda;

        if (card.foto || card.moldura) {
          return (
            <button
              key={card.nome}
              type="button"
              className={[styles.cardArtefato, classeSelecionada].join(" ")}
              style={{ ...cardStyle(card), "--borda": corRaridade, "--cor-raridade": corRaridade } as CardStyle}
              onClick={() => aoSelecionar(card.nome)}
              aria-pressed={selecionada}
            >
              <CartaMontada
                arte={card.foto ?? undefined}
                moldura={card.moldura ?? undefined}
                nome={card.nome}
                raridade={card.raridade}
                elemento={card.elemento}
                config={card.configVisual ?? undefined}
              />
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
            style={{ ...cardStyle(card), "--borda": corRaridade, "--cor-raridade": corRaridade } as CardStyle}
            onClick={() => aoSelecionar(card.nome)}
            aria-pressed={selecionada}
          >
            <span className={styles.arte} aria-hidden="true" />
            <span className={styles.silhueta} aria-hidden="true" />
            <span className={styles.raridade}>{obterRaridadeJogo(raridades, card.raridade)?.nome ?? card.raridade}</span>
            <span className={styles.elemento}>
              <IconeElemento aria-label={nomeElementoCarta(card.elemento)} />
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
