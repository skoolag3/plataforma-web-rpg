"use client";

import {
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
import { listarAdminUsuarios, type AdminUsuario } from "../../lib/admin";
import styles from "../../styles/admin/modalDashboardCards.module.css";

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

type Props = {
  aoFechar: () => void;
};

export function ModalUsuariosRecentes({ aoFechar }: Props) {
  const [usuarios, setUsuarios] = useState<AdminUsuario[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [statusFiltro, setStatusFiltro] = useState<"todos" | "ativos" | "bloqueados" | "pendentes">("todos");
  const aoFecharRef = useRef(aoFechar);

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
      const lista = await listarAdminUsuarios({ limite: 60 });
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

  const modalJSX = (
    <div
      className={styles.fundo}
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) aoFechar();
      }}
    >
      <section
        className={styles.modal}
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
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFiltro}
            value={statusFiltro}
            onChange={(e) => setStatusFiltro(e.target.value as typeof statusFiltro)}
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

        <div className={styles.conteudo}>
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
                  <col style={{ width: "27%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "14%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "8%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Jogador</th>
                    <th scope="col">Criado em</th>
                    <th scope="col">Status</th>
                    <th scope="col">Nível & Saldo</th>
                    <th scope="col">Último Login</th>
                    <th scope="col">Ação</th>
                  </tr>
                </thead>
                <tbody>
                  {usuariosFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td>
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
                            <span className={styles.jogadorNome}>
                              {item.nome}
                              {item.admin ? (
                                <span className={styles.badgeAdmin}>Admin</span>
                              ) : null}
                            </span>
                            <small className={styles.jogadorEmail}>{item.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div className={styles.horarioWrap}>
                          <span className={styles.horarioExato}>
                            {formatarDataHora(item.criadoEm)}
                          </span>
                          <span className={styles.tempoRelativo}>
                            {formatarTempoRelativo(item.criadoEm)}
                          </span>
                        </div>
                      </td>
                      <td>
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
                      <td>
                        <span style={{ fontWeight: 600, color: "#f8fafc" }}>
                          Nv. {item.nivel}
                        </span>{" "}
                        ·{" "}
                        <span style={{ color: "#38bdf8", fontWeight: 700 }}>
                          {item.rubys.toLocaleString("pt-BR")} rubys
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.72rem", color: item.ultimoLoginEm ? "#cbd5e1" : "#64748b" }}>
                          {item.ultimoLoginEm ? formatarDataHora(item.ultimoLoginEm) : "Nunca acessou"}
                        </span>
                      </td>
                      <td>
                        <Link
                          href={`/admin/usuarios?q=${encodeURIComponent(item.email)}`}
                          className={styles.btnAcaoTabela}
                          onClick={aoFechar}
                        >
                          Ver perfil <ExternalLink size={12} aria-hidden="true" />
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
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Total de {usuarios.length} novos cadastros listados.
          </span>
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
