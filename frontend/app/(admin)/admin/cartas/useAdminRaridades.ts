"use client";

import { useEffect, useState } from "react";
import { listarAdminRaridades, type AdminRaridade } from "../../../lib/admin";

export const raridadesIniciais: AdminRaridade[] = [
  { codigo: "N", nome: "Comum", valorVenda: 50, cor: "#94a3b8", ordem: 1, totalCartas: 0 },
  { codigo: "R", nome: "Rara", valorVenda: 100, cor: "#60a5fa", ordem: 2, totalCartas: 0 },
  { codigo: "SR", nome: "Épica", valorVenda: 200, cor: "#c084fc", ordem: 3, totalCartas: 0 },
  { codigo: "SSR", nome: "Lendária", valorVenda: 400, cor: "#facc15", ordem: 4, totalCartas: 0 },
  { codigo: "UR", nome: "Mítica", valorVenda: 800, cor: "#e879f9", ordem: 5, totalCartas: 0 },
  { codigo: "SECRETA", nome: "Secreta", valorVenda: 1600, cor: "#fb7185", ordem: 6, totalCartas: 0 },
];

export function useAdminRaridades() {
  const [raridades, setRaridades] = useState(raridadesIniciais);

  useEffect(() => {
    let ativo = true;
    listarAdminRaridades().then((res) => {
      if (ativo) setRaridades(res);
    }).catch(() => undefined);
    return () => { ativo = false; };
  }, []);

  return raridades;
}
