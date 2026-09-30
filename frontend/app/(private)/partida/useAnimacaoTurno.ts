"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";

import type { CartaPartida, EstadoPartida } from "../../lib/jogo";

export type AnimacaoDano = {
  id: string;
  origem: "JOGADOR" | "BOT";
  alvo: "JOGADOR" | "BOT";
  dano: number;
  cartaJogador: CartaPartida;
  cartaBot: CartaPartida;
  ativaJogador: number;
  ativaBot: number;
};

export function useAnimacaoTurno(partida: EstadoPartida) {
  const eventosConhecidos = useRef<Set<string> | null>(null);
  const estadoAnterior = useRef<EstadoPartida | null>(null);
  const [fila, setFila] = useState<AnimacaoDano[]>([]);

  useLayoutEffect(() => {
    const eventos = partida.eventos;
    if (!eventosConhecidos.current) {
      eventosConhecidos.current = new Set(eventos.map((evento) => evento.id));
      estadoAnterior.current = partida;
      return;
    }

    const novosEventos = eventos.filter(
      (evento) => !eventosConhecidos.current?.has(evento.id),
    );

    novosEventos.forEach((evento) => eventosConhecidos.current?.add(evento.id));

    const anterior = estadoAnterior.current;
    estadoAnterior.current = partida;
    if (!anterior) return;

    const cartasJogador = anterior.jogador.cartas.map((carta) => ({ ...carta }));
    const cartasBot = anterior.bot.cartas.map((carta) => ({ ...carta }));
    let ativaJogador = anterior.jogador.ativa;
    let ativaBot = anterior.bot.ativa;
    const danos: AnimacaoDano[] = [];

    for (const evento of novosEventos.sort((a, b) => a.sequencia - b.sequencia)) {
      if (evento.tipo === "ENTRADA" && evento.origem) {
        const cartas = evento.origem === "JOGADOR" ? cartasJogador : cartasBot;
        const indiceAtual = evento.origem === "JOGADOR" ? ativaJogador : ativaBot;
        const proxima = cartas.findIndex((carta, indice) => indice > indiceAtual && !carta.derrotada);
        if (proxima >= 0) {
          if (evento.origem === "JOGADOR") ativaJogador = proxima;
          else ativaBot = proxima;
        }
      }
      if (
        evento.tipo !== "DANO" ||
        (evento.origem !== "JOGADOR" && evento.origem !== "BOT") ||
        typeof evento.valor !== "number" || evento.valor <= 0
      ) continue;

      const alvo = evento.origem === "JOGADOR" ? "BOT" : "JOGADOR";
      const cartaAlvo = alvo === "JOGADOR" ? cartasJogador[ativaJogador] : cartasBot[ativaBot];
      if (!cartaAlvo || !cartasJogador[ativaJogador] || !cartasBot[ativaBot]) continue;
      cartaAlvo.hpAtual = Math.max(0, cartaAlvo.hpAtual - evento.valor);
      danos.push({
        id: evento.id,
        origem: evento.origem,
        alvo,
        dano: evento.valor,
        cartaJogador: { ...cartasJogador[ativaJogador] },
        cartaBot: { ...cartasBot[ativaBot] },
        ativaJogador,
        ativaBot,
      });
      if (cartaAlvo.hpAtual === 0) cartaAlvo.derrotada = true;
    }

    if (danos.length) {
      queueMicrotask(() => setFila((atualFila) => [...atualFila, ...danos]));
    }
  }, [partida]);

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
