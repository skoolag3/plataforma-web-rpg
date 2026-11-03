"use client";

import {
  Check,
  ChevronDown,
  ChevronRight,
  Map,
  Route,
  Sparkles,
  Swords,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { CartaMontada } from "../../components/cartaMontada";
import {
  abandonarExpedicao,
  buscarExpedicaoAtual,
  escolherRotaExpedicao,
  iniciarExpedicao,
  listarDecks,
  type Deck,
  type EstadoExpedicao,
  type OpcaoExpedicao,
} from "../../lib/jogo";
import styles from "../../styles/expedicao.module.css";
import { MapaExpedicao } from "./mapaExpedicao";
import { ResultadoExpedicao } from "./resultadoExpedicao";

export default function ExpedicaoPage() {
  const router = useRouter();
  const [expedicao, setExpedicao] = useState<EstadoExpedicao | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [idDeck, setIdDeck] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);

  useEffect(() => {
    Promise.allSettled([buscarExpedicaoAtual(), listarDecks()])
      .then(([resExpedicao, resDecks]) => {
        const mensagensErro: string[] = [];
        if (resExpedicao.status === "fulfilled") {
          setExpedicao(resExpedicao.value);
        } else {
          mensagensErro.push(
            resExpedicao.reason instanceof Error
              ? resExpedicao.reason.message
              : "Não foi possível carregar a Expedição.",
          );
        }
        if (resDecks.status === "fulfilled") {
          const lista = resDecks.value;
          setDecks(lista);
          const deck =
            lista.find((item) => item.ativo && item.completo) ??
            lista.find((item) => item.completo);
          setIdDeck(deck?.id ?? "");
        } else {
          mensagensErro.push(
            resDecks.reason instanceof Error
              ? resDecks.reason.message
              : "Não foi possível carregar os decks.",
          );
        }
        if (mensagensErro.length) setErro(mensagensErro[0]);
      })
      .finally(() => setCarregando(false));
  }, []);

  async function comecarExpedicao() {
    if (!idDeck) return;
    setProcessando(true);
    setErro("");
    try {
      setExpedicao(await iniciarExpedicao(idDeck));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao iniciar.");
    } finally {
      setProcessando(false);
    }
  }

  async function escolherRota(opcao: OpcaoExpedicao) {
    if (!expedicao) return;
    setProcessando(true);
    setErro("");
    try {
      const atualizada = await escolherRotaExpedicao(expedicao.id, opcao.id);
      setExpedicao(atualizada);
      router.push("/partida");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Falha ao escolher a rota.",
      );
      setProcessando(false);
    }
  }

  async function abandonar() {
    if (!expedicao) return;
    if (!confirmandoAbandono) {
      setConfirmandoAbandono(true);
      return;
    }
    setProcessando(true);
    setErro("");
    try {
      setExpedicao(await abandonarExpedicao(expedicao.id));
      setConfirmandoAbandono(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao abandonar.");
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <main className={styles.estado}>Gerando mapa da Expedição...</main>;
  }

  return (
    <main className={styles.pagina}>
      <section
        className={`${styles.container} ${!expedicao || expedicao.status !== "EM_ANDAMENTO" ? styles.containerInicio : ""}`}
      >
        <header className={styles.topo}>
          <div>
            <span>
              <Map /> Jornada procedural
            </span>
            <h1>Expedição</h1>
            <p>Escolha seus caminhos, vença os confrontos e alcance o chefe.</p>
          </div>
          {expedicao?.status === "EM_ANDAMENTO" &&
          !expedicao.dialogoBoss?.resultado ? (
            <button
              type="button"
              className={styles.btnAbandonar}
              onClick={() => void abandonar()}
              disabled={
                processando || expedicao.partidaAtual?.status === "EM_ANDAMENTO"
              }
            >
              {confirmandoAbandono ? "Confirmar abandono" : "Abandonar"}
            </button>
          ) : null}
        </header>

        {erro ? <p className={styles.erro}>{erro}</p> : null}

        {!expedicao || expedicao.status !== "EM_ANDAMENTO" ? (
          <div className={styles.inicioExpedicao}>
            {expedicao ? <ResultadoExpedicao expedicao={expedicao} /> : null}
            <NovaExpedicao
              decks={decks}
              idDeck={idDeck}
              expedicaoAnterior={expedicao}
              processando={processando}
              onSelecionar={setIdDeck}
              onIniciar={() => void comecarExpedicao()}
            />
          </div>
        ) : (
          <>
            {expedicao.partidaAtual?.status === "EM_ANDAMENTO" ? (
              <section className={styles.batalhaPendente}>
                <Swords />
                <div>
                  <strong>Confronto em andamento</strong>
                  <p>Retorne à batalha para continuar esta etapa.</p>
                </div>
                <button type="button" onClick={() => router.push("/partida")}>
                  Continuar batalha <ChevronRight />
                </button>
              </section>
            ) : null}
            <MapaExpedicao
              expedicao={expedicao}
              processando={processando}
              onEscolher={(opcao) => void escolherRota(opcao)}
              onAbrirDialogoBoss={() => router.push("/partida?boss=1")}
            />
          </>
        )}
      </section>
    </main>
  );
}

function NovaExpedicao({
  decks,
  idDeck,
  expedicaoAnterior,
  processando,
  onSelecionar,
  onIniciar,
}: {
  decks: Deck[];
  idDeck: string;
  expedicaoAnterior: EstadoExpedicao | null;
  processando: boolean;
  onSelecionar: (id: string) => void;
  onIniciar: () => void;
}) {
  const [menuDeckAberto, setMenuDeckAberto] = useState(false);
  const decksValidos = decks.filter((deck) => deck.completo);
  const deckSelecionado = decksValidos.find((deck) => deck.id === idDeck);
  return (
    <section className={styles.novaExpedicao}>
      <div className={styles.resumoNova}>
        <Route />
        <span>
          <small>
            {expedicaoAnterior
              ? `Última expedição: ${expedicaoAnterior.status.toLowerCase()}`
              : "Nova jornada"}
          </small>
          <h2>Prepare o deck para uma nova trilha</h2>
          <p>O mapa terá três escolhas e um chefe final.</p>
        </span>
      </div>
      <div className={styles.seletorDeck}>
        <div className={styles.seletorDeckCustom}>
          <span>Deck da Expedição</span>
          <button
            type="button"
            className={styles.btnSelecionarDeck}
            aria-expanded={menuDeckAberto}
            aria-haspopup="listbox"
            onClick={() => setMenuDeckAberto((aberto) => !aberto)}
          >
            <span>
              <strong>{deckSelecionado?.nome ?? "Selecione um deck"}</strong>
              {deckSelecionado ? (
                <small>
                  {deckSelecionado.cartas.length}{" "}
                  {deckSelecionado.cartas.length === 1 ? "carta" : "cartas"}
                </small>
              ) : null}
            </span>
            <ChevronDown aria-hidden="true" />
          </button>
          {menuDeckAberto ? (
            <div className={styles.menuDecks} role="listbox">
              {decksValidos.map((deck) => (
                <button
                  type="button"
                  role="option"
                  aria-selected={deck.id === idDeck}
                  onClick={() => {
                    onSelecionar(deck.id);
                    setMenuDeckAberto(false);
                  }}
                  key={deck.id}
                >
                  <span>
                    <strong>{deck.nome}</strong>
                    <small>
                      {deck.cartas.length}{" "}
                      {deck.cartas.length === 1
                        ? "carta equipada"
                        : "cartas equipadas"}
                    </small>
                  </span>
                  {deck.id === idDeck ? <Check aria-hidden="true" /> : null}
                </button>
              ))}
            </div>
          ) : null}
        </div>
        {deckSelecionado ? (
          <div className={styles.previaDeck} aria-live="polite">
            <small>{deckSelecionado.cartas.length} cartas equipadas</small>
            <div>
              {deckSelecionado.cartas.map((carta) => (
                <div
                  className={styles.miniCartaDeck}
                  title={carta.nome}
                  key={carta.id}
                >
                  <CartaMontada
                    arte={carta.foto ?? undefined}
                    moldura={carta.moldura ?? undefined}
                    nome={carta.nome}
                    raridade={carta.raridade}
                    elemento={carta.elemento}
                    config={carta.configVisual ?? undefined}
                    placeholder={<Sparkles aria-hidden="true" />}
                  />
                </div>
              ))}
              {Array.from(
                { length: Math.max(0, 6 - deckSelecionado.cartas.length) },
                (_, indice) => (
                  <div
                    className={styles.slotCartaVazio}
                    role="img"
                    aria-label={`Espaço vazio ${deckSelecionado.cartas.length + indice + 1}`}
                    key={`vazio-${indice}`}
                  />
                ),
              )}
            </div>
          </div>
        ) : (
          <p className={styles.deckNaoSelecionado}>
            Selecione um deck para conferir a formação.
          </p>
        )}
      </div>
      <button
        type="button"
        className={styles.btnIniciar}
        onClick={onIniciar}
        disabled={!idDeck || processando}
      >
        <Map /> {processando ? "Gerando trilha..." : "Iniciar expedição"}
      </button>
    </section>
  );
}
