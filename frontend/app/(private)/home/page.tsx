"use client";

import { ChevronRight, Layers, Sparkles, Swords, Trophy } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartaMontada } from "../../components/cartaMontada";
import { getToken } from "../../lib/auth";
import { listarDecks, type Deck } from "../../lib/jogo";
import { buscarPerfilApi, type PerfilConta } from "../../lib/perfil";
import styles from "../../styles/home.module.css";

export default function HomePage() {
  const [perfil, setPerfil] = useState<PerfilConta | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [erro, setErro] = useState("");

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    Promise.all([buscarPerfilApi(token), listarDecks()])
      .then(([dados, decksDados]) => {
        setPerfil(dados);
        setDecks(decksDados);
      })
      .catch((e) =>
        setErro(
          e instanceof Error
            ? e.message
            : "Não foi possível carregar seu salão.",
        ),
      );
  }, []);

  const deckAtivo = decks.find((deck) => deck.ativo);
  const cartasDeck = deckAtivo?.cartas.slice(0, 6) ?? [];

  return (
    <main className={styles.page}>
      <div className={styles.aurora} aria-hidden="true" />
      <section className={styles.container}>
        <header className={styles.saudacao}>
          <div>
            <span>Salão do invocador</span>
            <h1>Pronto para lutar, {perfil?.user ?? "aventureiro"}?</h1>
          </div>
          <div className={styles.recursos} aria-label="Progresso do jogador">
            <span>
              <Trophy />
              <strong>
                {perfil?.ranking?.toLocaleString("pt-BR") ?? "—"}
              </strong>{" "}
              ranking
            </span>
          </div>
        </header>

        {erro ? <p className={styles.error}>{erro}</p> : null}

        <section className={styles.palco}>
          <div className={styles.chamadaArena}>
            <span className={styles.capitulo}>Próximo confronto</span>
            <h2>Seu deck está esperando uma batalha.</h2>
            <p>
              Entre na arena, enfrente o adversário e conquiste rubys para novas
              invocações.
            </p>
            <Link href="/partida" className={styles.btnJogar}>
              <Swords /> Entrar na arena <ChevronRight />
            </Link>
            <small>O jogador sempre inicia o primeiro turno</small>
          </div>

          <div className={styles.deckDestaque}>
            <div className={styles.deckTitulo}>
              <span>
                <Layers /> Deck equipado
              </span>
              <strong>{deckAtivo?.nome ?? "Nenhum deck equipado"}</strong>
              <small>
                {deckAtivo
                  ? `${cartasDeck.length}/6 cartas`
                  : "Prepare seu primeiro deck"}
              </small>
            </div>

            <div className={styles.lequeCartas}>
              {cartasDeck.length ? (
                cartasDeck.map((carta) => (
                  <div className={styles.cartaDeck} key={carta.id}>
                    <CartaMontada
                      arte={carta.foto ?? undefined}
                      moldura={carta.moldura ?? undefined}
                      nome={carta.nome}
                      raridade={carta.raridade}
                      elemento={carta.elemento}
                      config={carta.configVisual ?? undefined}
                      placeholder={<Sparkles />}
                    />
                  </div>
                ))
              ) : (
                <div className={styles.deckVazio}>
                  <Layers />
                  <span>Seu palco ainda está vazio</span>
                </div>
              )}
            </div>

            <Link href="/decks" className={styles.editarDeck}>
              {deckAtivo ? "Ajustar formação" : "Montar deck"} <ChevronRight />
            </Link>
          </div>
        </section>

        <nav className={styles.caminhos} aria-label="Atalhos do jogo">
          <Link href="/cartas">
            <span className={styles.iconeCaminho}>
              <Layers />
            </span>
            <span>
              <small>Arquivo de cartas</small>
              <strong>Minha coleção</strong>
              <em>
                {perfil
                  ? `${perfil.cartasObtidas}/${perfil.totalCartas} descobertas`
                  : "Carregando coleção"}
              </em>
            </span>
            <ChevronRight />
          </Link>
          <Link href="/gacha">
            <span className={styles.iconeCaminho}>
              <Sparkles />
            </span>
            <span>
              <small>Portal de invocação</small>
              <strong>Buscar novas cartas</strong>
              <em>Use rubys e amplie suas estratégias</em>
            </span>
            <ChevronRight />
          </Link>
        </nav>
      </section>
    </main>
  );
}
