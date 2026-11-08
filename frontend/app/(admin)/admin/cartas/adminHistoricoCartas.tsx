"use client";

import { ArrowLeft, ChevronLeft, ChevronRight, History, Plus, RefreshCw, RotateCcw, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { listarHistoricoAdminCartas, type AdminCartaHistorico, type AdminCartasHistoricoPainel } from "../../../lib/admin";
import styles from "../../../styles/admin/adminHistoricoCartas.module.css";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import { AdminLayout } from "../shared/adminShared";

const nomesCampos: Record<string, string> = {
  nome: "Nome", elemento: "Elemento", raridade: "Raridade", idClasse: "Classe",
  hpBase: "HP", danoBase: "Dano", defesaBase: "Defesa", passiva: "Passiva",
  foto: "Imagem", moldura: "Moldura", configVisual: "Visual", ativo: "Status",
  habilidades: "Habilidades",
};

const iconesAcao = {
  CRIADA: Plus,
  ALTERADA: RefreshCw,
  REMOVIDA: Trash2,
  RESTAURADA: RotateCcw,
};

const opcoesAcao = [
  { valor: "", label: "Todas", icone: <History aria-hidden="true" /> },
  { valor: "CRIADA", label: "Criadas", icone: <Plus aria-hidden="true" /> },
  { valor: "ALTERADA", label: "Alteradas", icone: <RefreshCw aria-hidden="true" /> },
  { valor: "REMOVIDA", label: "Removidas", icone: <Trash2 aria-hidden="true" /> },
  { valor: "RESTAURADA", label: "Restauradas", icone: <RotateCcw aria-hidden="true" /> },
];

function resumoAlteracoes(registro: AdminCartaHistorico) {
  const campos = Object.keys(registro.alteracoes ?? {});
  if (!campos.length) return null;
  return campos.map((campo) => nomesCampos[campo] ?? campo).join(", ");
}

function valorAlteracao(campo: string, valor: unknown) {
  if (campo === 'ativo') return valor ? 'Ativa' : 'Inativa';
  if (valor === null || valor === undefined || valor === '') return 'Vazio';
  if (['foto', 'moldura', 'configVisual', 'passiva', 'habilidades', 'idClasse'].includes(campo)) {
    if (campo === 'habilidades' && Array.isArray(valor)) return valor.map((item) => typeof item === 'object' && item !== null && 'nome' in item ? String(item.nome) : 'Habilidade').join(', ') || 'Nenhuma';
    return campo === 'foto' || campo === 'moldura' ? 'Definida' : 'Configuração';
  }
  return String(valor);
}

export function AdminHistoricoCartas() {
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [acao, setAcao] = useState("");
  const [pagina, setPagina] = useState(1);
  const [painel, setPainel] = useState<AdminCartasHistoricoPainel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    const timer = window.setTimeout(() => { setPagina(1); setBuscaAplicada(busca.trim()); }, 280);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let ativo = true;
    void listarHistoricoAdminCartas({ pagina, busca: buscaAplicada, acao })
      .then((res) => { if (ativo) setPainel(res); })
      .catch((falha) => { if (ativo) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar o histórico."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [pagina, buscaAplicada, acao, tentativa]);

  function pesquisar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPagina(1);
    setBuscaAplicada(busca.trim());
  }

  function mudarAcao(valor: string) {
    setCarregando(true);
    setErro("");
    setPagina(1);
    setAcao(valor);
  }

  function mudarPagina(valor: number) {
    setCarregando(true);
    setErro("");
    setPagina(valor);
  }

  return <AdminLayout title="Histórico de cartas" subtitle="Criações, alterações e remoções registradas.">
    <div className={styles.topo}>
      <Link href="/admin/cartas"><ArrowLeft aria-hidden="true" /> Voltar às cartas</Link>
      <span><History aria-hidden="true" /> {painel?.paginacao.total ?? 0} registros</span>
    </div>
    <section className={styles.painel} aria-busy={carregando}>
      <form className={styles.filtros} onSubmit={pesquisar} role="search">
        <label><span>Buscar carta</span><input value={busca} onChange={(event) => setBusca(event.target.value)} placeholder="Nome da carta" /></label>
        <button type="submit" aria-label="Pesquisar histórico"><Search aria-hidden="true" /></button>
        <div className={styles.campoAcao}>
          <span>Ação</span>
          <SelectPadrao
            className={styles.seletorAcao}
            valor={acao}
            opcoes={opcoesAcao}
            aoAlterar={mudarAcao}
            placeholder="Todas"
            ariaLabel="Filtrar histórico por ação"
          />
        </div>
      </form>
      {carregando ? <p className={styles.mensagem}>Carregando histórico...</p> : null}
      {erro ? <p className={styles.erro} role="alert">{erro} <button type="button" onClick={() => { setCarregando(true); setErro(""); setTentativa((valor) => valor + 1); }}>Tentar novamente</button></p> : null}
      {!carregando && !erro && !painel?.registros.length ? <p className={styles.mensagem}>Nenhum registro encontrado.</p> : null}
      {!carregando && !erro ? <div className={styles.lista}>{painel?.registros.map((item) => {
        const IconeAcao = iconesAcao[item.acao];
        return <article key={item.id}>
        <span className={styles.acao} data-acao={item.acao}><IconeAcao aria-hidden="true" /> {item.acao === "CRIADA" ? "Criada" : item.acao === "REMOVIDA" ? "Removida" : item.acao === "RESTAURADA" ? "Restaurada" : "Alterada"}</span>
        <div><strong>{item.nomeCarta}</strong>{resumoAlteracoes(item) ? <details className={styles.detalhes}>
          <summary>Campos: {resumoAlteracoes(item)}</summary>
          <ul>{Object.entries(item.alteracoes ?? {}).map(([campo, valores]) => <li key={campo}><b>{nomesCampos[campo] ?? campo}:</b> {valorAlteracao(campo, valores.antes)} → {valorAlteracao(campo, valores.depois)}</li>)}</ul>
        </details> : null}</div>
        <span className={styles.autor}>{item.autor?.nome ?? "Autor não registrado"}</span>
        <time dateTime={item.criadoEm}>{new Date(item.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</time>
      </article>; })}</div> : null}
      {painel && painel.paginacao.totalPaginas > 1 ? <nav className={styles.paginacao} aria-label="Páginas do histórico">
        <button type="button" disabled={pagina <= 1 || carregando} onClick={() => mudarPagina(pagina - 1)}><ChevronLeft aria-hidden="true" /> Anterior</button>
        <span>{pagina} / {painel.paginacao.totalPaginas}</span>
        <button type="button" disabled={pagina >= painel.paginacao.totalPaginas || carregando} onClick={() => mudarPagina(pagina + 1)}>Próxima <ChevronRight aria-hidden="true" /></button>
      </nav> : null}
    </section>
    <p className={styles.legado}>Registros anteriores a este histórico mostram datas de criação e remoção quando disponíveis. A remoção e restauração da Eli foram registradas com as datas confirmadas nesta sessão. Edições antigas e seus autores não podem ser reconstruídos.</p>
  </AdminLayout>;
}
