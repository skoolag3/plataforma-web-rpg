"use client";

import { useEffect, useState } from "react";

const chaveFavoritas = "animecards-cartas-favoritas";

export function useCartasFavoritas() {
  const [favoritas, setFavoritas] = useState<Set<string>>(new Set());
  const [carregadas, setCarregadas] = useState(false);

  useEffect(() => {
    let ativo = true;
    queueMicrotask(() => {
      if (!ativo) return;
      try {
        const salvas = JSON.parse(localStorage.getItem(chaveFavoritas) ?? "[]");
        if (Array.isArray(salvas)) setFavoritas(new Set(salvas.filter((nome): nome is string => typeof nome === "string")));
      } catch {
        setFavoritas(new Set());
      }
      setCarregadas(true);
    });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (carregadas) localStorage.setItem(chaveFavoritas, JSON.stringify([...favoritas]));
  }, [carregadas, favoritas]);

  return [favoritas, setFavoritas] as const;
}
