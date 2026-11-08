"use client";

import {
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw,
  Search,
  UserCheck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { listarAdminUsuarios, type AdminUsuario } from "../../../lib/admin";
import styles from "../../../styles/admin/modalDashboardCards.module.css";

function formatarDataHora(dataStr: string | null) {
  if (!dataStr) return "-";
  const data = new Date(dataStr);
  if (Number.isNaN(data.getTime())) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(data);
}

function formatarTempoRelativo(dataStr: string | null) {
  if (!dataStr) return "";
  const data = new Date(dataStr);
  if (Number.isNaN(data.getTime())) return "";
  const diffSegundos = Math.floor((Date.now() - data.getTime()) / 1000);
  if (diffSegundos < 60) return "agora há pouco";
  const diffMinutos = Math.floor(diffSegundos / 60);
  if (diffMinutos < 60) return `há ${diffMinutos} min`;
  const diffHoras = Math.floor(diffMinutos / 60);
  if (diffHoras < 24) return `há ${diffHoras}h`;
  const diffDias = Math.floor(diffHoras / 24);
  if (diffDias === 1) return "ontem";
  if (diffDias < 30) return `há ${diffDias} dias`;
  return "";
}

const ITENS_POR_PAGINA = 6;

type Props = {
  aoFechar: () => void;
};

export function ModalUsuariosRecentes({ aoFechar }: Props) {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativos" | "bloqueados" | "pendentes">("todos");
  const [pagina, setPagina] = useState(1);
  const aoFecharRef = useRef(aoFechar);
  const conteudoRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        aoFecharRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  async function carregar() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await listarAdminUsuarios({ limite: 100 });
      setUsuarios(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar usuários recentes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregar();
  }, []);

  const usuariosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return usuarios.filter((usuario) => {
      if (statusFiltro === "ativos" && (!usuario.ativo || usuario.bloqueado)) return false;
      if (statusFiltro === "bloqueados" && !usuario.bloqueado) return false;
      if (statusFiltro === "pendentes" && usuario.emailVerificado) return false;

      if (!termo) return true;
      return (
        usuario.nome.toLowerCase().includes(termo) ||
        usuario.email.toLowerCase().includes(termo)
      );
    });
  }, [usuarios, busca, statusFiltro]);

  const totalPaginas = Math.max(1, Math.ceil(usuariosFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const usuariosPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return usuariosFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [usuariosFiltrados, paginaAtual]);

  function irParaPagina(novaPagina: number) {
    setPagina(Math.max(1, Math.min(totalPaginas, novaPagina)));
    conteudoRef.current?.scrollTo({ top: 0 });
  }

  const modalJSX = (
    <div
      className={styles.fundo}
      data-modal-overlay
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <section
        className={styles.modal}
        data-modal-panel
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-usuarios-recentes"
      >
        <header className={styles.cabecalho}>
          <div className={styles.cabecalhoInfo}>
            <span className={styles.iconeTopo}>
              <UserPlus aria-hidden="true" />
            </span>
            <div>
              <h3 id="titulo-usuarios-recentes">Usuários Criados Recentemente</h3>
              <p>Novos cadastros de jogadores ordenados pela data de registro mais recente.</p>
            </div>
          </div>
          <button
            type="button"
            className={styles.fechar}
            onClick={aoFechar}
            aria-label="Fechar modal"
            title="Fechar (Esc)"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <div className={styles.filtros}>
          <div className={styles.buscaWrap}>
            <Search aria-hidden="true" />
            <input
              type="text"
              className={styles.inputBusca}
              placeholder="Buscar por nome ou e-mail..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            className={styles.selectFiltro}
            value={statusFiltro}
            onChange={(e) => {
              setStatusFiltro(e.target.value as typeof statusFiltro);
              setPagina(1);
            }}
          >
            <option value="todos">Todos os status</option>
            <option value="ativos">Somente ativos</option>
            <option value="bloqueados">Somente bloqueados</option>
            <option value="pendentes">Não verificados</option>
          </select>

          <span className={styles.tagContador}>
            <Users size={13} aria-hidden="true" />
            {usuariosFiltrados.length} {usuariosFiltrados.length === 1 ? "usuário" : "usuários"}
          </span>
        </div>

        <div className={styles.conteudo} ref={conteudoRef}>
          {carregando ? (
            <div className={styles.carregandoWrap}>
              <RefreshCw aria-hidden="true" />
              <span>Carregando jogadores recentes...</span>
            </div>
          ) : erro ? (
            <div className={styles.estadoVazio}>
              <p>{erro}</p>
              <button
                type="button"
                className={styles.btnFecharRodape}
                onClick={() => void carregar()}
              >
                Tentar novamente
              </button>
            </div>
          ) : usuariosFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
              <p>Nenhum usuário recente encontrado com os filtros atuais.</p>
            </div>
          ) : (
            <div className={styles.tabelaWrap}>
              <table className={styles.tabela}>
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "15%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "11%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Jogador</th>
                    <th scope="col">Criado em</th>
                    <th scope="col">Status</th>
                    <th scope="col">Nível & Saldo</th>
                    <th scope="col">Último Login</th>
                    <th scope="col" className={styles.colunaDireita}>Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosPaginados.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Jogador">
                        <div className={styles.jogadorWrap}>
                          <div className={styles.avatarWrap}>
                            {item.avatarUrl ? (
                              <Image
                                src={item.avatarUrl}
                                alt=""
                                width={32}
                                height={32}
                                className={styles.avatarImg}
                              />
                            ) : (
                              <span className={styles.avatarPlaceholder}>
                                {item.nome.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className={styles.jogadorTextos}>
                            <span className={styles.jogadorNome} title={item.nome}>
                              <span className={styles.jogadorNomeTexto}>{item.nome}</span>
                              {item.admin ? (
                                <span className={styles.badgeAdmin}>Admin</span>
                              ) : null}
                            </span>
                            <small className={styles.jogadorEmail} title={item.email}>
                              {item.email}
                            </small>
                          </div>
                        </div>
                      </td>
                      <td data-label="Criado em">
                        <div className={styles.horarioWrap}>
                          <span className={styles.horarioExato}>
                            {formatarDataHora(item.criadoEm)}
                          </span>
                          <span className={styles.tempoRelativo}>
                            {formatarTempoRelativo(item.criadoEm)}
                          </span>
                        </div>
                      </td>
                      <td data-label="Status">
                        {item.bloqueado ? (
                          <span className={`${styles.statusBadge} ${styles.statusBloqueado}`}>
                            Bloqueado
                          </span>
                        ) : !item.ativo ? (
                          <span className={`${styles.statusBadge} ${styles.statusAbandonada}`}>
                            Inativo
                          </span>
                        ) : !item.emailVerificado ? (
                          <span className={`${styles.statusBadge} ${styles.statusPendente}`}>
                            Não verificado
                          </span>
                        ) : (
                          <span className={`${styles.statusBadge} ${styles.statusAtivo}`}>
                            <UserCheck size={11} aria-hidden="true" /> Ativo
                          </span>
                        )}
                      </td>
                      <td data-label="Nível & Saldo">
                        <div className={styles.nivelSaldoWrap}>
                          <span className={styles.nivelTexto}>Nv. {item.nivel}</span>
                          <span className={styles.saldoRubysTexto}>
                            {item.rubys.toLocaleString("pt-BR")} rubys
                          </span>
                        </div>
                      </td>
                      <td data-label="Último login">
                        {item.ultimoLoginEm ? (
                          <span className={styles.horarioExato}>
                            {formatarDataHora(item.ultimoLoginEm)}
                          </span>
                        ) : (
                          <span className={styles.ultimoLoginVazio}>Nunca acessou</span>
                        )}
                      </td>
                      <td data-label="Ação" className={styles.colunaDireita}>
                        <Link
                          href={`/admin/usuarios?q=${encodeURIComponent(item.email)}`}
                          className={styles.btnAcaoTabela}
                          title="Abrir usuário no painel"
                          onClick={aoFechar}
                        >
                          Ver <ExternalLink size={12} aria-hidden="true" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className={styles.rodape}>
          <nav className={styles.paginacao} aria-label="Paginação de usuários recentes">
            <button
              type="button"
              className={styles.btnPagina}
              disabled={paginaAtual <= 1 || carregando}
              onClick={() => irParaPagina(paginaAtual - 1)}
            >
              <ChevronLeft size={14} aria-hidden="true" /> Anterior
            </button>
            <span>
              Página {paginaAtual} de {totalPaginas}
            </span>
            <button
              type="button"
              className={styles.btnPagina}
              disabled={paginaAtual >= totalPaginas || carregando}
              onClick={() => irParaPagina(paginaAtual + 1)}
            >
              Próxima <ChevronRight size={14} aria-hidden="true" />
            </button>
          </nav>

          <button
            type="button"
            className={styles.btnFecharRodape}
            onClick={aoFechar}
          >
            Fechar
          </button>
        </footer>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalJSX, document.body);
}
