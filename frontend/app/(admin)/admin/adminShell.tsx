"use client";

import {
  Activity,
  Bell,
  Bot,
  ChevronDown,
  Database,
  Edit3,
  Eye,
  FileText,
  Gem,
  Home,
  ImagePlus,
  Layers,
  LogOut,
  MoreHorizontal,
  Plus,
  RefreshCw,
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Trash2,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  atualizarAdminCarta,
  criarAdminCarta,
  obterAdminDashboard,
  listarAdminCartas,
  removerAdminCarta,
  uploadCartaAssets,
  type AdminCarta,
  type AdminDashboardResumo,
  type CreateAdminCartaPayload,
} from "../../lib/admin";
import styles from "../../styles/admin/admin.module.css";

type AdminView =
  | "dashboard"
  | "cartas"
  | "nova-carta"
  | "habilidades"
  | "decks"
  | "usuarios"
  | "banners";

const nav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/cartas", label: "Cartas", icon: Layers },
  { href: "/admin/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/admin/decks-npc", label: "Decks NPC", icon: Bot },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "#", label: "Partidas", icon: Swords },
  { href: "#", label: "Economia", icon: Wallet },
  { href: "/admin/banners", label: "Gacha (Banners)", icon: ImagePlus },
  { href: "#", label: "Noticias / Eventos", icon: FileText },
  { href: "#", label: "Logs do Sistema", icon: Database },
  { href: "#", label: "Configuracoes", icon: Settings },
];

const habilidades = [
  ["Vontade da Floresta", "buff", "on_attack", "self", "Ativa"],
  ["Luz Purificadora", "heal", "on_turn_start", "ally", "Ativa"],
  ["Explosao Ignea", "damage", "on_attack", "enemy", "Ativa"],
  ["Escudo Sagrado", "shield", "on_turn_start", "self", "Ativa"],
  ["Drenar Vida", "lifesteal", "on_damage", "self", "Ativa"],
  ["Passo Sombrio", "evasion", "on_turn_start", "self", "Inativa"],
];

const decks = [
  ["Aprendiz da Luz", "Facil", "Controle", "6/6", "Ativo"],
  ["Guardiao Ancestral", "Normal", "Defensivo", "6/6", "Ativo"],
  ["Necromante Sombrio", "Normal", "Aggro", "6/6", "Ativo"],
  ["Cavaleiro Real", "Dificil", "Balanceado", "6/6", "Ativo"],
  ["Deusa da Lua", "Dificil", "Controle", "6/6", "Inativo"],
  ["Lorde das Chamas", "Extremo", "Aggro", "6/6", "Inativo"],
];

const usuarios = [
  ["User#18492", "42", "320", "2.850", "27/06/2026", "Ativo"],
  ["User#77321", "28", "156", "1.120", "26/06/2026", "Ativo"],
  ["User#99231", "15", "48", "520", "25/06/2026", "Ativo"],
  ["User#77221", "7", "12", "120", "24/06/2026", "Banido"],
  ["User#66521", "35", "280", "2.200", "23/06/2026", "Ativo"],
  ["User#95542", "19", "75", "640", "22/06/2026", "Ativo"],
];

const banners = [
  ["Eclipse Roxo", "Limitado", "27/06/2026", "10/07/2026", "Ativo"],
  ["Convocacao da Luz", "Limitado", "20/06/2026", "03/07/2026", "Ativo"],
  ["Herois do Reino", "Padrao", "01/06/2026", "-", "Ativo"],
  ["Convocacao de Iniciantes", "Iniciante", "-", "-", "Ativo"],
];

const raridades = ["UR", "SSR", "SR", "R", "N"] as const;
const elementos = [
  { value: "natureza", label: "Natureza" },
  { value: "agua", label: "Agua" },
  { value: "fogo", label: "Fogo" },
  { value: "sombra", label: "Sombra" },
  { value: "luz", label: "Luz" },
] as const;

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
};

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return <span className={ativo ? styles.statusAtivo : styles.statusInativo}>{value}</span>;
}

function AdminLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className={styles.adminPage}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>
            <Gem aria-hidden="true" />
          </span>
          <div>
            <strong>Anime Cards</strong>
            <small>Admin</small>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href} className={active ? styles.navActive : styles.navItem}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/" className={styles.logout}>
          <LogOut aria-hidden="true" />
          Sair
        </Link>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className={styles.adminActions}>
            <button type="button" aria-label="Buscar">
              <Search aria-hidden="true" />
            </button>
            <button type="button" aria-label="Notificacoes">
              <Bell aria-hidden="true" />
            </button>
            <Link href="/perfil" className={styles.adminUser}>
              <span>
                <Users aria-hidden="true" />
              </span>
              <div>
                <strong>Admin</strong>
                <small>Administrador</small>
              </div>
              <ChevronDown aria-hidden="true" />
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
            <th>Acoes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {index === row.length - 1 ? <Status value={cell} /> : cell}
                </td>
              ))}
              <td>
                <span className={styles.rowActions}>
                  <Eye aria-hidden="true" />
                  <Edit3 aria-hidden="true" />
                  <MoreHorizontal aria-hidden="true" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Dashboard() {
  const [resumo, setResumo] = useState<AdminDashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(null);

    try {
      setResumo(await obterAdminDashboard());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Nao foi possivel carregar o dashboard.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDashboard();
  }, []);

  const metricas = resumo?.metricas;
  const raridadesResumo = resumo?.raridades ?? [];
  const totalRaridades = raridadesResumo.reduce((total, item) => total + item.total, 0);

  return (
    <AdminLayout title="Dashboard" subtitle="Visao geral da plataforma">
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {carregando ? <p className={styles.feedbackInfo}>Carregando dashboard...</p> : null}
      <section className={styles.metrics}>
        {[
          ["Usuarios", formatNumber(metricas?.usuarios ?? 0), `${formatNumber(metricas?.usuariosAtivos ?? 0)} ativos`],
          ["Cartas", formatNumber(metricas?.cartas ?? 0), `${formatNumber(metricas?.cartasAtivas ?? 0)} ativas`],
          ["Partidas Jogadas", formatNumber(metricas?.partidas ?? 0), "total registrado"],
          ["Rubys em Circulacao", formatNumber(metricas?.rubysEmCirculacao ?? 0), "saldo em usuarios"],
        ].map(([label, value, detail]) => (
          <article className={styles.metricCard} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.chartCard}>
          <h2>Distribuicao de Raridades</h2>
          <div className={styles.lineChart}>
            {raridades.map((raridade) => {
              const total = raridadesResumo.find((item) => item.raridade === raridade)?.total ?? 0;
              const height = totalRaridades ? Math.max(10, (total / totalRaridades) * 100) : 10;
              return (
                <span key={raridade} title={`${raridade}: ${total}`} style={{ height: `${height}%` }}>
                  {raridade}
                </span>
              );
            })}
          </div>
        </article>
        <article className={styles.chartCard}>
          <h2>Total de Cartas</h2>
          <div className={styles.donut}>
            <span>Total<br />{formatNumber(metricas?.cartas ?? 0)}</span>
          </div>
        </article>
        <article className={styles.panelCard}>
          <h2>Atividade Recente</h2>
          {(resumo?.atividadeRecente.length ? resumo.atividadeRecente : []).map((item) => (
            <p key={`${item.texto}-${item.data}`}>
              <Activity aria-hidden="true" />
              {item.texto}
              <span>{formatDate(item.data)}</span>
            </p>
          ))}
          {!resumo?.atividadeRecente.length ? <p>Nenhuma atividade recente</p> : null}
        </article>
        <article className={styles.panelCard}>
          <h2>Top Cartas no Inventario</h2>
          {(resumo?.topCartas.length ? resumo.topCartas : []).map((item, index) => (
            <p key={`${item.id}-${index}`}>
              <strong>{index + 1}</strong>
              {item.nome}
              <span>{formatNumber(item.quantidade)}</span>
            </p>
          ))}
          {!resumo?.topCartas.length ? <p>Nenhum inventario registrado</p> : null}
        </article>
      </section>
    </AdminLayout>
  );
}

function Cartas() {
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
      setErro(error instanceof Error ? error.message : "Nao foi possivel carregar as cartas.");
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
      setErro(error instanceof Error ? error.message : "Nao foi possivel atualizar a carta.");
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
      setErro(error instanceof Error ? error.message : "Nao foi possivel remover a carta.");
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
      setErro(error instanceof Error ? error.message : "Nao foi possivel salvar a edicao.");
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
        className={styles.toolbar}
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
        <select value={filtroRaridade} onChange={(event) => setFiltroRaridade(event.target.value)}>
          <option value="">Raridade</option>
          {raridades.map((raridade) => <option key={raridade}>{raridade}</option>)}
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
              <th>Acoes</th>
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
                    />
                    {carta.nome}
                  </span>
                </td>
                <td>{carta.raridade}</td>
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

function NovaCarta() {
  const [form, setForm] = useState<CartaFormState>({
    nome: "Kael Arcano",
    raridade: "UR",
    elemento: "natureza",
    classe: "Mago",
    custo: "4",
    hpBase: "320",
    danoBase: "190",
    defesaBase: "120",
    passiva: '{\n  "nome": "Vontade da Floresta",\n  "descricao": "Quando esta carta atacar, ganha +10% de dano ate o final do turno.",\n  "gatilho": "on_attack",\n  "valor": 10\n}',
    ativo: true,
  });
  const [foto, setFoto] = useState<File | null>(null);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  function updateField<K extends keyof CartaFormState>(field: K, value: CartaFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFoto(file);
    setPreviewUrl((current) => {
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
        text: error instanceof Error ? error.message : "Nao foi possivel salvar a carta.",
      });
    } finally {
      setSalvando(false);
    }
  }

  const cardImage = previewUrl ?? undefined;

  return (
    <AdminLayout title="Nova Carta" subtitle="Criar uma nova carta para o jogo.">
      <form className={styles.editorGrid} onSubmit={handleSubmit}>
        <section className={styles.formPanel}>
          <h2>Informacoes Basicas</h2>
          <label>
            Nome da carta
            <input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} required />
          </label>
          <label>
            Raridade
            <select value={form.raridade} onChange={(event) => updateField("raridade", event.target.value as CartaFormState["raridade"])}>
              {raridades.map((raridade) => <option key={raridade}>{raridade}</option>)}
            </select>
          </label>
          <label>
            Elemento
            <select value={form.elemento} onChange={(event) => updateField("elemento", event.target.value as CartaFormState["elemento"])}>
              {elementos.map((elemento) => (
                <option key={elemento.value} value={elemento.value}>{elemento.label}</option>
              ))}
            </select>
          </label>
          <label>
            Classe
            <input value={form.classe} onChange={(event) => updateField("classe", event.target.value)} />
          </label>
          <label>
            Custo
            <input inputMode="numeric" value={form.custo} onChange={(event) => updateField("custo", event.target.value)} />
          </label>
          <label className={styles.toggleRow}>
            <input
              type="checkbox"
              checked={form.ativo}
              onChange={(event) => updateField("ativo", event.target.checked)}
            />
            Carta ativa
          </label>
          <h2>Passiva Principal</h2>
          <textarea
            className={styles.codeArea}
            value={form.passiva}
            onChange={(event) => updateField("passiva", event.target.value)}
          />
        </section>
        <aside className={styles.previewPanel}>
          <h2>Imagem da Carta</h2>
          <div className={styles.cardPreview} style={cardImage ? { backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(2, 6, 23, 0.94) 84%), url("${cardImage}")` } : undefined}>
            <strong>{form.raridade}</strong>
            <span>{form.nome || "Nova Carta"}</span>
          </div>
          <label>
            Foto/personagem
            <input type="file" accept="image/*" onChange={handleFotoChange} />
          </label>
          <label>
            Moldura
            <input type="file" accept="image/*" onChange={(event) => setMoldura(event.target.files?.[0] ?? null)} />
          </label>
          <h2>Atributos</h2>
          <label>HP<input inputMode="numeric" value={form.hpBase} onChange={(event) => updateField("hpBase", event.target.value)} /></label>
          <label>ATK<input inputMode="numeric" value={form.danoBase} onChange={(event) => updateField("danoBase", event.target.value)} /></label>
          <label>DEF<input inputMode="numeric" value={form.defesaBase} onChange={(event) => updateField("defesaBase", event.target.value)} /></label>
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
  const [erroLocal, setErroLocal] = useState<string | null>(null);

  function updateField<K extends keyof CartaFormState>(field: K, value: CartaFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function handleFotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFoto(file);
    setPreviewUrl((current) => {
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
      setErroLocal(error instanceof Error ? error.message : "Nao foi possivel salvar a carta.");
    }
  }

  const cardImage = previewUrl ?? carta.foto ?? undefined;

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
          <label>Nome<input value={form.nome} onChange={(event) => updateField("nome", event.target.value)} /></label>
          <label>
            Raridade
            <select value={form.raridade} onChange={(event) => updateField("raridade", event.target.value as CartaFormState["raridade"])}>
              {raridades.map((raridade) => <option key={raridade}>{raridade}</option>)}
            </select>
          </label>
          <label>
            Elemento
            <select value={form.elemento} onChange={(event) => updateField("elemento", event.target.value as CartaFormState["elemento"])}>
              {elementos.map((elemento) => (
                <option key={elemento.value} value={elemento.value}>{elemento.label}</option>
              ))}
            </select>
          </label>
          <label>Classe<input value={form.classe} onChange={(event) => updateField("classe", event.target.value)} /></label>
          <label>Custo<input inputMode="numeric" value={form.custo} onChange={(event) => updateField("custo", event.target.value)} /></label>
          <label className={styles.toggleRow}>
            <input type="checkbox" checked={form.ativo} onChange={(event) => updateField("ativo", event.target.checked)} />
            Carta ativa
          </label>
          <label>Passiva<textarea className={styles.codeArea} value={form.passiva} onChange={(event) => updateField("passiva", event.target.value)} /></label>
        </div>
        <aside className={styles.previewPanel}>
          <div className={styles.cardPreview} style={cardImage ? { backgroundImage: `linear-gradient(180deg, transparent 40%, rgba(2, 6, 23, 0.94) 84%), url("${cardImage}")` } : undefined}>
            <strong>{form.raridade}</strong>
            <span>{form.nome || "Carta"}</span>
          </div>
          <label>Foto/personagem<input type="file" accept="image/*" onChange={handleFotoChange} /></label>
          <label>Moldura<input type="file" accept="image/*" onChange={(event) => setMoldura(event.target.files?.[0] ?? null)} /></label>
          <label>HP<input inputMode="numeric" value={form.hpBase} onChange={(event) => updateField("hpBase", event.target.value)} /></label>
          <label>ATK<input inputMode="numeric" value={form.danoBase} onChange={(event) => updateField("danoBase", event.target.value)} /></label>
          <label>DEF<input inputMode="numeric" value={form.defesaBase} onChange={(event) => updateField("defesaBase", event.target.value)} /></label>
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
  };
}

function formatElemento(elemento: AdminCarta["elemento"]) {
  return elementos.find((item) => item.value === elemento)?.label ?? elemento;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string | null) {
  if (!value) {
    return "-";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(value));
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
    throw new Error(`${label} precisa ser um numero inteiro positivo.`);
  }

  return number;
}

function Habilidades() {
  return (
    <AdminLayout title="Habilidades" subtitle="Gerencie todas as habilidades do jogo.">
      <div className={styles.toolbar}><label><Search aria-hidden="true" /><input placeholder="Buscar habilidade..." /></label><button className={styles.primaryBtn}><Plus aria-hidden="true" /> Nova Habilidade</button></div>
      <DataTable headers={["Habilidade", "Tipo", "Gatilho", "Alvo", "Status"]} rows={habilidades} />
    </AdminLayout>
  );
}

function Decks() {
  return (
    <AdminLayout title="Decks de NPC" subtitle="Gerencie os decks utilizados pelos bots.">
      <div className={styles.toolbar}><label><Search aria-hidden="true" /><input placeholder="Buscar deck..." /></label><button className={styles.primaryBtn}><Plus aria-hidden="true" /> Novo Deck</button></div>
      <DataTable headers={["Deck", "Dificuldade", "Estilo", "Cartas", "Status"]} rows={decks} />
    </AdminLayout>
  );
}

function Usuarios() {
  return (
    <AdminLayout title="Usuarios" subtitle="Gerencie os usuarios da plataforma.">
      <div className={styles.toolbar}><label><Search aria-hidden="true" /><input placeholder="Buscar usuario..." /></label><button><Shield aria-hidden="true" /> Filtros</button></div>
      <DataTable headers={["Usuario", "Nivel", "Partidas", "Rubys", "Cadastro", "Status"]} rows={usuarios} />
    </AdminLayout>
  );
}

function Banners() {
  return (
    <AdminLayout title="Banners / Gacha" subtitle="Gerencie os banners disponiveis.">
      <div className={styles.toolbar}><span /><button className={styles.primaryBtn}><Plus aria-hidden="true" /> Novo Banner</button></div>
      <DataTable headers={["Banner", "Tipo", "Inicio", "Fim", "Status"]} rows={banners} />
    </AdminLayout>
  );
}

export function AdminScreen({ view }: { view: AdminView }) {
  if (view === "cartas") return <Cartas />;
  if (view === "nova-carta") return <NovaCarta />;
  if (view === "habilidades") return <Habilidades />;
  if (view === "decks") return <Decks />;
  if (view === "usuarios") return <Usuarios />;
  if (view === "banners") return <Banners />;
  return <Dashboard />;
}
