"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { Gem, Pencil, Plus, X } from "lucide-react";
import {
  atualizarAdminRaridade,
  criarAdminRaridade,
  listarAdminRaridades,
  type AdminRaridade,
  type SalvarAdminRaridadePayload,
} from "../../../lib/admin";
import { AdminLayout } from "../shared/adminShared";
import styles from "../../../styles/admin/adminRaridades.module.css";

const novoFormulario: SalvarAdminRaridadePayload = { nome: "", valorVenda: 0, cor: "#a78bfa" };

export function AdminRaridades() {
  const [raridades, setRaridades] = useState<AdminRaridade[]>([]);
  const [editando, setEditando] = useState<string | null>(null);
  const [modalAberto, setModalAberto] = useState(false);
  const [form, setForm] = useState<SalvarAdminRaridadePayload>(novoFormulario);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    listarAdminRaridades().then(setRaridades).catch((falha) => {
      setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as raridades.");
    }).finally(() => setCarregando(false));
  }, []);

  function abrirCriacao() {
    setForm(novoFormulario);
    setEditando(null);
    setErro(null);
    setModalAberto(true);
  }

  function abrirEdicao(raridade: AdminRaridade) {
    setForm({ nome: raridade.nome, valorVenda: raridade.valorVenda, cor: raridade.cor });
    setEditando(raridade.codigo);
    setErro(null);
    setModalAberto(true);
  }

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);
    try {
      const res = editando
        ? await atualizarAdminRaridade(editando, form)
        : await criarAdminRaridade(form);
      setRaridades(res);
      setModalAberto(false);
    } catch (falha) {
      setErro(falha instanceof Error ? falha.message : "Não foi possível salvar a raridade.");
    } finally {
      setSalvando(false);
    }
  }

  return <AdminLayout title="Raridades" subtitle="Defina os nomes, cores e valores de venda das cartas.">
    <section className={styles.painel}>
      <header className={styles.cabecalho}>
        <div>
          <Link href="/admin/cartas" className={styles.voltar}>← Cartas</Link>
          <h2>Raridades das cartas</h2>
          <p>As cartas antigas mantêm sua raridade ao editar o nome. O valor de venda atualizado vale para todas as cartas daquele tipo.</p>
        </div>
        <button type="button" className={styles.criar} onClick={abrirCriacao}><Plus aria-hidden="true" /> Nova raridade</button>
      </header>
      {erro && !modalAberto ? <p role="alert" className={styles.erro}>{erro}</p> : null}
      {carregando ? <p className={styles.vazio}>Carregando raridades...</p> : null}
      {!carregando && !raridades.length ? <p className={styles.vazio}>Nenhuma raridade cadastrada.</p> : null}
      <div className={styles.grade}>
        {raridades.map((item) => <article key={item.codigo} className={styles.item} style={{ borderColor: `${item.cor}66` }}>
          <div className={styles.selo} style={{ color: item.cor, backgroundColor: `${item.cor}18` }}><Gem aria-hidden="true" /> {item.nome}</div>
          <small>{item.totalCartas} {item.totalCartas === 1 ? "carta" : "cartas"} · código {item.codigo}</small>
          <div className={styles.rodape}><span><b>{item.valorVenda}</b> rubys na venda</span><button type="button" onClick={() => abrirEdicao(item)} aria-label={`Editar ${item.nome}`}><Pencil aria-hidden="true" /> Editar</button></div>
        </article>)}
      </div>
    </section>
    {modalAberto ? <div className={styles.fundo} role="presentation" onMouseDown={(evento) => { if (evento.target === evento.currentTarget) setModalAberto(false); }}>
      <form className={styles.modal} role="dialog" aria-modal="true" aria-labelledby="titulo-raridade" onSubmit={salvar}>
        <header><h2 id="titulo-raridade">{editando ? "Editar raridade" : "Nova raridade"}</h2><button type="button" onClick={() => setModalAberto(false)} aria-label="Fechar"><X aria-hidden="true" /></button></header>
        <label>Nome<input autoFocus required maxLength={80} value={form.nome} onChange={(evento) => setForm({ ...form, nome: evento.target.value })} /></label>
        <label>Valor de venda em rubys<input required type="number" min={0} max={1000000} step={1} value={form.valorVenda} onChange={(evento) => setForm({ ...form, valorVenda: Number(evento.target.value) })} /></label>
        <label>Cor da raridade<input type="color" value={form.cor} onChange={(evento) => setForm({ ...form, cor: evento.target.value })} /></label>
        {!editando ? <p>Novas raridades podem ser usadas nas cartas e configuradas diretamente em cada banner.</p> : null}
        {erro ? <p role="alert" className={styles.erro}>{erro}</p> : null}
        <footer><button type="button" onClick={() => setModalAberto(false)}>Cancelar</button><button type="submit" disabled={salvando}>{salvando ? "Salvando..." : "Salvar raridade"}</button></footer>
      </form>
    </div> : null}
  </AdminLayout>;
}
