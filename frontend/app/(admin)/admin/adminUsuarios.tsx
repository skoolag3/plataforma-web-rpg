"use client";

import { Edit3, Eye, MoreHorizontal, Save, Search, Shield, X } from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { atualizarAdminUsuario, listarAdminUsuarios, type AdminUsuario } from "../../lib/admin";
import styles from "../../styles/admin/admin.module.css";
import { AdminLayout } from "./adminShared";

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return <span className={ativo ? styles.statusAtivo : styles.statusInativo}>{value}</span>;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatAdminDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(value));
}

export function Usuarios() {
  const [usuariosApi, setUsuariosApi] = useState<AdminUsuario[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [selecionado, setSelecionado] = useState<AdminUsuario | null>(null);
  const [editando, setEditando] = useState<AdminUsuario | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [nivelEdicao, setNivelEdicao] = useState("1");
  const [ativoEdicao, setAtivoEdicao] = useState(true);
  const [emailVerificadoEdicao, setEmailVerificadoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function carregarUsuarios() {
    setCarregando(true);
    setErro(null);
    try {
      setUsuariosApi(await listarAdminUsuarios({ busca, status: filtroStatus }));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar os usuários.");
    } finally {
      setCarregando(false);
    }
  }

  function sincronizarUsuario(usuario: AdminUsuario) {
    setUsuariosApi((atuais) => atuais.map((item) => item.id === usuario.id ? usuario : item));
    setSelecionado((atual) => atual?.id === usuario.id ? usuario : atual);
  }

  function abrirEdicao(usuario: AdminUsuario) {
    setEditando(usuario);
    setNomeEdicao(usuario.nome);
    setNivelEdicao(String(usuario.nivel));
    setAtivoEdicao(usuario.ativo);
    setEmailVerificadoEdicao(usuario.emailVerificado);
    setFeedback(null);
  }

  async function salvarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarAdminUsuario(editando.id, {
        nome: nomeEdicao.trim(),
        nivel: Number(nivelEdicao),
        ativo: ativoEdicao,
        emailVerificado: emailVerificadoEdicao,
      });
      sincronizarUsuario(atualizado);
      setEditando(null);
      setFeedback("Usuário atualizado.");
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível atualizar o usuário.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarBloqueio(usuario: AdminUsuario) {
    const acao = usuario.bloqueado ? "desbloquear" : "bloquear";
    if (!window.confirm(`Deseja ${acao} ${usuario.nome}?`)) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarAdminUsuario(usuario.id, { bloqueado: !usuario.bloqueado });
      sincronizarUsuario(atualizado);
      setFeedback(`Usuário ${usuario.bloqueado ? "desbloqueado" : "bloqueado"}.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : `Não foi possível ${acao} o usuário.`);
    } finally {
      setSalvando(false);
    }
  }

  useEffect(() => {
    void carregarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AdminLayout title="Usuários" subtitle="Gerencie os usuários da plataforma.">
      <form className={`${styles.toolbar} ${styles.usuariosToolbar}`} onSubmit={(event) => { event.preventDefault(); void carregarUsuarios(); }}>
        <label><Search aria-hidden="true" /><input placeholder="Buscar por nome ou email..." value={busca} onChange={(event) => setBusca(event.target.value)} /></label>
        <select value={filtroStatus} onChange={(event) => setFiltroStatus(event.target.value)} aria-label="Filtrar usuários por status">
          <option value="">Todos os status</option>
          <option value="ativos">Ativos</option>
          <option value="bloqueados">Bloqueados</option>
          <option value="inativos">Inativos</option>
          <option value="admins">Administradores</option>
        </select>
        <button type="submit"><Shield aria-hidden="true" /> Filtrar</button>
      </form>
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {feedback ? <p className={styles.feedbackSuccess}>{feedback}</p> : null}
      {carregando ? <p className={styles.feedbackInfo}>Carregando usuários...</p> : null}
      {!carregando && !erro && usuariosApi.length === 0 ? <p className={styles.feedbackInfo}>Nenhum usuário encontrado.</p> : null}
      <div className={styles.tableWrap}>
        <table>
          <thead><tr><th>Usuário</th><th>Nível</th><th>Partidas</th><th>Rubys</th><th>Cadastro</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {usuariosApi.map((usuario) => (
              <tr key={usuario.id}>
                <td><span className={styles.usuarioCell}><strong>{usuario.nome}</strong><small>{usuario.email}</small></span></td>
                <td>{usuario.nivel}</td>
                <td>{formatNumber(usuario.partidas)}</td>
                <td>{formatNumber(usuario.rubys)}</td>
                <td>{formatAdminDate(usuario.criadoEm)}</td>
                <td><Status value={usuario.bloqueado ? "Bloqueado" : usuario.ativo ? "Ativo" : "Inativo"} /></td>
                <td>
                  <span className={styles.rowActions}>
                    <button type="button" onClick={() => setSelecionado(selecionado?.id === usuario.id ? null : usuario)} title="Visualizar usuário" aria-label={`Visualizar ${usuario.nome}`}><Eye aria-hidden="true" /></button>
                    <button type="button" onClick={() => abrirEdicao(usuario)} title="Editar usuário" aria-label={`Editar ${usuario.nome}`}><Edit3 aria-hidden="true" /></button>
                    <button type="button" onClick={() => void alternarBloqueio(usuario)} disabled={salvando || usuario.admin} title={usuario.admin ? "Conta administrativa protegida" : usuario.bloqueado ? "Desbloquear usuário" : "Bloquear usuário"} aria-label={`${usuario.bloqueado ? "Desbloquear" : "Bloquear"} ${usuario.nome}`}><MoreHorizontal aria-hidden="true" /></button>
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selecionado ? (
        <section className={styles.usuarioDetalhes}>
          <header><div><h2>{selecionado.nome}</h2><p>{selecionado.email}</p></div><button type="button" onClick={() => setSelecionado(null)} aria-label="Fechar detalhes"><X aria-hidden="true" /></button></header>
          <div className={styles.usuarioResumo}>
            <span><small>Nível</small><strong>{selecionado.nivel}</strong></span>
            <span><small>Partidas</small><strong>{formatNumber(selecionado.partidas)}</strong></span>
            <span><small>Rubys</small><strong>{formatNumber(selecionado.rubys)}</strong></span>
            <span><small>Moedas</small><strong>{formatNumber(selecionado.moedas)}</strong></span>
            <span><small>Email</small><strong>{selecionado.emailVerificado ? "Verificado" : "Pendente"}</strong></span>
            <span><small>Último login</small><strong>{formatAdminDate(selecionado.ultimoLoginEm)}</strong></span>
          </div>
        </section>
      ) : null}
      {editando ? (
        <form className={styles.usuarioEditor} onSubmit={salvarUsuario}>
          <header><div><h2>Editar usuário</h2><p>{editando.email}</p></div><button type="button" onClick={() => setEditando(null)} aria-label="Fechar editor"><X aria-hidden="true" /></button></header>
          <label>Nome<input value={nomeEdicao} onChange={(event) => setNomeEdicao(event.target.value)} required minLength={2} maxLength={100} /></label>
          <label>Nível<input type="number" min={1} max={9999} value={nivelEdicao} onChange={(event) => setNivelEdicao(event.target.value)} required /></label>
          <label className={styles.usuarioToggle}><input type="checkbox" checked={ativoEdicao} disabled={editando.admin} onChange={(event) => setAtivoEdicao(event.target.checked)} /><span><strong>Conta ativa</strong><small>{editando.admin ? "Contas administrativas permanecem ativas." : "Permite que o usuário acesse a plataforma."}</small></span></label>
          <label className={styles.usuarioToggle}><input type="checkbox" checked={emailVerificadoEdicao} onChange={(event) => setEmailVerificadoEdicao(event.target.checked)} /><span><strong>E-mail verificado</strong><small>Confirma manualmente que o endereço pertence ao usuário.</small></span></label>
          <div className={styles.editorActions}><button type="button" onClick={() => setEditando(null)}>Cancelar</button><button type="submit" className={styles.primaryBtn} disabled={salvando}><Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}</button></div>
        </form>
      ) : null}
    </AdminLayout>
  );
}
