"use client";

import type { LucideIcon } from "lucide-react";
import Link from "next/link";
import type { CSSProperties, MouseEvent } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import styles from "./expandableTabs.module.css";

export type AbaExpansivel = {
  titulo: string;
  icone: LucideIcon;
  href: string;
  ativa?: boolean;
  aoClicar?: (evento: MouseEvent<HTMLAnchorElement>) => void;
  tipo?: never;
};

export type SeparadorAbas = {
  tipo: "separador";
  titulo?: never;
  icone?: never;
  href?: never;
  ativa?: never;
  aoClicar?: never;
};

type PropsAbasExpansiveis = {
  itens: Array<AbaExpansivel | SeparadorAbas>;
  className?: string;
  ariaLabel: string;
};

export function ExpandableTabs({
  itens,
  className = "",
  ariaLabel,
}: PropsAbasExpansiveis) {
  const refAbas = useRef<HTMLElement>(null);
  const hrefAtivo = itens.find(
    (item) => item.tipo !== "separador" && item.ativa,
  )?.href;
  const hrefAnterior = useRef(hrefAtivo);
  const [indicador, setIndicador] = useState({ x: 0, largura: 0 });
  const [indicadorMovendo, setIndicadorMovendo] = useState(false);

  useEffect(() => {
    if (!hrefAnterior.current || hrefAnterior.current === hrefAtivo) {
      hrefAnterior.current = hrefAtivo;
      return;
    }

    hrefAnterior.current = hrefAtivo;
    let quadroEntrada = 0;
    const quadroSaida = requestAnimationFrame(() => {
      setIndicadorMovendo(false);
      quadroEntrada = requestAnimationFrame(() => setIndicadorMovendo(true));
    });
    const tempo = window.setTimeout(() => setIndicadorMovendo(false), 480);

    return () => {
      cancelAnimationFrame(quadroSaida);
      cancelAnimationFrame(quadroEntrada);
      window.clearTimeout(tempo);
    };
  }, [hrefAtivo]);

  useLayoutEffect(() => {
    const abas = refAbas.current;
    if (!abas) return;

    const atualizarIndicador = () => {
      const ativa = abas.querySelector<HTMLElement>("[aria-current='page']");
      if (!ativa) {
        setIndicador({ x: 0, largura: 0 });
        return;
      }

      setIndicador({ x: ativa.offsetLeft, largura: ativa.offsetWidth });
    };

    atualizarIndicador();
    const observador = new ResizeObserver(atualizarIndicador);
    observador.observe(abas);
    abas
      .querySelectorAll(`.${styles.aba}`)
      .forEach((aba) => observador.observe(aba));

    return () => observador.disconnect();
  }, [itens]);

  const estiloIndicador = {
    "--indicadorX": `${indicador.x}px`,
    "--indicadorLargura": `${indicador.largura}px`,
  } as CSSProperties;

  return (
    <nav
      ref={refAbas}
      className={`${styles.abas} ${className}`}
      aria-label={ariaLabel}
    >
      <span
        className={`${styles.indicador} ${indicador.largura ? styles.indicadorVisivel : ""} ${indicadorMovendo ? styles.indicadorMovendo : ""}`}
        style={estiloIndicador}
        aria-hidden="true"
      />
      {itens.map((item, indice) => {
        if (item.tipo === "separador") {
          return (
            <span
              className={styles.separador}
              aria-hidden="true"
              key={`separador-${indice}`}
            />
          );
        }

        const Icone = item.icone;

        return (
          <Link
            href={item.href}
            onClick={item.aoClicar}
            className={`${styles.aba} ${item.ativa ? styles.abaAtiva : ""}`}
            aria-label={item.titulo}
            aria-current={item.ativa ? "page" : undefined}
            title={!item.ativa ? item.titulo : undefined}
            key={item.href}
          >
            <Icone aria-hidden="true" />
            <span>{item.titulo}</span>
          </Link>
        );
      })}
    </nav>
  );
}
