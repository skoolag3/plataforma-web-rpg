"use client";

import { useEffect, type CSSProperties } from "react";
import { Trophy, X } from "lucide-react";

import { CartaMontada } from "../../../components/cartaMontada";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";
import type { Card, ResumoColecao } from "../types";
import styles from "../../../styles/inventario/modalConquistas.module.css";

type PropsModalConquistas = {
  resumo: ResumoColecao;
  cartas: Card[];
  carregando: boolean;
  erro: string;
  aoFechar: () => void;
};

export function ModalConquistas({ resumo, cartas, carregando, erro, aoFechar }: PropsModalConquistas) {
  const raridades = useRaridadesJogo();
  useEffect(() => {
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") aoFechar();
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [aoFechar]);

  const obtidas = cartas.filter((carta) => carta.obtida);
  const faltantes = cartas.filter((carta) => !carta.obtida);

  function gradeCartas(lista: Card[], bloqueadas = false) {
    return (
      <div className={styles.gradeCartas}>
        {lista.map((carta) => (
          <article key={carta.id ?? carta.nome} className={styles.itemCarta}>
            <div className={`${styles.visualCarta} ${bloqueadas ? styles.visualBloqueado : ""}`}>
              <CartaMontada
                arte={carta.foto ?? undefined}
                moldura={carta.moldura ?? undefined}
                nome={carta.nome}
                raridade={carta.raridade}
                elemento={carta.elemento}
                config={carta.configVisual ?? undefined}
              />
            </div>
            <div className={styles.identificacaoCarta}>
              <strong>{carta.nome}</strong>
              <span>{bloqueadas ? "Ainda não obtida" : "Obtida"}</span>
            </div>
          </article>
        ))}
      </div>
    );
  }

  function gruposPorRaridade(lista: Card[], bloqueadas = false) {
    const codigos = [...new Set(lista.map((carta) => carta.raridade))].sort((a, b) =>
      (obterRaridadeJogo(raridades, b)?.ordem ?? 0) - (obterRaridadeJogo(raridades, a)?.ordem ?? 0)
    );

    return codigos.map((codigo) => {
      const raridade = obterRaridadeJogo(raridades, codigo);
      const cartasDaRaridade = lista.filter((carta) => carta.raridade === codigo);

      return (
        <section className={styles.grupoRaridade} key={codigo} style={{ "--cor-raridade": raridade?.cor ?? cartasDaRaridade[0].borda } as CSSProperties}>
          <h4>{raridade?.nome ?? codigo} <span>{cartasDaRaridade.length}</span></h4>
          {gradeCartas(cartasDaRaridade, bloqueadas)}
        </section>
      );
    });
  }

  return (
    <div
      className={styles.fundoModal}
      data-modal-overlay
      onMouseDown={(evento) => { if (evento.target === evento.currentTarget) aoFechar(); }}
    >
      <section className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-conquistas">
        <header className={styles.cabecalho}>
          <div>
            <span className={styles.rotulo}><Trophy aria-hidden="true" /> Sua coleção</span>
            <h2 id="titulo-conquistas">Conquistas</h2>
            <p>Veja as cartas que você já encontrou e as que ainda faltam.</p>
          </div>
          <button type="button" onClick={aoFechar} aria-label="Fechar conquistas" autoFocus><X aria-hidden="true" /></button>
        </header>

        <div className={styles.progresso}>
          <div><strong>{resumo.cartasObtidas} de {resumo.totalCartas} cartas</strong><span>{resumo.percentual}% completo</span></div>
          <span className={styles.trilha} aria-hidden="true"><span style={{ width: `${resumo.percentual}%` }} /></span>
        </div>

        <div className={styles.conteudo}>
          {carregando ? <p className={styles.mensagem}>Carregando cartas...</p> : null}
          {erro ? <p className={styles.mensagem} role="alert">{erro}</p> : null}
          {!carregando && !erro ? (
            <>
              <section className={styles.grupo} aria-labelledby="cartas-obtidas">
                <h3 id="cartas-obtidas">Obtidas <span>{obtidas.length}</span></h3>
                {obtidas.length ? gruposPorRaridade(obtidas) : <p className={styles.mensagem}>Você ainda não obteve cartas.</p>}
              </section>
              <section className={styles.grupo} aria-labelledby="cartas-faltantes">
                <h3 id="cartas-faltantes">Ainda faltam <span>{faltantes.length}</span></h3>
                {faltantes.length ? gruposPorRaridade(faltantes, true) : <p className={styles.mensagem}>Você completou a coleção disponível.</p>}
              </section>
            </>
          ) : null}
        </div>
      </section>
    </div>
  );
}
