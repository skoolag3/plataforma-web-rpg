"use client";

import { useState } from "react";
import { ChevronDown, Clock3, Trophy, XCircle } from "lucide-react";

import type { HistoricoPartida } from "../../../lib/jogo";
import styles from "../../../styles/perfil/historicoPerfil.module.css";

type PartidaHistorico = Pick<
  HistoricoPartida,
  "id" | "resultado" | "turnos_jogados" | "variacao_pontos" | "timestamp_inicio" | "deck"
>;

type PropsHistoricoPartidasPerfil = {
  historico: PartidaHistorico[];
  oculto?: boolean;
  proprioPerfil?: boolean;
};

export function HistoricoPartidasPerfil({ historico, oculto = false, proprioPerfil = false }: PropsHistoricoPartidasPerfil) {
  const [aberto, setAberto] = useState(false);
  const [pagina, setPagina] = useState(1);
  const totalPaginas = Math.ceil(historico.length / 5);

  return (
    <section id="historico" className={styles.painel}>
      <button type="button" className={styles.cabecalho} onClick={() => setAberto((valor) => !valor)} aria-expanded={aberto}>
        <span><Clock3 aria-hidden="true" /> Histórico de partidas</span>
        <small>{oculto ? "Privado" : "Últimas batalhas registradas"} <ChevronDown aria-hidden="true" /></small>
      </button>
      {aberto && (
        oculto ? <p className={styles.vazio}>Este jogador ocultou o histórico de partidas.</p> :
        historico.length === 0 ? <p className={styles.vazio}>{proprioPerfil ? "Você ainda não concluiu nenhuma partida." : "Este jogador ainda não concluiu nenhuma partida."}</p> : (
          <div className={styles.lista}>
            {historico.slice((pagina - 1) * 5, pagina * 5).map((partida) => {
              const vitoria = partida.resultado === "VITORIA";
              const data = partida.timestamp_inicio
                ? new Date(partida.timestamp_inicio).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })
                : "—";
              return (
                <article key={partida.id} className={styles.item}>
                  <strong data-resultado={partida.resultado}>
                    {vitoria ? <><Trophy aria-hidden="true" /> Vitória</> : partida.resultado === "DERROTA" ? <><XCircle aria-hidden="true" /> Derrota</> : "Empate"}
                  </strong>
                  <span><b>{partida.deck?.nome ?? "Deck removido"}</b><small>{data} · {partida.turnos_jogados} turnos</small></span>
                  <em>{partida.variacao_pontos && partida.variacao_pontos > 0 ? "+" : ""}{partida.variacao_pontos ?? 0} pts</em>
                </article>
              );
            })}
            {totalPaginas > 1 ? (
              <nav className={styles.paginacao} aria-label="Paginação do histórico">
                <button type="button" disabled={pagina === 1} onClick={() => setPagina((valor) => valor - 1)}>Anterior</button>
                <span>{pagina} / {totalPaginas}</span>
                <button type="button" disabled={pagina >= totalPaginas} onClick={() => setPagina((valor) => valor + 1)}>Próxima</button>
              </nav>
            ) : null}
          </div>
        )
      )}
    </section>
  );
}
