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
  Save,
  Search,
  Settings,
  Shield,
  Sparkles,
  Swords,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  useEffect,
  useMemo,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  criarAdminCarta,
  listarAdminCartas,
  uploadCartaAssets,
  type AdminCarta,
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
  return (
    <AdminLayout title="Dashboard" subtitle="Visao geral da plataforma">
      <section className={styles.metrics}>
        {[
          ["Usuarios", "12.487", "+12.9%"],
          ["Partidas Jogadas", "45.231", "+8.3%"],
          ["Rubys em Circulacao", "2.350.980", "+15.7%"],
          ["Receita estimada", "R$ 8.742,21", "+9.4%"],
        ].map(([label, value, delta]) => (
          <article className={styles.metricCard} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{delta} vs mes anterior</small>
          </article>
        ))}
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.chartCard}>
          <h2>Partidas por dia</h2>
          <div className={styles.lineChart}>
            {Array.from({ length: 8 }).map((_, index) => (
              <span key={index} style={{ height: `${34 + ((index * 17) % 48)}%` }} />
            ))}
          </div>
        </article>
        <article className={styles.chartCard}>
          <h2>Distribuicao de Raridades</h2>
          <div className={styles.donut}>
            <span>Total<br />84.326</span>
          </div>
        </article>
        <article className={styles.panelCard}>
          <h2>Atividade Recente</h2>
          {["Novo usuario registrado", "Carta criada", "Banner atualizado", "Partida reportada"].map((item) => (
            <p key={item}><Activity aria-hidden="true" /> {item}</p>
          ))}
        </article>
        <article className={styles.panelCard}>
          <h2>Top Cartas Mais Usadas</h2>
          {["Kael Arcano", "Lyria da Luz", "Riven Duelista", "Mira Sombria", "Eron Guardiao"].map((item, index) => (
            <p key={item}><strong>{index + 1}</strong> {item}<span>{18 - index * 3},7%</span></p>
          ))}
        </article>
      </section>
    </AdminLayout>
  );
}

function Cartas() {
  const [busca, setBusca] = useState("");
  const [cartasApi, setCartasApi] = useState<AdminCarta[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregarCartas(termo = busca) {
    setCarregando(true);
    setErro(null);

    try {
      setCartasApi(await listarAdminCartas(termo));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Nao foi possivel carregar as cartas.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarCartas("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rows = useMemo(
    () =>
      cartasApi.map((carta) => [
        carta.nome,
        carta.raridade,
        formatElemento(carta.elemento),
        carta.classe ?? "-",
        carta.custo?.toString() ?? "-",
        carta.ativo ? "Ativa" : "Inativa",
      ]),
    [cartasApi],
  );

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
        <Link href="/admin/cartas/nova" className={styles.primaryBtn}><Plus aria-hidden="true" /> Nova Carta</Link>
      </form>
      <div className={styles.tabs}>
        {["Todas", "UR", "SSR", "SR", "R", "N"].map((tab) => <button key={tab}>{tab}</button>)}
      </div>
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {carregando ? <p className={styles.feedbackInfo}>Carregando cartas...</p> : null}
      {!carregando && !erro && rows.length === 0 ? (
        <p className={styles.feedbackInfo}>Nenhuma carta encontrada.</p>
      ) : null}
      <DataTable headers={["Carta", "Raridade", "Elemento", "Classe", "Custo", "Status"]} rows={rows} />
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
        const fotoAsset = upload.assets.find((asset) => asset.kind === "foto");
        const molduraAsset = upload.assets.find((asset) => asset.kind === "moldura");
        payload.foto = fotoAsset?.url;
        payload.moldura = molduraAsset?.url;
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
