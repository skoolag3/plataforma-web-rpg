"use client";

import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Bell,
  BookOpen,
  Boxes,
  ChevronLeft,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Gift,
  Heart,
  Home,
  Layers,
  Leaf,
  LogOut,
  Moon,
  PackagePlus,
  Search,
  Shield,
  Shirt,
  Sparkles,
  Star,
  Swords,
  Trophy,
  User,
  Wand2,
  Waves,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buscarColecao, type CartaColecao } from "../../lib/jogo";
import { CartaMontada, type ConfigVisualCarta } from "../../components/cartaMontada";
import cardsStyles from "../../styles/inventario/cards.module.css";
import controlsStyles from "../../styles/inventario/controls.module.css";
import detailsStyles from "../../styles/inventario/details.module.css";
import layoutStyles from "../../styles/inventario/layout.module.css";
import sidebarStyles from "../../styles/inventario/sidebar.module.css";
import topbarStyles from "../../styles/inventario/topbar.module.css";

const styles = {
  ...layoutStyles,
  ...sidebarStyles,
  ...topbarStyles,
  ...controlsStyles,
  ...cardsStyles,
  ...detailsStyles,
};

type Card = {
  id?: string;
  nome: string;
  raridade: "UR" | "SSR" | "SR" | "R" | "N";
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  classe: string;
  elementoIcone: LucideIcon;
  copias: string;
  borda: string;
  elementoCor: string;
  artA: string;
  artB: string;
  glow: string;
  quantidade?: number;
  obtida?: boolean;
  foto?: string | null;
  moldura?: string | null;
  configVisual?: ConfigVisualCarta | null;
  hpBase?: number;
  danoBase?: number;
  defesaBase?: number;
  passiva?: Record<string, unknown>;
};

const navItems = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/cartas", label: "Colecao", icon: Layers, ativo: true },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "#", label: "Loja", icon: Shirt },
  { href: "/gacha", label: "Gacha", icon: Sparkles },
  { href: "#", label: "Historico", icon: BookOpen },
  { href: "#", label: "Ranking", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "#", label: "Sair", icon: LogOut },
];

const fallbackCards: Card[] = [
  {
    nome: "Kael Arcano",
    raridade: "UR",
    elemento: "natureza",
    classe: "Mago",
    elementoIcone: Leaf,
    copias: "1 / 1",
    borda: "#a78bfa",
    elementoCor: "#7ee757",
    artA: "#0f2d1f",
    artB: "#172554",
    glow: "rgba(74, 222, 128, 0.62)",
  },
  {
    nome: "Lyria da Luz",
    raridade: "SSR",
    elemento: "agua",
    classe: "Mago",
    elementoIcone: Waves,
    copias: "1 / 1",
    borda: "#ca8a04",
    elementoCor: "#38bdf8",
    artA: "#e0f2fe",
    artB: "#1e3a8a",
    glow: "rgba(125, 211, 252, 0.62)",
  },
  {
    nome: "Riven Duelista",
    raridade: "SSR",
    elemento: "fogo",
    classe: "Guerreiro",
    elementoIcone: Flame,
    copias: "2 / 3",
    borda: "#ca8a04",
    elementoCor: "#ef4444",
    artA: "#451a03",
    artB: "#111827",
    glow: "rgba(248, 113, 113, 0.56)",
  },
  {
    nome: "Mira Sombria",
    raridade: "SR",
    elemento: "sombra",
    classe: "Vidente",
    elementoIcone: Moon,
    copias: "1 / 2",
    borda: "#94a3b8",
    elementoCor: "#a855f7",
    artA: "#312e81",
    artB: "#0f172a",
    glow: "rgba(168, 85, 247, 0.56)",
  },
  {
    nome: "Eron Guardiao",
    raridade: "SR",
    elemento: "luz",
    classe: "Guardiao",
    elementoIcone: Zap,
    copias: "3 / 3",
    borda: "#ca8a04",
    elementoCor: "#facc15",
    artA: "#78350f",
    artB: "#1e293b",
    glow: "rgba(250, 204, 21, 0.5)",
  },
  {
    nome: "Sylva Cacadora",
    raridade: "SR",
    elemento: "natureza",
    classe: "Cacador",
    elementoIcone: Leaf,
    copias: "0 / 2",
    borda: "#ca8a04",
    elementoCor: "#84cc16",
    artA: "#365314",
    artB: "#0f172a",
    glow: "rgba(132, 204, 22, 0.5)",
  },
  {
    nome: "Dren Mercenario",
    raridade: "R",
    elemento: "agua",
    classe: "Guerreiro",
    elementoIcone: Waves,
    copias: "2 / 4",
    borda: "#60a5fa",
    elementoCor: "#38bdf8",
    artA: "#1e3a8a",
    artB: "#020617",
    glow: "rgba(59, 130, 246, 0.5)",
  },
  {
    nome: "Zed Pirotecnico",
    raridade: "R",
    elemento: "fogo",
    classe: "Cacador",
    elementoIcone: Flame,
    copias: "1 / 4",
    borda: "#64748b",
    elementoCor: "#ef4444",
    artA: "#7f1d1d",
    artB: "#111827",
    glow: "rgba(239, 68, 68, 0.5)",
  },
  {
    nome: "Luna Vidente",
    raridade: "R",
    elemento: "sombra",
    classe: "Vidente",
    elementoIcone: Moon,
    copias: "0 / 4",
    borda: "#94a3b8",
    elementoCor: "#a855f7",
    artA: "#581c87",
    artB: "#020617",
    glow: "rgba(168, 85, 247, 0.48)",
  },
  {
    nome: "Soldado Real",
    raridade: "R",
    elemento: "luz",
    classe: "Guardiao",
    elementoIcone: Zap,
    copias: "4 / 4",
    borda: "#ca8a04",
    elementoCor: "#facc15",
    artA: "#57534e",
    artB: "#111827",
    glow: "rgba(250, 204, 21, 0.46)",
  },
  {
    nome: "Taro Aprendiz",
    raridade: "N",
    elemento: "natureza",
    classe: "Cacador",
    elementoIcone: Leaf,
    copias: "4 / 8",
    borda: "#ca8a04",
    elementoCor: "#84cc16",
    artA: "#422006",
    artB: "#052e16",
    glow: "rgba(132, 204, 22, 0.42)",
  },
  {
    nome: "Nilo Errante",
    raridade: "N",
    elemento: "agua",
    classe: "Guerreiro",
    elementoIcone: Waves,
    copias: "5 / 8",
    borda: "#60a5fa",
    elementoCor: "#38bdf8",
    artA: "#1e1b4b",
    artB: "#0f172a",
    glow: "rgba(56, 189, 248, 0.42)",
  },
  {
    nome: "Asha Rubra",
    raridade: "N",
    elemento: "fogo",
    classe: "Mago",
    elementoIcone: Flame,
    copias: "2 / 8",
    borda: "#64748b",
    elementoCor: "#ef4444",
    artA: "#831843",
    artB: "#111827",
    glow: "rgba(244, 63, 94, 0.42)",
  },
  {
    nome: "Noct Vigia",
    raridade: "N",
    elemento: "sombra",
    classe: "Vidente",
    elementoIcone: Moon,
    copias: "1 / 8",
    borda: "#94a3b8",
    elementoCor: "#a855f7",
    artA: "#3b0764",
    artB: "#020617",
    glow: "rgba(168, 85, 247, 0.4)",
  },
  {
    nome: "Theo Escudeiro",
    raridade: "N",
    elemento: "luz",
    classe: "Guardiao",
    elementoIcone: Zap,
    copias: "6 / 8",
    borda: "#ca8a04",
    elementoCor: "#facc15",
    artA: "#7c2d12",
    artB: "#1f2937",
    glow: "rgba(250, 204, 21, 0.4)",
  },
];

const cartasPorPagina = 10;
const raridades = ["Todas", "UR", "SSR", "SR", "R", "N"];
const elementos = ["Todos", "natureza", "agua", "fogo", "sombra", "luz"];
const classes = ["Todas", "Mago", "Guerreiro", "Cacador", "Guardiao", "Vidente"];

function cardStyle(card: Card): CSSProperties {
  return {
    "--borda": card.borda,
    "--elemento": card.elementoCor,
    "--artA": card.artA,
    "--artB": card.artB,
    "--glow": card.glow,
    ...(card.foto
      ? {
          backgroundImage: `linear-gradient(180deg, transparent 38%, rgba(2, 6, 23, 0.92) 86%), url("${card.foto}")`,
          backgroundPosition: "center",
          backgroundSize: "cover",
        }
      : {}),
  } as CSSProperties;
}

const elementoVisual: Record<
  CartaColecao["elemento"],
  Pick<Card, "elementoIcone" | "elementoCor" | "artA" | "artB" | "glow">
> = {
  natureza: { elementoIcone: Leaf, elementoCor: "#7ee757", artA: "#0f2d1f", artB: "#172554", glow: "rgba(74, 222, 128, .55)" },
  agua: { elementoIcone: Waves, elementoCor: "#38bdf8", artA: "#0c4a6e", artB: "#172554", glow: "rgba(56, 189, 248, .55)" },
  fogo: { elementoIcone: Flame, elementoCor: "#ef4444", artA: "#7f1d1d", artB: "#111827", glow: "rgba(248, 113, 113, .52)" },
  sombra: { elementoIcone: Moon, elementoCor: "#a855f7", artA: "#3b0764", artB: "#020617", glow: "rgba(168, 85, 247, .52)" },
  luz: { elementoIcone: Zap, elementoCor: "#facc15", artA: "#713f12", artB: "#1f2937", glow: "rgba(250, 204, 21, .48)" },
};

const bordaRaridade: Record<Card["raridade"], string> = {
  UR: "#a78bfa",
  SSR: "#f59e0b",
  SR: "#c084fc",
  R: "#60a5fa",
  N: "#64748b",
};

function mapearCarta(carta: CartaColecao): Card {
  return {
    ...carta,
    ...elementoVisual[carta.elemento],
    copias: String(carta.quantidade),
    borda: bordaRaridade[carta.raridade],
  };
}

export default function CartasPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(fallbackCards);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [resumo, setResumo] = useState({
    totalCartas: 0,
    cartasObtidas: 0,
    percentual: 0,
  });
  const [jogador, setJogador] = useState({
    nome: "Jogador",
    nivel: 1,
    moedas: 0,
    rubys: 0,
  });
  const [raridade, setRaridade] = useState("Todas");
  const [elemento, setElemento] = useState("Todos");
  const [classe, setClasse] = useState("Todas");
  const [busca, setBusca] = useState("");
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);
  const [favoritas, setFavoritas] = useState<Set<string>>(new Set(["Kael Arcano"]));
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [deckSlots, setDeckSlots] = useState<(string | null)[]>(
    Array.from({ length: 6 }, () => null),
  );
  const [modalDeckAberto, setModalDeckAberto] = useState(false);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [recompensaResgatada, setRecompensaResgatada] = useState(false);

  useEffect(() => {
    buscarColecao()
      .then((dados) => {
        setCards(dados.itens.map(mapearCarta));
        setResumo(dados.resumo);
        setJogador(dados.jogador);
      })
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : "Nao foi possivel carregar a colecao.",
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    return cards.filter((card) => {
      const combinaBusca =
        !texto ||
        card.nome.toLowerCase().includes(texto) ||
        card.elemento.toLowerCase().includes(texto) ||
        card.classe.toLowerCase().includes(texto);
      const combinaRaridade = raridade === "Todas" || card.raridade === raridade;
      const combinaElemento = elemento === "Todos" || card.elemento === elemento;
      const combinaClasse = classe === "Todas" || card.classe === classe;
      const combinaFavorita = !somenteFavoritas || favoritas.has(card.nome);

      return (
        combinaBusca &&
        combinaRaridade &&
        combinaElemento &&
        combinaClasse &&
        combinaFavorita
      );
    });
  }, [busca, cards, classe, elemento, favoritas, raridade, somenteFavoritas]);

  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / cartasPorPagina));
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cartasVisiveis = filtradas.slice(
    (paginaAtual - 1) * cartasPorPagina,
    paginaAtual * cartasPorPagina,
  );
  const cartaSelecionada = selecionada
    ? cards.find((card) => card.nome === selecionada)
    : undefined;
  const ElementoSelecionado = cartaSelecionada?.elementoIcone;
  const slotDaCarta = cartaSelecionada
    ? deckSlots.findIndex((nome) => nome === cartaSelecionada.nome)
    : -1;
  const cartaNoDeck = slotDaCarta >= 0;

  function atualizarFiltro(setter: (valor: string) => void, valor: string) {
    setter(valor);
    setPagina(1);
  }

  function alternarFavorita(nome: string) {
    setFavoritas((atuais) => {
      const proximas = new Set(atuais);
      if (proximas.has(nome)) {
        proximas.delete(nome);
      } else {
        proximas.add(nome);
      }
      return proximas;
    });
  }

  function equiparNoSlot(slotIndex: number) {
    if (!cartaSelecionada) {
      return;
    }

    setDeckSlots((atuais) => {
      const proximos = atuais.map((nome) =>
        nome === cartaSelecionada.nome ? null : nome,
      );
      proximos[slotIndex] = cartaSelecionada.nome;
      return proximos;
    });
    setModalDeckAberto(false);
  }

  function removerDoDeck() {
    if (!cartaSelecionada) {
      return;
    }

    setDeckSlots((atuais) =>
      atuais.map((nome) => (nome === cartaSelecionada.nome ? null : nome)),
    );
    setModalDeckAberto(false);
  }

  if (carregando) {
    return (
      <main className={styles.pagina}>
        <p className={styles.semResultados}>Carregando sua colecao...</p>
      </main>
    );
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.shellSemSidebar}>
        <aside className={styles.sidebar} aria-label="Menu do inventario">
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
              const classeNav = item.ativo ? styles.navLinkAtivo : styles.navLink;

              return (
                <Link key={item.label} href={item.href} className={classeNav}>
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
            <strong>
              {recompensaResgatada ? "Giro diario resgatado" : "Giro diario disponivel!"}
            </strong>
            <p>
              {recompensaResgatada
                ? "Volte amanha para novas recompensas."
                : "Resgate agora suas recompensas gratuitas."}
            </p>
            <button
              type="button"
              onClick={() => setRecompensaResgatada(true)}
              disabled={recompensaResgatada}
            >
              {recompensaResgatada ? "Resgatado" : "Resgatar"}
            </button>
          </section>
        </aside>

        <section className={styles.conteudo}>
          <header className={styles.topbar}>
            <div className={styles.titulo}>
              <h1>
                Colecao
                <span>
                  <Trophy aria-hidden="true" />
                </span>
              </h1>
              <div className={styles.progressoLinha}>
                <strong>{resumo.cartasObtidas} / {resumo.totalCartas} cartas coletadas</strong>
                <span className={styles.barra} aria-hidden="true">
                  <span style={{ width: `${resumo.percentual}%` }} />
                </span>
                <strong>{resumo.percentual}%</strong>
              </div>
            </div>

            <div className={styles.status}>
              <button type="button" className={styles.moeda} title="Moedas">
                <Coins className={styles.ouro} aria-hidden="true" />
                {jogador.moedas.toLocaleString("pt-BR")}
              </button>
              <span className={styles.divisor} aria-hidden="true" />
              <button type="button" className={styles.moeda} title="Gemas">
                <Gem className={styles.gema} aria-hidden="true" />
                {jogador.rubys.toLocaleString("pt-BR")}
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
                  <strong>{jogador.nome}</strong>
                  <span>Nivel {jogador.nivel}</span>
                </span>
              </Link>
            </div>
          </header>

          <div className={styles.workspace}>
            <section className={styles.lista} aria-label="Lista de cartas">
              {erro ? <p className={styles.semResultados} role="alert">{erro}</p> : null}
              <div className={styles.filtros}>
                <label className={styles.selectVisual}>
                  <span>Raridade</span>
                  <select
                    value={raridade}
                    onChange={(event) => atualizarFiltro(setRaridade, event.target.value)}
                  >
                    {raridades.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.selectVisual}>
                  <span>Elemento</span>
                  <select
                    value={elemento}
                    onChange={(event) => atualizarFiltro(setElemento, event.target.value)}
                  >
                    {elementos.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao === "Todos" ? "Todos" : opcao}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.selectVisual}>
                  <span>Classe</span>
                  <select
                    value={classe}
                    onChange={(event) => atualizarFiltro(setClasse, event.target.value)}
                  >
                    {classes.map((opcao) => (
                      <option key={opcao} value={opcao}>
                        {opcao}
                      </option>
                    ))}
                  </select>
                </label>

                <label className={styles.busca}>
                  <input
                    type="search"
                    value={busca}
                    onChange={(event) => {
                      setBusca(event.target.value);
                      setPagina(1);
                    }}
                    placeholder="Buscar carta..."
                  />
                  <Search aria-hidden="true" />
                </label>
              </div>

              <label className={styles.favoritos}>
                <input
                  type="checkbox"
                  checked={somenteFavoritas}
                  onChange={(event) => {
                    setSomenteFavoritas(event.target.checked);
                    setPagina(1);
                  }}
                />
                <span className={styles.checkbox} aria-hidden="true" />
                Mostrar apenas favoritas
              </label>

              <div className={styles.gridCartas}>
                {cartasVisiveis.map((card) => {
                  const IconeElemento = card.elementoIcone;
                  const selecionadaAgora = card.nome === selecionada;

                  if (card.foto || card.moldura) {
                    return (
                      <button
                        key={card.nome}
                        type="button"
                        className={[
                          styles.cardArtefato,
                          selecionadaAgora ? styles.cardArtefatoSelecionado : "",
                        ].join(" ")}
                        style={cardStyle(card)}
                        onClick={() => {
                          setSelecionada(card.nome);
                          setDetalhesAbertos(false);
                          setModalDeckAberto(false);
                        }}
                        aria-pressed={selecionadaAgora}
                      >
                        <CartaMontada arte={card.foto ?? undefined} moldura={card.moldura ?? undefined} config={card.configVisual ?? undefined}>
                          <span className={styles.cardMontadaInfo}>
                            <span className={styles.cardMontadaTopo}>
                              <span>{card.raridade}</span>
                              <IconeElemento aria-label={card.elemento} />
                            </span>
                            <strong>{card.nome}</strong>
                            <small><PackagePlus aria-hidden="true" /> {card.copias}</small>
                          </span>
                        </CartaMontada>
                      </button>
                    );
                  }

                  return (
                <button
                  key={card.nome}
                      type="button"
                      className={[
                        styles.card,
                        selecionadaAgora ? styles.cardSelecionado : "",
                      ].join(" ")}
                      style={cardStyle(card)}
                      onClick={() => {
                        setSelecionada(card.nome);
                        setDetalhesAbertos(false);
                        setModalDeckAberto(false);
                      }}
                      aria-pressed={selecionadaAgora}
                    >
                      <span className={styles.arte} aria-hidden="true" />
                      <span className={styles.silhueta} aria-hidden="true" />
                      <span className={styles.raridade}>{card.raridade}</span>
                      <span className={styles.elemento}>
                        <IconeElemento aria-label={card.elemento} />
                      </span>
                      <span className={styles.cardInfo}>
                        <strong>{card.nome}</strong>
                        <span>
                          <PackagePlus aria-hidden="true" />
                          {card.copias}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {!cartasVisiveis.length ? (
                <p className={styles.semResultados}>Nenhuma carta encontrada.</p>
              ) : null}

              <footer className={styles.paginacao}>
                <button
                  type="button"
                  className={styles.setaPagina}
                  onClick={() => setPagina((atual) => Math.max(1, atual - 1))}
                  disabled={paginaAtual === 1}
                  aria-label="Pagina anterior"
                >
                  <ChevronLeft aria-hidden="true" />
                </button>
                {Array.from({ length: totalPaginas }).map((_, index) => {
                  const numero = index + 1;
                  return (
                    <button
                      key={numero}
                      type="button"
                      className={numero === paginaAtual ? styles.paginaAtual : styles.paginaNumero}
                      onClick={() => setPagina(numero)}
                      aria-current={numero === paginaAtual ? "page" : undefined}
                    >
                      {numero}
                    </button>
                  );
                })}
                <button
                  type="button"
                  className={styles.setaPagina}
                  onClick={() => setPagina((atual) => Math.min(totalPaginas, atual + 1))}
                  disabled={paginaAtual === totalPaginas}
                  aria-label="Proxima pagina"
                >
                  <ChevronRight aria-hidden="true" />
                </button>
              </footer>
            </section>

            <aside className={styles.detalhe} aria-label="Detalhe da carta">
              {cartaSelecionada && ElementoSelecionado ? (
                <>
                  <div className={styles.detalheTopo}>
                    <article className={styles.cardGrande} style={cardStyle(cartaSelecionada)}>
                      <span className={styles.arte} aria-hidden="true" />
                      <span className={styles.silhueta} aria-hidden="true" />
                      <span className={styles.raridade}>{cartaSelecionada.raridade}</span>
                      <span className={styles.elemento}>
                        <ElementoSelecionado aria-label={cartaSelecionada.elemento} />
                      </span>
                    </article>

                    <div className={styles.detalheTitulo}>
                      <button
                        type="button"
                        className={[
                          styles.favoritoIcone,
                          favoritas.has(cartaSelecionada.nome) ? styles.favoritoAtivo : "",
                        ].join(" ")}
                        onClick={() => alternarFavorita(cartaSelecionada.nome)}
                        aria-pressed={favoritas.has(cartaSelecionada.nome)}
                        aria-label="Alternar favorita"
                      >
                        <Star aria-hidden="true" />
                      </button>
                      <h2>{cartaSelecionada.nome}</h2>
                      <div className={styles.estrelas} aria-label="5 estrelas">
                        {Array.from({ length: 5 }).map((_, index) => (
                          <Star key={index} aria-hidden="true" />
                        ))}
                      </div>

                      <div className={styles.tags}>
                        <span className={[styles.tag, styles.tagVerde].join(" ")}>
                          <ElementoSelecionado aria-hidden="true" />
                          {cartaSelecionada.elemento}
                        </span>
                        <span className={[styles.tag, styles.tagRoxo].join(" ")}>
                          <Wand2 aria-hidden="true" />
                          {cartaSelecionada.classe}
                        </span>
                      </div>

                      <div className={styles.nivel}>
                        <strong>Nivel 1 / 60</strong>
                        <div className={styles.nivelLinha}>
                          <span className={styles.barra} aria-hidden="true">
                            <span />
                          </span>
                          <span>0 / 100</span>
                        </div>
                      </div>

                      <div className={styles.atributos}>
                        <span className={styles.atributo}>
                          <Heart className={styles.verde} aria-hidden="true" />
                          HP
                          <strong className={styles.verde}>{cartaSelecionada.hpBase ?? 0}</strong>
                        </span>
                        <span className={styles.atributo}>
                          <Swords className={styles.vermelho} aria-hidden="true" />
                          ATK
                          <strong className={styles.vermelho}>{cartaSelecionada.danoBase ?? 0}</strong>
                        </span>
                        <span className={styles.atributo}>
                          <Shield className={styles.azul} aria-hidden="true" />
                          DEF
                          <strong className={styles.azul}>{cartaSelecionada.defesaBase ?? 0}</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <section className={styles.secaoDetalhe}>
                    <h3>Passiva</h3>
                    <div className={styles.passiva}>
                      <span className={styles.passivaIcone}>
                        <ElementoSelecionado aria-hidden="true" />
                      </span>
                      <p>
                        <strong>
                          {typeof cartaSelecionada.passiva?.nome === "string"
                            ? cartaSelecionada.passiva.nome
                            : "Sem passiva cadastrada"}
                        </strong>
                        {typeof cartaSelecionada.passiva?.descricao === "string"
                          ? cartaSelecionada.passiva.descricao
                          : "Esta carta ainda nao possui uma descricao de passiva."}
                      </p>
                    </div>
                  </section>

                  <section className={styles.secaoDetalhe}>
                    <h3>Descricao</h3>
                    <p>
                      Carta de raridade {cartaSelecionada.raridade} ligada ao
                      elemento {cartaSelecionada.elemento} e a classe {cartaSelecionada.classe}.
                    </p>
                  </section>

                  <section className={styles.secaoDetalhe}>
                    <h3>Obtido em</h3>
                    <p>Gacha - Eclipse Roxo</p>
                  </section>

                  {detalhesAbertos ? (
                    <section className={styles.detalhesExtras}>
                      <strong>Detalhes completos</strong>
                      <span>Copias: {cartaSelecionada.copias}</span>
                      <span>Classe: {cartaSelecionada.classe}</span>
                      <span>Status: {cartaSelecionada.obtida ? "Obtida" : "Nao obtida"}</span>
                    </section>
                  ) : null}

                  <div className={styles.acoesDetalhe}>
                    <button
                      className={styles.botaoPrimario}
                      type="button"
                      onClick={() => {
                        if (cartaSelecionada.id) {
                          router.push(`/decks?carta=${cartaSelecionada.id}`);
                        }
                      }}
                      disabled={!cartaSelecionada.obtida}
                    >
                      <PackagePlus aria-hidden="true" />
                      {cartaSelecionada.obtida ? "Adicionar a um deck" : "Carta nao obtida"}
                    </button>
                    <button
                      className={styles.botaoSecundario}
                      type="button"
                      onClick={() => setDetalhesAbertos((aberto) => !aberto)}
                    >
                      <Search aria-hidden="true" />
                      {detalhesAbertos ? "Ocultar detalhes" : "Ver detalhes completos"}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.detalheVazio}>
                  <span>
                    <PackagePlus aria-hidden="true" />
                  </span>
                  <h2>Selecione uma carta</h2>
                  <p>Clique em uma carta do inventario para ver detalhes e equipar no deck.</p>
                </div>
              )}
            </aside>
          </div>
        </section>
      </div>

      {modalDeckAberto && cartaSelecionada && ElementoSelecionado ? (
        <div
          className={styles.modalOverlay}
          role="dialog"
          aria-modal="true"
          aria-labelledby="equipar-deck-titulo"
        >
          <section className={styles.modalDeck}>
            <header className={styles.modalTopo}>
              <div>
                <span>Escolher slot</span>
                <h2 id="equipar-deck-titulo">Equipar {cartaSelecionada.nome}</h2>
              </div>
              <button
                type="button"
                className={styles.modalFechar}
                onClick={() => setModalDeckAberto(false)}
                aria-label="Fechar"
              >
                <X aria-hidden="true" />
              </button>
            </header>

            <div className={styles.modalCartaResumo}>
              <article className={styles.deckCartaPreview} style={cardStyle(cartaSelecionada)}>
                <span className={styles.arte} aria-hidden="true" />
                <span className={styles.silhueta} aria-hidden="true" />
                <span className={styles.raridade}>{cartaSelecionada.raridade}</span>
                <span className={styles.elemento}>
                  <ElementoSelecionado aria-label={cartaSelecionada.elemento} />
                </span>
              </article>
              <div>
                <strong>{cartaSelecionada.nome}</strong>
                <span>{cartaSelecionada.elemento} / {cartaSelecionada.classe}</span>
                <p>Escolha um dos 6 slots do deck. O slot escolhido sera substituido.</p>
              </div>
            </div>

            <div className={styles.deckSlots} aria-label="Slots do deck">
              {deckSlots.map((nomeNoSlot, index) => {
                const cardNoSlot = cards.find((card) => card.nome === nomeNoSlot);
                const IconeSlot = cardNoSlot?.elementoIcone;
                const slotAtual = nomeNoSlot === cartaSelecionada.nome;

                return (
                  <button
                    key={`slot-${index + 1}`}
                    type="button"
                    className={[
                      styles.deckSlot,
                      slotAtual ? styles.deckSlotAtivo : "",
                    ].join(" ")}
                    onClick={() => equiparNoSlot(index)}
                    style={cardNoSlot ? cardStyle(cardNoSlot) : undefined}
                  >
                    <span className={styles.deckSlotNumero}>Slot {index + 1}</span>
                    {cardNoSlot && IconeSlot ? (
                      <>
                        <span className={styles.deckSlotRaridade}>{cardNoSlot.raridade}</span>
                        <IconeSlot className={styles.deckSlotElemento} aria-hidden="true" />
                        <strong>{cardNoSlot.nome}</strong>
                        <span>{cardNoSlot.classe}</span>
                      </>
                    ) : (
                      <>
                        <PackagePlus aria-hidden="true" />
                        <strong>Vazio</strong>
                        <span>Equipar aqui</span>
                      </>
                    )}
                  </button>
                );
              })}
            </div>

            <footer className={styles.modalAcoes}>
              <button
                type="button"
                className={styles.botaoSecundario}
                onClick={() => setModalDeckAberto(false)}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.botaoPrimario}
                onClick={removerDoDeck}
                disabled={!cartaNoDeck}
              >
                Remover do deck
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </main>
  );
}
