"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { SlidersHorizontal, X } from "lucide-react";
import { createPortal } from "react-dom";
import { CampoBusca } from "../../components/ui/controlesFormulario";

import { buscarColecao } from "../../lib/jogo";
import { CARTAS_POR_PAGINA, FALLBACK_CARDS, mapearCarta } from "./cardData";
import { CabecalhoColecao } from "./components/cabecalhoColecao";
import { DetalheCarta } from "./components/detalheCarta";
import { FiltrosColecao } from "./components/filtrosColecao";
import { GradeCartas } from "./components/gradeCartas";
import { ModalDeck } from "./components/modalDeck";
import { Paginacao } from "./components/paginacao";
import { styles } from "./styles";
import type { Card, ResumoColecao } from "./types";

const resumoInicial: ResumoColecao = {
  totalCartas: 0,
  cartasObtidas: 0,
  percentual: 0,
};

const pesoRaridade: Record<Card["raridade"], number> = {
  UR: 5,
  SSR: 4,
  SR: 3,
  R: 2,
  N: 1,
};

export default function CartasPage() {
  const router = useRouter();
  const [cards, setCards] = useState<Card[]>(FALLBACK_CARDS);
  const [resumo, setResumo] = useState(resumoInicial);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  const [raridade, setRaridade] = useState("Todas");
  const [elemento, setElemento] = useState("Todos");
  const [classe, setClasse] = useState("Todas");
  const [custo, setCusto] = useState("Todos");
  const [ordenacao, setOrdenacao] = useState("Raridade");
  const [busca, setBusca] = useState("");
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const [favoritas, setFavoritas] = useState<Set<string>>(
    new Set(["Kael Arcano"]),
  );
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [deckSlots, setDeckSlots] = useState<Array<string | null>>(
    Array.from({ length: 6 }, () => null),
  );
  const [modalDeckAberto, setModalDeckAberto] = useState(false);
  const [portalPronto, setPortalPronto] = useState(false);
  const botaoCartaAtivo = useRef<HTMLElement | null>(null);
  const botaoFiltros = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setPortalPronto(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    buscarColecao("obtidas")
      .then((dados) => {
        setCards(dados.itens.map(mapearCarta));
        setResumo(dados.resumo);
      })
      .catch((error) => {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a coleção.",
        );
      })
      .finally(() => setCarregando(false));
  }, []);

  const filtradas = useMemo(() => {
    const texto = busca.trim().toLowerCase();

    const res = cards.filter((card) => {
      const combinaBusca =
        !texto ||
        card.nome.toLowerCase().includes(texto) ||
        card.elemento.toLowerCase().includes(texto) ||
        card.classe.toLowerCase().includes(texto);

      return (
        combinaBusca &&
        (raridade === "Todas" || card.raridade === raridade) &&
        (elemento === "Todos" || card.elemento === elemento) &&
        (classe === "Todas" || card.classe === classe) &&
        (custo === "Todos" || card.custo === Number(custo)) &&
        (!somenteFavoritas || favoritas.has(card.nome))
      );
    });

    return [...res].sort((a, b) => {
      if (ordenacao === "Raridade") {
        return pesoRaridade[b.raridade] - pesoRaridade[a.raridade];
      }
      if (ordenacao === "HP") return (b.hpBase ?? 0) - (a.hpBase ?? 0);
      if (ordenacao === "Ataque") {
        return (b.danoBase ?? 0) - (a.danoBase ?? 0);
      }
      if (ordenacao === "Defesa") {
        return (b.defesaBase ?? 0) - (a.defesaBase ?? 0);
      }
      if (ordenacao === "Valor de venda") return b.custo - a.custo;

      const dataA = a.obtidaEm ? new Date(a.obtidaEm).getTime() : 0;
      const dataB = b.obtidaEm ? new Date(b.obtidaEm).getTime() : 0;
      return ordenacao === "Mais recentes" ? dataB - dataA : dataA - dataB;
    });
  }, [
    busca,
    cards,
    classe,
    custo,
    elemento,
    favoritas,
    ordenacao,
    raridade,
    somenteFavoritas,
  ]);

  const totalPaginas = Math.max(
    1,
    Math.ceil(filtradas.length / CARTAS_POR_PAGINA),
  );
  const paginaAtual = Math.min(pagina, totalPaginas);
  const cartasVisiveis = filtradas.slice(
    (paginaAtual - 1) * CARTAS_POR_PAGINA,
    paginaAtual * CARTAS_POR_PAGINA,
  );
  const cartaSelecionada = selecionada
    ? cards.find((card) => card.nome === selecionada)
    : undefined;

  useEffect(() => {
    if (!cartaSelecionada) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape" && !modalDeckAberto) {
        setSelecionada(null);
        requestAnimationFrame(() => botaoCartaAtivo.current?.focus());
      }
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [cartaSelecionada, modalDeckAberto]);

  useEffect(() => {
    if (!filtrosAbertos) return;
    const botaoFiltrosAtual = botaoFiltros.current;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setFiltrosAbertos(false);
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
      botaoFiltrosAtual?.focus();
    };
  }, [filtrosAbertos]);

  function atualizarFiltro(setter: (valor: string) => void, valor: string) {
    setter(valor);
    setPagina(1);
  }

  function selecionarCarta(nome: string) {
    botaoCartaAtivo.current = document.activeElement as HTMLElement;
    setSelecionada(nome);
    setModalDeckAberto(false);
  }

  function fecharDetalhe() {
    setSelecionada(null);
    requestAnimationFrame(() => botaoCartaAtivo.current?.focus());
  }

  function alternarFavorita() {
    if (!cartaSelecionada) {
      return;
    }

    setFavoritas((atuais) => {
      const proximas = new Set(atuais);

      if (proximas.has(cartaSelecionada.nome)) {
        proximas.delete(cartaSelecionada.nome);
      } else {
        proximas.add(cartaSelecionada.nome);
      }

      return proximas;
    });
  }

  function equiparNoSlot(indice: number) {
    if (!cartaSelecionada) {
      return;
    }

    setDeckSlots((atuais) => {
      const proximos = atuais.map((nome) =>
        nome === cartaSelecionada.nome ? null : nome,
      );
      proximos[indice] = cartaSelecionada.nome;
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

  function adicionarAoDeck() {
    if (cartaSelecionada?.id) {
      router.push(`/decks?carta=${cartaSelecionada.id}`);
      return;
    }

    setModalDeckAberto(true);
  }

  if (carregando) {
    return (
      <main className={styles.pagina}>
        <p className={styles.semResultados}>Carregando sua coleção...</p>
      </main>
    );
  }

  return (
    <main className={styles.pagina}>
      <div className={styles.shellSemSidebar}>
        <section className={styles.conteudo}>
          <CabecalhoColecao resumo={resumo} />

          <div className={`${styles.workspace} ${styles.workspaceSemDetalhe}`}>
            <section className={styles.lista} aria-label="Lista de cartas">
              {erro ? (
                <p className={styles.semResultados} role="alert">
                  {erro}
                </p>
              ) : null}

              <div className={styles.barraBuscaFiltros}>
                <CampoBusca
                  className={styles.busca}
                  value={busca}
                  onChange={(evento) =>
                    atualizarFiltro(setBusca, evento.target.value)
                  }
                  aoLimpar={() => atualizarFiltro(setBusca, "")}
                  placeholder="Buscar carta..."
                  aria-label="Buscar carta"
                />
                <button
                  ref={botaoFiltros}
                  type="button"
                  className={styles.btnFiltros}
                  aria-expanded={filtrosAbertos}
                  aria-controls="filtros-colecao"
                  onClick={() => setFiltrosAbertos(true)}
                >
                  <SlidersHorizontal aria-hidden="true" />
                  Filtros
                </button>
              </div>

              <GradeCartas
                cartas={cartasVisiveis}
                cartaSelecionada={selecionada}
                aoSelecionar={selecionarCarta}
              />

              <Paginacao
                paginaAtual={paginaAtual}
                totalPaginas={totalPaginas}
                aoAlterar={setPagina}
              />
            </section>
          </div>
        </section>
      </div>

      {filtrosAbertos && portalPronto
        ? createPortal(
            <div
              className={styles.modalFiltros}
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-filtros-colecao"
              onClick={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setFiltrosAbertos(false);
                }
              }}
            >
              <section id="filtros-colecao" className={styles.painelFiltros}>
                <header className={styles.cabecalhoFiltros}>
                  <div>
                    <span>Minha coleção</span>
                    <h2 id="titulo-filtros-colecao">Filtros</h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiltrosAbertos(false)}
                    aria-label="Fechar filtros"
                    autoFocus
                  >
                    <X aria-hidden="true" />
                  </button>
                </header>
                <FiltrosColecao
                  raridade={raridade}
                  elemento={elemento}
                  classe={classe}
                  custo={custo}
                  ordenacao={ordenacao}
                  somenteFavoritas={somenteFavoritas}
                  aoAlterarRaridade={(valor) =>
                    atualizarFiltro(setRaridade, valor)
                  }
                  aoAlterarElemento={(valor) =>
                    atualizarFiltro(setElemento, valor)
                  }
                  aoAlterarClasse={(valor) => atualizarFiltro(setClasse, valor)}
                  aoAlterarCusto={(valor) => atualizarFiltro(setCusto, valor)}
                  aoAlterarOrdenacao={(valor) =>
                    atualizarFiltro(setOrdenacao, valor)
                  }
                  aoAlterarSomenteFavoritas={(valor) => {
                    setSomenteFavoritas(valor);
                    setPagina(1);
                  }}
                />
                <button
                  type="button"
                  className={styles.btnMostrarCartas}
                  onClick={() => setFiltrosAbertos(false)}
                >
                  Mostrar {filtradas.length} cartas
                </button>
              </section>
            </div>,
            document.body,
          )
        : null}

      {cartaSelecionada && portalPronto
        ? createPortal(
            <div
              className={styles.modalDetalhe}
              role="dialog"
              aria-modal="true"
              aria-label={`Detalhes da carta ${cartaSelecionada.nome}`}
              onClick={(evento) => {
                if (evento.target === evento.currentTarget) fecharDetalhe();
              }}
            >
              <DetalheCarta
                carta={cartaSelecionada}
                favorita={favoritas.has(cartaSelecionada.nome)}
                aoAlternarFavorita={alternarFavorita}
                aoAdicionarAoDeck={adicionarAoDeck}
                aoFechar={fecharDetalhe}
              />
            </div>,
            document.body,
          )
        : null}

      <ModalDeck
        aberto={modalDeckAberto}
        carta={cartaSelecionada}
        cartas={cards}
        slots={deckSlots}
        aoFechar={() => setModalDeckAberto(false)}
        aoEquipar={equiparNoSlot}
        aoRemover={removerDoDeck}
      />
    </main>
  );
}
