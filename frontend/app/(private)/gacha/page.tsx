"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { LucideIcon } from "lucide-react";
import { Flame, Gift, Leaf, Moon, Sparkles, Waves, Zap } from "lucide-react";
import {
  CartaMontada,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import { IconeRuby } from "../../components/iconeRuby";
import { notificarErro } from "../../components/notificacoesGlobais";
import {
  buscarGacha,
  girarGacha,
  resgatarGiroDiario,
  type BannerGacha,
  type CartaGachaApi,
} from "../../lib/jogo";
import cardsStyles from "../../styles/inventario/cards.module.css";
import layoutStyles from "../../styles/inventario/layout.module.css";
import gachaActionsStyles from "../../styles/gacha/actions.module.css";
import gachaBannerStyles from "../../styles/gacha/banner.module.css";
import gachaCardsStyles from "../../styles/gacha/cards.module.css";
import gachaLayoutStyles from "../../styles/gacha/layout.module.css";
import gachaResultsStyles from "../../styles/gacha/results.module.css";

const styles = {
  ...layoutStyles,
  ...cardsStyles,
  ...gachaLayoutStyles,
  ...gachaBannerStyles,
  ...gachaCardsStyles,
  ...gachaActionsStyles,
  ...gachaResultsStyles,
};

type CartaGacha = {
  id?: string;
  nome: string;
  subtitulo: string;
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  icon: LucideIcon;
  borda: string;
  elementoCor: string;
  artA: string;
  artB: string;
  destaque?: boolean;
  foto?: string | null;
  moldura?: string | null;
  configVisual?: ConfigVisualCarta | null;
  nova?: boolean;
};

const cartasPool: CartaGacha[] = [
  {
    nome: "Kael Arcano",
    subtitulo: "Guardião da Floresta",
    raridade: "UR",
    elemento: "natureza",
    icon: Leaf,
    borda: "#a78bfa",
    elementoCor: "#7ee757",
    artA: "#0f2d1f",
    artB: "#172554",
    destaque: true,
  },
  {
    nome: "Lyria da Luz",
    subtitulo: "Oráculo Azul",
    raridade: "SR",
    elemento: "agua",
    icon: Waves,
    borda: "#a78bfa",
    elementoCor: "#38bdf8",
    artA: "#1e3a8a",
    artB: "#0f172a",
  },
  {
    nome: "Mira Sombria",
    subtitulo: "Vidente Lunar",
    raridade: "SR",
    elemento: "sombra",
    icon: Moon,
    borda: "#a78bfa",
    elementoCor: "#a855f7",
    artA: "#312e81",
    artB: "#0f172a",
  },
  {
    nome: "Zed Pirotecnico",
    subtitulo: "Faisca Rubra",
    raridade: "R",
    elemento: "fogo",
    icon: Flame,
    borda: "#60a5fa",
    elementoCor: "#ef4444",
    artA: "#7f1d1d",
    artB: "#111827",
  },
  {
    nome: "Soldado Real",
    subtitulo: "Linha de Frente",
    raridade: "N",
    elemento: "luz",
    icon: Zap,
    borda: "#64748b",
    elementoCor: "#facc15",
    artA: "#57534e",
    artB: "#111827",
  },
];

function estrelas(raridade: CartaGacha["raridade"]) {
  return raridade === "UR"
    ? 5
    : raridade === "SSR"
      ? 4
      : raridade === "SR"
        ? 3
        : raridade === "R"
          ? 2
          : 1;
}

function mapearCarta(carta: CartaGachaApi): CartaGacha {
  const base =
    cartasPool.find((item) => item.elemento === carta.elemento) ??
    cartasPool[0];
  return {
    ...base,
    ...carta,
    subtitulo: carta.nova ? "Nova na coleção" : "Cópia adicional",
    icon:
      carta.elemento === "natureza"
        ? Leaf
        : carta.elemento === "agua"
          ? Waves
          : carta.elemento === "fogo"
            ? Flame
            : carta.elemento === "sombra"
              ? Moon
              : Zap,
    borda:
      carta.raridade === "UR"
        ? "#a78bfa"
        : carta.raridade === "SSR"
          ? "#f59e0b"
          : base.borda,
  };
}

function CartaVisualGacha({ carta }: { carta: CartaGacha }) {
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
  const [aba, setAba] = useState("");
  const [rubys, setRubys] = useState(0);
  const [pity, setPity] = useState(0);
  const [invocando, setInvocando] = useState(false);
  const [resultado, setResultado] = useState<CartaGacha[]>([]);
  const [resgatado, setResgatado] = useState(false);
  const [erro, setErro] = useState("");
  const [probabilidades, setProbabilidades] = useState<
    { raridade: CartaGachaApi["raridade"]; percentual: number }[]
  >([]);
  const [proximaRotacaoEm, setProximaRotacaoEm] = useState<string | null>(null);
  const [painelInfo, setPainelInfo] = useState<
    "detalhes" | "probabilidades" | null
  >(null);

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  const bannerAtivo = banners.find((banner) => banner.id === aba) ?? banners[0];

  useEffect(() => {
    buscarGacha()
      .then((dados) => {
        setBanners(dados.banners);
        setAba(dados.banners[0]?.id ?? "");
        setRubys(dados.jogador.rubys);
        setPity(dados.banners[0]?.pity ?? 0);
        setResgatado(!dados.banners[0]?.diarioDisponivel);
        setProbabilidades(dados.probabilidades);
        setProximaRotacaoEm(dados.rotacao?.proximaRotacaoEm ?? null);
      })
      .catch((e) =>
        setErro(e instanceof Error ? e.message : "Erro ao carregar gacha."),
      );
  }, []);

  const destaque = resultado[0] ?? cartasPool[0];
  const resultadoMultiplo = resultado.length > 1;
  const custo10 = bannerAtivo?.custoDez ?? 2700;

  const statusResultado = useMemo(() => {
    if (!resultado.length) return "principal";
    if (resultadoMultiplo) return "multiplo";
    return destaque.raridade;
  }, [destaque.raridade, resultado.length, resultadoMultiplo]);

  async function invocar(qtd: 1 | 10) {
    if (!bannerAtivo) return;
    setInvocando(true);
    setResultado([]);
    setErro("");
    const inicioInvocacao = Date.now();
    try {
      const resposta = await girarGacha(bannerAtivo.id, qtd);
      const tempoRestante = Math.max(0, 3600 - (Date.now() - inicioInvocacao));
      if (tempoRestante) {
        await new Promise((resolve) => setTimeout(resolve, tempoRestante));
      }
      setResultado(resposta.cartas.map(mapearCarta));
      setPity(resposta.pity);
      setRubys(resposta.rubys);
      window.dispatchEvent(new Event("perfil-atualizado"));
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao realizar giro.");
    } finally {
      setInvocando(false);
    }
  }

  function resetar() {
    setResultado([]);
    setInvocando(false);
  }

  async function resgatarDiario() {
    if (!bannerAtivo) return;
    setErro("");
    try {
      const resposta = await resgatarGiroDiario(bannerAtivo.id);
      setRubys((atual) => atual + resposta.rubysRecebidos);
      window.dispatchEvent(new Event("perfil-atualizado"));
      setResgatado(true);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao resgatar recompensa.");
    }
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.shellSemSidebar}>
        <section className={styles.conteudo}>
          <header className={styles.gachaTopo}>
            <div>
              <span>
                <Sparkles aria-hidden="true" /> Invocações
              </span>
              <h1>Gacha</h1>
              <p>Invoque cartas e expanda suas possibilidades.</p>
            </div>
            <div className={styles.gachaTopoAcoes}>
              <span className={styles.saldoTopo}>
                <IconeRuby tamanho={24} />
                <small>Seu saldo</small>
                <strong>{rubys.toLocaleString("pt-BR")}</strong>
              </span>
              <button
                type="button"
                onClick={() => void resgatarDiario()}
                disabled={resgatado || !bannerAtivo}
              >
                <Gift aria-hidden="true" />
                {resgatado ? "Diário resgatado" : "Resgatar diário"}
              </button>
            </div>
          </header>

          <section className={styles.gachaPainel} data-estado={statusResultado}>
            {invocando ? (
              <div className={styles.invocando}>
                <div className={styles.portal} aria-hidden="true">
                  <div className={styles.cartasInvocacao}>
                    {[0, 1, 2, 3, 4].map((indice) => (
                      <div className={[styles.cartaPortal, indice === 2 ? styles.cartaPortalCentral : ""].join(" ")} style={{ "--indice": indice } as CSSProperties} key={indice}>
                        <IconeRuby tamanho={38} />
                      </div>
                    ))}
                  </div>
                </div>
                <strong>Invocando...</strong>
                <span>Toque para pular</span>
              </div>
            ) : resultado.length ? (
              <div
                className={
                  resultadoMultiplo
                    ? styles.resultadoMultiplo
                    : styles.resultadoUnico
                }
              >
                {resultadoMultiplo ? (
                  <>
                    <div className={styles.gradeResultado}>
                      {resultado.map((carta, index) => {
                        return (
                          <article
                            className={[
                              styles.cartaResultado,
                              carta.raridade === "UR"
                                ? styles.cartaObtidaDestaque
                                : "",
                            ].join(" ")}
                            style={{ "--indice": index } as CSSProperties}
                            key={`${carta.nome}-${index}`}
                          >
                            <CartaVisualGacha carta={carta} />
                            <small>{carta.subtitulo}</small>
                          </article>
                        );
                      })}
                    </div>
                    <footer className={styles.resultadoAcoes}>
                      <span>
                        <IconeRuby />
                        Rubys obtidos 30
                      </span>
                      <button
                        type="button"
                        className={styles.btnPrimario}
                        onClick={() => invocar(10)}
                      >
                        Invocar 10x novamente
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecundario}
                        onClick={resetar}
                      >
                        Voltar
                      </button>
                    </footer>
                  </>
                ) : (
                  <>
                    <strong className={styles.raridadeGrande}>
                      {destaque.raridade}
                    </strong>
                    <article className={styles.cartaObtida}>
                      <CartaVisualGacha carta={destaque} />
                    </article>
                    <span className={styles.estrelasResultado}>
                      {"★".repeat(estrelas(destaque.raridade))}
                    </span>
                    <p>Novo herói adicionado à sua coleção!</p>
                    <div className={styles.resultadoBotoes}>
                      <button type="button" className={styles.btnPrimario}>
                        Ver detalhes
                      </button>
                      <button
                        type="button"
                        className={styles.btnSecundario}
                        onClick={resetar}
                      >
                        Continuar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.gachaPrincipal}>
                <div className={styles.abas}>
                  {banners.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      className={aba === item.id ? styles.abaAtiva : styles.aba}
                      onClick={() => {
                        setAba(item.id);
                        setPity(item.pity);
                        setResgatado(!item.diarioDisponivel);
                      }}
                    >
                      {item.nome}
                    </button>
                  ))}
                </div>

                <section className={styles.banner}>
                  <div className={styles.bannerTexto}>
                    <small className={styles.bannerSelo}>
                      <Sparkles aria-hidden="true" /> Banner em destaque
                    </small>
                    <h2>{bannerAtivo?.nome.toUpperCase() ?? "SEM BANNERS"}</h2>
                    <p>
                      {bannerAtivo
                        ? `${bannerAtivo.cartas.length} cartas disponíveis neste banner. Cada invocação aproxima você da garantia UR.`
                        : "Cadastre cartas ativas para habilitar o gacha."}
                    </p>
                    {proximaRotacaoEm ? (
                      <small className={styles.rotacaoAviso}>
                        Próxima rotação automática às {new Date(proximaRotacaoEm).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}.
                      </small>
                    ) : null}
                    <div className={styles.pityPainel}>
                      <span>
                        <small>Garantia UR</small>
                        <strong>
                          {pity} / {bannerAtivo?.limitePity ?? 80}
                        </strong>
                      </span>
                      <span className={styles.pityBarra}>
                        <span
                          style={{
                            width: `${(pity / (bannerAtivo?.limitePity ?? 80)) * 100}%`,
                          }}
                        />
                      </span>
                      <small>
                        O progresso permanece entre as invocações deste banner.
                      </small>
                    </div>
                    <div className={styles.bannerAcoes}>
                      <button
                        type="button"
                        onClick={() =>
                          setPainelInfo((atual) =>
                            atual === "detalhes" ? null : "detalhes",
                          )
                        }
                      >
                        Detalhes
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setPainelInfo((atual) =>
                            atual === "probabilidades" ? null : "probabilidades",
                          )
                        }
                      >
                        Probabilidades
                      </button>
                    </div>
                    {painelInfo ? (
                      <div className={styles.painelInfoBanner}>
                        {painelInfo === "detalhes" ? (
                          <p>
                            O servidor escolhe a raridade, sorteia uma carta do grupo e registra o resultado. Se uma faixa não tiver cartas, ela passa para a próxima raridade disponível. A UR é garantida no giro {bannerAtivo?.limitePity ?? 80}.
                          </p>
                        ) : (
                          probabilidades.map((item) => (
                            <span key={item.raridade}>
                              <b>{item.raridade}</b>
                              <strong>{item.percentual}%</strong>
                            </span>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                  <div className={styles.bannerCartas}>
                    {(
                      bannerAtivo?.cartas.slice(0, 3).map(mapearCarta) ?? []
                    ).map((carta, index) => (
                      <article
                        className={styles.cartaPequena}
                        data-posicao={index}
                        key={carta.nome}
                      >
                        <CartaVisualGacha carta={carta} />
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.painelInvocacao}>
                  <div>
                    <small>Rubys disponíveis</small>
                    <strong>
                      <IconeRuby /> {rubys.toLocaleString("pt-BR")}
                    </strong>
                    <button type="button">Obter Rubys</button>
                  </div>
                  <div className={styles.invocacoes}>
                    <button
                      type="button"
                      className={styles.invocarUm}
                      disabled={
                        !bannerAtivo || rubys < (bannerAtivo?.custoGiro ?? 0)
                      }
                      onClick={() => void invocar(1)}
                    >
                      <span>Invocar 1x</span>
                      <strong>
                        <IconeRuby /> {bannerAtivo?.custoGiro ?? 0}
                      </strong>
                    </button>
                    <button
                      type="button"
                      className={styles.invocarDez}
                      disabled={!bannerAtivo || rubys < custo10}
                      onClick={() => void invocar(10)}
                    >
                      <span>Invocar 10x</span>
                      <strong>
                        <IconeRuby /> {custo10.toLocaleString("pt-BR")}
                      </strong>
                    </button>
                  </div>
                </section>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
