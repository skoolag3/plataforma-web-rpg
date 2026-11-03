"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { listarRaridadesJogo, type RaridadeJogo } from "../lib/jogo";

const padrao: RaridadeJogo[] = [
  { codigo: "N", nome: "Comum", valor_venda: 50, cor: "#94a3b8", ordem: 1 },
  { codigo: "R", nome: "Rara", valor_venda: 100, cor: "#60a5fa", ordem: 2 },
  { codigo: "SR", nome: "Épica", valor_venda: 200, cor: "#c084fc", ordem: 3 },
  { codigo: "SSR", nome: "Lendária", valor_venda: 400, cor: "#facc15", ordem: 4 },
  { codigo: "UR", nome: "Mítica", valor_venda: 800, cor: "#e879f9", ordem: 5 },
  { codigo: "SECRETA", nome: "Secreta", valor_venda: 1600, cor: "#fb7185", ordem: 6 },
];

const ContextoRaridades = createContext(padrao);

export function RaridadesJogoProvider({ children }: { children: ReactNode }) {
  const [raridades, setRaridades] = useState(padrao);
  useEffect(() => {
    let ativo = true;
    listarRaridadesJogo().then((res) => { if (ativo) setRaridades(res); }).catch(() => undefined);
    return () => { ativo = false; };
  }, []);
  return <ContextoRaridades.Provider value={raridades}>{children}</ContextoRaridades.Provider>;
}

export function useRaridadesJogo() {
  return useContext(ContextoRaridades);
}

export function obterRaridadeJogo(raridades: RaridadeJogo[], codigo: string) {
  return raridades.find((item) => item.codigo === codigo) ?? padrao.find((item) => item.codigo === codigo);
}
