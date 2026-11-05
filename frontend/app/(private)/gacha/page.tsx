"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import {
  BookOpen,
  Flame,
  Leaf,
  Moon,
  Sparkles,
  ShoppingBag,
  Swords,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { CartaMontada } from "../../components/cartaMontada";
import { IconeRuby } from "../../components/iconeRuby";
import { notificarErro } from "../../components/notificacoesGlobais";
import { DetalheCarta } from "../cartas/components/detalheCarta";
import { mapearCarta as mapearCartaColecao } from "../cartas/cardData";
import type { Card } from "../cartas/types";
import {
  buscarColecao,
  buscarGacha,
  girarGacha,
  type BannerGacha,
  type CartaGachaApi,
} from "../../lib/jogo";
import { PityProgress } from "./components/pityProgress";
import { RarityBadge } from "./components/rarityBadge";
import { RewardCard } from "./components/rewardCard";
import { SummonButton } from "./components/summonButton";
import { FundoDitherBanner } from "./components/fundoDitherBanner";
import type { CartaGachaVisual, EstadoGacha } from "./types";
import styles from "../../styles/gacha/gacha.module.css";
import indiceStyles from "../../styles/gacha/indiceBanner.module.css";
import detalheStyles from "../../styles/inventario/details.module.css";
import { obterRaridadeJogo, useRaridadesJogo } from "../../components/raridadesJogo";

function mapearCarta(carta: CartaGachaApi): CartaGachaVisual {
  const icon =
    carta.elemento === "natureza"
      ? Leaf
      : carta.elemento === "agua"
        ? Waves
        : carta.elemento === "fogo"
          ? Flame
          : carta.elemento === "sombra"
            ? Moon
            : Zap;
  return { ...carta, icon };
}

function CartaReal({ carta }: { carta: CartaGachaVisual }) {
  const Icone = carta.icon;
  return (
    <CartaMontada
      arte={carta.foto ?? undefined}
      moldura={carta.moldura ?? undefined}
      nome={carta.nome}
      raridade={carta.raridade}
      elemento={carta.elemento}
      config={carta.configVisual ?? undefined}
      placeholder={<Icone aria-hidden="true" />}
    />
  );
}

export default function GachaPage() {
  const raridades = useRaridadesJogo();
  const [banners, setBanners] = useState<BannerGacha[]>([]);
  const [idBanner, setIdBanner] = useState("");
  const [rubys, setRubys] = useState(0);
  const [pities, setPities] = useState<BannerGacha["pities"]>([]);
  const [estado, setEstado] = useState<EstadoGacha>("selecao");
  const [invocando, setInvocando] = useState(false);
  const [resultado, setResultado] = useState<CartaGachaVisual[]>([]);
  const [cartaDetalhada, setCartaDetalhada] = useState<CartaGachaVisual | null>(
    null,
  );
  const [origemDetalhe, setOrigemDetalhe] = useState<"resultado" | "banner">("resultado");
  const [detalheColecao, setDetalheColecao] = useState<Card | null>(null);
  const [erroDetalhe, setErroDetalhe] = useState("");
  const [probabilidades, setProbabilidades] = useState<
    { raridade: CartaGachaApi["raridade"]; percentual: number }[]
  >([]);
  const [proximaRotacaoEm, setProximaRotacaoEm] = useState<string | null>(null);
  const [indiceAberto, setIndiceAberto] = useState(false);
  const btnIndice = useRef<HTMLButtonElement>(null);
  const detalheAbertoRef = useRef(false);
  const carregandoBanners = useRef(false);
  const invocacaoEmAndamento = useRef(false);

  const bannerAtivo =
    banners.find((banner) => banner.id === idBanner) ?? banners[0];
  const custo1 = bannerAtivo?.custoGiro ?? 300;
  const custo10 = bannerAtivo?.custoDez ?? 2700;
  const cartasPodio = useMemo(() => {
    const cartas = bannerAtivo?.cartas ?? [];
    const principal = cartas.find((carta) => carta.raridade === "UR") ?? cartas[0];
    if (!principal) return [];
    const laterais = cartas.filter((carta) => carta.id !== principal.id);
    const outrasRaridades = laterais.filter((carta) => carta.raridade !== principal.raridade);
    const raridadesLaterais = outrasRaridades.filter((carta, indice) => outrasRaridades.findIndex((item) => item.raridade === carta.raridade) === indice);
    const selecionadas = [...raridadesLaterais, ...laterais.filter((carta) => !raridadesLaterais.includes(carta))].slice(0, 2);
    return [selecionadas[0], principal, selecionadas[1]].filter((carta): carta is CartaGachaApi => Boolean(carta));
  }, [bannerAtivo]);
  const destaque = useMemo(
    () =>
      [...resultado].sort(
        (a, b) => (obterRaridadeJogo(raridades, b.raridade)?.ordem ?? 0) - (obterRaridadeJogo(raridades, a.raridade)?.ordem ?? 0),
      )[0],
    [resultado, raridades],
  );
  const restantes = useMemo(
    () => (destaque ? resultado.filter((carta) => carta !== destaque) : []),
    [destaque, resultado],
  );
  const resumo = useMemo(
    () =>
      resultado.reduce(
        (acc, carta) => ({ ...acc, [carta.raridade]: (acc[carta.raridade] ?? 0) + 1 }),
        {} as Record<string, number>,
      ),
    [resultado],
  );
  const copias = resultado.filter((carta) => !carta.nova).length;
  const rubysDuplicatas = resultado.reduce(
    (total, carta) => total + (carta.valorVenda ?? 0),
    0,
  );

  const carregarBanners = useCallback(async (avisarErro = false) => {
    if (carregandoBanners.current) return;
    carregandoBanners.current = true;
    try {
      const dados = await buscarGacha();
      const primeiro = dados.banners[0];
      setBanners(dados.banners);
      setIdBanner(primeiro?.id ?? "");
      setRubys(dados.jogador.rubys);
      setPities(primeiro?.pities ?? []);
      setProbabilidades(dados.probabilidades);
      setProximaRotacaoEm(dados.rotacao?.proximaRotacaoEm ?? null);
    } catch (erro) {
      if (avisarErro) notificarErro(erro instanceof Error ? erro.message : "Erro ao carregar banners.");
    } finally {
      carregandoBanners.current = false;
    }
  }, []);

  useEffect(() => {
    void carregarBanners(true);
    const intervalo = window.setInterval(() => {
      if (!document.hidden) void carregarBanners();
    }, 15000);
    const aoVoltar = () => {
      if (!document.hidden) void carregarBanners();
    };
    document.addEventListener("visibilitychange", aoVoltar);
    window.addEventListener("focus", aoVoltar);
    return () => {
      window.clearInterval(intervalo);
      document.removeEventListener("visibilitychange", aoVoltar);
      window.removeEventListener("focus", aoVoltar);
    };
  }, [carregarBanners]);

  useEffect(() => {
    if (!cartaDetalhada) return;
    let ativo = true;
    buscarColecao("todas")
      .then((dados) => {
        if (!ativo) return;
        const carta = dados.itens.find((item) => item.id === cartaDetalhada.id);
        if (carta) setDetalheColecao(mapearCartaColecao(carta));
        else setErroDetalhe("Não foi possível encontrar esta carta na coleção.");
      })
      .catch(() => { if (ativo) setErroDetalhe("Não foi possível carregar os detalhes da carta."); });
    return () => { ativo = false; };
  }, [cartaDetalhada]);

  useEffect(() => { detalheAbertoRef.current = Boolean(cartaDetalhada); }, [cartaDetalhada]);

  function abrirDetalhes(carta: CartaGachaVisual, origem: "resultado" | "banner" = "resultado") {
    setDetalheColecao(null);
    setErroDetalhe("");
    setOrigemDetalhe(origem);
    setCartaDetalhada(carta);
  }

  useEffect(() => {
    if (!cartaDetalhada) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape") setCartaDetalhada(null);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoTeclar);
    };
  }, [cartaDetalhada]);

  useEffect(() => {
    if (!proximaRotacaoEm) return;
    const espera = Math.max(0, new Date(proximaRotacaoEm).getTime() - Date.now()) + 100;
    let timer: number;
    const atualizarNaVirada = () => {
      if (carregandoBanners.current) {
        timer = window.setTimeout(atualizarNaVirada, 250);
        return;
      }
      void carregarBanners();
    };
    timer = window.setTimeout(atualizarNaVirada, espera);
    return () => window.clearTimeout(timer);
  }, [proximaRotacaoEm, carregarBanners]);

  useEffect(() => {
    const atualizarRubys = (evento: Event) => {
      const { rubysRecebidos } = (evento as CustomEvent<{ rubysRecebidos: number }>).detail;
      setRubys((valor) => valor + rubysRecebidos);
    };
    window.addEventListener("rubys-reivindicados", atualizarRubys);
    return () => window.removeEventListener("rubys-reivindicados", atualizarRubys);
  }, []);

  useEffect(() => {
    if (!indiceAberto) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const aoTeclar = (evento: KeyboardEvent) => {
      if (evento.key === "Escape" && !detalheAbertoRef.current) setIndiceAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", aoTeclar);
      btnIndice.current?.focus();
    };
  }, [indiceAberto]);

  async function invocar(quantidade: 1 | 10) {
    if (!bannerAtivo || invocacaoEmAndamento.current) return;
    invocacaoEmAndamento.current = true;
    setInvocando(true);
    setResultado([]);
    try {
      const resposta = await girarGacha(bannerAtivo.id, quantidade);
      const cartas = resposta.cartas.map(mapearCarta);
      setResultado(cartas);
      setPities(resposta.pities);
      setRubys(resposta.rubys);
      setEstado(quantidade === 10 ? "resultado" : "revelacao");
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch (erro) {
      setEstado("selecao");
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao realizar invocação.",
      );
    } finally {
      invocacaoEmAndamento.current = false;
      setInvocando(false);
    }
  }


  function voltarSelecao() {
    setResultado([]);
    setEstado("selecao");
  }

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <div>
          <h1>Banners</h1>
          <p>Escolha um banner. Veja a garantia. Invoque.</p>
        </div>
      </header>

      {estado === "selecao" && (
        <section className={styles.selecao} aria-label="Seleção de banner" data-guia="banner">
          {banners.length > 1 && (
            <nav className={styles.abas} aria-label="Banners disponíveis">
              {banners.map((banner) => (
                <button
                  type="button"
                  key={banner.id}
                  aria-current={banner.id === idBanner ? "true" : undefined}
                  onClick={() => {
                    setIdBanner(banner.id);
                    setPities(banner.pities);
                  }}
                >
                  {banner.nome}
                </button>
              ))}
            </nav>
          )}
          <article className={styles.banner}>
            <FundoDitherBanner />
            <div className={styles.bannerConteudo}>
              <h2>{bannerAtivo?.nome.toUpperCase() ?? "ECLIPSE ROXO"}</h2>
              <span className={styles.selo}>
                Banner em destaque{" "}
                {proximaRotacaoEm
                  ? `· próxima mudança ${new Date(proximaRotacaoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}`
                  : ""}
              </span>
              <p>
                {cartasPodio.length
                  ? `${bannerAtivo?.cartas.length ?? 0} cartas disponíveis. Confira as chances e garantias deste banner.`
                  : "Nenhuma carta disponível neste banner."}
              </p>
              {pities.map((regra) => <PityProgress key={regra.raridade} raridade={regra.raridade} atual={regra.atual} limite={regra.limite} />)}
              <div className={styles.linksBanner}>
                <button
                  type="button"
                  ref={btnIndice}
                  className={indiceStyles.botaoIndice}
                  aria-haspopup="dialog"
                  onClick={() => setIndiceAberto(true)}
                >
                  <BookOpen aria-hidden="true" /> Índice de cartas
                </button>
              </div>
            </div>
            <div className={styles.bannerArte}>
              {cartasPodio.length ? (
                <div className={styles.podioCartas}>
                  {cartasPodio.map((carta, indice) => (
                    <div key={carta.id} className={indice === Math.floor(cartasPodio.length / 2) ? styles.cartaCentral : styles.cartaLateral}>
                      <button type="button" className={styles.botaoCartaBanner} aria-label={`Ver detalhes de ${carta.nome}`} onClick={() => abrirDetalhes(mapearCarta(carta), "banner")}>
                        <CartaReal carta={mapearCarta(carta)} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <Sparkles aria-hidden="true" />
              )}
            </div>
          </article>
          <div className={styles.acoesInvocacao}>
            <SummonButton
              quantidade={1}
              custo={custo1}
              carregando={invocando}
              desabilitado={!bannerAtivo || rubys < custo1 || invocando}
              onClick={() => void invocar(1)}
            />
            <SummonButton
              quantidade={10}
              custo={custo10}
              principal
              carregando={invocando}
              desabilitado={!bannerAtivo || rubys < custo10 || invocando}
              onClick={() => void invocar(10)}
            />
          </div>
          <nav className={styles.atalhosRubys} aria-label="Como conseguir Rubys">
            <Link href="/expedicao">
              <Swords aria-hidden="true" />
              <span><small>Ganhe Rubys jogando</small><strong>Ir à Expedição</strong></span>
            </Link>
            <Link href="/loja">
              <ShoppingBag aria-hidden="true" />
              <span><small>Mais Rubys para invocar</small><strong>Abrir Loja</strong></span>
            </Link>
          </nav>
        </section>
      )}

      {estado === "revelacao" && destaque && (
        <section className={styles.resultadoMultiplo} data-unitario aria-live="polite">
          <div className={styles.resumoResultado} aria-label="Resumo da invocação">
            {Object.entries(resumo).map(([codigo, total]) => <span key={codigo}><RarityBadge raridade={codigo} /> {total}</span>)}
            <span>{copias} {copias === 1 ? "cópia vendida" : "cópias vendidas"}</span>
            {rubysDuplicatas > 0 && <strong>+{rubysDuplicatas.toLocaleString("pt-BR")} Rubys</strong>}
          </div>
          <div className={styles.resultadoCorpo} data-unitario>
            <article className={styles.destaqueResultado} style={{ "--cor-raridade": obterRaridadeJogo(raridades, destaque.raridade)?.cor ?? "#94a3b8" } as CSSProperties}>
              <span>★ Destaque da invocação</span>
              <RewardCard
                carta={destaque}
                destaque
                onDetalhes={() => abrirDetalhes(destaque)}
              />
            </article>
          </div>
          <footer className={styles.rodapeResultado}>
            <button
              type="button"
              className={styles.primario}
              disabled={rubys < custo1 || invocando}
              onClick={() => void invocar(1)}
            >
              Invocar novamente · <IconeRuby />{" "}
              {custo1.toLocaleString("pt-BR")}
            </button>
            <button type="button" onClick={voltarSelecao}>
              Continuar
            </button>
          </footer>
        </section>
      )}

      {estado === "resultado" && destaque && (
        <section className={styles.resultadoMultiplo}>
          <div className={styles.resumoResultado} aria-label="Resumo da invocação">
            {Object.entries(resumo).map(([codigo, total]) => <span key={codigo}><RarityBadge raridade={codigo} /> {total}</span>)}
            <span>{copias} {copias === 1 ? "cópia vendida" : "cópias vendidas"}</span>
            <strong>+{rubysDuplicatas.toLocaleString("pt-BR")} Rubys</strong>
          </div>
          <div className={styles.resultadoCorpo}>
            <article className={styles.destaqueResultado} style={{ "--cor-raridade": obterRaridadeJogo(raridades, destaque.raridade)?.cor ?? "#94a3b8" } as CSSProperties}>
              <span>★ Destaque da invocação</span>
              <RewardCard
                carta={destaque}
                destaque
                onDetalhes={() => abrirDetalhes(destaque)}
              />
            </article>
            <div className={styles.recompensasGrade}>
              <h3>Outras recompensas</h3>
              <p>Clique em uma carta para abrir os detalhes.</p>
              <div>
                {restantes.map((carta, index) => (
                  <RewardCard
                    key={`${carta.id}-${index}`}
                    carta={carta}
                    onDetalhes={() => abrirDetalhes(carta)}
                  />
                ))}
              </div>
            </div>
          </div>
          <footer className={styles.rodapeResultado}>
            <button
              type="button"
              className={styles.primario}
              disabled={rubys < custo10}
              onClick={() => void invocar(10)}
            >
              Invocar novamente · <IconeRuby />{" "}
              {custo10.toLocaleString("pt-BR")}
            </button>
            <button type="button" onClick={voltarSelecao}>
              Continuar
            </button>
          </footer>
        </section>
      )}

      {indiceAberto && bannerAtivo && (
        <div className={styles.modalFundo} role="presentation" onMouseDown={(evento) => {
          if (evento.target === evento.currentTarget) setIndiceAberto(false);
        }}>
          <section className={indiceStyles.modalIndice} role="dialog" aria-modal="true" aria-hidden={Boolean(cartaDetalhada)} aria-labelledby="titulo-indice-banner">
            <header className={indiceStyles.topoIndice}>
              <div>
                <small>Índice do banner</small>
                <h2 id="titulo-indice-banner">{bannerAtivo.nome}</h2>
                <p>Chances por raridade e cartas que podem aparecer.</p>
              </div>
              <button type="button" aria-label="Fechar índice de cartas" onClick={() => setIndiceAberto(false)} autoFocus><X aria-hidden="true" /></button>
            </header>
            <div className={indiceStyles.conteudoIndice}>
              {probabilidades.map((item) => {
                const cartasRaridade = bannerAtivo.cartas.filter((carta) => carta.raridade === item.raridade);
                const raridade = obterRaridadeJogo(raridades, item.raridade);
                return <section className={indiceStyles.grupoRaridade} key={item.raridade} style={{ "--cor-raridade": raridade?.cor ?? "#94a3b8" } as CSSProperties}>
                  <header>
                    <h3>{raridade?.nome ?? item.raridade}</h3>
                    <strong>{item.percentual}%</strong>
                  </header>
                  <div className={indiceStyles.gradeCartas}>
                    {cartasRaridade.map((carta) => <div className={indiceStyles.cartaIndice} key={carta.id}>
                      <button type="button" className={indiceStyles.botaoCartaIndice} aria-label={`Ver detalhes de ${carta.nome}`} onClick={() => abrirDetalhes(mapearCarta(carta), "banner")}>
                        <CartaReal carta={mapearCarta(carta)} />
                      </button>
                    </div>)}
                  </div>
                </section>;
              })}
            </div>
          </section>
        </div>
      )}

      {cartaDetalhada && (
        <div
          className={detalheStyles.modalDetalhe}
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes da carta ${cartaDetalhada.nome}`}
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setCartaDetalhada(null);
          }}
        >
          {detalheColecao ? <DetalheCarta
            carta={detalheColecao}
            favorita={false}
            aoAlternarFavorita={() => undefined}
            aoAdicionarAoDeck={() => undefined}
            aoFechar={() => setCartaDetalhada(null)}
            modoResultado
            modoPrevia={origemDetalhe === "banner"}
            valorVendaResultado={cartaDetalhada.valorVenda}
          /> : <div className={styles.detalhePendente} role="status">
            <p>{erroDetalhe || "Carregando detalhes da carta..."}</p>
            <button type="button" onClick={() => setCartaDetalhada(null)} autoFocus>Fechar</button>
          </div>}
        </div>
      )}
    </main>
  );
}
