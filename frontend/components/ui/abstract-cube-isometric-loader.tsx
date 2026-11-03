"use client";

import { useMemo } from "react";
import type { CSSProperties } from "react";
import styles from "./abstract-cube-isometric-loader.module.css";

const matriz = ["00100", "01110", "10101", "11011", "01110"] as const;

type Props = {
  dotSize?: number;
  gap?: number;
  speed?: number;
  color?: string;
  bloom?: boolean;
  className?: string;
  label?: string;
};

export function AbstractCubeIsometricLoader({
  dotSize = 5,
  gap = 4,
  speed = 1.2,
  color = "currentColor",
  bloom = false,
  className = "",
  label = "Carregando",
}: Props) {
  const pontos = useMemo(
    () => matriz.flatMap((linha, y) =>
      [...linha].map((ativo, x) => ({
        chave: `${x}-${y}`,
        ativo: ativo === "1",
        atraso: `${(y * linha.length + x) * 0.04}s`,
      })),
    ),
    [],
  );

  return (
    <span
      className={`${styles.loader} ${bloom ? styles.bloom : ""} ${className}`}
      role="status"
      aria-label={label}
      style={{
        "--dot-size": `${dotSize}px`,
        "--gap": `${gap}px`,
        "--speed": `${speed}s`,
        "--dot-color": color,
      } as CSSProperties}
    >
      {pontos.map((ponto) => (
        <span
          key={ponto.chave}
          className={ponto.ativo ? styles.ativo : styles.inativo}
          style={{ "--atraso": ponto.atraso } as CSSProperties}
          aria-hidden="true"
        />
      ))}
    </span>
  );
}
