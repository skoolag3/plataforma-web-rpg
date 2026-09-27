"use client";

import { useEffect, useRef, useState } from "react";

import type { EstadoPartida } from "../../lib/jogo";

type EventoPartida = EstadoPartida["eventos"][number];

export type AnimacaoDano = {
  id: string;
  origem: "JOGADOR" | "BOT";
  alvo: "JOGADOR" | "BOT";
  dano: number;
};

export function useAnimacaoTurno(eventos: EventoPartida[]) {
  const eventosConhecidos = useRef<Set<string> | null>(null);
  const [fila, setFila] = useState<AnimacaoDano[]>([]);

  useEffect(() => {
    if (!eventosConhecidos.current) {
      eventosConhecidos.current = new Set(eventos.map((evento) => evento.id));
      return;
    }

    const novosEventos = eventos.filter(
      (evento) => !eventosConhecidos.current?.has(evento.id),
    );

    novosEventos.forEach((evento) => eventosConhecidos.current?.add(evento.id));

    const danos = novosEventos
      .filter(
        (evento): evento is EventoPartida & {
          origem: "JOGADOR" | "BOT";
          valor: number;
        } =>
          evento.tipo === "DANO" &&
          (evento.origem === "JOGADOR" || evento.origem === "BOT") &&
          typeof evento.valor === "number" &&
          evento.valor > 0,
      )
      .sort((a, b) => a.sequencia - b.sequencia)
      .map<AnimacaoDano>((evento) => ({
        id: evento.id,
        origem: evento.origem,
        alvo: evento.origem === "JOGADOR" ? "BOT" : "JOGADOR",
        dano: evento.valor,
      }));

    if (danos.length) setFila((atualFila) => [...atualFila, ...danos]);
  }, [eventos]);

  useEffect(() => {
    if (!fila.length) return;
    const timer = window.setTimeout(
      () => setFila((atualFila) => atualFila.slice(1)),
      2300,
    );
    return () => window.clearTimeout(timer);
  }, [fila]);

  function pularAnimacao() {
    setFila([]);
  }

  return {
    animacaoAtual: fila[0] ?? null,
    animando: fila.length > 0,
    pularAnimacao,
  };
}
