"use client";

import { Boxes, Layers, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "../../lib/auth";
import { listarDecks, type Deck } from "../../lib/jogo";
import { buscarPerfilApi, type PerfilConta } from "../../lib/perfil";
import styles from "../../styles/dashboard.module.css";
import { IconeRuby } from "../../components/iconeRuby";

export default function DashboardPage() {
  const [perfil, setPerfil] = useState<PerfilConta | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [erro, setErro] = useState("");
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    Promise.all([buscarPerfilApi(token), listarDecks()])
      .then(([dados, decksDados]) => { setPerfil(dados); setDecks(decksDados); })
      .catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível carregar o resumo."));
  }, []);
  const deckAtivo = decks.find((deck) => deck.ativo);
  return (
    <main className={styles.page}>
      <section className={styles.container}>
        <header className={styles.hero}>
          <div><span>Início do jogador</span><h1>Bem-vindo, {perfil?.user ?? "aventureiro"}.</h1><p>Seu ponto de partida para organizar a coleção e entrar na arena.</p></div>
          <Link href="/partida"><Swords /> Jogar agora</Link>
        </header>
        {erro ? <p className={styles.error}>{erro}</p> : null}
        <section className={styles.metrics}>
          <article><IconeRuby tamanho={22} /><span>Rubys</span><strong>{perfil?.rubys?.toLocaleString("pt-BR") ?? "—"}</strong></article>
          <article><Layers /><span>Coleção</span><strong>{perfil ? `${perfil.cartasObtidas}/${perfil.totalCartas}` : "—"}</strong></article>
          <article><Trophy /><span>Ranking</span><strong>{perfil?.ranking?.toLocaleString("pt-BR") ?? "—"}</strong></article>
        </section>
        <section className={styles.grid}>
          <article className={styles.deckCard}><div><Boxes /><span><small>Deck equipado</small><strong>{deckAtivo?.nome ?? "Nenhum deck equipado"}</strong><p>{deckAtivo ? `${deckAtivo.cartas.length}/6 cartas prontas` : "Monte um deck para liberar as batalhas."}</p></span></div><Link href="/decks">{deckAtivo ? "Gerenciar deck" : "Criar deck"}</Link></article>
          <article className={styles.actions}><h2>Acessos rápidos</h2><Link href="/cartas"><Layers /><span><strong>Minha coleção</strong><small>Veja suas cartas e atributos</small></span></Link><Link href="/gacha"><IconeRuby tamanho={22} /><span><strong>Invocações</strong><small>Obtenha novas cartas</small></span></Link><Link href="/partida"><Swords /><span><strong>Arena</strong><small>Enfrente o bot</small></span></Link></article>
        </section>
      </section>
    </main>
  );
}
