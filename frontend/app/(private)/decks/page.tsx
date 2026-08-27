"use client";

import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Edit3,
  Layers,
  Plus,
  Save,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { CartaMontada } from "../../components/cartaMontada";
import {
  notificar,
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import { FiltroSelect } from "../cartas/components/filtroSelect";
import {
  ativarDeck,
  atualizarDeck,
  buscarColecao,
  criarDeck,
  excluirDeck,
  listarDecks,
  type CartaColecao,
  type Deck,
} from "../../lib/jogo";
import styles from "../../styles/decks.module.css";

const SLOT_COUNT = 6;

function montarSlots(deck: Deck | undefined, cartas: CartaColecao[]) {
  if (!deck) return Array<CartaColecao | null>(SLOT_COUNT).fill(null);

  const cartasDoDeck = [...deck.cartas]
    .sort((a, b) => a.posicao - b.posicao)
    .map((carta) => cartas.find((item) => item.id === carta.id) ?? null);

  return [
    ...cartasDoDeck,
    ...Array<CartaColecao | null>(
      Math.max(0, SLOT_COUNT - cartasDoDeck.length),
    ).fill(null),
  ];
}

export default function DecksPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [colecao, setColecao] = useState<CartaColecao[]>([]);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [nome, setNome] = useState("Meu Deck");
  const [slots, setSlots] = useState<(CartaColecao | null)[]>(
    Array(SLOT_COUNT).fill(null),
  );
  const [slotSelecionado, setSlotSelecionado] = useState(0);
  const [busca, setBusca] = useState("");
  const [raridade, setRaridade] = useState("Todas");
  const [elemento, setElemento] = useState("Todos");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState("");
  const [mensagem, setMensagem] = useState("");

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  useEffect(() => {
    if (!mensagem) return;
    if (mensagem.startsWith("Editando")) {
      notificar({ mensagem, titulo: "Construtor de decks", tipo: "info" });
      return;
    }
    if (mensagem.includes("cheio")) {
      notificar({ mensagem, titulo: "Deck completo", tipo: "aviso" });
      return;
    }
    notificarSucesso(mensagem);
  }, [mensagem]);

  const carregar = useCallback(async () => {
    setCarregando(true);
    setErro("");
    try {
      const [decksData, colecaoData] = await Promise.all([
        listarDecks(),
        buscarColecao(),
      ]);
      setDecks(decksData);
      const cartasObtidas = colecaoData.itens.filter((carta) => carta.obtida);
      const deckEquipado = decksData.find((deck) => deck.ativo);
      const slotsIniciais = montarSlots(deckEquipado, cartasObtidas);
      setColecao(cartasObtidas);
      setEditandoId(deckEquipado?.id ?? null);
      setNome(deckEquipado?.nome ?? "Meu Deck");

      const cartaInicialId = new URLSearchParams(window.location.search).get(
        "carta",
      );
      const cartaInicial = colecaoData.itens.find(
        (carta) => carta.id === cartaInicialId && carta.obtida,
      );
      if (cartaInicial) {
        if (!slotsIniciais.some((carta) => carta?.id === cartaInicial.id)) {
          const primeiroVazio = slotsIniciais.findIndex((carta) => !carta);
          if (primeiroVazio >= 0) {
            slotsIniciais[primeiroVazio] = cartaInicial;
            setSlotSelecionado(primeiroVazio);
            setMensagem(
              `${cartaInicial.nome} foi adicionada ao deck equipado.`,
            );
          } else {
            setMensagem(
              "O deck equipado está cheio. Remova uma carta antes de adicionar outra.",
            );
          }
        }
      }
      setSlots(slotsIniciais);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Erro ao carregar decks.",
      );
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const cartasFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return colecao.filter(
      (carta) =>
        (!termo ||
          carta.nome.toLocaleLowerCase("pt-BR").includes(termo) ||
          carta.classe.toLocaleLowerCase("pt-BR").includes(termo)) &&
        (raridade === "Todas" || carta.raridade === raridade) &&
        (elemento === "Todos" || carta.elemento === elemento),
    );
  }, [busca, colecao, elemento, raridade]);

  const cartasSelecionadas = slots.filter((carta): carta is CartaColecao =>
    Boolean(carta),
  );
  const deckCompleto = cartasSelecionadas.length >= 3;

  function novoDeck() {
    setEditandoId(null);
    setNome(`Meu Deck ${decks.length + 1}`);
    setSlots(Array(SLOT_COUNT).fill(null));
    setSlotSelecionado(0);
    setErro("");
    setMensagem("");
  }

  function editar(deck: Deck) {
    setEditandoId(deck.id);
    setNome(deck.nome);
    setSlots(montarSlots(deck, colecao));
    setSlotSelecionado(0);
    setErro("");
    setMensagem(`Editando ${deck.nome}.`);
  }

  function selecionarCarta(carta: CartaColecao) {
    setErro("");
    if (slots.some((item) => item?.id === carta.id)) {
      setErro("Essa carta ja esta no deck.");
      return;
    }
    const proximos = [...slots];
    proximos[slotSelecionado] = carta;
    setSlots(proximos);
    const proximoVazio = proximos.findIndex((item) => !item);
    if (proximoVazio >= 0) setSlotSelecionado(proximoVazio);
  }

  function removerCarta(index: number) {
    const proximos = [...slots];
    proximos[index] = null;
    setSlots(proximos);
    setSlotSelecionado(index);
  }

  async function salvar(ativar: boolean) {
    const nomeLimpo = nome.trim();
    if (nomeLimpo.length < 3) {
      setErro("O nome do deck precisa ter pelo menos 3 caracteres.");
      return;
    }
    if (ativar && !deckCompleto) {
      setErro("Escolha pelo menos 3 cartas antes de salvar e ativar.");
      return;
    }

    setSalvando(true);
    setErro("");
    setMensagem("");
    try {
      const ids = cartasSelecionadas.map((carta) => carta.id);
      const resposta = editandoId
        ? await atualizarDeck(editandoId, {
            nome: nomeLimpo,
            cartas: ids,
            ativar,
          })
        : await criarDeck(nomeLimpo, ids, ativar);
      setEditandoId(resposta.deck.id);
      setMensagem(ativar ? "Deck salvo e equipado." : resposta.message);
      setDecks(await listarDecks());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao salvar deck.");
    } finally {
      setSalvando(false);
    }
  }

  async function equiparDeck(deck: Deck) {
    setErro("");
    setMensagem("");
    try {
      await ativarDeck(deck.id);
      const decksAtualizados = await listarDecks();
      const deckEquipado = decksAtualizados.find((item) => item.ativo) ?? deck;
      setDecks(decksAtualizados);
      setEditandoId(deckEquipado.id);
      setNome(deckEquipado.nome);
      setSlots(montarSlots(deckEquipado, colecao));
      setSlotSelecionado(0);
      setMensagem("Deck equipado com sucesso.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao equipar deck.");
    }
  }

  async function removerDeck(deck: Deck) {
    if (!window.confirm(`Excluir o deck "${deck.nome}"?`)) return;
    setErro("");
    try {
      const resposta = await excluirDeck(deck.id);
      setMensagem(resposta.message);
      if (editandoId === deck.id) novoDeck();
      setDecks(await listarDecks());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Erro ao excluir deck.");
    }
  }

  if (carregando) {
    return <main className={styles.estado}>Carregando seus decks...</main>;
  }

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <div>
          <Link href="/cartas" className={styles.voltar}>
            <ArrowLeft aria-hidden="true" /> Voltar para a coleção
          </Link>
          <h1>Construtor de decks</h1>
          <p>Monte e equipe o deck que será usado nas partidas.</p>
        </div>
      </header>

      <div className={styles.layout}>
        <aside className={styles.listaDecks}>
          <div className={styles.listaDecksTopo}>
            <h2>
              Meus decks <span>{decks.length}</span>
            </h2>
            <button
              type="button"
              className={styles.novoDeckLista}
              onClick={novoDeck}
            >
              <Plus aria-hidden="true" /> Novo
            </button>
          </div>
          {!decks.length && (
            <p className={styles.vazio}>Nenhum deck salvo ainda.</p>
          )}
          {decks.map((deck) => (
            <article
              key={deck.id}
              className={`${styles.deckResumo} ${editandoId === deck.id ? styles.selecionado : ""}`}
            >
              <button
                type="button"
                className={styles.editarDeck}
                onClick={() => editar(deck)}
              >
                <span className={styles.deckIcone}>
                  <Layers aria-hidden="true" />
                </span>
                <span>
                  <strong>{deck.nome}</strong>
                  <small>{deck.cartas.length}/6 cartas</small>
                </span>
                {deck.ativo && (
                  <em>
                    <CheckCircle2 aria-hidden="true" /> Equipado
                  </em>
                )}
              </button>
              <div className={styles.deckAcoes}>
                <button
                  type="button"
                  onClick={() => editar(deck)}
                  aria-label={`Editar ${deck.nome}`}
                >
                  <Edit3 aria-hidden="true" />
                </button>
                {!deck.ativo && (
                  <button
                    type="button"
                    onClick={() => void equiparDeck(deck)}
                    disabled={!deck.completo}
                    aria-label={`Equipar ${deck.nome}`}
                    title={
                      deck.completo
                        ? "Equipar deck"
                        : "Escolha pelo menos 3 cartas"
                    }
                  >
                    <Check aria-hidden="true" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void removerDeck(deck)}
                  disabled={deck.ativo}
                  aria-label={`Excluir ${deck.nome}`}
                  title={
                    deck.ativo
                      ? "O deck equipado não pode ser excluído"
                      : "Excluir deck"
                  }
                >
                  <Trash2 aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </aside>

        <section className={styles.editor}>
          <div className={styles.editorTopo}>
            <label>
              Nome do deck
              <input
                value={nome}
                onChange={(event) => setNome(event.target.value)}
                maxLength={100}
              />
            </label>
            <div
              className={
                deckCompleto ? styles.validacaoOk : styles.validacaoPendente
              }
            >
              <ShieldCheck aria-hidden="true" />
              <span>
                <strong>
                  {deckCompleto ? "Deck válido" : "Mínimo de 3 cartas"}
                </strong>
                {cartasSelecionadas.length}/6 cartas únicas
              </span>
            </div>
          </div>

          <div className={styles.slots}>
            {slots.map((carta, index) => (
              <button
                type="button"
                key={index}
                className={`${styles.slot} ${carta ? styles.slotPreenchido : ""} ${slotSelecionado === index ? styles.slotAtivo : ""}`}
                onClick={() => setSlotSelecionado(index)}
              >
                <span className={styles.numero}>{index + 1}</span>
                {carta ? (
                  <>
                    <span className={styles.slotCartaVisual}>
                      <CartaMontada
                        arte={carta.foto ?? undefined}
                        moldura={carta.moldura ?? undefined}
                        config={carta.configVisual ?? undefined}
                        placeholder={<Layers aria-hidden="true" />}
                      />
                    </span>
                    <span className={styles.slotCartaInfo}>
                      <strong>{carta.nome}</strong>
                      <small>
                        {carta.raridade} · {carta.elemento}
                      </small>
                      <em>{carta.classe}</em>
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      className={styles.remover}
                      onClick={(event) => {
                        event.stopPropagation();
                        removerCarta(index);
                      }}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ")
                          removerCarta(index);
                      }}
                      aria-label={`Remover ${carta.nome}`}
                    >
                      <X aria-hidden="true" />
                    </span>
                  </>
                ) : (
                  <>
                    <Plus aria-hidden="true" />
                    <strong>Slot vazio</strong>
                    <small>Selecione uma carta</small>
                  </>
                )}
              </button>
            ))}
          </div>

          <div className={styles.salvarAcoes}>
            <button
              type="button"
              className={styles.rascunho}
              disabled={salvando}
              onClick={() => void salvar(false)}
            >
              <Save aria-hidden="true" /> Salvar rascunho
            </button>
            <button
              type="button"
              className={styles.ativar}
              disabled={salvando || !deckCompleto}
              onClick={() => void salvar(true)}
            >
              <ShieldCheck aria-hidden="true" /> Salvar e equipar
            </button>
          </div>
        </section>

        <aside className={styles.colecao}>
          <h2>Sua coleção</h2>
          <label className={styles.busca}>
            <Search aria-hidden="true" />
            <input
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
              placeholder="Buscar carta..."
            />
          </label>
          <div className={styles.filtros}>
            <FiltroSelect
              rotulo="Raridade"
              valor={raridade}
              opcoes={["Todas", "UR", "SSR", "SR", "R", "N"]}
              aoAlterar={setRaridade}
            />
            <FiltroSelect
              rotulo="Elemento"
              valor={elemento}
              opcoes={["Todos", "natureza", "agua", "fogo", "sombra", "luz"]}
              aoAlterar={setElemento}
            />
          </div>
          <div className={styles.cartas}>
            {cartasFiltradas.map((carta) => {
              const usada = slots.some((item) => item?.id === carta.id);
              return (
                <button
                  type="button"
                  key={carta.id}
                  disabled={usada}
                  onClick={() => selecionarCarta(carta)}
                >
                  {carta.foto ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={carta.foto} alt="" />
                  ) : (
                    <span>
                      <Layers aria-hidden="true" />
                    </span>
                  )}
                  <span>
                    <strong>{carta.nome}</strong>
                    <small>
                      {carta.raridade} · {carta.classe}
                    </small>
                  </span>
                  {usada ? (
                    <Check aria-label="Ja adicionada" />
                  ) : (
                    <Plus aria-label="Adicionar" />
                  )}
                </button>
              );
            })}
            {!cartasFiltradas.length && (
              <p className={styles.vazio}>
                Nenhuma carta obtida corresponde aos filtros.
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
