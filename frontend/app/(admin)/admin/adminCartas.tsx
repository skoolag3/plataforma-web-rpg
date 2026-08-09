"use client";

import {
  ChevronDown,
  Edit3,
  Eye,
  ImagePlus,
  Plus,
  RefreshCw,
  Save,
  Search,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import {
  atualizarAdminCarta,
  criarAdminCarta,
  listarAdminCartas,
  removerAdminCarta,
  uploadCartaAssets,
  type AdminCarta,
  type CreateAdminCartaPayload,
} from "../../lib/admin";
import {
  criarConfigVisualPadrao,
  normalizarConfigVisual,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import styles from "../../styles/admin/admin.module.css";
import {
  CampoArquivo,
  ControleVisualCarta,
  PreviewCarta,
  Raridade,
  classeRaridade,
  elementos,
  raridades,
} from "./adminCartaVisual";
import { AdminLayout } from "./adminShared";

type CartaFormState = {
  nome: string;
  raridade: CreateAdminCartaPayload["raridade"];
  elemento: CreateAdminCartaPayload["elemento"];
  classe: string;
  custo: string;
  hpBase: string;
  danoBase: string;
  defesaBase: string;
  passiva: string;
  ativo: boolean;
  configVisual: ConfigVisualCarta;
};

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
    passiva: "{}",
    ativo: true,
    configVisual: criarConfigVisualPadrao(),
  };
}

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return <span className={ativo ? styles.statusAtivo : styles.statusInativo}>{value}</span>;
}


export function Cartas() {
  const [busca, setBusca] = useState("");
  const [filtroRaridade, setFiltroRaridade] = useState("");
  const [filtroElemento, setFiltroElemento] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [cartasApi, setCartasApi] = useState<AdminCarta[]>([]);
  const [selecionada, setSelecionada] = useState<AdminCarta | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregarCartas() {
    setCarregando(true);
    setErro(null);

    try {
      const cartas = await listarAdminCartas({
        busca,
        raridade: filtroRaridade,
        elemento: filtroElemento,
        status: filtroStatus,
      });
      setCartasApi(cartas);
      setSelecionada((current) => {
        if (!current) return null;
        return cartas.find((carta) => carta.id === current.id) ?? null;
      });
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar as cartas.");
    } finally {
      setCarregando(false);
    }
  }

  async function alternarStatus(carta: AdminCarta) {
    setSalvando(true);
    setFeedback(null);

    try {
      const atualizada = await atualizarAdminCarta(carta.id, { ativo: !carta.ativo });
      setCartasApi((current) => current.map((item) => (item.id === atualizada.id ? atualizada : item)));
      setSelecionada((current) => (current?.id === atualizada.id ? atualizada : current));
      setFeedback(`Carta ${atualizada.ativo ? "ativada" : "inativada"}.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar a carta.");
    } finally {
      setSalvando(false);
    }
  }

  async function removerCarta(carta: AdminCarta) {
    if (!window.confirm(`Remover ${carta.nome}?`)) {
      return;
    }

    setSalvando(true);
    setFeedback(null);

    try {
      await removerAdminCarta(carta.id);
      setCartasApi((current) => current.filter((item) => item.id !== carta.id));
      setSelecionada((current) => (current?.id === carta.id ? null : current));
      setFeedback("Carta removida.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível remover a carta.");
    } finally {
      setSalvando(false);
    }
  }

  async function salvarEdicao(carta: AdminCarta, payload: CreateAdminCartaPayload) {
    setSalvando(true);
    setErro(null);
    setFeedback(null);

    try {
      const atualizada = await atualizarAdminCarta(carta.id, payload);
      setCartasApi((current) => current.map((item) => (item.id === atualizada.id ? atualizada : item)));
      setSelecionada(atualizada);
      setFeedback("Carta atualizada.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível salvar a edição.");
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    void carregarCartas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout title="Cartas" subtitle="Gerencie todas as cartas do jogo.">
      <form
        className={`${styles.toolbar} ${styles.cartasToolbar}`}
        onSubmit={(event) => {
          event.preventDefault();
          void carregarCartas();
        }}
      >
        <label>
          <Search aria-hidden="true" />
          <input
            placeholder="Buscar cartas..."
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
          />
        </label>
        <select className={`${styles.selectRaridade} ${classeRaridade(filtroRaridade)}`} value={filtroRaridade} onChange={(event) => setFiltroRaridade(event.target.value)}>
          <option value="">Raridade</option>
          {raridades.map((raridade) => <option className={classeRaridade(raridade)} key={raridade}>{raridade}</option>)}
        </select>
        <select value={filtroElemento} onChange={(event) => setFiltroElemento(event.target.value)}>
          <option value="">Elemento</option>
          {elementos.map((elemento) => (
            <option key={elemento.value} value={elemento.value}>{elemento.label}</option>
          ))}
        </select>
        <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)}>
          <option value="">Status</option>
          <option value="ativas">Ativas</option>
          <option value="inativas">Inativas</option>
          <option value="removidas">Removidas</option>
        </select>
        <button type="submit"><RefreshCw aria-hidden="true" /> Filtrar</button>
        <Link href="/admin/cartas/nova" className={styles.primaryBtn}><Plus aria-hidden="true" /> Nova Carta</Link>
      </form>

      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {feedback ? <p className={styles.feedbackSuccess}>{feedback}</p> : null}
      {carregando ? <p className={styles.feedbackInfo}>Carregando cartas...</p> : null}
      {!carregando && !erro && cartasApi.length === 0 ? (
        <p className={styles.feedbackInfo}>Nenhuma carta encontrada.</p>
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
            {cartasApi.map((carta) => (
              <tr key={carta.id}>
                <td>
                  <span className={styles.cardCell}>
                    <span
                      className={styles.cardThumb}
                      style={carta.foto ? { backgroundImage: `url("${carta.foto}")` } : undefined}
                    >{!carta.foto ? <ImagePlus aria-label="Sem imagem" /> : null}</span>
                    {carta.nome}
                  </span>
                </td>
                <td><Raridade value={carta.raridade} /></td>
                <td>{formatElemento(carta.elemento)}</td>
                <td>{carta.classe ?? "-"}</td>
                <td>{carta.custo ?? "-"}</td>
                <td><Status value={carta.ativo ? "Ativa" : "Inativa"} /></td>
                <td>
                  <span className={styles.rowActions}>
                    <button type="button" onClick={() => setSelecionada(carta)} title="Editar">
                      <Edit3 aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => void alternarStatus(carta)} disabled={salvando} title={carta.ativo ? "Inativar" : "Ativar"}>

                      <Eye aria-hidden="true" />
                    </button>
                    <button type="button" onClick={() => void removerCarta(carta)} disabled={salvando} title="Remover">
                      <Trash2 aria-hidden="true" />
                    </button>
                  </span>
                </td>
              </tr>
            ))}

          </tbody>
        </table>
      </div>

      {selecionada ? (
        <CartaEditor
          key={selecionada.id}
          carta={selecionada}
          onClose={() => setSelecionada(null)}
          onSave={(payload) => salvarEdicao(selecionada, payload)}
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
  const [molduraPreviewUrl, setMolduraPreviewUrl] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function updateField<K extends keyof CartaFormState>(field: K, value: CartaFormState[K]) {
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
      passiva: padrao.passiva,
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
      const passiva = parsePassiva(form.passiva);
      const payload: CreateAdminCartaPayload = {
        nome: form.nome.trim(),
        raridade: form.raridade,
        elemento: form.elemento,
        classe: form.classe.trim() || undefined,
        custo: toNumber(form.custo, "Custo"),
        hpBase: toNumber(form.hpBase, "HP"),
        danoBase: toNumber(form.danoBase, "ATK"),
        defesaBase: toNumber(form.defesaBase, "DEF"),
        passiva,
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
      setFeedback({ type: "success", text: `Carta ${carta.nome} salva com sucesso.` });
    } catch (error) {
      setFeedback({
        type: "error",
        text: error instanceof Error ? error.message : "Não foi possível salvar a carta.",
      });
    } finally {
      setSalvando(false);
    }
  }

  const cardImage = previewUrl ?? undefined;
  const cardFrame = molduraPreviewUrl ?? undefined;

  return (
    <AdminLayout title="Nova Carta" subtitle="Criar uma nova carta para o jogo.">
      <form className={styles.editorGrid} onSubmit={handleSubmit}>
        <section className={styles.formPanel}>
          <details className={styles.editorSection} open>
            <summary><span><strong>Informações</strong><small>Identidade, classificação e efeitos da carta</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}><button type="button" onClick={resetarInformacoes}><RefreshCw aria-hidden="true" /> Restaurar informações</button></div>
              <label>Nome da carta<input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required /></label>
              <label>Raridade<select className={`${styles.selectRaridade} ${classeRaridade(form.raridade)}`} value={form.raridade} onChange={(event) => updateField("raridade", event.target.value as CartaFormState["raridade"])}>{raridades.map((raridade) => <option className={classeRaridade(raridade)} key={raridade}>{raridade}</option>)}</select></label>
              <label>Elemento<select value={form.elemento} onChange={(event) => updateField("elemento", event.target.value as CartaFormState["elemento"])}>{elementos.map((elemento) => <option key={elemento.value} value={elemento.value}>{elemento.label}</option>)}</select></label>
              <label>Classe<input value={form.classe} onChange={(event) => updateField("classe", event.target.value)} /></label>
              <label className={styles.toggleRow}><input type="checkbox" checked={form.ativo} onChange={(event) => updateField("ativo", event.target.checked)} />Carta ativa</label>
              <label>Modelo da passiva<select defaultValue="" onChange={(event) => {
                const modelos: Record<string, Record<string, unknown>> = {
                  entradaBuff: { nome: "Impulso inicial", gatilho: "on_enter", tipo: "buff", alvo: "self", atributo: "ataque", valor: 10, velocidade: 12 },
                  entradaDebuff: { nome: "Presenca opressora", gatilho: "on_enter", tipo: "debuff", alvo: "enemy", atributo: "defesa", valor: 10, velocidade: 10 },
                  ataqueBuff: { nome: "Furia crescente", gatilho: "on_attack", tipo: "buff", alvo: "self", atributo: "ataque", valor: 5, velocidade: 14 },
                };
                updateField("passiva", JSON.stringify(modelos[event.target.value] ?? {}, null, 2));
              }}><option value="">Sem passiva</option><option value="entradaBuff">Buff ao entrar</option><option value="entradaDebuff">Debuff ao entrar</option><option value="ataqueBuff">Buff ao atacar</option></select></label>
              <label className={styles.fullField}>Configuração da passiva<textarea className={styles.codeArea} value={form.passiva} onChange={(event) => updateField("passiva", event.target.value)} /><small>O modelo preenche o JSON; ajuste os valores se necessário.</small></label>
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary><span><strong>Estatísticas</strong><small>Custo, vida, ataque e defesa</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}><button type="button" onClick={resetarEstatisticas}><RefreshCw aria-hidden="true" /> Restaurar estatísticas</button></div>
              <label>Custo<input inputMode="numeric" value={form.custo} onChange={(event) => updateField("custo", event.target.value)} /></label>
              <label>HP<input inputMode="numeric" value={form.hpBase} onChange={(event) => updateField("hpBase", event.target.value)} /></label>
              <label>ATK<input inputMode="numeric" value={form.danoBase} onChange={(event) => updateField("danoBase", event.target.value)} /></label>
              <label>DEF<input inputMode="numeric" value={form.defesaBase} onChange={(event) => updateField("defesaBase", event.target.value)} /></label>
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary><span><strong>Personalizar</strong><small>Arte, moldura e encaixe visual</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <CampoArquivo rotulo="Foto/personagem" accept="image/*" ajuda="PNG, JPG ou WEBP, até 5 MB." onChange={handleFotoChange} />
              <CampoArquivo rotulo="Moldura" accept="image/png,image/webp" ajuda="PNG ou WEBP transparente, proporção 2:3." onChange={handleMolduraChange} />
              <ControleVisualCarta value={form.configVisual} onChange={(configVisual) => updateField("configVisual", configVisual)} />
            </div>
          </details>
        </section>
        <aside className={styles.previewPanel}>
          <h2>Pré-visualização</h2>
          <PreviewCarta arte={cardImage} moldura={cardFrame} nome={form.nome || "Nova Carta"} raridade={form.raridade} configVisual={form.configVisual} />
          {feedback ? (
            <p className={feedback.type === "success" ? styles.feedbackSuccess : styles.feedbackError}>
              {feedback.text}
            </p>
          ) : null}
          <div className={styles.editorActions}>
            <Link href="/admin/cartas">Cancelar</Link>
            <button type="submit" className={styles.primaryBtn} disabled={salvando}>
              <Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>

        </aside>
      </form>
    </AdminLayout>
  );
}

function CartaEditor({
  carta,
  onClose,
  onSave,
  salvando,
}: {
  carta: AdminCarta;
  onClose: () => void;
  onSave: (payload: CreateAdminCartaPayload) => Promise<void>;
  salvando: boolean;
}) {
  const [form, setForm] = useState<CartaFormState>(() => cartaToForm(carta));

  const [foto, setFoto] = useState<File | null>(null);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [molduraPreviewUrl, setMolduraPreviewUrl] = useState<string | null>(null);
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function updateField<K extends keyof CartaFormState>(field: K, value: CartaFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function restaurarInformacoesSalvas() {
    const salvo = cartaToForm(carta);
    setForm((atual) => ({
      ...atual,
      nome: salvo.nome,
      raridade: salvo.raridade,
      elemento: salvo.elemento,
      classe: salvo.classe,
      passiva: salvo.passiva,
      ativo: salvo.ativo,
    }));
  }

  function restaurarEstatisticasSalvas() {
    const salvo = cartaToForm(carta);
    setForm((atual) => ({
      ...atual,
      custo: salvo.custo,
      hpBase: salvo.hpBase,
      danoBase: salvo.danoBase,
      defesaBase: salvo.defesaBase,
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
    setErroLocal(null);

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
        passiva: parsePassiva(form.passiva),
        ativo: form.ativo,
        configVisual: form.configVisual,
      };

      if (foto || moldura) {
        const formData = new FormData();
        if (foto) formData.append("foto", foto);
        if (moldura) formData.append("moldura", moldura);

        const upload = await uploadCartaAssets(formData);
        payload.foto = upload.foto?.url ?? carta.foto ?? undefined;
        payload.moldura = upload.moldura?.url ?? carta.moldura ?? undefined;
      } else {
        payload.foto = carta.foto ?? undefined;
        payload.moldura = carta.moldura ?? undefined;
      }

      await onSave(payload);
    } catch (error) {
      setErroLocal(error instanceof Error ? error.message : "Não foi possível salvar a carta.");
    }
  }

  const cardImage = previewUrl ?? carta.foto ?? undefined;
  const cardFrame = molduraPreviewUrl ?? carta.moldura ?? undefined;

  return (
    <form className={styles.editPanel} onSubmit={handleSubmit}>
      <header>
        <div>
          <h2>Editando carta</h2>
          <p>{carta.nome}</p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar editor">
          <X aria-hidden="true" />
        </button>
      </header>
      {erroLocal ? <p className={styles.feedbackError}>{erroLocal}</p> : null}
      <section className={styles.editorGrid}>
        <div className={styles.formPanel}>
          <details className={styles.editorSection} open>
            <summary><span><strong>Informações</strong><small>Identidade, classificação e efeitos da carta</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}><button type="button" onClick={restaurarInformacoesSalvas}><RefreshCw aria-hidden="true" /> Restaurar informações</button></div>
              <label>Nome<input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} /></label>
              <label>Raridade<select className={`${styles.selectRaridade} ${classeRaridade(form.raridade)}`} value={form.raridade} onChange={(event) => updateField("raridade", event.target.value as CartaFormState["raridade"])}>{raridades.map((raridade) => <option className={classeRaridade(raridade)} key={raridade}>{raridade}</option>)}</select></label>
              <label>Elemento<select value={form.elemento} onChange={(event) => updateField("elemento", event.target.value as CartaFormState["elemento"])}>{elementos.map((elemento) => <option key={elemento.value} value={elemento.value}>{elemento.label}</option>)}</select></label>
              <label>Classe<input value={form.classe} onChange={(event) => updateField("classe", event.target.value)} /></label>
              <label className={styles.toggleRow}><input type="checkbox" checked={form.ativo} onChange={(event) => updateField("ativo", event.target.checked)} />Carta ativa</label>
              <label className={styles.fullField}>Passiva<textarea className={styles.codeArea} value={form.passiva} onChange={(event) => updateField("passiva", event.target.value)} /></label>

            </div>
          </details>
          <details className={styles.editorSection}>
            <summary><span><strong>Estatísticas</strong><small>Custo, vida, ataque e defesa</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}><button type="button" onClick={restaurarEstatisticasSalvas}><RefreshCw aria-hidden="true" /> Restaurar estatísticas</button></div>
              <label>Custo<input inputMode="numeric" value={form.custo} onChange={(event) => updateField("custo", event.target.value)} /></label>
              <label>HP<input inputMode="numeric" value={form.hpBase} onChange={(event) => updateField("hpBase", event.target.value)} /></label>
              <label>ATK<input inputMode="numeric" value={form.danoBase} onChange={(event) => updateField("danoBase", event.target.value)} /></label>
              <label>DEF<input inputMode="numeric" value={form.defesaBase} onChange={(event) => updateField("defesaBase", event.target.value)} /></label>
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary><span><strong>Personalizar</strong><small>Arte, moldura e encaixe visual</small></span><ChevronDown aria-hidden="true" /></summary>
            <div className={styles.editorSectionContent}>
              <CampoArquivo rotulo="Foto/personagem" accept="image/*" ajuda="PNG, JPG ou WEBP, até 5 MB." onChange={handleFotoChange} />
              <CampoArquivo rotulo="Moldura" accept="image/png,image/webp" ajuda="PNG ou WEBP transparente, proporção 2:3." onChange={handleMolduraChange} />
              <ControleVisualCarta value={form.configVisual} onChange={(configVisual) => updateField("configVisual", configVisual)} />
            </div>
          </details>
        </div>
        <aside className={styles.previewPanel}>
          <h2>Pré-visualização</h2>
          <PreviewCarta arte={cardImage} moldura={cardFrame} nome={form.nome || "Carta"} raridade={form.raridade} configVisual={form.configVisual} />
          <div className={styles.editorActions}>
            <button type="button" onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.primaryBtn} disabled={salvando}>
              <Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </aside>
      </section>
    </form>
  );
}

function cartaToForm(carta: AdminCarta): CartaFormState {
  return {
    nome: carta.nome,
    raridade: carta.raridade,
    elemento: carta.elemento,
    classe: carta.classe ?? "",
    custo: carta.custo?.toString() ?? "0",
    hpBase: carta.hpBase.toString(),
    danoBase: carta.danoBase.toString(),
    defesaBase: carta.defesaBase.toString(),
    passiva: JSON.stringify(carta.passiva ?? {}, null, 2),
    ativo: carta.ativo,
    configVisual: normalizarConfigVisual(carta.configVisual),
  };
}

function formatElemento(elemento: AdminCarta["elemento"]) {
  return elementos.find((item) => item.value === elemento)?.label ?? elemento;
}

function parsePassiva(value: string) {
  if (!value.trim()) {
    return {};
  }

  const parsed = JSON.parse(value) as unknown;

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("A passiva precisa ser um objeto JSON.");
  }

  return parsed as Record<string, unknown>;
}

function toNumber(value: string, label: string) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} precisa ser um número inteiro positivo.`);
  }

  return number;
}
