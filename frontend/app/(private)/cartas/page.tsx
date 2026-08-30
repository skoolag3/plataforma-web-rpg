"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

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
  const [busca, setBusca] = useState("");
  const [somenteFavoritas, setSomenteFavoritas] = useState(false);

  const [favoritas, setFavoritas] = useState<Set<string>>(
    new Set(["Kael Arcano"]),
  );
  const [selecionada, setSelecionada] = useState<string | null>(null);
  const [pagina, setPagina] = useState(1);
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [deckSlots, setDeckSlots] = useState<Array<string | null>>(
    Array.from({ length: 6 }, () => null),
  );
  const [modalDeckAberto, setModalDeckAberto] = useState(false);

  useEffect(() => {
    buscarColecao()
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

    return cards.filter((card) => {
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
  }, [
    busca,
    cards,
    classe,
    custo,
    elemento,
    favoritas,
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

  function atualizarFiltro(setter: (valor: string) => void, valor: string) {
    setter(valor);
    setPagina(1);
  }

  function selecionarCarta(nome: string) {
    setSelecionada(nome);
    setDetalhesAbertos(false);
    setModalDeckAberto(false);
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

          <div className={styles.workspace}>
            <section className={styles.lista} aria-label="Lista de cartas">
              {erro ? (
                <p className={styles.semResultados} role="alert">
                  {erro}
                </p>
              ) : null}

              <FiltrosColecao
                raridade={raridade}
                elemento={elemento}
                classe={classe}
                custo={custo}
                busca={busca}
                somenteFavoritas={somenteFavoritas}
                aoAlterarRaridade={(valor) =>
                  atualizarFiltro(setRaridade, valor)
                }
                aoAlterarElemento={(valor) =>
                  atualizarFiltro(setElemento, valor)
                }
                aoAlterarClasse={(valor) => atualizarFiltro(setClasse, valor)}
                aoAlterarCusto={(valor) => atualizarFiltro(setCusto, valor)}
                aoAlterarBusca={(valor) => atualizarFiltro(setBusca, valor)}
                aoAlterarSomenteFavoritas={(valor) => {
                  setSomenteFavoritas(valor);
                  setPagina(1);
                }}
              />

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

            <DetalheCarta
              carta={cartaSelecionada}
              favorita={
                cartaSelecionada ? favoritas.has(cartaSelecionada.nome) : false
              }
              detalhesAbertos={detalhesAbertos}
              aoAlternarFavorita={alternarFavorita}
              aoAlternarDetalhes={() => setDetalhesAbertos((aberto) => !aberto)}
              aoAdicionarAoDeck={adicionarAoDeck}
            />
          </div>
        </section>
      </div>

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
