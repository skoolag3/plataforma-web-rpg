"use client";

import { Medal, Trophy, User } from "lucide-react";
import { useEffect, useState } from "react";
import { buscarRanking, type JogadorRanking } from "../../lib/jogo";
import styles from "../../styles/ranking.module.css";

export default function RankingPage() {
  const [jogadores, setJogadores] = useState<JogadorRanking[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarRanking().then((resposta) => setJogadores(resposta.jogadores)).catch((erroApi) => {
      setErro(erroApi instanceof Error ? erroApi.message : "Não foi possível carregar o ranking.");
    });
  }, []);

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span><Trophy /> Classificação</span>
        <h1>Ranking dos jogadores</h1>
        <p>Os melhores invocadores da arena, ordenados pela pontuação.</p>
      </header>
      <section className={styles.panel} aria-label="Ranking público">
        {erro ? <p className={styles.error}>{erro}</p> : null}
        {!erro && jogadores.length === 0 ? <p className={styles.empty}>Ainda não há jogadores no ranking.</p> : null}
        {jogadores.map((jogador) => (
          <article className={`${styles.row} ${jogador.posicao <= 3 ? styles.destaque : ""}`} key={jogador.id}>
            <strong className={styles.posicao}>{jogador.posicao <= 3 ? <Medal /> : `#${jogador.posicao}`}</strong>
            <span className={styles.avatar}>{jogador.avatarUrl ? <img src={jogador.avatarUrl} alt="" /> : <User />}</span>
            <span className={styles.nome}><b>{jogador.nome}</b><small>Nível {jogador.nivel} · {jogador.partidas} partidas</small></span>
            <strong className={styles.pontos}>{jogador.pontos.toLocaleString("pt-BR")} pts</strong>
          </article>
        ))}
      </section>
    </main>
  );
}
