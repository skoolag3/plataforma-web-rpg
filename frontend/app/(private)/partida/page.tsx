"use client";

import { Bot, Shield, Sparkles, Swords } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  buscarProvocacaoBot,
  iniciarPartidaBot,
  type ResultadoPartida,
} from "../../lib/jogo";
import styles from "../../styles/partida.module.css";

export default function PartidaPage() {
  const [provocacao, setProvocacao] = useState({ personalidade: "", pergunta: "" });
  const [resposta, setResposta] = useState("");
  const [resultado, setResultado] = useState<ResultadoPartida | null>(null);
  const [erro, setErro] = useState("");
  const [lutando, setLutando] = useState(false);
  useEffect(() => { buscarProvocacaoBot().then(setProvocacao).catch((e) => setErro(e.message)); }, []);
  async function batalhar() {
    setLutando(true); setErro("");
    try { setResultado(await iniciarPartidaBot(resposta)); }
    catch (e) { setErro(e instanceof Error ? e.message : "Erro ao iniciar a batalha."); }
    finally { setLutando(false); }
  }
  return (
    <main className={styles.pagina}>
      <section className={styles.container}>
        <header className={styles.topo}><div><span>Duelo tático</span><h1>Arena 1v1</h1><p>Prepare sua resposta, desafie o bot e conquiste pontos no ranking.</p></div><Link href="/decks">Gerenciar deck</Link></header>
        {!resultado ? <section className={styles.desafio}>
          <div className={styles.oponente}><span><Bot /></span><div><small>Seu oponente</small><strong>{provocacao.personalidade || "Carregando oponente..."}</strong><p>Sua resposta define como o bot enfrentará você.</p></div></div>
          <blockquote>&ldquo;{provocacao.pergunta}&rdquo;</blockquote>
          <label className={styles.resposta}><span>Sua resposta <small>{resposta.length}/500</small></span><textarea value={resposta} onChange={(e) => setResposta(e.target.value)} maxLength={500} placeholder="Responda ao vilão..." /></label>
          {erro && <p className={styles.erro}>{erro}</p>}<button className={styles.batalhar} onClick={() => void batalhar()} disabled={lutando || resposta.trim().length < 2}><Swords />{lutando ? "Simulando turnos..." : "Aceitar duelo"}</button>
        </section> : <section className={styles.resultado}><aside className={styles.resumo}><Sparkles /><small>Resultado</small><h2>{resultado.resultado}</h2><dl><div><dt>Dificuldade</dt><dd>{resultado.dificuldade}</dd></div><div><dt>Turnos</dt><dd>{resultado.estado.turno}</dd></div></dl><p className={resultado.variacaoPontos >= 0 ? styles.positivo : styles.negativo}>{resultado.variacaoPontos >= 0 ? "+" : ""}{resultado.variacaoPontos} pontos</p><button onClick={() => { setResultado(null); setResposta(""); }}>Nova partida</button></aside><div className={styles.log}><h2><Shield /> Log da partida</h2>{resultado.estado.eventos.map((evento, i) => <div className={styles.evento} key={i}><span>T{evento.turno}</span>{evento.texto}</div>)}</div></section>}
      </section>
    </main>
  );
}
