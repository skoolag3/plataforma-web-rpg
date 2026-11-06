"use client";

import {
  Edit3,
  ListFilter,
  Lock,
  MoreHorizontal,
  Save,
  Search,
  SlidersHorizontal,
  Trash2,
  Unlock,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import {
  atualizarAdminUsuario,
  listarAdminUsuarios,
  removerAdminUsuario,
  type AdminUsuario,
} from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import featureStyles from "../../styles/admin/adminUsuarios.module.css";
import colecaoStyles from "../../styles/admin/adminUsuarioColecao.module.css";
import financeiroStyles from "../../styles/admin/adminUsuarioFinanceiro.module.css";

import { AdminLayout } from "./adminShared";
import { AdminUsuarioPainel } from "./adminUsuarioPainel";
import { combinarEstilos } from "./combinarEstilos";
import { FiltroUsuariosModal } from "./filtroUsuariosModal";
import { ConfirmarRemocaoUsuario } from "./confirmarRemocaoUsuario";
import { SwitchToggle } from "../../../components/ui/switch";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../../components/ui/tooltip-07-utils/tooltip";
import { criarEstiloMolduraPerfil } from "../../components/cartaMontada";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  featureStyles,
  colecaoStyles,
  financeiroStyles,
);

export function UsuarioAvatarMoldura({ usuario }: { usuario: AdminUsuario }) {
  const classeMoldura = usuario.molduraClasse ?? "molduraPadrao";
  return (
    <span
      className={`${styles.usuarioAvatarWrap} ${styles[classeMoldura] ?? ""}`}
    >
      <span
        className={styles.usuarioAvatarFoto}
        style={{
          backgroundImage: `url("${usuario.avatarUrl ?? "/avatar-padrao.svg"}")`,
        }}
      />
      {usuario.molduraUrl ? (
        <i
          className={styles.usuarioMolduraImg}
          style={{
            ...criarEstiloMolduraPerfil(usuario.molduraConfig),
            backgroundImage: `url("${usuario.molduraUrl}")`,
          }}
          aria-hidden="true"
        />
      ) : null}
    </span>
  );
}

function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return (
    <span className={ativo ? styles.statusAtivo : value === "E-mail pendente" ? styles.statusAlerta : styles.statusInativo}>
      {value}
    </span>
  );
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

export function Usuarios() {
  const [usuariosApi, setUsuariosApi] = useState<AdminUsuario[]>([]);
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);
  const btnFiltrosRef = useRef<HTMLButtonElement>(null);
  const [selecionado, setSelecionado] = useState<AdminUsuario | null>(null);
  const [editando, setEditando] = useState<AdminUsuario | null>(null);
  const [usuarioParaRemover, setUsuarioParaRemover] = useState<AdminUsuario | null>(null);
  const [removendo, setRemovendo] = useState(false);
  const [erroRemocao, setErroRemocao] = useState<string | null>(null);
  const [nomeEdicao, setNomeEdicao] = useState("");
  const [ativoEdicao, setAtivoEdicao] = useState(true);
  const [adminEdicao, setAdminEdicao] = useState(false);
  const [emailVerificadoEdicao, setEmailVerificadoEdicao] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  function fecharModalFiltros() {
    setModalFiltrosAberto(false);
    requestAnimationFrame(() => btnFiltrosRef.current?.focus());
  }

  async function carregarUsuarios() {
    setCarregando(true);
    setErro(null);
    try {
      setUsuariosApi(
        await listarAdminUsuarios({
          busca: buscaAplicada,
          status: filtroStatus,
        }),
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar os usuários.",
      );
    } finally {
      setCarregando(false);
    }
  }

  function sincronizarUsuario(usuario: AdminUsuario) {
    setUsuariosApi((atuais) =>
      atuais.map((item) => (item.id === usuario.id ? usuario : item)),
    );
    setSelecionado((atual) => (atual?.id === usuario.id ? usuario : atual));
  }

  function abrirEdicao(usuario: AdminUsuario) {
    setSelecionado(null);
    setEditando(usuario);
    setNomeEdicao(usuario.nome);
    setAtivoEdicao(usuario.ativo);
    setAdminEdicao(usuario.admin);
    setEmailVerificadoEdicao(usuario.emailVerificado);
    setFeedback(null);
  }

  function fecharEdicao() {
    if (!editando) return;
    const alterado =
      nomeEdicao !== editando.nome ||
      ativoEdicao !== editando.ativo ||
      adminEdicao !== editando.admin ||
      emailVerificadoEdicao !== editando.emailVerificado;
    if (
      alterado &&
      !window.confirm(
        "Existem alterações não salvas. Deseja mesmo descartá-las?",
      )
    )
      return;
    setEditando(null);
  }

  async function salvarUsuario(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editando) return;
    setSalvando(true);
    setErro(null);
    try {
      const atualizado = await atualizarAdminUsuario(editando.id, {
        nome: nomeEdicao.trim(),
        ativo: ativoEdicao,
        ...(!editando.admin && adminEdicao ? { admin: true } : {}),
        emailVerificado: emailVerificadoEdicao,
      });
      sincronizarUsuario(atualizado);
      setEditando(null);
      setFeedback(!editando.admin && adminEdicao ? "Acesso de administrador concedido." : "Usuário atualizado.");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o usuário.",
      );
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
      const atualizado = await atualizarAdminUsuario(usuario.id, {
        bloqueado: !usuario.bloqueado,
      });
      sincronizarUsuario(atualizado);
      setFeedback(
        `Usuário ${usuario.bloqueado ? "desbloqueado" : "bloqueado"}.`,
      );
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : `Não foi possível ${acao} o usuário.`,
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarRemocao() {
    if (!usuarioParaRemover || removendo) return;
    setRemovendo(true);
    setErroRemocao(null);
    try {
      await removerAdminUsuario(usuarioParaRemover.id, usuarioParaRemover.nome);
      setUsuariosApi((atuais) => atuais.filter((usuario) => usuario.id !== usuarioParaRemover.id));
      setSelecionado(null);
      setEditando(null);
      setUsuarioParaRemover(null);
      setFeedback("Usuário removido. A conta perdeu o acesso; os dados foram preservados.");
    } catch (error) {
      setErroRemocao(error instanceof Error ? error.message : "Não foi possível remover o usuário.");
    } finally {
      setRemovendo(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => setBuscaAplicada(busca.trim()), 280);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    void carregarUsuarios();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscaAplicada, filtroStatus]);

  useEffect(() => {
    if (!selecionado && !editando) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (editando) fecharEdicao();
      else setSelecionado(null);
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selecionado,
    editando,
    nomeEdicao,
    ativoEdicao,
    emailVerificadoEdicao,
  ]);

  return (
    <AdminLayout
      title="Usuários"
      subtitle="Gerencie os usuários da plataforma."
    >
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {feedback ? <p className={styles.feedbackSuccess}>{feedback}</p> : null}
      {carregando ? (
        <p className={styles.feedbackInfo}>Carregando usuários...</p>
      ) : null}
      <div className={styles.usuariosWorkspace}>
        <section
          className={`${styles.cartasListaPanel} ${styles.usuariosListaPanel}`}
        >
          <header className={styles.cartasListaTopo}>
            <div className={styles.cartasListaEsquerda}>
              <div className={styles.cartasListaTitulo}>
                <strong>Usuários cadastrados</strong>
                <small>
                  {usuariosApi.length}{" "}
                  {usuariosApi.length === 1 ? "resultado" : "resultados"}
                </small>
              </div>
              <form className={styles.pesquisaCartas} role="search" onSubmit={(evento) => {
                evento.preventDefault();
                setBuscaAplicada(busca.trim());
              }}>
                <input
                  type="search"
                  placeholder="Buscar por nome ou e-mail..."
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  aria-label="Buscar usuários por nome ou e-mail"
                />
                <button type="submit" aria-label="Pesquisar usuários" title="Pesquisar usuários">
                  <Search aria-hidden="true" />
                </button>
              </form>
              <button
                ref={btnFiltrosRef}
                type="button"
                className={styles.btnFiltros}
                aria-haspopup="dialog"
                aria-expanded={modalFiltrosAberto}
                aria-label="Abrir filtros de usuários"
                data-ativo={filtroStatus ? "true" : undefined}
                onClick={() => setModalFiltrosAberto(true)}
              >
                <ListFilter aria-hidden="true" /> Filtros
              </button>
            </div>
          </header>
          <div className={styles.tableWrap}>
            <table>
              <colgroup>
                <col className={styles.colunaUsuario} />
                <col className={styles.colunaProgresso} />
                <col className={styles.colunaSaldos} />
                <col className={styles.colunaStatus} />
                <col className={styles.colunaAcoes} />
              </colgroup>
              <thead>
                <tr>
                  <th>Usuário</th>
                  <th>Partidas</th>
                  <th>Saldos</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {!carregando && !erro && usuariosApi.length === 0 ? (
                  <tr className={styles.emptyTableRow}>
                    <td colSpan={5}>Nenhum usuário encontrado.</td>
                  </tr>
                ) : null}
                {usuariosApi.map((usuario) => {
                  const motivoAlerta = usuario.bloqueado
                    ? "Conta bloqueada pelo administrador."
                    : !usuario.emailVerificado
                      ? "E-mail ainda não verificado."
                      : null;
                  const tomAlerta = usuario.bloqueado
                    ? "vermelho"
                    : !usuario.emailVerificado
                      ? "amarelo"
                      : undefined;

                  return (
                  <tr key={usuario.id}>
                    <td data-label="Usuário">
                      <div className={styles.usuarioIdentidade}>
                        <UsuarioAvatarMoldura usuario={usuario} />
                        <span className={styles.usuarioCell}>
                          {motivoAlerta ? (
                            <Tooltip>
                              <TooltipTrigger
                                render={
                                  <strong
                                    className={styles.usuarioNomeAlerta}
                                    data-tom={tomAlerta}
                                    tabIndex={0}
                                  >
                                    {usuario.nome}
                                  </strong>
                                }
                              />
                              <TooltipContent>
                                <strong>Alerta</strong> — {motivoAlerta}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            <strong>{usuario.nome}</strong>
                          )}
                          <small>{usuario.email}</small>
                        </span>
                      </div>
                    </td>
                    <td data-label="Partidas">
                      <span className={styles.usuarioDadoDuplo}>
                        <strong>{formatNumber(usuario.partidas)} partidas</strong>
                      </span>
                    </td>
                    <td data-label="Saldo">
                      <span className={styles.usuarioDadoDuplo}>
                        <strong>{formatNumber(usuario.rubys)} Rubys</strong>
                      </span>
                    </td>
                    <td data-label="Status">
                      <Status
                        value={
                          usuario.bloqueado
                            ? "Bloqueado"
                            : !usuario.ativo
                              ? "Inativo"
                              : usuario.emailVerificado
                                ? "Ativo"
                                : "E-mail pendente"
                        }
                      />
                    </td>
                    <td data-label="Ações">
                      <details className={styles.menuAcoesCarta} name="acoes-usuarios">
                        <summary aria-label={`Ações de ${usuario.nome}`}>
                          <MoreHorizontal aria-hidden="true" />
                        </summary>
                        <div>
                          <button type="button" onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            setEditando(null);
                            setSelecionado(usuario);
                          }}>
                            <SlidersHorizontal aria-hidden="true" /> Gerenciar
                          </button>
                          <button type="button" onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            abrirEdicao(usuario);
                          }}>
                            <Edit3 aria-hidden="true" /> Editar
                          </button>
                          <button
                            type="button"
                            disabled={salvando || usuario.admin}
                            title={usuario.admin ? "Conta administrativa protegida" : undefined}
                            onClick={(evento) => {
                              evento.currentTarget.closest("details")?.removeAttribute("open");
                              void alternarBloqueio(usuario);
                            }}
                          >
                            {usuario.bloqueado ? <Unlock aria-hidden="true" /> : <Lock aria-hidden="true" />}
                            {usuario.bloqueado ? "Desbloquear" : "Bloquear"}
                          </button>
                          <button
                            type="button"
                            disabled={salvando || removendo || usuario.admin}
                            title={usuario.admin ? "Conta administrativa protegida" : undefined}
                            onClick={(evento) => {
                              evento.currentTarget.closest("details")?.removeAttribute("open");
                              setErroRemocao(null);
                              setFeedback(null);
                              setUsuarioParaRemover(usuario);
                            }}
                          >
                            <Trash2 aria-hidden="true" /> Remover
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {modalFiltrosAberto ? <FiltroUsuariosModal
        status={filtroStatus}
        setStatus={setFiltroStatus}
        aoFechar={fecharModalFiltros}
      /> : null}
      {usuarioParaRemover ? <ConfirmarRemocaoUsuario
        usuario={usuarioParaRemover}
        removendo={removendo}
        erro={erroRemocao}
        aoFechar={() => { if (!removendo) setUsuarioParaRemover(null); }}
        aoConfirmar={() => { void confirmarRemocao(); }}
      /> : null}
      {selecionado ? (
        <AdminUsuarioPainel
          usuario={selecionado}
          onClose={() => setSelecionado(null)}
          onUpdateUsuario={sincronizarUsuario}
        />
      ) : null}
      {editando ? (
        <div
          className={styles.modalBackdrop}
          data-modal-overlay
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) fecharEdicao();
          }}
        >
          <form
            className={`${styles.usuarioEditorModal} ${styles.usuarioModal}`}
            data-modal-panel
            onSubmit={salvarUsuario}
            role="dialog"
            aria-modal="true"
            aria-labelledby="usuario-editor-titulo"
          >
            <header className={styles.usuarioEditorTopo}>
              <div className={styles.usuarioIdentidade}>
                <UsuarioAvatarMoldura usuario={editando} />
                <div className={styles.usuarioCell}>
                  <h2 id="usuario-editor-titulo">Editar {editando.nome}</h2>
                  <p>{editando.email}</p>
                </div>
              </div>
              <button
                type="button"
                className={styles.btnFecharEditor}
                onClick={fecharEdicao}
                aria-label="Fechar editor"
              >
                <X aria-hidden="true" />
              </button>
            </header>
            <label className={styles.campoNome}>
              Nome
              <input
                value={nomeEdicao}
                onChange={(event) => setNomeEdicao(event.target.value)}
                required
                minLength={2}
                maxLength={100}
                autoFocus
              />
            </label>
            <div className={styles.usuarioTogglesGrade}>
              <div className={styles.usuarioToggle}>
                <SwitchToggle
                  checked={ativoEdicao}
                  disabled={adminEdicao}
                  onChange={setAtivoEdicao}
                  aria-label="Conta ativa"
                />
                <div className={styles.usuarioToggleTexto}>
                  <strong>Conta ativa</strong>
                  <small>
                    {adminEdicao
                      ? "Contas administrativas permanecem ativas."
                      : "Permite que o usuário acesse a plataforma."}
                  </small>
                </div>
              </div>
              <div className={styles.usuarioToggle}>
                <SwitchToggle
                  checked={adminEdicao}
                  disabled={editando.admin}
                  onChange={(admin) => {
                    setAdminEdicao(admin);
                    if (admin) setAtivoEdicao(true);
                  }}
                  aria-label="Conceder acesso de administrador"
                />
                <div className={styles.usuarioToggleTexto}>
                  <strong>Administrador</strong>
                  <small>
                    {editando.admin
                      ? "Esta conta já possui acesso administrativo."
                      : "Concede acesso ao painel administrativo e desbloqueia a conta."}
                  </small>
                </div>
              </div>
              <div className={styles.usuarioToggle}>
                <SwitchToggle
                  checked={emailVerificadoEdicao}
                  onChange={setEmailVerificadoEdicao}
                  aria-label="E-mail verificado"
                />
                <div className={styles.usuarioToggleTexto}>
                  <strong>E-mail verificado</strong>
                  <small>
                    Confirma manualmente que o endereço pertence ao usuário.
                  </small>
                </div>
              </div>
            </div>
            <div className={styles.editorActions}>
              <button
                type="button"
                className={styles.btnCancelar}
                onClick={fecharEdicao}
              >
                Cancelar
              </button>
              <button
                type="submit"
                className={styles.btnSalvar}
                disabled={salvando}
              >
                <Save aria-hidden="true" />{" "}
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </AdminLayout>
  );
}
