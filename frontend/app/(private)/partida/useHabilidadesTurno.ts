"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { EstadoPartida } from "../../lib/jogo";

type HabilidadeAtivada = {
  id: string;
  turno: number;
  origem: "JOGADOR" | "BOT";
  nome: string;
};

function nomeHabilidade(texto: string) {
  return texto.match(/ ativou (.+?)(?: e (?:evitou|recuperou|drenou|recebeu)|:|\.|$)/)?.[1] ?? null;
}

export function useHabilidadesTurno(partida: EstadoPartida) {
  const partidaConhecida = useRef<string | null>(null);
  const eventosConhecidos = useRef<Set<string>>(new Set());
  const [fila, setFila] = useState<HabilidadeAtivada[]>([]);

  useLayoutEffect(() => {
    if (partidaConhecida.current !== partida.id) {
      partidaConhecida.current = partida.id;
      eventosConhecidos.current = new Set(partida.eventos.map((evento) => evento.id));
      return;
    }

    const novasHabilidades = partida.eventos
      .filter((evento) => !eventosConhecidos.current.has(evento.id))
      .sort((a, b) => a.sequencia - b.sequencia)
      .flatMap((evento) => {
        const nome = nomeHabilidade(evento.texto);
        return nome && (evento.origem === "JOGADOR" || evento.origem === "BOT")
          ? [{ id: evento.id, turno: evento.turno, origem: evento.origem, nome }]
          : [];
      })
      .filter((habilidade, indice, todas) => todas.findIndex((item) =>
        item.turno === habilidade.turno && item.origem === habilidade.origem && item.nome === habilidade.nome,
      ) === indice);

    partida.eventos.forEach((evento) => eventosConhecidos.current.add(evento.id));
    if (novasHabilidades.length) {
      queueMicrotask(() => setFila((atual) => [...atual, ...novasHabilidades]));
    }
  }, [partida]);

  useEffect(() => {
    if (!fila.length) return;
    const timer = window.setTimeout(() => setFila((atual) => atual.slice(1)), 2200);
    return () => window.clearTimeout(timer);
  }, [fila]);

  return fila[0] ?? null;
}
