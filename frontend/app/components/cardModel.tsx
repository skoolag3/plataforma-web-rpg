"use client";

import type { CSSProperties } from "react";
import styles from "../styles/cardModel.module.css";

export type TomCarta = "roxo" | "carmesim" | "ciano";

export type CartaObj = {
  id: string;
  nome: string;
  funcao: string;
  nivel: string;
  poder: number;
  vida: number;
  imagem?: string;
  imagemMoldura?: string;
  tom?: TomCarta;
};

type PropsModeloCarta = {
  carta: CartaObj;
  inclinacao?: "left" | "right" | "none";
  compacta?: boolean;
};

const classeTom: Record<TomCarta, string> = {
  roxo: styles.roxo,
  carmesim: styles.carmesim,
  ciano: styles.ciano,
};

const classeInclinacao = {
  left: styles.inclinadaEsquerda,
  right: styles.inclinadaDireita,
  none: "",
};

export function ModeloCarta({ carta, inclinacao = "none", compacta = false }: PropsModeloCarta) {
  const estiloCarta = {
    ...(carta.imagem ? { "--imagemCarta": `url("${carta.imagem}")` } : {}),
    ...(carta.imagemMoldura ? { "--imagemMoldura": `url("${carta.imagemMoldura}")` } : {}),
  } as CSSProperties;

  return (
    <article
      className={[
        styles.carta,
        classeTom[carta.tom ?? "roxo"],
        classeInclinacao[inclinacao],
        compacta ? styles.compacta : "",
      ].join(" ")}
      style={estiloCarta}
      aria-label={`${carta.nome}, ${carta.funcao}`}
    >
      <div className={styles.camadaFoto} />
      <div className={styles.camadaFx} />
      <div className={styles.camadaMoldura} />
      <div className={styles.camadaMeta}>
        <div>
          <span className={styles.nivel}>{carta.nivel}</span>
          <h3>{carta.nome}</h3>
          <p>{carta.funcao}</p>
        </div>
        <dl className={styles.atributos}>
          <div>
            <dt>poder</dt>
            <dd>{carta.poder}</dd>
          </div>
          <div>
            <dt>vida</dt>
            <dd>{carta.vida}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
