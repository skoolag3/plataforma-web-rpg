"use client";

import Image from "next/image";
import type { CSSProperties, ReactNode } from "react";
import styles from "../styles/cartaMontada.module.css";

export const PROPORCAO_CARTA = 2 / 3;

export type DimensoesImagem = {
  largura: number;
  altura: number;
};

export type ConfigVisualCarta = {
  arte: {
    escala: number;
    x: number;
    y: number;
    rotacao: number;
  };
  moldura: {
    escalaX: number;
    escalaY: number;
    x: number;
    y: number;
    rotacao: number;
    esquerda: number;
    direita: number;
    topo: number;
    base: number;
  };
};

export function criarConfigVisualPadrao(): ConfigVisualCarta {
  return {
    arte: { escala: 1, x: 0, y: 0, rotacao: 0 },
    moldura: {
      escalaX: 1,
      escalaY: 1,
      x: 0,
      y: 0,
      rotacao: 0,
      esquerda: 0,
      direita: 0,
      topo: 0,
      base: 0,
    },
  };
}

export function normalizarConfigVisual(config?: Partial<ConfigVisualCarta> | null): ConfigVisualCarta {
  const padrao = criarConfigVisualPadrao();
  return {
    arte: { ...padrao.arte, ...config?.arte },
    moldura: { ...padrao.moldura, ...config?.moldura },
  };
}

type PropsCartaMontada = {
  arte?: string;
  moldura?: string;
  children?: ReactNode;
  placeholder?: ReactNode;
  config?: ConfigVisualCarta;
  onDimensoesArte?: (dimensoes: DimensoesImagem) => void;
  onDimensoesMoldura?: (dimensoes: DimensoesImagem) => void;
};

export function CartaMontada({
  arte,
  moldura,
  children,
  placeholder,
  config,
  onDimensoesArte,
  onDimensoesMoldura,
}: PropsCartaMontada) {
  const configNormalizada = normalizarConfigVisual(config);
  const estiloArte = {
    "--arteEscala": configNormalizada.arte.escala,
    "--arteX": `${configNormalizada.arte.x}%`,
    "--arteY": `${configNormalizada.arte.y}%`,
    "--arteRotacao": `${configNormalizada.arte.rotacao}deg`,
  } as CSSProperties;
  const estiloMoldura = {
    "--molduraEscalaX": configNormalizada.moldura.escalaX,
    "--molduraEscalaY": configNormalizada.moldura.escalaY,
    "--molduraX": `${configNormalizada.moldura.x}%`,
    "--molduraY": `${configNormalizada.moldura.y}%`,
    "--molduraRotacao": `${configNormalizada.moldura.rotacao}deg`,
    "--molduraEsquerda": `${configNormalizada.moldura.esquerda}%`,
    "--molduraDireita": `${configNormalizada.moldura.direita}%`,
    "--molduraTopo": `${configNormalizada.moldura.topo}%`,
    "--molduraBase": `${configNormalizada.moldura.base}%`,
  } as CSSProperties;

  return (
    <div className={styles.carta}>
      <span className={styles.canvasArte}>
        {arte ? (
          <Image
            className={styles.arte}
            src={arte}
            alt=""
            fill
            sizes="20rem"
            unoptimized
            style={estiloArte}
            onLoad={(event) => onDimensoesArte?.({
              largura: event.currentTarget.naturalWidth,
              altura: event.currentTarget.naturalHeight,
            })}
          />
        ) : (
          <span className={styles.placeholder}>{placeholder}</span>
        )}
        <span className={styles.sombra} aria-hidden="true" />
      </span>
      {moldura ? (
        <span className={styles.camadaMoldura} style={estiloMoldura}>
          <Image
            className={styles.moldura}
            src={moldura}
            alt=""
            fill
            sizes="20rem"
            unoptimized
            onLoad={(event) => onDimensoesMoldura?.({
              largura: event.currentTarget.naturalWidth,
              altura: event.currentTarget.naturalHeight,
            })}
          />
        </span>
      ) : null}
      {children ? <span className={styles.conteudo}>{children}</span> : null}
    </div>
  );
}
