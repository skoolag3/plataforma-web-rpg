"use client";

import {
  ArrowUpDown,
  CheckCircle2,
  CircleOff,
  Gem,
  ImagePlus,
  History,
  MoreHorizontal,
  Pencil,
  Plus,
  Shapes,
  Shield,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type CSSProperties } from "react";
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
  CampoBusca,
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
  elementos,
  obterElementoVisual,
  raridades,
} from "./adminCartaVisual";
import { AdminLayout } from "./adminShared";
import { CartaEditor } from "./adminCartaEditor";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

const periodosFiltro = [
  { value: "", label: "Todos" },
  { value: "1a", label: "1 ano" },
  { value: "6m", label: "6 meses" },
  { value: "1m", label: "1 mês" },
  { value: "1s", label: "1 semana" },
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
      <div className={styles.cartasWorkspace}>
        <section className={styles.cartasListaPanel}>
          <header className={styles.cartasListaTopo}>
            <div>
              <strong>Cartas cadastradas</strong>
              <small>
                {cartasApi.length}{" "}
                {cartasApi.length === 1 ? "resultado" : "resultados"}
              </small>
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

        <aside
          className={`${styles.toolbar} ${styles.cartasToolbar}`}
          aria-label="Filtros de cartas"
        >
          <header className={styles.filtrosTopo}>
            <strong>Filtros</strong>
            <small>Atualização automática</small>
          </header>
          <CampoBusca
            className={styles.buscaCartas}
            placeholder="Buscar cartas..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            aoLimpar={() => setBusca("")}
          />
          <SelectPadrao
            className={styles.controlePadrao}
            placeholder="Raridade"
            valor={filtroRaridade}
            aoAlterar={setFiltroRaridade}
            opcoes={[
              {
                valor: "",
                label: "Todas as raridades",
                labelCurto: "Raridade",
                icone: <Gem />,
              },
              ...raridades.map((raridade) => ({
                valor: raridade,
                label: raridade,
                icone: <Gem />,
                cor: {
                  UR: "#e879f9",
                  SSR: "#facc15",
                  SR: "#67e8f9",
                  R: "#a78bfa",
                  N: "#94a3b8",
                }[raridade],
              })),
            ]}
          />
          <SelectPadrao
            className={styles.controlePadrao}
            placeholder="Elemento"
            valor={filtroElemento}
            aoAlterar={setFiltroElemento}
            opcoes={[
              {
                valor: "",
                label: "Todos os elementos",
                labelCurto: "Elemento",
                icone: <Shapes />,
              },
              ...elementos.map((elemento) => ({
                valor: elemento.value,
                label: elemento.label,
                cor: elemento.cor,
                icone: (
                  <span
                    className={styles.iconeOpcaoElemento}
                    style={{ backgroundImage: `url("${elemento.icone}")` }}
                  />
                ),
              })),
            ]}
          />
          <SelectPadrao
            className={styles.controlePadrao}
            placeholder="Status"
            valor={filtroStatus}
            aoAlterar={setFiltroStatus}
            opcoes={[
              {
                valor: "",
                label: "Todos os status",
                labelCurto: "Status",
                icone: <Shield />,
              },
              {
                valor: "ativas",
                label: "Ativas",
                cor: "#4ade80",
                icone: <CheckCircle2 />,
              },
              {
                valor: "inativas",
                label: "Inativas",
                cor: "#fbbf24",
                icone: <CircleOff />,
              },
              {
                valor: "removidas",
                label: "Removidas",
                cor: "#f87171",
                icone: <Trash2 />,
              },
            ]}
          />
          <SelectPadrao
            className={styles.controlePadrao}
            placeholder="Classe"
            valor={filtroClasse}
            aoAlterar={setFiltroClasse}
            opcoes={[
              {
                valor: "",
                label: "Todas as classes",
                labelCurto: "Classe",
                icone: <Shield />,
              },
              ...classesApi.map((classe) => ({
                valor: classe.nome,
                label: classe.nome,
                icone: <Shield />,
              })),
            ]}
          />
          <div className={styles.periodoFiltro}>
            <div className={styles.periodoCabecalho}>
              <span>Período de cadastro</span>
              <strong>
                {
                  periodosFiltro.find(
                    (periodo) => periodo.value === filtroPeriodo,
                  )?.label
                }
              </strong>
            </div>
            <input
              type="range"
              min="0"
              max={periodosFiltro.length - 1}
              step="1"
              value={periodosFiltro.findIndex(
                (periodo) => periodo.value === filtroPeriodo,
              )}
              aria-label="Período de cadastro"
              aria-valuetext={
                periodosFiltro.find(
                  (periodo) => periodo.value === filtroPeriodo,
                )?.label
              }
              style={
                {
                  "--periodo-progresso": `${(periodosFiltro.findIndex((periodo) => periodo.value === filtroPeriodo) / (periodosFiltro.length - 1)) * 100}%`,
                } as CSSProperties
              }
              onChange={(event) =>
                setFiltroPeriodo(
                  periodosFiltro[Number(event.target.value)].value,
                )
              }
            />
            <div className={styles.periodoMetas} aria-hidden="true">
              {periodosFiltro.map((periodo) => (
                <span key={periodo.value || "todos"}>{periodo.label}</span>
              ))}
            </div>
          </div>
        </aside>
      </div>

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
