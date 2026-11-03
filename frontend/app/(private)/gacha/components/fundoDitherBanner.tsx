"use client";

import { useEffect, useRef } from "react";
import styles from "../../../styles/gacha/gacha.module.css";

const cores = [
  { pos: 0, rgb: [234, 247, 251] },
  { pos: 0.38, rgb: [127, 198, 230] },
  { pos: 0.67, rgb: [46, 124, 192] },
  { pos: 1, rgb: [18, 58, 107] },
];
const bayer = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export function FundoDitherBanner() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const contexto = canvas?.getContext("2d", { alpha: false });
    if (!canvas || !contexto) return;

    let frame = 0;
    let inicio = 0;
    let largura = 0;
    let altura = 0;
    const movimentoReduzido = window.matchMedia("(prefers-reduced-motion: reduce)");

    const desenhar = (tempo: number) => {
      if (!inicio) inicio = tempo;
      const t = movimentoReduzido.matches ? 0 : (tempo - inicio) / 1000;
      const ph = t * 0.32;
      const amt = 0.45;
      const dir = 1;
      const spin = ph * dir;
      const deslocamento = Math.sin(spin * 0.9) * 0.5 * amt;
      const lado = Math.max(12, Math.min(largura / 16, altura / 10));
      const colunas = Math.ceil(largura / lado);
      const linhas = Math.ceil(altura / lado);
      contexto.fillStyle = "#123A6B";
      contexto.fillRect(0, 0, largura, altura);

      for (let linha = 0; linha < linhas; linha++) {
        for (let coluna = 0; coluna < colunas; coluna++) {
          const diagonal = 1 - (coluna / Math.max(1, colunas - 1) * 0.78 + linha / Math.max(1, linhas - 1) * 0.22);
          const ponto = Math.max(0, Math.min(1, diagonal + deslocamento));
          const indice = Math.min(cores.length - 2, cores.findIndex((cor, i) => i < cores.length - 1 && ponto <= cores[i + 1].pos));
          const atual = cores[Math.max(0, indice)];
          const proxima = cores[Math.max(0, indice) + 1];
          const mistura = (ponto - atual.pos) / (proxima.pos - atual.pos);
          const limiar = (bayer[linha % 4][coluna % 4] + 0.5) / 16;
          const cor = mistura > limiar ? proxima : atual;
          contexto.fillStyle = `rgb(${cor.rgb.join(",")})`;
          contexto.fillRect(coluna * lado, linha * lado, lado + 0.5, lado + 0.5);
        }
      }
      if (!movimentoReduzido.matches && !document.hidden) frame = requestAnimationFrame(desenhar);
    };

    const ajustar = () => {
      const area = canvas.getBoundingClientRect();
      largura = canvas.width = Math.max(1, Math.ceil(area.width));
      altura = canvas.height = Math.max(1, Math.ceil(area.height));
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(desenhar);
    };
    const observer = new ResizeObserver(ajustar);
    const aoVoltar = () => { if (!document.hidden) ajustar(); };
    observer.observe(canvas);
    document.addEventListener("visibilitychange", aoVoltar);
    ajustar();
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", aoVoltar);
      cancelAnimationFrame(frame);
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.fundoDitherBanner} aria-hidden="true" />;
}
