"use client";

import {
  ArrowUpDown,
  ListFilter,
  ImagePlus,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  atualizarAdminCarta,
  listarAdminCartas,
  listarAdminClasses,
  removerAdminCarta,
  type AdminCarta,
  type AdminClasse,
  type UpdateAdminCartaPayload,
} from "../../lib/admin";
import {
  SelectPadrao,
} from "../../components/ui/controlesFormulario";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import editorStyles from "../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import {
  ElementoVisual,
  Raridade,
  obterElementoVisual,
} from "./adminCartaVisual";
import { AdminLayout } from "./adminShared";
import { CartaEditor } from "./adminCartaEditor";
import { combinarEstilos } from "./combinarEstilos";
import { FiltroCartasModal } from "./filtroCartasModal";

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
  const [excluindo, setExcluindo] = useState<AdminCarta | null>(null);

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
    if (
      editorAlterado &&
      !window.confirm(
        "Existem alterações não salvas. Deseja mesmo descartá-las?",
      )
    ) {
      return;
    }

    setEditorAlterado(false);
    setSelecionada(carta);
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
      if (
        !window.confirm(
          "Existem alterações não salvas. Deseja mesmo descartá-las?",
        )
      )
        return;

      setEditorAlterado(false);
      router.push(`${destino.pathname}${destino.search}${destino.hash}`);
    }

    document.addEventListener("click", confirmarNavegacao, true);
    return () =>
      document.removeEventListener("click", confirmarNavegacao, true);
  }, [editorAlterado, router]);

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
      setFeedback("Carta atualizada.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a edição.",
      );
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
                {cartasApi.map((carta) => (
                  <tr key={carta.id}>
                    <td>
                      <span className={styles.cardCell}>
                        <span
                          className={styles.cardThumb}
                          style={
                            carta.foto
                              ? { backgroundImage: `url("${carta.foto}")` }
                              : undefined
                          }
                        >
                          {!carta.foto ? (
                            <ImagePlus aria-label="Sem imagem" />
                          ) : null}
                        </span>
                        <strong
                          className={styles.nomeCartaElemento}
                          style={
                            {
                              "--elemento-cor": obterElementoVisual(
                                carta.elemento,
                              ).cor,
                            } as CSSProperties
                          }
                        >
                          {carta.nome}
                        </strong>
                      </span>
                    </td>
                    <td>
                      <Raridade value={carta.raridade} />
                    </td>
                    <td>
                      <ElementoVisual value={carta.elemento} />
                    </td>
                    <td>{carta.classe ?? "-"}</td>
                    <td>{carta.custo ?? "-"}</td>
                    <td>
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
                    <td>
                      <details className={styles.menuAcoesCarta}>
                        <summary aria-label={`Ações de ${carta.nome}`}>
                          <MoreHorizontal aria-hidden="true" />
                        </summary>
                        <div>
                          <button
                            type="button"
                            disabled={Boolean(carta.excluidoEm)}
                            onClick={() => selecionarCarta(carta)}
                          >
                            <Pencil aria-hidden="true" /> Editar
                          </button>
                          <button
                            type="button"
                            disabled={Boolean(carta.excluidoEm)}
                            onClick={() => setExcluindo(carta)}
                          >
                            <Trash2 aria-hidden="true" /> Excluir
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {modalFiltrosAberto ? <FiltroCartasModal
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
