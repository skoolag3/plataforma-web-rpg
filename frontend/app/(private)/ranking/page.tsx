"use client";

import {
  Crown,
  Layers3,
  Medal,
  RefreshCw,
  Trophy,
  User,
  Users,
} from "lucide-react";
import Image from "next/image";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { getStoredUser, subscribeAuthChange } from "../../lib/auth";
import { buscarRanking, type JogadorRanking } from "../../lib/jogo";
import styles from "../../styles/ranking.module.css";

export default function RankingPage() {
  const [jogadores, setJogadores] = useState<JogadorRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criterio, setCriterio] = useState<"pontos" | "colecao">("pontos");
  const usuario = useSyncExternalStore(
    subscribeAuthChange,
    getStoredUser,
    () => null,
  );

  const carregarRanking = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const resposta = await buscarRanking();
      setJogadores(resposta.jogadores);
    } catch (erroApi) {
      setErro(
        erroApi instanceof Error
          ? erroApi.message
          : "Não foi possível carregar o ranking.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarRanking();
  }, [carregarRanking]);

  const jogadoresOrdenados = useMemo(
    () =>
      [...jogadores]
        .sort((a, b) =>
          criterio === "pontos"
            ? b.pontos - a.pontos ||
              b.partidas - a.partidas ||
              b.cartasColecionadas - a.cartasColecionadas
            : b.cartasColecionadas - a.cartasColecionadas ||
              b.pontos - a.pontos ||
              b.partidas - a.partidas,
        )
        .map((jogador, indice) => ({ ...jogador, posicao: indice + 1 })),
    [criterio, jogadores],
  );
  const podio = jogadoresOrdenados.slice(0, 3);
  const classificacao = jogadoresOrdenados.slice(3);
  const totalPartidas = jogadores.reduce(
    (total, jogador) => total + jogador.partidas,
    0,
  );
  const totalCartas = jogadores.reduce(
    (total, jogador) => total + jogador.cartasColecionadas,
    0,
  );

  return (
    <main className={styles.pagina}>
      <section className={styles.container}>
        <header className={styles.topo}>
          <div>
            <span className={styles.sobretitulo}>
              <Trophy /> Classificação da arena
            </span>
            <h1>Ranking</h1>
            <p>Os invocadores com maior pontuação nas batalhas.</p>
          </div>
          <div className={styles.resumo} aria-label="Resumo do ranking">
            <span>
              <Users />
              <small>Jogadores</small>
              <strong>{jogadores.length}</strong>
            </span>
            <span>
              <Medal />
              <small>Partidas</small>
              <strong>{totalPartidas.toLocaleString("pt-BR")}</strong>
            </span>
            <span>
              <Layers3 />
              <small>Cartas</small>
              <strong>{totalCartas.toLocaleString("pt-BR")}</strong>
            </span>
          </div>
        </header>

        {carregando ? (
          <CarregandoRanking />
        ) : erro ? (
          <section className={styles.estado} role="alert">
            <Trophy />
            <strong>Não foi possível abrir a classificação</strong>
            <p>{erro}</p>
            <button type="button" onClick={() => void carregarRanking()}>
              <RefreshCw /> Tentar novamente
            </button>
          </section>
        ) : jogadores.length === 0 ? (
          <section className={styles.estado}>
            <Trophy />
            <strong>A arena ainda está vazia</strong>
            <p>O ranking será preenchido após as primeiras partidas.</p>
          </section>
        ) : (
          <>
            <nav className={styles.criterios} aria-label="Ordenar ranking por">
              <button
                type="button"
                data-ativo={criterio === "pontos" || undefined}
                onClick={() => setCriterio("pontos")}
              >
                <Trophy /> Pontos
              </button>
              <button
                type="button"
                data-ativo={criterio === "colecao" || undefined}
                onClick={() => setCriterio("colecao")}
              >
                <Layers3 /> Cartas colecionadas
              </button>
            </nav>
            <section className={styles.podio} aria-label="Pódio do ranking">
              {podio.map((jogador) => (
                <article
                  className={styles.cardPodio}
                  data-posicao={jogador.posicao}
                  data-atual={jogador.id === usuario?.id || undefined}
                  key={jogador.id}
                >
                  <span className={styles.numeroPodio}>
                    {jogador.posicao === 1 ? <Crown /> : <Medal />}
                    {jogador.posicao}º
                  </span>
                  <AvatarRanking jogador={jogador} destaque />
                  <strong className={styles.nomePodio}>{jogador.nome}</strong>
                  <small>
                    Nível {jogador.nivel} · {jogador.partidas} partidas
                  </small>
                  <b>
                    {criterio === "pontos"
                      ? `${jogador.pontos.toLocaleString("pt-BR")} pts`
                      : `${jogador.cartasColecionadas.toLocaleString("pt-BR")} cartas`}
                  </b>
                  <span className={styles.metricaSecundaria}>
                    {criterio === "pontos"
                      ? `${jogador.cartasColecionadas.toLocaleString("pt-BR")} cartas únicas`
                      : `${jogador.pontos.toLocaleString("pt-BR")} pts`}
                  </span>
                  {jogador.id === usuario?.id ? <em>Você</em> : null}
                </article>
              ))}
            </section>

            {classificacao.length > 0 ? (
              <section
                className={styles.classificacao}
                aria-label="Classificação geral"
              >
                <header>
                  <span>Posição</span>
                  <span>Jogador</span>
                  <span>Partidas</span>
                  <span>Cartas</span>
                  <span>Pontos</span>
                </header>
                {classificacao.map((jogador) => (
                  <article
                    className={styles.linha}
                    data-atual={jogador.id === usuario?.id || undefined}
                    key={jogador.id}
                  >
                    <strong className={styles.posicao}>
                      #{jogador.posicao}
                    </strong>
                    <div className={styles.jogador}>
                      <AvatarRanking jogador={jogador} />
                      <span>
                        <b>{jogador.nome}</b>
                        <small>Nível {jogador.nivel}</small>
                      </span>
                    </div>
                    <span className={styles.partidas}>
                      {jogador.partidas} partidas
                    </span>
                    <strong className={styles.cartas}>
                      {jogador.cartasColecionadas.toLocaleString("pt-BR")}
                    </strong>
                    <strong className={styles.pontos}>
                      {jogador.pontos.toLocaleString("pt-BR")} pts
                    </strong>
                  </article>
                ))}
              </section>
            ) : null}
          </>
        )}
      </section>
    </main>
  );
}

function AvatarRanking({
  jogador,
  destaque = false,
}: {
  jogador: JogadorRanking;
  destaque?: boolean;
}) {
  const tamanho = destaque ? 72 : 40;
  return (
    <span className={styles.avatar} data-destaque={destaque || undefined}>
      {jogador.avatarUrl ? (
        <Image
          src={jogador.avatarUrl}
          alt={`Avatar de ${jogador.nome}`}
          width={tamanho}
          height={tamanho}
          unoptimized
        />
      ) : (
        <User aria-hidden="true" />
      )}
    </span>
  );
}

function CarregandoRanking() {
  return (
    <section className={styles.carregando} aria-label="Carregando ranking">
      <div className={styles.esqueletoPodio}>
        {[1, 2, 3].map((item) => (
          <span key={item} />
        ))}
      </div>
      <div className={styles.esqueletoLista}>
        {[1, 2, 3, 4].map((item) => (
          <span key={item} />
        ))}
      </div>
    </section>
  );
}
