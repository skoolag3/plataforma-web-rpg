"use client";

import {
  ArrowUpDown,
  ListFilter,
  ImagePlus,
  History,
  Gem,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import { CartaMontada } from "../../../components/cartaMontada";
import {
  atualizarAdminCarta,
  listarAdminCartas,
  listarAdminClasses,
  removerAdminCarta,
  type AdminCarta,
  type AdminClasse,
  type UpdateAdminCartaPayload,
} from "../../../lib/admin";
import {
  SelectPadrao,
} from "../../../components/ui/controlesFormulario";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import editorStyles from "../../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../../styles/admin/adminCartasLista.module.css";
import {
  ElementoVisual,
  Raridade,
  obterElementoVisual,
} from "./adminCartaVisual";
import { AdminLayout, NomeComAlerta } from "../shared/adminShared";
import { CartaEditor } from "./adminCartaEditor";
import { combinarEstilos } from "../shared/combinarEstilos";
import { FiltroCartasModal } from "./filtroCartasModal";
import { useAdminRaridades } from "./useAdminRaridades";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

const periodosFiltro = [
  { value: "", label: "Todos" },
  { value: "1a", label: "1 ano" },
  { value: "6m", label: "6 meses", labelCurto: "6m" },
  { value: "1m", label: "1 mês", labelCurto: "1m" },
  { value: "1s", label: "1 semana", labelCurto: "7d" },
  { value: "24h", label: "24h" },
] as const;

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return (
    <span className={ativo ? styles.statusAtivo : styles.statusInativo}>
      {value}
    </span>
  );
}

export function Cartas() {
  const raridades = useAdminRaridades();
  const router = useRouter();
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [filtroRaridade, setFiltroRaridade] = useState("");
  const [filtroElemento, setFiltroElemento] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroClasse, setFiltroClasse] = useState("");
  const [filtroPeriodo, setFiltroPeriodo] = useState("");
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);
  const btnFiltrosRef = useRef<HTMLButtonElement>(null);
  const [ordem, setOrdem] = useState("recentes");
  const [cartasApi, setCartasApi] = useState<AdminCarta[]>([]);
  const [classesApi, setClassesApi] = useState<AdminClasse[]>([]);
  const [selecionada, setSelecionada] = useState<AdminCarta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editorAlterado, setEditorAlterado] = useState(false);
  const [descartePendente, setDescartePendente] = useState<
    { tipo: "carta"; carta: AdminCarta | null } | { tipo: "navegacao"; destino: string } | null
  >(null);
  const [excluindo, setExcluindo] = useState<AdminCarta | null>(null);
  const [menuAcoesAbertoId, setMenuAcoesAbertoId] = useState<string | null>(null);

  function fecharModalFiltros() {
    setModalFiltrosAberto(false);
    requestAnimationFrame(() => btnFiltrosRef.current?.focus());
  }

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  useEffect(() => {
    if (feedback) notificarSucesso(feedback);
  }, [feedback]);

  useEffect(() => {
    if (!selecionada && !excluindo) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = overflowAnterior;
    };
  }, [selecionada, excluindo]);

  useEffect(() => {
    const carregarClasses = () =>
      listarAdminClasses()
        .then(setClassesApi)
        .catch(() => setClassesApi([]));
    void carregarClasses();
    window.addEventListener("admin-classes-updated", carregarClasses);
    return () =>
      window.removeEventListener("admin-classes-updated", carregarClasses);
  }, []);

  function selecionarCarta(carta: AdminCarta | null) {
    if (editorAlterado) {
      setDescartePendente({ tipo: "carta", carta });
      return;
    }

    setEditorAlterado(false);
    setSelecionada(carta);
  }

  function confirmarDescarte() {
    if (!descartePendente) return;
    const pendente = descartePendente;
    setDescartePendente(null);
    setEditorAlterado(false);
    if (pendente.tipo === "carta") {
      setSelecionada(pendente.carta);
    } else {
      router.push(pendente.destino);
    }
  }

  useEffect(() => {
    function confirmarNavegacao(event: MouseEvent) {
      if (!editorAlterado || event.defaultPrevented || event.button !== 0)
        return;
      const link = (event.target as Element | null)?.closest(
        "a[href]",
      ) as HTMLAnchorElement | null;
      if (!link || link.target === "_blank" || link.hasAttribute("download"))
        return;

      const destino = new URL(link.href, window.location.href);
      if (destino.origin !== window.location.origin) return;

      event.preventDefault();
      setDescartePendente({
        tipo: "navegacao",
        destino: `${destino.pathname}${destino.search}${destino.hash}`,
      });
    }

    document.addEventListener("click", confirmarNavegacao, true);
    return () =>
      document.removeEventListener("click", confirmarNavegacao, true);
  }, [editorAlterado]);

  async function carregarCartas() {
    setCarregando(true);
    setErro(null);

    try {
      const cartas = await listarAdminCartas({
        busca: buscaAplicada,
        raridade: filtroRaridade,
        elemento: filtroElemento,
        status: filtroStatus,
        classe: filtroClasse,
        periodo: filtroPeriodo,
        ordem,
      });
      setCartasApi(cartas);
      setSelecionada((current) => {
        if (!current) return null;
        return (
          cartas.find((carta) => carta.id === current.id) ??
          (editorAlterado ? current : null)
        );
      });
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar as cartas.",
      );
    } finally {
      setCarregando(false);
    }
  }

  async function removerCarta(carta: AdminCarta) {
    setSalvando(true);
    setFeedback(null);

    try {
      await removerAdminCarta(carta.id, carta.nome, true);
      setCartasApi((current) => current.filter((item) => item.id !== carta.id));
      setSelecionada((current) => (current?.id === carta.id ? null : current));
      setExcluindo(null);
      setFeedback(
        "Carta removida com segurança. O registro foi preservado no histórico.",
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível remover a carta.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(
    carta: AdminCarta,
    payload: UpdateAdminCartaPayload,
  ) {
    setSalvando(true);
    setErro(null);
    setFeedback(null);

    try {
      const atualizada = await atualizarAdminCarta(carta.id, payload);
      setCartasApi((current) =>
        current.map((item) => (item.id === atualizada.id ? atualizada : item)),
      );
      setSelecionada(atualizada);
      setEditorAlterado(false);
      setFeedback("Carta atualizada.");
      return atualizada;
    } catch (error) {
      const falha =
        error instanceof Error
          ? error
          : new Error("Não foi possível salvar a edição.");
      setErro(falha.message);
      throw falha;
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaAplicada(busca.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    void carregarCartas();
    // A busca ja chega estabilizada; selects disparam esta atualizacao imediatamente.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    buscaAplicada,
    filtroClasse,
    filtroElemento,
    filtroPeriodo,
    filtroRaridade,
    filtroStatus,
    ordem,
  ]);

  return (
    <AdminLayout title="Cartas" subtitle="Gerencie todas as cartas do jogo.">
      <div className={`${styles.cartasWorkspace} ${listaStyles.cartasWorkspaceUnica}`}>
        <section className={styles.cartasListaPanel}>
          <header className={styles.cartasListaTopo}>
            <div className={styles.cartasListaEsquerda}>
              <div className={styles.cartasListaTitulo}>
                <strong>Cartas cadastradas</strong>
                <small>
                  {cartasApi.length}{" "}
                  {cartasApi.length === 1 ? "resultado" : "resultados"}
                </small>
              </div>
              <form className={styles.pesquisaCartas} role="search" onSubmit={(evento) => {
                evento.preventDefault();
                setBuscaAplicada(busca.trim());
              }}>
                <input
                  type="search"
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  placeholder="Buscar cartas..."
                  aria-label="Buscar cartas"
                />
                <button type="submit" aria-label="Pesquisar cartas" title="Pesquisar cartas">
                  <Search aria-hidden="true" />
                </button>
              </form>
              <button
                ref={btnFiltrosRef}
                type="button"
                className={styles.btnFiltros}
                aria-haspopup="dialog"
                aria-expanded={modalFiltrosAberto}
                aria-label="Abrir filtros de cartas"
                data-ativo={filtroRaridade || filtroElemento || filtroStatus || filtroClasse || filtroPeriodo ? "true" : undefined}
                onClick={() => setModalFiltrosAberto(true)}
              >
                <ListFilter aria-hidden="true" /> Filtros
              </button>
            </div>
            <div className={styles.cartasListaAcoes}>
              <Link href="/admin/cartas/historico" className={styles.btnHistoricoCartas}>
                <History aria-hidden="true" /> Histórico
              </Link>
              <Link href="/admin/cartas/raridades" className={styles.btnHistoricoCartas}>
                <Gem aria-hidden="true" /> Raridades
              </Link>
              <SelectPadrao
                className={styles.ordenacaoCartas}
                ariaLabel="Ordenar cartas"
                placeholder="Ordenar cartas"
                valor={ordem}
                aoAlterar={setOrdem}
                opcoes={[
                  {
                    valor: "recentes",
                    label: "Mais recentes",
                    icone: <ArrowUpDown />,
                  },
                  {
                    valor: "antigas",
                    label: "Mais antigas",
                    icone: <ArrowUpDown />,
                  },
                  { valor: "az", label: "Nome A–Z", icone: <ArrowUpDown /> },
                  { valor: "za", label: "Nome Z–A", icone: <ArrowUpDown /> },
                ]}
              />
              <Link href="/admin/cartas/nova" className={styles.primaryBtn}>
                <Plus aria-hidden="true" /> Nova Carta
              </Link>
            </div>
          </header>

          {carregando ? (
            <p className={styles.feedbackInfo}>Carregando cartas...</p>
          ) : null}
          <div className={styles.tableWrap}>
            <table>
              <thead>
                <tr>
                  <th>Carta</th>
                  <th>Raridade</th>
                  <th>Elemento</th>
                  <th>Classe</th>
                  <th>Venda</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {!carregando && !erro && cartasApi.length === 0 ? (
                  <tr className={styles.emptyTableRow}>
                    <td colSpan={7}>Nenhuma carta encontrada.</td>
                  </tr>
                ) : null}
                {cartasApi.map((carta) => {
                  const semHabilidade =
                    carta.ativo &&
                    !carta.excluidoEm &&
                    (!carta.habilidades || carta.habilidades.length === 0);
                  return (
                  <tr key={carta.id}>
                    <td data-label="Carta">
                      <span className={styles.cardCell}>
                        <span className={styles.cardThumb}>
                          <CartaMontada
                            arte={carta.foto ?? undefined}
                            moldura={carta.moldura ?? undefined}
                            config={carta.configVisual ?? undefined}
                            placeholder={<ImagePlus aria-label="Sem imagem" />}
                          />
                        </span>
                        <NomeComAlerta
                          nome={carta.nome}
                          tom="vermelho"
                          motivo={
                            semHabilidade
                              ? "Carta ativa sem habilidade vinculada."
                              : null
                          }
                          className={styles.nomeCartaElemento}
                          style={
                            {
                              "--elemento-cor": obterElementoVisual(
                                carta.elemento,
                              ).cor,
                            } as CSSProperties
                          }
                        />
                      </span>
                    </td>
                    <td data-label="Raridade">
                      <Raridade value={carta.raridade} nome={raridades.find((item) => item.codigo === carta.raridade)?.nome} cor={raridades.find((item) => item.codigo === carta.raridade)?.cor} />
                    </td>
                    <td data-label="Elemento">
                      <ElementoVisual value={carta.elemento} />
                    </td>
                    <td data-label="Classe">{carta.classe ?? "-"}</td>
                    <td data-label="Venda">{carta.custo ?? "-"}</td>
                    <td data-label="Status">
                      <Status
                        value={
                          carta.excluidoEm
                            ? "Removida"
                            : carta.ativo
                              ? "Ativa"
                              : "Inativa"
                        }
                      />
                    </td>
                    <td data-label="Ações">
                      <details
                        className={styles.menuAcoesCarta}
                        open={menuAcoesAbertoId === carta.id}
                      >
                        <summary
                          aria-label={`Ações de ${carta.nome}`}
                          onClick={(event) => {
                            event.preventDefault();
                            setMenuAcoesAbertoId((atual) =>
                              atual === carta.id ? null : carta.id,
                            );
                          }}
                        >
                          <MoreHorizontal aria-hidden="true" />
                        </summary>
                        <div>
                          <button
                            type="button"
                            disabled={Boolean(carta.excluidoEm)}
                            onClick={() => {
                              setMenuAcoesAbertoId(null);
                              selecionarCarta(carta);
                            }}
                          >
                            <Pencil aria-hidden="true" /> Editar
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(carta.excluidoEm)}
                            onClick={() => {
                              setMenuAcoesAbertoId(null);
                              setExcluindo(carta);
                            }}
                          >
                            <Trash2 aria-hidden="true" /> Excluir
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {modalFiltrosAberto ? <FiltroCartasModal
        raridades={raridades}
        raridade={filtroRaridade}
        setRaridade={setFiltroRaridade}
        elemento={filtroElemento}
        setElemento={setFiltroElemento}
        status={filtroStatus}
        setStatus={setFiltroStatus}
        classe={filtroClasse}
        setClasse={setFiltroClasse}
        periodo={filtroPeriodo}
        setPeriodo={setFiltroPeriodo}
        periodos={periodosFiltro}
        classes={classesApi}
        aoFechar={fecharModalFiltros}
      /> : null}

      {selecionada ? (
        <div className={styles.modalCartaBackdrop} role="presentation">
          <CartaEditor
            key={selecionada.id}
            carta={selecionada}
            onClose={() => selecionarCarta(null)}
            onDirtyChange={setEditorAlterado}
            onSave={(payload) => salvarEdicao(selecionada, payload)}
            onDelete={() => removerCarta(selecionada)}
            salvando={salvando}
          />
        </div>
      ) : null}

      {descartePendente ? (
        <div className={styles.modalCartaBackdrop} role="presentation">
          <section
            className={`${styles.confirmarExclusaoCarta} ${styles.confirmarDescarteCarta}`}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-descartar-carta"
            aria-describedby="descricao-descartar-carta"
          >
            <h2 id="titulo-descartar-carta">Descartar alterações?</h2>
            <p id="descricao-descartar-carta">
              Existem alterações não salvas nesta carta. Se continuar, elas serão perdidas.
            </p>
            <div>
              <button type="button" autoFocus onClick={() => setDescartePendente(null)}>
                Continuar editando
              </button>
              <button type="button" onClick={confirmarDescarte}>
                Descartar alterações
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {excluindo ? (
        <div className={styles.modalCartaBackdrop} role="presentation">
          <section
            className={styles.confirmarExclusaoCarta}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="titulo-excluir-carta"
          >
            <Trash2 aria-hidden="true" />
            <h2 id="titulo-excluir-carta">Excluir {excluindo.nome}?</h2>
            <p>
              A carta deixará de aparecer no jogo, mas o histórico será
              preservado.
            </p>
            <div>
              <button type="button" onClick={() => setExcluindo(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void removerCarta(excluindo)}
              >
                {salvando ? "Excluindo..." : "Excluir carta"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}

export { NovaCarta } from "./adminNovaCarta";
