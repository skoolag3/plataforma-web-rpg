"use client";

import type { CSSProperties } from "react";
import { useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Boxes,
  ChevronDown,
  Coins,
  Flame,
  Gem,
  Gift,
  Home,
  Layers,
  Leaf,
  LogOut,
  Moon,
  Shirt,
  Sparkles,
  Trophy,
  User,
  Waves,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import cardsStyles from "../../styles/inventario/cards.module.css";
import layoutStyles from "../../styles/inventario/layout.module.css";
import sidebarStyles from "../../styles/inventario/sidebar.module.css";
import topbarStyles from "../../styles/inventario/topbar.module.css";
import gachaActionsStyles from "../../styles/gacha/actions.module.css";
import gachaBannerStyles from "../../styles/gacha/banner.module.css";
import gachaCardsStyles from "../../styles/gacha/cards.module.css";
import gachaLayoutStyles from "../../styles/gacha/layout.module.css";
import gachaResultsStyles from "../../styles/gacha/results.module.css";

const styles = {
  ...layoutStyles,
  ...sidebarStyles,
  ...topbarStyles,
  ...cardsStyles,
  ...gachaLayoutStyles,
  ...gachaBannerStyles,
  ...gachaCardsStyles,
  ...gachaActionsStyles,
  ...gachaResultsStyles,
};

type CartaGacha = {
  nome: string;
  subtitulo: string;
  raridade: "UR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  icon: LucideIcon;
  borda: string;
  elementoCor: string;
  artA: string;
  artB: string;
  glow: string;
  destaque?: boolean;
};

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/cartas", label: "Colecao", icon: Layers },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "#", label: "Loja", icon: Shirt },
  { href: "/gacha", label: "Gacha", icon: Sparkles, ativo: true },
  { href: "#", label: "Historico", icon: BookOpen },
  { href: "#", label: "Ranking", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "#", label: "Sair", icon: LogOut },
];

const cartasPool: CartaGacha[] = [
  {
    nome: "Kael Arcano",
    subtitulo: "Guardiao da Floresta",
    raridade: "UR",
    elemento: "natureza",
    icon: Leaf,
    borda: "#a78bfa",
    elementoCor: "#7ee757",
    artA: "#0f2d1f",
    artB: "#172554",
    glow: "rgba(74, 222, 128, 0.62)",
    destaque: true,
  },
  {
    nome: "Lyria da Luz",
    subtitulo: "Oraculo Azul",
    raridade: "SR",
    elemento: "agua",
    icon: Waves,
    borda: "#a78bfa",
    elementoCor: "#38bdf8",
    artA: "#1e3a8a",
    artB: "#0f172a",
    glow: "rgba(125, 211, 252, 0.58)",
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
    glow: "rgba(168, 85, 247, 0.56)",
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
    glow: "rgba(239, 68, 68, 0.5)",
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
    glow: "rgba(250, 204, 21, 0.42)",
  },
];

function cardStyle(card: CartaGacha): CSSProperties {
  return {
    "--borda": card.borda,
    "--elemento": card.elementoCor,
    "--artA": card.artA,
    "--artB": card.artB,
    "--glow": card.glow,
  } as CSSProperties;
}

function estrelas(raridade: CartaGacha["raridade"]) {
  return raridade === "UR" ? 5 : raridade === "SR" ? 4 : raridade === "R" ? 3 : 2;
}

function sortear(qtd: number) {
  if (qtd === 1) {
    return [cartasPool[0]];
  }

  return [
    cartasPool[3],
    cartasPool[2],
    cartasPool[4],
    cartasPool[0],
    cartasPool[3],
    cartasPool[4],
    cartasPool[1],
    cartasPool[2],
    cartasPool[4],
    cartasPool[4],
  ];
}

export default function GachaPage() {
  const [aba, setAba] = useState("Eclipse Roxo");
  const [rubys, setRubys] = useState(380);
  const [pity, setPity] = useState(79);
  const [invocando, setInvocando] = useState(false);
  const [resultado, setResultado] = useState<CartaGacha[]>([]);
  const [resgatado, setResgatado] = useState(false);

  const destaque = resultado[0] ?? cartasPool[0];
  const IconeDestaque = destaque.icon;
  const resultadoMultiplo = resultado.length > 1;
  const custo10 = 2700;

  const statusResultado = useMemo(() => {
    if (!resultado.length) return "principal";
    if (resultadoMultiplo) return "multiplo";
    return destaque.raridade;
  }, [destaque.raridade, resultado.length, resultadoMultiplo]);

  function invocar(qtd: 1 | 10) {
    setInvocando(true);
    setResultado([]);

    window.setTimeout(() => {
      const novasCartas = sortear(qtd);
      setResultado(novasCartas);
      setPity(novasCartas.some((carta) => carta.raridade === "UR") ? 0 : Math.min(80, pity + qtd));
      setRubys((atual) => Math.max(0, atual - (qtd === 1 ? 300 : custo10)));
      setInvocando(false);
    }, 900);
  }

  function resetar() {
    setResultado([]);
    setInvocando(false);
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.shell}>
        <aside className={styles.sidebar} aria-label="Menu do gacha">
          <div className={styles.marca}>
            <span className={styles.marcaIcone}>
              <Gem aria-hidden="true" />
            </span>
            <span className={styles.marcaTexto}>
              <strong>Anime Cards</strong>
              <span>RPG Online</span>
            </span>
          </div>

          <nav className={styles.nav}>
            {navItems.map((item) => {
              const Icone = item.icon;
              return (
                <Link
                  key={item.label}
                  href={item.href}
                  className={item.ativo ? styles.navLinkAtivo : styles.navLink}
                >
                  <Icone aria-hidden="true" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <section className={styles.presente} aria-label="Giro diario">
            <span className={styles.presenteIcone}>
              <Gift aria-hidden="true" />
            </span>
            <strong>{resgatado ? "Giro diario resgatado" : "Giro diario disponivel!"}</strong>
            <p>{resgatado ? "Volte amanha para novas recompensas." : "Resgate agora suas recompensas gratuitas."}</p>
            <button type="button" onClick={() => setResgatado(true)} disabled={resgatado}>
              {resgatado ? "Resgatado" : "Resgatar"}
            </button>
          </section>
        </aside>

        <section className={styles.conteudo}>
          <header className={styles.topbar}>
            <div className={styles.titulo}>
              <h1>
                Gacha
                <span>
                  <Sparkles aria-hidden="true" />
                </span>
              </h1>
            </div>

            <div className={styles.status}>
              <button type="button" className={styles.moeda} title="Moedas">
                <Coins className={styles.ouro} aria-hidden="true" />
                1.250
              </button>
              <span className={styles.divisor} aria-hidden="true" />
              <button type="button" className={styles.moeda} title="Rubys">
                <Gem className={styles.gema} aria-hidden="true" />
                {rubys}
              </button>
              <span className={styles.divisor} aria-hidden="true" />
              <button type="button" className={styles.iconeTopo} aria-label="Notificacoes">
                <Bell aria-hidden="true" />
              </button>
              <span className={styles.divisor} aria-hidden="true" />
              <Link href="/perfil" className={styles.avatar}>
                <span className={styles.avatarIcone}>
                  <User aria-hidden="true" />
                </span>
                <span>
                  <strong>Gabriel1</strong>
                  <span>Nivel 1</span>
                </span>
                <ChevronDown aria-hidden="true" />
              </Link>
            </div>
          </header>

          <section className={styles.gachaPainel} data-estado={statusResultado}>
            {invocando ? (
              <div className={styles.invocando}>
                <div className={styles.portal} aria-hidden="true">
                  <div className={styles.cartaPortal}>
                    <Gem aria-hidden="true" />
                  </div>
                </div>
                <strong>Invocando...</strong>
                <span>Toque para pular</span>
              </div>
            ) : resultado.length ? (
              <div className={resultadoMultiplo ? styles.resultadoMultiplo : styles.resultadoUnico}>
                {resultadoMultiplo ? (
                  <>
                    <div className={styles.gradeResultado}>
                      {resultado.map((carta, index) => {
                        const Icone = carta.icon;
                        return (
                          <article
                            className={[styles.cartaResultado, carta.raridade === "UR" ? styles.cartaObtidaDestaque : ""].join(" ")}
                            style={cardStyle(carta)}
                            key={`${carta.nome}-${index}`}
                          >
                            <span className={styles.arte} aria-hidden="true" />
                            <span className={styles.raridade}>{carta.raridade}</span>
                            <span className={styles.elemento}>
                              <Icone aria-hidden="true" />
                            </span>
                            <span className={styles.cardInfo}>
                              <strong>{carta.nome}</strong>
                              <span>{carta.subtitulo}</span>
                            </span>
                          </article>
                        );
                      })}
                    </div>
                    <footer className={styles.resultadoAcoes}>
                      <span>
                        <Gem aria-hidden="true" />
                        Rubys obtidos 30
                      </span>
                      <button type="button" className={styles.btnPrimario} onClick={() => invocar(10)}>
                        Invocar 10x novamente
                      </button>
                      <button type="button" className={styles.btnSecundario} onClick={resetar}>
                        Voltar
                      </button>
                    </footer>
                  </>
                ) : (
                  <>
                    <strong className={styles.raridadeGrande}>{destaque.raridade}</strong>
                    <article className={styles.cartaObtida} style={cardStyle(destaque)}>
                      <span className={styles.arte} aria-hidden="true" />
                      <span className={styles.raridade}>{destaque.raridade}</span>
                      <span className={styles.elemento}>
                        <IconeDestaque aria-hidden="true" />
                      </span>
                      <span className={styles.cardInfo}>
                        <strong>{destaque.nome}</strong>
                        <span>{"★".repeat(estrelas(destaque.raridade))}</span>
                      </span>
                    </article>
                    <p>Novo heroi adicionado a sua colecao!</p>
                    <div className={styles.resultadoBotoes}>
                      <button type="button" className={styles.btnPrimario}>
                        Ver detalhes
                      </button>
                      <button type="button" className={styles.btnSecundario} onClick={resetar}>
                        Continuar
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.gachaPrincipal}>
                <div className={styles.abas}>
                  {["Eclipse Roxo", "Invocacao de Herois", "Convocacao da Luz"].map((item) => (
                    <button
                      type="button"
                      key={item}
                      className={aba === item ? styles.abaAtiva : styles.aba}
                      onClick={() => setAba(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>

                <section className={styles.banner}>
                  <div className={styles.bannerTexto}>
                    <h2>{aba.toUpperCase()}</h2>
                    <p>Chance aumentada para cartas UR Kael Arcano e Mira Sombria.</p>
                    <span>Termina em: 6d 10h 23m</span>
                    <div className={styles.pityMini}>
                      <span />
                      <strong>{pity}/80</strong>
                    </div>
                    <div className={styles.bannerAcoes}>
                      <button type="button">Detalhes</button>
                      <button type="button">Probabilidades</button>
                    </div>
                  </div>
                  <div className={styles.bannerCartas}>
                    {cartasPool.slice(0, 2).map((carta) => (
                      <article className={styles.cartaPequena} style={cardStyle(carta)} key={carta.nome}>
                        <span className={styles.arte} aria-hidden="true" />
                        <span className={styles.raridade}>{carta.raridade}</span>
                        <span className={styles.cardInfo}>
                          <strong>{carta.nome}</strong>
                        </span>
                      </article>
                    ))}
                  </div>
                </section>

                <section className={styles.invocacoes}>
                  <button type="button" className={styles.invocarUm} onClick={() => invocar(1)}>
                    Invocar 1x <Gem aria-hidden="true" /> 300
                  </button>
                  <button type="button" className={styles.invocarDez} onClick={() => invocar(10)}>
                    Invocar 10x <Gem aria-hidden="true" /> {custo10.toLocaleString("pt-BR")}
                  </button>
                </section>

                <section className={styles.rubysBox}>
                  <span>
                    <Gem aria-hidden="true" />
                    Rubys atuais <strong>{rubys}</strong>
                  </span>
                  <button type="button">Comprar Rubys</button>
                </section>

                <aside className={styles.pityBox}>
                  <button type="button" className={styles.fecharPity} aria-label="Fechar garantia">
                    <X aria-hidden="true" />
                  </button>
                  <h3>Garantia UR</h3>
                  <p>A cada 80 invocacoes, voce garante uma carta UR.</p>
                  <strong>{pity} / 80</strong>
                  <span className={styles.pityBarra}>
                    <span style={{ width: `${(pity / 80) * 100}%` }} />
                  </span>
                </aside>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  );
}
