"use client";

import {
  Crown,
  Layers3,
  Medal,
  RefreshCw,
  Trophy,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
} from "react";
import { getStoredUser, subscribeAuthChange } from "../../lib/auth";
import { criarEstiloMolduraPerfil } from "../../components/cartaMontada";
import { buscarRanking, type JogadorRanking } from "../../lib/jogo";
import styles from "../../styles/ranking.module.css";
import perfilStyles from "../../styles/perfil/cardUsuario.module.css";

const jogadoresPorPagina = 10;

export default function RankingPage() {
  const [jogadores, setJogadores] = useState<JogadorRanking[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [criterio, setCriterio] = useState<"pontos" | "colecao">("pontos");
  const [paginaAtual, setPaginaAtual] = useState(1);
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
      jogadores
        .filter((jogador) =>
          criterio === "pontos"
            ? jogador.pontos > 0 || jogador.partidas > 0
            : jogador.cartasColecionadas > 0,
        )
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
  const totalPaginas = Math.ceil(classificacao.length / jogadoresPorPagina);
  const jogadoresPagina = classificacao.slice(
    (paginaAtual - 1) * jogadoresPorPagina,
    paginaAtual * jogadoresPorPagina,
  );
  const minhaPosicao = jogadoresOrdenados.find(
    (jogador) => jogador.id === usuario?.id,
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
        </header>

        <div className={styles.guiaRanking}>
          {criterio === "pontos" ? (
            <>
              <Trophy aria-hidden="true" />
              <span><strong>Quer ganhar pontos?</strong><small>Vença batalhas na Expedição.</small></span>
              <Link href="/expedicao">Jogar</Link>
            </>
          ) : (
            <>
              <Layers3 aria-hidden="true" />
              <span><strong>Quer colecionar mais cartas?</strong><small>Invoque nos Banners.</small></span>
              <Link href="/banners">Invocar</Link>
            </>
          )}
        </div>

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
                onClick={() => {
                  setCriterio("pontos");
                  setPaginaAtual(1);
                }}
              >
                <Trophy /> Pontos
              </button>
              <button
                type="button"
                data-ativo={criterio === "colecao" || undefined}
                onClick={() => {
                  setCriterio("colecao");
                  setPaginaAtual(1);
                }}
              >
                <Layers3 /> Cartas colecionadas
              </button>
            </nav>
            {minhaPosicao ? (
              <div className={styles.minhaPosicao}>
                <span>Sua posição <strong>#{minhaPosicao.posicao}</strong></span>
                <span>
                  {criterio === "pontos"
                    ? `${minhaPosicao.pontos.toLocaleString("pt-BR")} pts`
                    : `${minhaPosicao.cartasColecionadas.toLocaleString("pt-BR")} cartas únicas`}
                </span>
              </div>
            ) : null}
            {jogadoresOrdenados.length === 0 ? (
              <section className={styles.estado}>
                {criterio === "pontos" ? <Trophy /> : <Layers3 />}
                <strong>
                  {criterio === "pontos"
                    ? "Nenhum invocador pontuou ainda"
                    : "Nenhuma carta colecionada ainda"}
                </strong>
                <p>
                  {criterio === "pontos"
                    ? "Vença batalhas na Expedição para aparecer no ranking de pontos."
                    : "Invoque cartas nos Banners para aparecer no ranking de coleção."}
                </p>
              </section>
            ) : (
            <section className={styles.podio} aria-label="Pódio do ranking">
              {podio.map((jogador) => (
                <Link
                  className={styles.cardPodio}
                  href={`/perfil/${jogador.id}`}
                  aria-label={`Ver perfil de ${jogador.nome}`}
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
                  <small>{jogador.partidas} partidas</small>
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
                </Link>
              ))}
            </section>
            )}

            {classificacao.length > 0 ? (
              <section
                className={styles.classificacao}
                aria-label="Classificação geral"
                data-criterio={criterio}
              >
                <header>
                  <span>Posição</span>
                  <span>Jogador</span>
                  <span>Partidas</span>
                  <span data-ativo={criterio === "colecao" || undefined}>Cartas</span>
                  <span data-ativo={criterio === "pontos" || undefined}>Pontos</span>
                </header>
                {jogadoresPagina.map((jogador) => (
                  <Link
                    className={styles.linha}
                    href={`/perfil/${jogador.id}`}
                    aria-label={`Ver perfil de ${jogador.nome}`}
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
                        <small>
                          <span className={styles.subtituloMobile}>{jogador.partidas} partidas · </span>
                          Ver perfil
                        </small>
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
                  </Link>
                ))}
                {totalPaginas > 1 ? (
                  <nav className={styles.paginacao} aria-label="Páginas do ranking">
                    <button
                      type="button"
                      disabled={paginaAtual === 1}
                      onClick={() => setPaginaAtual((pagina) => pagina - 1)}
                    >
                      Anterior
                    </button>
                    <span>Página {paginaAtual} de {totalPaginas}</span>
                    <button
                      type="button"
                      disabled={paginaAtual === totalPaginas}
                      onClick={() => setPaginaAtual((pagina) => pagina + 1)}
                    >
                      Próxima
                    </button>
                  </nav>
                ) : null}
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
    <span className={`${styles.avatar} ${perfilStyles[jogador.molduraClasse] ?? ""}`} data-destaque={destaque || undefined}>
        <Image
          src={jogador.avatarUrl ?? "/avatar-padrao.svg"}
          alt={`Avatar de ${jogador.nome}`}
          width={tamanho}
          height={tamanho}
          unoptimized
        />
        {jogador.molduraUrl ? (
          <span
            className={styles.molduraAvatar}
            style={{
              ...criarEstiloMolduraPerfil(jogador.molduraConfig),
              backgroundImage: `url("${jogador.molduraUrl}")`,
            }}
            aria-hidden="true"
          />
        ) : null}
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
