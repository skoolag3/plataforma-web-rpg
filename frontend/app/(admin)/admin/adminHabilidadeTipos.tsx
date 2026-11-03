"use client";

import { CircleHelp } from "lucide-react";
import type { AdminHabilidade } from "../../lib/admin";
import { Tooltip, TooltipContent, TooltipTrigger } from "../../../components/ui/tooltip-07-utils/tooltip";
import styles from "../../styles/admin/adminHabilidadeTipos.module.css";

type Tipo = AdminHabilidade["tipoEfeito"];

export const referenciasTipo: Record<Tipo, { nome: string; explicacao: string; cor: string }> = {
  DANO: { nome: "Dano", explicacao: "Reduz a vida do inimigo ativo quando a habilidade é aplicada.", cor: "#fb7185" },
  CURA: { nome: "Cura", explicacao: "Recupera vida da própria carta.", cor: "#4ade80" },
  ESCUDO: { nome: "Escudo", explicacao: "Cria proteção que absorve dano recebido pela própria carta.", cor: "#60a5fa" },
  CRITICO: { nome: "Crítico", explicacao: "Dá uma chance de aumentar o dano de um ataque.", cor: "#fbbf24" },
  BUFF: { nome: "Fortalecimento", explicacao: "Aumenta um atributo da própria carta.", cor: "#c084fc" },
  DEBUFF: { nome: "Enfraquecimento", explicacao: "Reduz um atributo do inimigo ativo.", cor: "#f472b6" },
  ROUBO_VIDA: { nome: "Roubo de vida", explicacao: "Causa dano e recupera vida da própria carta.", cor: "#f97373" },
  EVASAO: { nome: "Evasão", explicacao: "Aumenta a capacidade de evitar um ataque.", cor: "#2dd4bf" },
};

export function TipoHabilidade({ tipo, texto }: { tipo: Tipo; texto?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={
        <button type="button" className={styles.tipoTermo} data-tipo={tipo} aria-label={`${texto ?? referenciasTipo[tipo].nome}: ${referenciasTipo[tipo].explicacao}`}>
          {texto ?? referenciasTipo[tipo].nome}
        </button>
      } />
      <TooltipContent><strong>{referenciasTipo[tipo].nome}</strong> — {referenciasTipo[tipo].explicacao}</TooltipContent>
    </Tooltip>
  );
}

export function AjudaTiposHabilidade({ titulo = "O que significam as cores dos efeitos?" }: { titulo?: string }) {
  return (
    <Tooltip>
      <TooltipTrigger render={
        <button type="button" className={styles.btnAjuda} aria-label={titulo}>
          <CircleHelp aria-hidden="true" />
        </button>
      } />
      <TooltipContent>
        <strong>Tipos de efeito</strong>
        <span className={styles.legenda}>
          {(Object.entries(referenciasTipo) as [Tipo, (typeof referenciasTipo)[Tipo]][]).map(([tipo, referencia]) => (
            <span key={tipo} className={styles.itemLegenda} data-tipo={tipo}>
              <span className={styles.marcaLegenda} aria-hidden="true" />
              <span><b>{referencia.nome}</b> — {referencia.explicacao}</span>
            </span>
          ))}
        </span>
      </TooltipContent>
    </Tooltip>
  );
}
