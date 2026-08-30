"use client";

import {
  ArrowUpDown,
  ChevronDown,
  Edit3,
  ImagePlus,
  Power,
  Plus,
  RefreshCw,
  Save,
  Search,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  atualizarAdminCarta,
  criarAdminCarta,
  listarAdminCartas,
  removerAdminCarta,
  uploadCartaAssets,
  type AdminCarta,
  type CreateAdminCartaPayload,
  type UpdateAdminCartaPayload,
} from "../../lib/admin";
import {
  criarConfigVisualPadrao,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import editorStyles from "../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";

import {
  CampoArquivo,
  ControleVisualCarta,
  ElementoSelect,
  ElementoVisual,
  PreviewCarta,
  Raridade,
  StatusSelect,
  classesCarta,
  classeRaridade,
  obterElementoVisual,
  raridades,
} from "./adminCartaVisual";
import { AdminLayout } from "./adminShared";
import { AdminCartaHabilidades } from "./adminCartaHabilidades";
import { CartaEditor } from "./adminCartaEditor";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

type CartaFormState = {
  nome: string;
  raridade: CreateAdminCartaPayload["raridade"];
  elemento: CreateAdminCartaPayload["elemento"];
  classe: string;
  custo: string;
  hpBase: string;
  danoBase: string;
  defesaBase: string;
  habilidadesIds: string[];
  ativo: boolean;
  configVisual: ConfigVisualCarta;
};

const periodosFiltro = [
  { value: "", label: "Todos" },
  { value: "1a", label: "1 ano" },
  { value: "6m", label: "6 meses" },
  { value: "1m", label: "1 mês" },
  { value: "1s", label: "1 semana" },
  { value: "24h", label: "24h" },
] as const;

function criarFormularioNovaCarta(): CartaFormState {
  return {
    nome: "",
    raridade: "N",
    elemento: "natureza",
    classe: "",
    custo: "1",
    hpBase: "100",
    danoBase: "20",
    defesaBase: "10",
    habilidadesIds: [],
    ativo: true,
    configVisual: criarConfigVisualPadrao(),
  };
}

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
  const [selecionada, setSelecionada] = useState<AdminCarta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [editorAlterado, setEditorAlterado] = useState(false);

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  useEffect(() => {
    if (feedback) notificarSucesso(feedback);
  }, [feedback]);

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
              <label className={styles.ordenacaoCartas}>
                <ArrowUpDown aria-hidden="true" />
                <span className={styles.srOnly}>Ordenar cartas</span>
                <select
                  value={ordem}
                  onChange={(event) => setOrdem(event.target.value)}
                >
                  <option value="recentes">Mais recentes</option>
                  <option value="antigas">Mais antigas</option>
                  <option value="az">Nome A–Z</option>
                  <option value="za">Nome Z–A</option>
                </select>
              </label>
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
                  <th>Custo</th>
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
                      <span className={styles.rowActions}>
                        <button
                          type="button"
                          className={
                            selecionada?.id === carta.id
                              ? styles.rowActionSelected
                              : undefined
                          }
                          onClick={() =>
                            selecionarCarta(
                              selecionada?.id === carta.id ? null : carta,
                            )
                          }
                          disabled={Boolean(carta.excluidoEm)}
                          title={
                            carta.excluidoEm
                              ? "Carta removida"
                              : selecionada?.id === carta.id
                                ? "Carta em edição"
                                : "Editar"
                          }
                          aria-label={`Editar ${carta.nome}`}
                          aria-pressed={selecionada?.id === carta.id}
                        >
                          <Edit3 aria-hidden="true" />
                        </button>
                      </span>
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
          <label>
            <Search aria-hidden="true" />
            <input
              placeholder="Buscar cartas..."
              value={busca}
              onChange={(event) => setBusca(event.target.value)}
            />
          </label>
          <select
            className={`${styles.selectRaridade} ${classeRaridade(filtroRaridade)}`}
            value={filtroRaridade}
            onChange={(event) => setFiltroRaridade(event.target.value)}
          >
            <option value="">Raridade</option>
            {raridades.map((raridade) => (
              <option className={classeRaridade(raridade)} key={raridade}>
                {raridade}
              </option>
            ))}
          </select>
          <ElementoSelect
            value={filtroElemento as CreateAdminCartaPayload["elemento"] | ""}
            placeholder="Elemento"
            onChange={setFiltroElemento}
          />
          <StatusSelect
            value={filtroStatus as "" | "ativas" | "inativas" | "removidas"}
            onChange={setFiltroStatus}
          />
          <select
            value={filtroClasse}
            onChange={(event) => setFiltroClasse(event.target.value)}
          >
            <option value="">Classe</option>
            {classesCarta.map((classe) => (
              <option key={classe} value={classe}>
                {classe}
              </option>
            ))}
          </select>
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
        <CartaEditor
          key={selecionada.id}
          carta={selecionada}
          onClose={() => selecionarCarta(null)}
          onDirtyChange={setEditorAlterado}
          onSave={(payload) => salvarEdicao(selecionada, payload)}
          onDelete={() => removerCarta(selecionada)}
          salvando={salvando}
        />
      ) : null}
    </AdminLayout>
  );
}

export function NovaCarta() {
  const [form, setForm] = useState<CartaFormState>(criarFormularioNovaCarta);
  const [foto, setFoto] = useState<File | null>(null);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [molduraPreviewUrl, setMolduraPreviewUrl] = useState<string | null>(
    null,
  );
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    if (!feedback) return;
    if (feedback.type === "success") notificarSucesso(feedback.text);
    else notificarErro(feedback.text);
  }, [feedback]);

  function updateField<K extends keyof CartaFormState>(
    field: K,
    value: CartaFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetarInformacoes() {
    const padrao = criarFormularioNovaCarta();
    setForm((atual) => ({
      ...atual,
      nome: padrao.nome,
      raridade: padrao.raridade,
      elemento: padrao.elemento,
      classe: padrao.classe,
      habilidadesIds: padrao.habilidadesIds,
      ativo: padrao.ativo,
    }));
  }

  function resetarEstatisticas() {
    const padrao = criarFormularioNovaCarta();
    setForm((atual) => ({
      ...atual,
      custo: padrao.custo,
      hpBase: padrao.hpBase,
      danoBase: padrao.danoBase,
      defesaBase: padrao.defesaBase,
    }));
  }

  function handleFotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFoto(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleMolduraChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMoldura(file);
    setMolduraPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFeedback(null);
    setSalvando(true);

    try {
      const payload: CreateAdminCartaPayload = {
        nome: form.nome.trim(),
        raridade: form.raridade,
        elemento: form.elemento,
        classe: form.classe.trim() || undefined,
        custo: toNumber(form.custo, "Custo"),
        hpBase: toNumber(form.hpBase, "HP"),
        danoBase: toNumber(form.danoBase, "ATK"),
        defesaBase: toNumber(form.defesaBase, "DEF"),
        habilidadesIds: form.habilidadesIds,
        ativo: form.ativo,
        configVisual: form.configVisual,
      };

      if (foto || moldura) {
        const formData = new FormData();
        if (foto) formData.append("foto", foto);
        if (moldura) formData.append("moldura", moldura);

        const upload = await uploadCartaAssets(formData);
        payload.foto = upload.foto?.url;
        payload.moldura = upload.moldura?.url;
      }

      const carta = await criarAdminCarta(payload);
      setFeedback({
        type: "success",
        text: `Carta ${carta.nome} salva com sucesso.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a carta.",
      });
    } finally {
      setSalvando(false);
    }
  }

  const cardImage = previewUrl ?? undefined;
  const cardFrame = molduraPreviewUrl ?? undefined;

  return (
    <AdminLayout
      title="Nova Carta"
      subtitle="Criar uma nova carta para o jogo."
    >
      <form className={styles.editorGrid} onSubmit={handleSubmit}>
        <section className={styles.formPanel}>
          <div className={styles.novaCartaStatus}>
            <span>
              <Power aria-hidden="true" />
              <strong>Status inicial</strong>
            </span>
            <div role="group" aria-label="Status inicial da carta">
              <button
                type="button"
                className={form.ativo ? styles.statusInicialAtivo : undefined}
                aria-pressed={form.ativo}
                onClick={() => updateField("ativo", true)}
              >
                Ativa
              </button>
              <button
                type="button"
                className={
                  !form.ativo ? styles.statusInicialInativo : undefined
                }
                aria-pressed={!form.ativo}
                onClick={() => updateField("ativo", false)}
              >
                Inativa
              </button>
            </div>
          </div>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Informações</strong>
                <small>Identidade, classificação e efeitos da carta</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}>
                <button type="button" onClick={resetarInformacoes}>
                  <RefreshCw aria-hidden="true" /> Restaurar informações
                </button>
              </div>
              <label>
                Nome da carta
                <input
                  className={styles.nomePersonagemElemento}
                  style={
                    {
                      "--elemento-cor": obterElementoVisual(form.elemento).cor,
                    } as CSSProperties
                  }
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  required
                />
              </label>
              <label>
                Raridade
                <select
                  className={`${styles.selectRaridade} ${classeRaridade(form.raridade)}`}
                  value={form.raridade}
                  onChange={(event) =>
                    updateField(
                      "raridade",
                      event.target.value as CartaFormState["raridade"],
                    )
                  }
                >
                  {raridades.map((raridade) => (
                    <option className={classeRaridade(raridade)} key={raridade}>
                      {raridade}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Elemento
                <ElementoSelect
                  value={form.elemento}
                  onChange={(value) => {
                    if (value) updateField("elemento", value);
                  }}
                />
              </label>
              <label>
                Classe
                <select
                  value={form.classe}
                  onChange={(event) =>
                    updateField("classe", event.target.value)
                  }
                >
                  <option value="">Selecione</option>
                  {classesCarta.map((classe) => (
                    <option key={classe}>{classe}</option>
                  ))}
                </select>
              </label>
              <AdminCartaHabilidades
                selecionadasIds={form.habilidadesIds}
                aoAlterar={(ids) => updateField("habilidadesIds", ids)}
              />
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Estatísticas</strong>
                <small>Custo, vida, ataque e defesa</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}>
                <button type="button" onClick={resetarEstatisticas}>
                  <RefreshCw aria-hidden="true" /> Restaurar estatísticas
                </button>
              </div>
              <label>
                Custo
                <input
                  inputMode="numeric"
                  value={form.custo}
                  onChange={(event) => updateField("custo", event.target.value)}
                />
              </label>
              <label>
                HP
                <input
                  inputMode="numeric"
                  value={form.hpBase}
                  onChange={(event) =>
                    updateField("hpBase", event.target.value)
                  }
                />
              </label>
              <label>
                ATK
                <input
                  inputMode="numeric"
                  value={form.danoBase}
                  onChange={(event) =>
                    updateField("danoBase", event.target.value)
                  }
                />
              </label>
              <label>
                DEF
                <input
                  inputMode="numeric"
                  value={form.defesaBase}
                  onChange={(event) =>
                    updateField("defesaBase", event.target.value)
                  }
                />
              </label>
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Personalizar</strong>
                <small>Arte, moldura e encaixe visual</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <CampoArquivo
                rotulo="Foto/personagem"
                accept="image/*"
                ajuda="PNG, JPG ou WEBP, até 5 MB."
                onChange={handleFotoChange}
              />
              <CampoArquivo
                rotulo="Moldura"
                accept="image/png,image/webp"
                ajuda="PNG ou WEBP transparente, proporção 2:3."
                onChange={handleMolduraChange}
              />
              <ControleVisualCarta
                value={form.configVisual}
                arte={cardImage}
                moldura={cardFrame}
                onChange={(configVisual) =>
                  updateField("configVisual", configVisual)
                }
              />
            </div>
          </details>
        </section>
        <aside className={styles.previewPanel}>
          <h2>Pré-visualização</h2>
          <PreviewCarta
            arte={cardImage}
            moldura={cardFrame}
            nome={form.nome || "Nova Carta"}
            raridade={form.raridade}
            elemento={form.elemento}
            classe={form.classe}
            hpBase={Number(form.hpBase) || 0}
            danoBase={Number(form.danoBase) || 0}
            defesaBase={Number(form.defesaBase) || 0}
            configVisual={form.configVisual}
          />
          <div className={styles.editorActions}>
            <Link href="/admin/cartas">Cancelar</Link>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={salvando}
            >
              <Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}

function toNumber(value: string, label: string) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} precisa ser um número inteiro positivo.`);
  }

  return number;
}
