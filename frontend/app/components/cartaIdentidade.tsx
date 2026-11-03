"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { obterElementoCarta } from "./elementosCarta";
import styles from "../styles/cartaIdentidade.module.css";
import { obterRaridadeJogo, useRaridadesJogo } from "./raridadesJogo";

export function CartaIdentidade({
  nome,
  raridade,
  elemento,
}: {
  nome: string;
  raridade: string;
  elemento: string;
}) {
  const elementoVisual = obterElementoCarta(elemento);
  const raridadeVisual = obterRaridadeJogo(useRaridadesJogo(), raridade);

  return (
    <span className={styles.identidade} data-elemento={elemento}>
      {elementoVisual ? (
        <span
          className={styles.elemento}
          title={elementoVisual.label}
          style={{ "--cor-elemento": elementoVisual.cor } as CSSProperties}
        >
          <Image
            src={elementoVisual.icone}
            alt={elementoVisual.label}
            width={40}
            height={40}
          />
        </span>
      ) : null}
      <span className={styles.titulo}>
        <strong>{nome}</strong>
        <small data-raridade={raridade} style={raridadeVisual ? { color: raridadeVisual.cor, borderColor: raridadeVisual.cor } : undefined}>{raridadeVisual?.nome ?? raridade}</small>
      </span>
    </span>
  );
}
