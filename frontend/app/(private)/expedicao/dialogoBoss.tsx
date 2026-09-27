"use client";

import { useState } from "react";
import type { EstadoExpedicao } from "../../lib/jogo";
import styles from "../../styles/dialogoBoss.module.css";

export function DialogoBoss({
  dialogo,
  processando,
  onResponder,
  onIniciar,
}: {
  dialogo: NonNullable<EstadoExpedicao["dialogoBoss"]>;
  processando: boolean;
  onResponder: (resposta: string) => void;
  onIniciar: () => void;
}) {
  const [resposta, setResposta] = useState("");
  return (
    <section className={styles.painel} aria-label="Diálogo com o boss final">
      <span className={styles.legenda}>Confronto final · Antes da batalha</span>
      <h2>{dialogo.nome}</h2>
      <p className={styles.fala}>“{dialogo.provocacao}”</p>
      <p className={styles.pergunta}>{dialogo.pergunta}</p>
      {dialogo.resultado ? (
        <div className={styles.resposta}>
          <span>Você: {dialogo.resultado.resposta}</span>
          <strong>
            {dialogo.nome}: “{dialogo.resultado.reacao}”
          </strong>
          <small>
            Teor {dialogo.resultado.nota}/4 · recompensa ×
            {dialogo.resultado.multiplicador.toLocaleString("pt-BR")}
            {dialogo.resultado.modo === "LOCAL"
              ? " · avaliação local"
              : " · avaliação por IA"}
          </small>
          <button type="button" onClick={onIniciar} disabled={processando}>
            {processando ? "Preparando confronto..." : "Iniciar confronto"}
          </button>
        </div>
      ) : (
        <form
          onSubmit={(evento) => {
            evento.preventDefault();
            onResponder(resposta.trim());
          }}
        >
          <label htmlFor="respostaBoss">Sua resposta</label>
          <textarea
            id="respostaBoss"
            minLength={20}
            maxLength={600}
            required
            value={resposta}
            onChange={(evento) => setResposta(evento.target.value)}
            placeholder="Responda como seu personagem reagiria..."
          />
          <button
            type="submit"
            disabled={processando || resposta.trim().length < 20}
          >
            {processando ? "O boss está ouvindo..." : "Responder ao boss"}
          </button>
          <small>
            A resposta é registrada uma vez por expedição. Não inclua dados
            pessoais.
          </small>
        </form>
      )}
    </section>
  );
}
