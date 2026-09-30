"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Flame,
  Leaf,
  Moon,
  Sparkles,
  Waves,
  X,
  Zap,
} from "lucide-react";
import { CartaMontada } from "../../components/cartaMontada";
import { IconeRuby } from "../../components/iconeRuby";
import { notificarErro } from "../../components/notificacoesGlobais";
import {
  buscarGacha,
  girarGacha,
  type BannerGacha,
  type CartaGachaApi,
} from "../../lib/jogo";
import { PityProgress } from "./components/pityProgress";
import { RarityBadge } from "./components/rarityBadge";
import { RewardCard } from "./components/rewardCard";
import { SummonButton } from "./components/summonButton";
import type { CartaGachaVisual, EstadoGacha, RaridadeCarta } from "./types";
import styles from "../../styles/gacha/gacha.module.css";

const pesoRaridade: Record<RaridadeCarta, number> = {
  UR: 5,
  SSR: 4,
  SR: 3,
  R: 2,
  N: 1,
};

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
  const [banners, setBanners] = useState<BannerGacha[]>([]);
  const [idBanner, setIdBanner] = useState("");
  const [rubys, setRubys] = useState(0);
  const [pity, setPity] = useState(0);
  const [estado, setEstado] = useState<EstadoGacha>("selecao");
  const [resultado, setResultado] = useState<CartaGachaVisual[]>([]);
  const [cartaDetalhada, setCartaDetalhada] = useState<CartaGachaVisual | null>(
    null,
  );
  const [probabilidades, setProbabilidades] = useState<
    { raridade: CartaGachaApi["raridade"]; percentual: number }[]
  >([]);
  const [proximaRotacaoEm, setProximaRotacaoEm] = useState<string | null>(null);
  const [painelInfo, setPainelInfo] = useState<
    "detalhes" | "probabilidades" | null
  >(null);

  const bannerAtivo =
    banners.find((banner) => banner.id === idBanner) ?? banners[0];
  const custo1 = bannerAtivo?.custoGiro ?? 300;
  const custo10 = bannerAtivo?.custoDez ?? 2700;
  const cartaBanner = useMemo(
    () =>
      bannerAtivo?.cartas.find((carta) => carta.raridade === "UR") ??
      bannerAtivo?.cartas[0],
    [bannerAtivo],
  );
  const destaque = useMemo(
    () =>
      [...resultado].sort(
        (a, b) => pesoRaridade[b.raridade] - pesoRaridade[a.raridade],
      )[0],
    [resultado],
  );
  const restantes = useMemo(
    () => (destaque ? resultado.filter((carta) => carta !== destaque) : []),
    [destaque, resultado],
  );
  const resumo = useMemo(
    () =>
      resultado.reduce(
        (acc, carta) => ({ ...acc, [carta.raridade]: acc[carta.raridade] + 1 }),
        { UR: 0, SSR: 0, SR: 0, R: 0, N: 0 },
      ),
    [resultado],
  );
  const copias = resultado.filter((carta) => !carta.nova).length;
  const rubysDuplicatas = resultado.reduce(
    (total, carta) => total + (carta.valorVenda ?? 0),
    0,
  );

  useEffect(() => {
    buscarGacha()
      .then((dados) => {
        const primeiro = dados.banners[0];
        setBanners(dados.banners);
        setIdBanner(primeiro?.id ?? "");
        setRubys(dados.jogador.rubys);
        setPity(primeiro?.pity ?? 0);
        setProbabilidades(dados.probabilidades);
        setProximaRotacaoEm(dados.rotacao?.proximaRotacaoEm ?? null);
      })
      .catch((erro) =>
        notificarErro(
          erro instanceof Error ? erro.message : "Erro ao carregar gacha.",
        ),
      );
  }, []);

  useEffect(() => {
    const atualizarRubys = (evento: Event) => {
      const { rubysRecebidos } = (evento as CustomEvent<{ rubysRecebidos: number }>).detail;
      setRubys((valor) => valor + rubysRecebidos);
    };
    window.addEventListener("rubys-reivindicados", atualizarRubys);
    return () => window.removeEventListener("rubys-reivindicados", atualizarRubys);
  }, []);

  async function invocar(quantidade: 1 | 10) {
    if (!bannerAtivo || estado === "carregando") return;
    setEstado("carregando");
    setResultado([]);
    const inicio = Date.now();
    try {
      const resposta = await girarGacha(bannerAtivo.id, quantidade);
      const espera = Math.max(0, 850 - (Date.now() - inicio));
      if (espera) await new Promise((resolve) => setTimeout(resolve, espera));
      const cartas = resposta.cartas.map(mapearCarta);
      setResultado(cartas);
      setPity(resposta.pity);
      setRubys(resposta.rubys);
      setEstado(quantidade === 10 ? "resultado" : "revelacao");
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch (erro) {
      setEstado("selecao");
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao realizar invocação.",
      );
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
          <h1>Gacha</h1>
          <p>Escolha um banner. Veja a garantia. Invoque.</p>
        </div>
      </header>

      {estado === "selecao" && (
        <section className={styles.selecao} aria-label="Seleção de banner">
          {banners.length > 1 && (
            <nav className={styles.abas} aria-label="Banners disponíveis">
              {banners.map((banner) => (
                <button
                  type="button"
                  key={banner.id}
                  aria-current={banner.id === idBanner ? "true" : undefined}
                  onClick={() => {
                    setIdBanner(banner.id);
                    setPity(banner.pity);
                  }}
                >
                  {banner.nome}
                </button>
              ))}
            </nav>
          )}
          <article className={styles.banner}>
            <div className={styles.bannerConteudo}>
              <span className={styles.selo}>
                Banner em destaque{" "}
                {proximaRotacaoEm
                  ? `· até ${new Date(proximaRotacaoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`
                  : ""}
              </span>
              <h2>{bannerAtivo?.nome.toUpperCase() ?? "ECLIPSE ROXO"}</h2>
              <p>
                {cartaBanner
                  ? `${cartaBanner.nome} está com taxa aumentada. A próxima UR está a no máximo ${Math.max(0, (bannerAtivo?.limitePity ?? 80) - pity)} invocações.`
                  : "Nenhuma carta disponível neste banner."}
              </p>
              <PityProgress
                atual={pity}
                limite={bannerAtivo?.limitePity ?? 80}
              />
              <div className={styles.linksBanner}>
                <button
                  type="button"
                  aria-expanded={painelInfo === "detalhes"}
                  onClick={() =>
                    setPainelInfo(painelInfo === "detalhes" ? null : "detalhes")
                  }
                >
                  Detalhes
                </button>
                <button
                  type="button"
                  aria-expanded={painelInfo === "probabilidades"}
                  onClick={() =>
                    setPainelInfo(
                      painelInfo === "probabilidades" ? null : "probabilidades",
                    )
                  }
                >
                  Probabilidades
                </button>
              </div>
              {painelInfo && (
                <div className={styles.infoBanner}>
                  {painelInfo === "detalhes" ? (
                    <p>
                      A raridade é definida pelo servidor e a garantia UR é
                      aplicada no limite indicado. O progresso permanece neste
                      banner.
                    </p>
                  ) : (
                    probabilidades.map((item) => (
                      <span key={item.raridade}>
                        <b>{item.raridade}</b>
                        {item.percentual}%
                      </span>
                    ))
                  )}
                </div>
              )}
            </div>
            <div className={styles.bannerArte}>
              {cartaBanner ? (
                <>
                  <div className={styles.flare}>
                    <CartaReal carta={mapearCarta(cartaBanner)} />
                  </div>
                  <div className={styles.nomeDestaque}>
                    <strong>{cartaBanner.nome}</strong>
                    <span>
                      {cartaBanner.raridade} · {cartaBanner.elemento}
                    </span>
                  </div>
                </>
              ) : (
                <Sparkles aria-hidden="true" />
              )}
            </div>
          </article>
          <div className={styles.acoesInvocacao}>
            <SummonButton
              quantidade={1}
              custo={custo1}
              carregando={false}
              desabilitado={!bannerAtivo || rubys < custo1}
              onClick={() => void invocar(1)}
            />
            <SummonButton
              quantidade={10}
              custo={custo10}
              principal
              carregando={false}
              desabilitado={!bannerAtivo || rubys < custo10}
              onClick={() => void invocar(10)}
            />
          </div>
        </section>
      )}

      {estado === "carregando" && (
        <section className={styles.carregando} aria-live="polite">
          <div className={styles.portal}>
            <IconeRuby tamanho={42} />
          </div>
          <strong>Invocando...</strong>
          <span>O Eclipse está respondendo</span>
        </section>
      )}

      {estado === "revelacao" && destaque && (
        <section className={styles.revelacao} aria-live="polite">
          <span className={styles.kicker}>
            {destaque.nova
              ? "Novo herói desbloqueado"
              : "Carta duplicada vendida"}
          </span>
          <strong className={styles.raridadeRevelada}>
            {destaque.raridade}
          </strong>
          <h2>{destaque.nome}</h2>
          <p>
            {destaque.elemento} · {destaque.nova ? "novo" : "vendida"}
          </p>
          <div className={styles.cartaRevelada}>
            <CartaReal carta={destaque} />
            {!destaque.nova && destaque.valorVenda ? (
              <span className={styles.vendaDuplicata}>
                <small>Carta repetida</small>
                <strong>
                  +{destaque.valorVenda.toLocaleString("pt-BR")} Rubys
                </strong>
              </span>
            ) : null}
          </div>
          <div className={styles.revelacaoResumo}>
            <Sparkles aria-hidden="true" />
            <span>
              <strong>
                {destaque.nova
                  ? "Nova carta adicionada à coleção"
                  : `Carta vendida por ${destaque.valorVenda?.toLocaleString("pt-BR") ?? 0} Rubys`}
              </strong>
              <small>
                {destaque.nova
                  ? `${destaque.elemento} · quantidade ${destaque.quantidade ?? 1}`
                  : "O valor já foi creditado no seu saldo."}
              </small>
            </span>
          </div>
          <div className={styles.botoesResultado}>
            <button
              type="button"
              className={styles.primario}
              onClick={() => setCartaDetalhada(destaque)}
            >
              Ver detalhes
            </button>
            <button type="button" onClick={voltarSelecao}>
              Continuar
            </button>
          </div>
        </section>
      )}

      {estado === "resultado" && destaque && (
        <section className={styles.resultadoMultiplo}>
          <header>
            <span className={styles.kicker}>Resultado da invocação</span>
            <h2>Seu 10x</h2>
            <p>
              {resumo.UR} UR · {resumo.SSR + resumo.SR} SR+ ·{" "}
              {resumo.R + resumo.N} R/N · {copias}{" "}
              {copias === 1 ? "cópia vendida" : "cópias vendidas"} · +
              {rubysDuplicatas.toLocaleString("pt-BR")} Rubys
            </p>
          </header>
          <div className={styles.resultadoCorpo}>
            <article className={styles.destaqueResultado}>
              <span>★ Destaque da invocação</span>
              <RewardCard
                carta={destaque}
                destaque
                onDetalhes={() => setCartaDetalhada(destaque)}
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
                    onDetalhes={() => setCartaDetalhada(carta)}
                  />
                ))}
              </div>
            </div>
          </div>
          <footer className={styles.rodapeResultado}>
            <span>
              <RarityBadge raridade="UR" /> {resumo.UR}
              <RarityBadge raridade="SR" /> {resumo.SR}
              <RarityBadge raridade="R" /> {resumo.R}
              <b className={styles.totalVenda}>
                +{rubysDuplicatas.toLocaleString("pt-BR")} Rubys
              </b>
            </span>
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

      {cartaDetalhada && (
        <div
          className={styles.modalFundo}
          role="presentation"
          onMouseDown={(evento) => {
            if (evento.target === evento.currentTarget) setCartaDetalhada(null);
          }}
        >
          <section
            className={styles.modalCarta}
            role="dialog"
            aria-modal="true"
            aria-labelledby="titulo-carta"
          >
            <button
              type="button"
              className={styles.fecharModal}
              aria-label="Fechar detalhes"
              onClick={() => setCartaDetalhada(null)}
            >
              <X />
            </button>
            <div>
              <CartaReal carta={cartaDetalhada} />
            </div>
            <aside>
              <RarityBadge raridade={cartaDetalhada.raridade} />
              <h2 id="titulo-carta">{cartaDetalhada.nome}</h2>
              <p>
                Elemento {cartaDetalhada.elemento}.{" "}
                {cartaDetalhada.nova
                  ? "Nova na sua coleção."
                  : `Cópia vendida automaticamente por ${cartaDetalhada.valorVenda?.toLocaleString("pt-BR") ?? 0} Rubys.`}
              </p>
              <button
                type="button"
                className={styles.primario}
                onClick={() => setCartaDetalhada(null)}
              >
                Fechar
              </button>
            </aside>
          </section>
        </div>
      )}
    </main>
  );
}
