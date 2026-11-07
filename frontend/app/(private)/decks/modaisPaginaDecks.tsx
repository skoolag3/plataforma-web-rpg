"use client";

import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Edit3,
  Layers,
  PanelRightOpen,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import type { RefObject } from "react";
import { createPortal } from "react-dom";
import { DetalheCarta } from "../cartas/components/detalheCarta";
import { mapearCarta } from "../cartas/cardData";
import { styles as estilosInventario } from "../cartas/styles";
import type { CartaColecao, Deck } from "../../lib/jogo";
import styles from "../../styles/decks.module.css";
import { InventarioDeck } from "./inventarioDeck";
import { ModalFiltrosDeck } from "./modalFiltrosDeck";

export function ModaisPaginaDecks({
  portalPronto,
  inventarioModalAberto,
  setInventarioModalAberto,
  setInventarioNaLateral,
  cartasFiltradas,
  cartasSelecionadasIds,
  busca,
  setBusca,
  filtrosAtivos,
  btnFiltros,
  setFiltrosAbertos,
  selecionarCarta,
  filtrosAbertos,
  raridade,
  elemento,
  classe,
  ordenacao,
  somenteFavoritas,
  setRaridade,
  setElemento,
  setClasse,
  setOrdenacao,
  setSomenteFavoritas,
  decksAbertos,
  setDecksAbertos,
  decks,
  editandoId,
  novoDeck,
  editar,
  equiparDeck,
  setDeckParaExcluir,
  cartaDetalhada,
  setCartaDetalhada,
  deckParaExcluir,
  excluindo,
  confirmarExclusao,
}: {
  portalPronto: boolean;
  inventarioModalAberto: boolean;
  setInventarioModalAberto: (valor: boolean) => void;
  setInventarioNaLateral: (valor: boolean) => void;
  cartasFiltradas: CartaColecao[];
  cartasSelecionadasIds: Set<string>;
  busca: string;
  setBusca: (valor: string) => void;
  filtrosAtivos: boolean;
  btnFiltros: RefObject<HTMLButtonElement | null>;
  setFiltrosAbertos: (valor: boolean) => void;
  selecionarCarta: (carta: CartaColecao) => void;
  filtrosAbertos: boolean;
  raridade: string;
  elemento: string;
  classe: string;
  ordenacao: string;
  somenteFavoritas: boolean;
  setRaridade: (valor: string) => void;
  setElemento: (valor: string) => void;
  setClasse: (valor: string) => void;
  setOrdenacao: (valor: string) => void;
  setSomenteFavoritas: (valor: boolean) => void;
  decksAbertos: boolean;
  setDecksAbertos: (valor: boolean) => void;
  decks: Deck[];
  editandoId: string | null;
  novoDeck: () => void;
  editar: (deck: Deck) => void;
  equiparDeck: (deck: Deck) => Promise<void>;
  setDeckParaExcluir: (deck: Deck | null) => void;
  cartaDetalhada: CartaColecao | null;
  setCartaDetalhada: (carta: CartaColecao | null) => void;
  deckParaExcluir: Deck | null;
  excluindo: boolean;
  confirmarExclusao: () => Promise<void>;
}) {
  return (
    <>
      {inventarioModalAberto && portalPronto
        ? createPortal(
            <div
              className={styles.fundoInventario}
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-inventario-deck"
              onMouseDown={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setInventarioModalAberto(false);
                }
              }}
            >
              <div className={styles.painelInventarioModal}>
                <header className={styles.topoInventarioModal}>
                  <div>
                    <span>Montagem de deck</span>
                    <h2 id="titulo-inventario-deck">Escolher cartas</h2>
                  </div>
                  <div className={styles.acoesInventarioModal}>
                    <button
                      type="button"
                      onClick={() => {
                        setInventarioNaLateral(true);
                        setInventarioModalAberto(false);
                      }}
                      aria-label="Fixar inventário à direita"
                      title="Fixar à direita"
                    >
                      <PanelRightOpen aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setInventarioModalAberto(false)}
                      aria-label="Fechar inventário"
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </header>
                <InventarioDeck
                  cartas={cartasFiltradas}
                  cartasNoDeck={cartasSelecionadasIds}
                  busca={busca}
                  setBusca={setBusca}
                  filtrosAtivos={filtrosAtivos}
                  btnFiltros={btnFiltros}
                  aoAbrirFiltros={() => setFiltrosAbertos(true)}
                  aoSelecionar={selecionarCarta}
                  emModal
                />
              </div>
            </div>,
            document.body,
          )
        : null}

      {filtrosAbertos && portalPronto
        ? createPortal(
            <ModalFiltrosDeck
              raridade={raridade}
              elemento={elemento}
              classe={classe}
              ordenacao={ordenacao}
              somenteFavoritas={somenteFavoritas}
              quantidadeCartas={cartasFiltradas.length}
              setRaridade={setRaridade}
              setElemento={setElemento}
              setClasse={setClasse}
              setOrdenacao={setOrdenacao}
              setSomenteFavoritas={setSomenteFavoritas}
              aoFechar={() => {
                setFiltrosAbertos(false);
                requestAnimationFrame(() => btnFiltros.current?.focus());
              }}
            />,
            document.body,
          )
        : null}

      {decksAbertos && portalPronto
        ? createPortal(
            <div
              className={styles.fundoDecks}
              role="dialog"
              aria-modal="true"
              aria-labelledby="titulo-meus-decks"
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setDecksAbertos(false);
                }
              }}
            >
              <section className={styles.listaDecks}>
                <div className={styles.listaDecksTopo}>
                  <h2 id="titulo-meus-decks">
                    Meus decks <span>{decks.length}</span>
                  </h2>
                  <div className={styles.listaDecksBotoes}>
                    <button
                      type="button"
                      className={styles.novoDeckLista}
                      onClick={novoDeck}
                    >
                      <Plus aria-hidden="true" /> Novo
                    </button>
                    <button
                      type="button"
                      className={styles.fecharListaDecks}
                      onClick={() => setDecksAbertos(false)}
                      aria-label="Fechar meus decks"
                      autoFocus
                    >
                      <X aria-hidden="true" />
                    </button>
                  </div>
                </div>
                {!decks.length && (
                  <p className={styles.vazio}>Nenhum deck salvo ainda.</p>
                )}
                <div className={styles.gradeDecks}>
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
                                : "Adicione pelo menos uma carta"
                            }
                          >
                            <Check aria-hidden="true" />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setDecksAbertos(false);
                            setDeckParaExcluir(deck);
                          }}
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
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}

      {cartaDetalhada && portalPronto
        ? createPortal(
            <div
              className={estilosInventario.modalDetalhe}
              role="dialog"
              aria-modal="true"
              aria-label={`Detalhes da carta ${cartaDetalhada.nome}`}
              onClick={(evento) => {
                if (evento.target === evento.currentTarget) {
                  setCartaDetalhada(null);
                }
              }}
            >
              <DetalheCarta
                carta={mapearCarta(cartaDetalhada)}
                favorita={false}
                aoAlternarFavorita={() => {}}
                aoAdicionarAoDeck={() => {}}
                aoFechar={() => setCartaDetalhada(null)}
                modoDeck
              />
            </div>,
            document.body,
          )
        : null}

      {deckParaExcluir ? (
        <div
          className={styles.fundoConfirmacao}
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !excluindo) {
              setDeckParaExcluir(null);
            }
          }}
        >
          <section
            className={styles.popupConfirmacao}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-deck"
            aria-describedby="descricao-excluir-deck"
          >
            <button
              type="button"
              className={styles.fecharConfirmacao}
              onClick={() => setDeckParaExcluir(null)}
              disabled={excluindo}
              aria-label="Fechar confirmação"
            >
              <X aria-hidden="true" />
            </button>
            <span className={styles.iconeConfirmacao}>
              <AlertTriangle aria-hidden="true" />
            </span>
            <div>
              <small>Ação permanente</small>
              <h2 id="titulo-excluir-deck">Excluir deck?</h2>
              <p id="descricao-excluir-deck">
                O deck <strong>{deckParaExcluir.nome}</strong> será removido.
                Suas cartas continuarão na coleção.
              </p>
            </div>
            <footer>
              <button
                type="button"
                className={styles.btnCancelarExclusao}
                onClick={() => setDeckParaExcluir(null)}
                disabled={excluindo}
              >
                Cancelar
              </button>
              <button
                type="button"
                className={styles.btnConfirmarExclusao}
                onClick={() => void confirmarExclusao()}
                disabled={excluindo}
              >
                <Trash2 aria-hidden="true" />
                {excluindo ? "Excluindo..." : "Excluir deck"}
              </button>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
