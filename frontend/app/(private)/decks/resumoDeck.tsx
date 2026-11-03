"use client";

import Image from "next/image";
import { Heart, Shield, Swords, Zap } from "lucide-react";
import { useState } from "react";

import { elementosCarta, obterElementoCarta, type ElementoCarta } from "../../components/elementosCarta";
import type { CartaColecao } from "../../lib/jogo";
import styles from "../../styles/decks.module.css";

export function ResumoDeck({ cartas }: { cartas: CartaColecao[] }) {
  const [dicaAberta, setDicaAberta] = useState<ElementoCarta | null>(null);
  const [mediaAberta, setMediaAberta] = useState<string | null>(null);
  const vantagemElemento: Record<ElementoCarta, ElementoCarta> = {
    fogo: "natureza",
    natureza: "agua",
    agua: "fogo",
    luz: "sombra",
    sombra: "luz",
  };
  const media = (valor: (carta: CartaColecao) => number) =>
    cartas.length ? Math.round(cartas.reduce((total, carta) => total + valor(carta), 0) / cartas.length) : "—";
  const elementos = elementosCarta
    .map((elemento) => ({ ...elemento, quantidade: cartas.filter((carta) => carta.elemento === elemento.value).length }))
    .filter((elemento) => elemento.quantidade > 0);
  const medias = [
    { id: "prioridade", label: "Prioridade", Icone: Zap, valor: media((carta) => carta.prioridadeAtaque), dica: "Média do deck. O menor número ataca primeiro." },
    { id: "ataque", label: "Ataque", Icone: Swords, valor: media((carta) => carta.danoBase), dica: "Média do ataque base usado para calcular o dano." },
    { id: "defesa", label: "Defesa", Icone: Shield, valor: media((carta) => carta.defesaBase), dica: "Média da defesa base, que reduz o dano recebido." },
    { id: "hp", label: "HP", Icone: Heart, valor: media((carta) => carta.hpBase), dica: "Média dos pontos de vida base. Ao chegar a zero, a carta é derrotada." },
  ];

  return (
    <section className={styles.resumoDeck} aria-label="Resumo das cartas no deck">
      <div className={styles.resumoElementos}>
        <span className={styles.resumoRotulo}>Elementos no deck</span>
        <div className={styles.resumoElementosLista}>
          {elementos.length ? elementos.map((elemento) => {
            const vantagem = obterElementoCarta(vantagemElemento[elemento.value])?.label ?? "";
            const desvantagemCodigo = elementosCarta.find((item) => vantagemElemento[item.value] === elemento.value)?.value;
            const desvantagem = desvantagemCodigo ? obterElementoCarta(desvantagemCodigo)?.label : "";
            return (
              <span className={styles.resumoElementoComDica} key={elemento.value} data-aberta={dicaAberta === elemento.value}>
                <button
                  type="button"
                  className={styles.resumoElemento}
                  style={{ borderColor: elemento.cor }}
                  aria-label={`${elemento.label}: ${elemento.quantidade} ${elemento.quantidade === 1 ? "carta" : "cartas"}. Vantagem contra ${vantagem}; desvantagem contra ${desvantagem}.`}
                  aria-describedby={`dica-elemento-deck-${elemento.value}`}
                  aria-expanded={dicaAberta === elemento.value}
                  onClick={() => setDicaAberta(dicaAberta === elemento.value ? null : elemento.value)}
                >
                  <Image src={elemento.icone} alt="" width={18} height={18} />
                  {elemento.label} <strong>{elemento.quantidade}</strong>
                </button>
                <span id={`dica-elemento-deck-${elemento.value}`} className={styles.dicaElementoDeck} role="tooltip">
                  <strong>{elemento.label}</strong>
                  <span>Vantagem contra {vantagem}. Desvantagem contra {desvantagem}.</span>
                </span>
              </span>
            );
          }) : <span className={styles.resumoVazio}>Adicione cartas para ver a composição.</span>}
        </div>
      </div>
      <div className={styles.resumoMedias} aria-label="Médias dos atributos base">
        {medias.map(({ id, label, Icone, valor, dica }) => (
          <span className={styles.resumoMediaComDica} key={id} data-aberta={mediaAberta === id}>
            <button
              type="button"
              className={styles.resumoMediaBotao}
              aria-label={`${label}: ${valor}. ${dica}`}
              aria-describedby={`dica-media-deck-${id}`}
              aria-expanded={mediaAberta === id}
              onClick={() => setMediaAberta(mediaAberta === id ? null : id)}
            >
              <span><Icone aria-hidden="true" /><small>{label}</small></span>
              <strong>{valor}</strong>
            </button>
            <span id={`dica-media-deck-${id}`} className={styles.dicaMediaDeck} role="tooltip">{dica}</span>
          </span>
        ))}
      </div>
    </section>
  );
}
