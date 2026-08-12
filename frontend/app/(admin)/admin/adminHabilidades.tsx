"use client";

import { Edit3, Plus, Save, Search, Sparkles, X } from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import styles from "../../styles/admin/admin.module.css";
import { AdminLayout } from "./adminShared";

type Habilidade = {
  id: string;
  nome: string;
  tipo: string;
  gatilho: string;
  alvo: string;
  ativa: boolean;
};

const habilidadesIniciais: Habilidade[] = [
  { id: "vontade-floresta", nome: "Vontade da Floresta", tipo: "buff", gatilho: "on_attack", alvo: "self", ativa: true },
  { id: "luz-purificadora", nome: "Luz Purificadora", tipo: "heal", gatilho: "on_turn_start", alvo: "ally", ativa: true },
  { id: "explosao-ignea", nome: "Explosão Ígnea", tipo: "damage", gatilho: "on_attack", alvo: "enemy", ativa: true },
  { id: "escudo-sagrado", nome: "Escudo Sagrado", tipo: "shield", gatilho: "on_turn_start", alvo: "self", ativa: true },
  { id: "drenar-vida", nome: "Drenar Vida", tipo: "lifesteal", gatilho: "on_damage", alvo: "self", ativa: true },
  { id: "passo-sombrio", nome: "Passo Sombrio", tipo: "evasion", gatilho: "on_turn_start", alvo: "self", ativa: false },
];

const formularioVazio: Habilidade = {
  id: "",
  nome: "",
  tipo: "buff",
  gatilho: "on_attack",
  alvo: "self",
  ativa: true,
};

function Status({ ativa }: { ativa: boolean }) {
  return <span className={ativa ? styles.statusAtivo : styles.statusInativo}>{ativa ? "Ativa" : "Inativa"}</span>;
}

export function Habilidades() {
  const [habilidades, setHabilidades] = useState(habilidadesIniciais);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [form, setForm] = useState<Habilidade | null>(null);

  const tipos = useMemo(() => [...new Set(habilidades.map((habilidade) => habilidade.tipo))].sort(), [habilidades]);
  const habilidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");

    return habilidades.filter((habilidade) => {
      const correspondeBusca = !termo || [habilidade.nome, habilidade.tipo, habilidade.gatilho, habilidade.alvo]
        .some((valor) => valor.toLocaleLowerCase("pt-BR").includes(termo));
      const correspondeTipo = !filtroTipo || habilidade.tipo === filtroTipo;
      const correspondeStatus = !filtroStatus || (filtroStatus === "ativas" ? habilidade.ativa : !habilidade.ativa);
      return correspondeBusca && correspondeTipo && correspondeStatus;
    });
  }, [busca, filtroStatus, filtroTipo, habilidades]);

  function atualizar<K extends keyof Habilidade>(campo: K, valor: Habilidade[K]) {
    setForm((atual) => atual ? { ...atual, [campo]: valor } : atual);
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;

    if (form.id) {
      setHabilidades((atuais) => atuais.map((habilidade) => habilidade.id === form.id ? form : habilidade));
    } else {
      setHabilidades((atuais) => [...atuais, { ...form, id: `local-${Date.now()}` }]);
    }
    setForm(null);
  }

  return (
    <AdminLayout title="Habilidades" subtitle="Gerencie todas as habilidades do jogo.">
      <div className={styles.cartasWorkspace}>
        <section className={`${styles.cartasListaPanel} ${styles.habilidadesListaPanel}`}>
          <header className={styles.cartasListaTopo}>
            <div>
              <strong>Habilidades cadastradas</strong>
              <small>{habilidadesFiltradas.length} {habilidadesFiltradas.length === 1 ? "resultado" : "resultados"}</small>
            </div>
            <button type="button" className={styles.primaryBtn} onClick={() => setForm({ ...formularioVazio })}>
              <Plus aria-hidden="true" /> Nova Habilidade
            </button>
          </header>
          <div className={styles.tableWrap}>
            <table>
              <thead><tr><th>Habilidade</th><th>Tipo</th><th>Gatilho</th><th>Alvo</th><th>Status</th><th>Ações</th></tr></thead>
              <tbody>
                {habilidadesFiltradas.length === 0 ? <tr className={styles.emptyTableRow}><td colSpan={6}>Nenhuma habilidade encontrada.</td></tr> : null}
                {habilidadesFiltradas.map((habilidade) => (
                  <tr key={habilidade.id}>
                    <td><span className={styles.habilidadeNome}><Sparkles aria-hidden="true" /><strong>{habilidade.nome}</strong></span></td>
                    <td>{habilidade.tipo}</td>
                    <td>{habilidade.gatilho}</td>
                    <td>{habilidade.alvo}</td>
                    <td><Status ativa={habilidade.ativa} /></td>
                    <td><span className={styles.rowActions}><button type="button" className={form?.id === habilidade.id ? styles.rowActionSelected : undefined} onClick={() => setForm(form?.id === habilidade.id ? null : { ...habilidade })} aria-label={`Editar ${habilidade.nome}`} aria-pressed={form?.id === habilidade.id}><Edit3 aria-hidden="true" /></button></span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <aside className={`${styles.toolbar} ${styles.cartasToolbar}`} aria-label="Filtros de habilidades">
          <header className={styles.filtrosTopo}>
            <strong>Filtros</strong>
            <small>Atualização automática</small>
          </header>
          <label>
            <Search aria-hidden="true" />
            <input placeholder="Buscar habilidade..." value={busca} onChange={(event) => setBusca(event.target.value)} />
          </label>
          <select value={filtroTipo} onChange={(event) => setFiltroTipo(event.target.value)} aria-label="Filtrar por tipo">
            <option value="">Tipo</option>
            {tipos.map((tipo) => <option key={tipo}>{tipo}</option>)}
          </select>
          <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} aria-label="Filtrar por status">
            <option value="">Status</option>
            <option value="ativas">Ativas</option>
            <option value="inativas">Inativas</option>
          </select>
        </aside>
      </div>

      {form ? (
        <form className={`${styles.usuarioEditor} ${styles.habilidadeEditor}`} onSubmit={salvar}>
          <header>
            <div><h2>{form.id ? "Editando habilidade" : "Nova habilidade"}</h2><p>Configuração da regra executada durante a partida.</p></div>
            <button type="button" onClick={() => setForm(null)} aria-label="Fechar formulário"><X aria-hidden="true" /></button>
          </header>
          <label>Nome<input value={form.nome} onChange={(event) => atualizar("nome", event.target.value)} required /></label>
          <label>Tipo<select value={form.tipo} onChange={(event) => atualizar("tipo", event.target.value)}><option value="buff">buff</option><option value="damage">damage</option><option value="heal">heal</option><option value="shield">shield</option><option value="lifesteal">lifesteal</option><option value="evasion">evasion</option></select></label>
          <label>Gatilho<select value={form.gatilho} onChange={(event) => atualizar("gatilho", event.target.value)}><option value="on_attack">on_attack</option><option value="on_damage">on_damage</option><option value="on_turn_start">on_turn_start</option></select></label>
          <label>Alvo<select value={form.alvo} onChange={(event) => atualizar("alvo", event.target.value)}><option value="self">self</option><option value="ally">ally</option><option value="enemy">enemy</option></select></label>
          <label className={styles.usuarioToggle}><input type="checkbox" checked={form.ativa} onChange={(event) => atualizar("ativa", event.target.checked)} /><span><strong>Habilidade ativa</strong><small>Permite que a habilidade seja utilizada pelas cartas.</small></span></label>
          <div className={styles.editorActions}><button type="button" onClick={() => setForm(null)}>Cancelar</button><button type="submit" className={styles.primaryBtn}><Save aria-hidden="true" /> Salvar</button></div>
        </form>
      ) : null}
    </AdminLayout>
  );
}
