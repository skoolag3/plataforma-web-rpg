"use client";

import Image from "next/image";
import {
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from "react";
import styles from "../styles/cartaMontada.module.css";
import { CartaIdentidade } from "./cartaIdentidade";

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
  molduraPerfil: {
    escalaX: number;
    escalaY: number;
    x: number;
    y: number;
    rotacao: number;
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
    molduraPerfil: {
      escalaX: 1,
      escalaY: 1.045,
      x: 0,
      y: 1,
      rotacao: 0,
    },
  };
}

export function normalizarConfigVisual(
  config?: Partial<ConfigVisualCarta> | null,
): ConfigVisualCarta {
  const padrao = criarConfigVisualPadrao();
  return {
    arte: { ...padrao.arte, ...config?.arte },
    moldura: { ...padrao.moldura, ...config?.moldura },
    molduraPerfil: {
      ...padrao.molduraPerfil,
      ...config?.molduraPerfil,
    },
  };
}

export function criarEstiloMolduraPerfil(
  config?: Partial<ConfigVisualCarta> | null,
): CSSProperties {
  const ajuste = normalizarConfigVisual(config).molduraPerfil;

  return {
    "--perfilMolduraEscalaX": ajuste.escalaX,
    "--perfilMolduraEscalaY": ajuste.escalaY,
    "--perfilMolduraX": `${ajuste.x}%`,
    "--perfilMolduraY": `${ajuste.y}%`,
    "--perfilMolduraRotacao": `${ajuste.rotacao}deg`,
  } as CSSProperties;
}

function imagemLocalTemporaria(url: string) {
  return url.startsWith("blob:") || url.startsWith("data:");
}

type PropsCartaMontada = {
  arte?: string;
  moldura?: string;
  nome?: string;
  raridade?: string;
  elemento?: string;
  children?: ReactNode;
  placeholder?: ReactNode;
  verso?: ReactNode;
  config?: ConfigVisualCarta;
  onDimensoesArte?: (dimensoes: DimensoesImagem) => void;
  onDimensoesMoldura?: (dimensoes: DimensoesImagem) => void;
};

export function CartaMontada({
  arte,
  moldura,
  nome,
  raridade,
  elemento,
  children,
  placeholder,
  verso,
  config,
  onDimensoesArte,
  onDimensoesMoldura,
}: PropsCartaMontada) {
  const [virada, setVirada] = useState(false);
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

  function alternarLado() {
    if (verso) setVirada((atual) => !atual);
  }

  function handleTecla(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      alternarLado();
    }
  }

  return (
    <div
      className={`${styles.carta} ${verso ? styles.cartaInterativa : ""}`}
      role={verso ? "button" : undefined}
      tabIndex={verso ? 0 : undefined}
      aria-label={
        verso
          ? virada
            ? "Mostrar frente da carta"
            : "Mostrar atributos da carta"
          : undefined
      }
      aria-pressed={verso ? virada : undefined}
      onClick={alternarLado}
      onKeyDown={verso ? handleTecla : undefined}
    >
      <span className={`${styles.miolo} ${virada ? styles.virada : ""}`}>
        <span className={styles.frente}>
          <span className={styles.canvasArte}>
            {arte ? (
              <Image
                className={styles.arte}
                src={arte}
                alt=""
                fill
                sizes="20rem"
                unoptimized={imagemLocalTemporaria(arte)}
                style={estiloArte}
                onLoad={(event) =>
                  onDimensoesArte?.({
                    largura: event.currentTarget.naturalWidth,
                    altura: event.currentTarget.naturalHeight,
                  })
                }
              />
            ) : (
              <span className={styles.placeholder}>{placeholder}</span>
            )}
          </span>
          {moldura ? (
            <span className={styles.camadaMoldura} style={estiloMoldura}>
              <Image
                className={styles.moldura}
                src={moldura}
                alt=""
                fill
                sizes="20rem"
                unoptimized={imagemLocalTemporaria(moldura)}
                onLoad={(event) =>
                  onDimensoesMoldura?.({
                    largura: event.currentTarget.naturalWidth,
                    altura: event.currentTarget.naturalHeight,
                  })
                }
              />
            </span>
          ) : null}
          {children || (nome && raridade && elemento) ? (
            <span className={styles.conteudo}>
              {nome && raridade && elemento ? (
                <CartaIdentidade
                  nome={nome}
                  raridade={raridade}
                  elemento={elemento}
                />
              ) : null}
              {children}
            </span>
          ) : null}
        </span>
        {verso ? <span className={styles.verso}>{verso}</span> : null}
      </span>
    </div>
  );
}
