"use client";

import { Boxes, Gem, Layers, Swords, Trophy, WalletCards } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { listarDecks, type Deck } from "../../lib/jogo";
import { buscarPerfilApi, type PerfilConta } from "../../lib/perfil";
import styles from "../../styles/dashboard.module.css";

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<PerfilConta | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [erro, setErro] = useState("");
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([buscarPerfilApi(token), listarDecks()])
      .then(([dados, decksDados]) => { setPerfil(dados); setDecks(decksDados); })
      .catch((e) => setErro(e instanceof Error ? e.message : "Nao foi possivel carregar o resumo."));
  }, []);
  const deckAtivo = decks.find((deck) => deck.ativo);
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.hero}>
          <div><span>Home do jogador</span><h1>Bem-vindo, {perfil?.user ?? "aventureiro"}.</h1><p>Seu ponto de partida para organizar a colecao e entrar na arena.</p></div>
          <Link href="/partida"><Swords /> Jogar agora</Link>
        </header>
        {erro ? <p className={styles.error}>{erro}</p> : null}
        <section className={styles.metrics}>
          <article><Gem /><span>Rubys</span><strong>{perfil?.rubys?.toLocaleString("pt-BR") ?? "—"}</strong></article>
          <article><WalletCards /><span>Moedas</span><strong>{perfil?.moedas?.toLocaleString("pt-BR") ?? "—"}</strong></article>
          <article><Layers /><span>Colecao</span><strong>{perfil ? `${perfil.cartasObtidas}/${perfil.totalCartas}` : "—"}</strong></article>
          <article><Trophy /><span>Ranking</span><strong>{perfil?.ranking?.toLocaleString("pt-BR") ?? "—"}</strong></article>
        </section>
        <section className={styles.grid}>
          <article className={styles.deckCard}><div><Boxes /><span><small>Deck ativo</small><strong>{deckAtivo?.nome ?? "Nenhum deck ativo"}</strong><p>{deckAtivo ? `${deckAtivo.cartas.length}/6 cartas prontas` : "Monte um deck para liberar as batalhas."}</p></span></div><Link href="/decks">{deckAtivo ? "Gerenciar deck" : "Criar deck"}</Link></article>
          <article className={styles.actions}><h2>Acessos rapidos</h2><Link href="/cartas"><Layers /><span><strong>Minha colecao</strong><small>Veja suas cartas e atributos</small></span></Link><Link href="/gacha"><Gem /><span><strong>Invocacoes</strong><small>Obtenha novas cartas</small></span></Link><Link href="/partida"><Swords /><span><strong>Arena</strong><small>Enfrente o bot</small></span></Link></article>
        </section>
      </section>
    </main>
  );
}
