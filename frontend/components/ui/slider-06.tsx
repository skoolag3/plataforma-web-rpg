"use client";

import { useRef, useState, type MouseEvent } from "react";
import { Slider } from "@/components/ui/slider-06-utils/slider";
import styles from "./slider-06.module.css";

export type OpcaoPeriodo = { value: string; label: string; labelCurto?: string };

type Props = {
  opcoes: readonly OpcaoPeriodo[];
  valor: string;
  aoAlterar: (valor: string) => void;
  rotulo?: string;
};

export default function Slider06({ opcoes, valor, aoAlterar, rotulo = "Período de cadastro" }: Props) {
  const [preview, setPreview] = useState<number | null>(null);
  const trilhoRef = useRef<HTMLDivElement>(null);
  const indice = Math.max(0, opcoes.findIndex((opcao) => opcao.value === valor));
  const maximo = Math.max(0, opcoes.length - 1);
  const porcentagem = (posicao: number) => maximo ? (posicao / maximo) * 100 : 0;
  const porcentagemAtual = porcentagem(indice);
  const porcentagemPreview = preview === null ? null : porcentagem(preview);

  function handleMouseMove(evento: MouseEvent<HTMLDivElement>) {
    const area = trilhoRef.current?.getBoundingClientRect();
    if (!area || !maximo) return;
    const posicao = Math.round(((evento.clientX - area.left) / area.width) * maximo);
    setPreview(Math.min(maximo, Math.max(0, posicao)));
  }

  return <div className={styles.filtro}>
    <div className={styles.cabecalho}>
      <span>{rotulo}</span>
      <strong aria-live="polite">{opcoes[indice]?.label}</strong>
    </div>
    <div className={styles.corpo}>
      <div className={styles.trilho} ref={trilhoRef} onMouseMove={handleMouseMove} onMouseLeave={() => setPreview(null)}>
        <Slider
          value={[indice]}
          onValueChange={([posicao]) => aoAlterar(opcoes[posicao]?.value ?? opcoes[0].value)}
          min={0}
          max={maximo}
          step={1}
          aria-label={rotulo}
          aria-valuetext={opcoes[indice]?.label}
        />
        {porcentagemPreview !== null && porcentagemPreview !== porcentagemAtual ? <span
          className={styles.preview}
          style={{ left: `${Math.min(porcentagemAtual, porcentagemPreview)}%`, width: `${Math.abs(porcentagemPreview - porcentagemAtual)}%` }}
          aria-hidden="true"
        /> : null}
      </div>
      <div className={styles.marcas} aria-hidden="true">
        {opcoes.map((opcao) => <span key={opcao.value || "todos"}>{opcao.labelCurto ?? opcao.label}</span>)}
      </div>
    </div>
  </div>;
}
