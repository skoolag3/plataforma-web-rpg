"use client";

import { Bot, Edit3, Plus, Save, Search, X } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminDecks.module.css";

import { AdminLayout } from "./adminShared";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, featureStyles);


type DeckNpc = {
  id: string;
  nome: string;
  dificuldade: string;
  estilo: string;
  quantidadeCartas: number;
  ativo: boolean;
};

const decksIniciais: DeckNpc[] = [
  { id: "aprendiz-luz", nome: "Aprendiz da Luz", dificuldade: "Fácil", estilo: "Controle", quantidadeCartas: 6, ativo: true },
  { id: "guardiao-ancestral", nome: "Guardião Ancestral", dificuldade: "Normal", estilo: "Defensivo", quantidadeCartas: 6, ativo: true },
  { id: "necromante-sombrio", nome: "Necromante Sombrio", dificuldade: "Normal", estilo: "Aggro", quantidadeCartas: 6, ativo: true },
  { id: "cavaleiro-real", nome: "Cavaleiro Real", dificuldade: "Difícil", estilo: "Balanceado", quantidadeCartas: 6, ativo: true },
  { id: "deusa-lua", nome: "Deusa da Lua", dificuldade: "Difícil", estilo: "Controle", quantidadeCartas: 6, ativo: false },
  { id: "lorde-chamas", nome: "Lorde das Chamas", dificuldade: "Extremo", estilo: "Aggro", quantidadeCartas: 6, ativo: false },
];

const deckVazio: DeckNpc = {
  id: "",
  nome: "",
  dificuldade: "Normal",
  estilo: "Balanceado",
  quantidadeCartas: 6,
  ativo: true,
};

function Status({ ativo }: { ativo: boolean }) {
  return <span className={ativo ? styles.statusAtivo : styles.statusInativo}>{ativo ? "Ativo" : "Inativo"}</span>;
}

export function DecksNpc() {
  const [decks, setDecks] = useState(decksIniciais);
  const [busca, setBusca] = useState("");
  const [filtroDificuldade, setFiltroDificuldade] = useState("");
  const [filtroEstilo, setFiltroEstilo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [form, setForm] = useState<DeckNpc | null>(null);

  const decksFiltrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return decks.filter((deck) => {
      const correspondeBusca = !termo || [deck.nome, deck.dificuldade, deck.estilo]
        .some((valor) => valor.toLocaleLowerCase("pt-BR").includes(termo));
      const correspondeDificuldade = !filtroDificuldade || deck.dificuldade === filtroDificuldade;
      const correspondeEstilo = !filtroEstilo || deck.estilo === filtroEstilo;
      const correspondeStatus = !filtroStatus || (filtroStatus === "ativos" ? deck.ativo : !deck.ativo);
      return correspondeBusca && correspondeDificuldade && correspondeEstilo && correspondeStatus;
    });
  }, [busca, decks, filtroDificuldade, filtroEstilo, filtroStatus]);

  function atualizar<K extends keyof DeckNpc>(campo: K, valor: DeckNpc[K]) {
    setForm((atual) => atual ? { ...atual, [campo]: valor } : atual);
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    if (form.id) {
      setDecks((atuais) => atuais.map((deck) => deck.id === form.id ? form : deck));
    } else {
      setDecks((atuais) => [...atuais, { ...form, id: `local-${Date.now()}` }]);
    }
    setForm(null);
  }

  useEffect(() => {
    if (!form) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setForm(null);
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [form]);

  return (
    <AdminLayout title="Decks de NPC" subtitle="Gerencie os decks utilizados pelos bots.">
      <div className={styles.cartasWorkspace}>
        <section className={`${styles.cartasListaPanel} ${styles.decksListaPanel}`}>
          <header className={styles.cartasListaTopo}>
            <div>
              <strong>Decks cadastrados</strong>
              <small>{decksFiltrados.length} {decksFiltrados.length === 1 ? "resultado" : "resultados"}</small>
            </div>
            <button type="button" className={styles.primaryBtn} onClick={() => setForm({ ...deckVazio })}>
              <Plus aria-hidden="true" /> Novo Deck
            </button>
          </header>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Deck</th><th>Dificuldade</th><th>Estilo</th><th>Cartas</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {decksFiltrados.length === 0 ? <tr className={styles.emptyTableRow}><td colSpan={6}>Nenhum deck encontrado.</td></tr> : null}
                {decksFiltrados.map((deck) => (
                  <tr key={deck.id}>
                    <td><span className={styles.habilidadeNome}><Bot aria-hidden="true" /><strong>{deck.nome}</strong></span></td>
                    <td>{deck.dificuldade}</td>
                    <td>{deck.estilo}</td>
                    <td>{deck.quantidadeCartas}/6</td>
                    <td><Status ativo={deck.ativo} /></td>
                    <td><span className={styles.rowActions}><button type="button" className={form?.id === deck.id ? styles.rowActionSelected : undefined} onClick={() => setForm(form?.id === deck.id ? null : { ...deck })} aria-label={`Editar ${deck.nome}`} aria-pressed={form?.id === deck.id}><Edit3 aria-hidden="true" /></button></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={`${styles.toolbar} ${styles.cartasToolbar}`} aria-label="Filtros de decks NPC">
          <header className={styles.filtrosTopo}><strong>Filtros</strong><small>Atualização automática</small></header>
          <label><Search aria-hidden="true" /><input placeholder="Buscar deck..." value={busca} onChange={(event) => setBusca(event.target.value)} /></label>
          <select value={filtroDificuldade} onChange={(event) => setFiltroDificuldade(event.target.value)} aria-label="Filtrar por dificuldade">
            <option value="">Dificuldade</option><option>Fácil</option><option>Normal</option><option>Difícil</option><option>Extremo</option>
          </select>
          <select value={filtroEstilo} onChange={(event) => setFiltroEstilo(event.target.value)} aria-label="Filtrar por estilo">
            <option value="">Estilo</option><option>Aggro</option><option>Balanceado</option><option>Controle</option><option>Defensivo</option>
          </select>
          <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} aria-label="Filtrar por status">
            <option value="">Status</option><option value="ativos">Ativos</option><option value="inativos">Inativos</option>
          </select>
        </aside>
      </div>

      {form ? (
        <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setForm(null); }}>
          <form className={`${styles.usuarioEditor} ${styles.habilidadeEditor} ${styles.habilidadeModal}`} onSubmit={salvar} role="dialog" aria-modal="true" aria-labelledby="deck-modal-titulo">
            <header><div><h2 id="deck-modal-titulo">{form.id ? "Editando deck" : "Novo deck"}</h2><p>Configuração do baralho utilizado pelo bot.</p></div><button type="button" onClick={() => setForm(null)} aria-label="Fechar formulário"><X aria-hidden="true" /></button></header>
            <label>Nome<input value={form.nome} onChange={(event) => atualizar("nome", event.target.value)} required autoFocus /></label>
            <label>Dificuldade<select value={form.dificuldade} onChange={(event) => atualizar("dificuldade", event.target.value)}><option>Fácil</option><option>Normal</option><option>Difícil</option><option>Extremo</option></select></label>
            <label>Estilo<select value={form.estilo} onChange={(event) => atualizar("estilo", event.target.value)}><option>Aggro</option><option>Balanceado</option><option>Controle</option><option>Defensivo</option></select></label>
            <label>Cartas no deck<input type="number" min="0" max="6" value={form.quantidadeCartas} onChange={(event) => atualizar("quantidadeCartas", Number(event.target.value))} required /></label>
            <label className={styles.usuarioToggle}><input type="checkbox" checked={form.ativo} onChange={(event) => atualizar("ativo", event.target.checked)} /><span><strong>Deck ativo</strong><small>Permite que o deck seja utilizado pelos bots.</small></span></label>
            <div className={styles.editorActions}><button type="button" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className={styles.primaryBtn}><Save aria-hidden="true" /> Salvar</button></div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  );
}
