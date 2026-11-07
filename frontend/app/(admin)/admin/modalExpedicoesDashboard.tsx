"use client";

import {
  ChevronLeft,
  ChevronRight,
  Gem,
  Map,
  PauseCircle,
  PlayCircle,
  RefreshCw,
  Swords,
  X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  obterAdminExpedicoes,
  type AdminExpedicoesPainel,
} from "../../lib/admin";
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

function obterClasseStatus(status: string) {
  const normalizado = status.toLowerCase();
  if (normalizado.includes("vitória") || normalizado.includes("concluid")) {
    return styles.statusVitoria;
  }
  if (normalizado.includes("derrota") || normalizado.includes("falha")) {
    return styles.statusDerrota;
  }
  if (normalizado.includes("andamento") || normalizado.includes("ativa")) {
    return styles.statusEmAndamento;
  }
  return styles.statusAbandonada;
}

type Props = {
  aoFechar: () => void;
};

export function ModalExpedicoesDashboard({ aoFechar }: Props) {
  const [pagina, setPagina] = useState(1);
  const [painel, setPainel] = useState<AdminExpedicoesPainel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
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

  async function carregarExpedicoes(numPagina: number) {
    setCarregando(true);
    setErro(null);
    try {
      const dados = await obterAdminExpedicoes(numPagina);
      setPainel(dados);
      if (dados.paginacao.pagina !== numPagina) {
        setPagina(dados.paginacao.pagina);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar expedições.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarExpedicoes(pagina);
  }, [pagina]);

  const paginacao = painel?.paginacao;

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
        aria-labelledby="titulo-expedicoes-jogadores"
      >
        <header className={styles.cabecalho}>
          <div className={styles.cabecalhoInfo}>
            <span className={styles.iconeTopo}>
              <Swords aria-hidden="true" />
            </span>
            <div>
              <h3 id="titulo-expedicoes-jogadores">Expedições dos Jogadores</h3>
              <p>Acompanhe jornadas em andamento e consulte o histórico completo.</p>
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

        {painel ? (
          <div className={styles.metricasGrid} aria-label="Resumo das expedições">
            <div className={styles.metricaItem}>
              <span className={styles.metricaIcone}>
                <Map aria-hidden="true" />
              </span>
              <div>
                <strong>{painel.metricas.total}</strong>
                <small>Expedições</small>
              </div>
            </div>
            <div className={styles.metricaItem}>
              <span className={styles.metricaIcone} style={{ color: "#60a5fa", background: "rgba(59, 130, 246, 0.16)" }}>
                <Swords aria-hidden="true" />
              </span>
              <div>
                <strong>{painel.metricas.ativas}</strong>
                <small>Em andamento</small>
              </div>
            </div>
            <div className={styles.metricaItem}>
              <span className={styles.metricaIcone} style={{ color: "#4ade80", background: "rgba(34, 197, 94, 0.16)" }}>
                <PlayCircle aria-hidden="true" />
              </span>
              <div>
                <strong>{painel.metricas.concluidas}</strong>
                <small>Concluídas</small>
              </div>
            </div>
            <div className={styles.metricaItem}>
              <span className={styles.metricaIcone} style={{ color: "#f87171", background: "rgba(239, 68, 68, 0.16)" }}>
                <PauseCircle aria-hidden="true" />
              </span>
              <div>
                <strong>{painel.metricas.falhas + painel.metricas.abandonadas}</strong>
                <small>Encerradas</small>
              </div>
            </div>
          </div>
        ) : null}

        <div className={styles.conteudo} ref={conteudoRef}>
          {carregando && !painel ? (
            <div className={styles.carregandoWrap}>
              <RefreshCw aria-hidden="true" />
              <span>Carregando expedições...</span>
            </div>
          ) : erro ? (
            <div className={styles.estadoVazio}>
              <p>{erro}</p>
              <button
                type="button"
                className={styles.btnFecharRodape}
                onClick={() => void carregarExpedicoes(pagina)}
              >
                Tentar novamente
              </button>
            </div>
          ) : !painel || painel.expedicoes.length === 0 ? (
            <div className={styles.estadoVazio}>
              <p>Nenhuma expedição registrada até o momento.</p>
            </div>
          ) : (
            <div className={styles.tabelaWrap}>
              <table className={styles.tabela}>
                <colgroup>
                  <col style={{ width: "28%" }} />
                  <col style={{ width: "18%" }} />
                  <col style={{ width: "16%" }} />
                  <col style={{ width: "9%" }} />
                  <col style={{ width: "12%" }} />
                  <col style={{ width: "17%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Jogador</th>
                    <th scope="col">Deck</th>
                    <th scope="col">Status</th>
                    <th scope="col">Etapa</th>
                    <th scope="col">Rubys</th>
                    <th scope="col">Início</th>
                  </tr>
                </thead>
                <tbody>
                  {painel.expedicoes.map((item) => (
                    <tr key={item.id}>
                      <td data-label="Jogador">
                        <div className={styles.jogadorTextos}>
                          <strong className={styles.jogadorNome} title={item.jogador}>
                            <span className={styles.jogadorNomeTexto}>{item.jogador}</span>
                          </strong>
                          <small className={styles.jogadorEmail} title={item.email}>
                            {item.email}
                          </small>
                        </div>
                      </td>
                      <td data-label="Deck">
                        <span className={styles.deckBadge} title={item.deck || "Meu Deck"}>
                          {item.deck || "Meu Deck"}
                        </span>
                      </td>
                      <td data-label="Status">
                        <span className={`${styles.statusBadge} ${obterClasseStatus(item.status)}`}>
                          {item.status}
                        </span>
                      </td>
                      <td data-label="Etapa">
                        <span className={styles.nivelTexto}>{item.etapaAtual}/4</span>
                      </td>
                      <td data-label="Rubys">
                        <span className={styles.rubysCell}>
                          <Gem size={13} aria-hidden="true" />
                          {item.rubys.toLocaleString("pt-BR")}
                        </span>
                      </td>
                      <td data-label="Início">
                        <span className={styles.horarioExato}>
                          {formatarDataHora(item.criadoEm)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className={styles.rodape}>
          <nav className={styles.paginacao} aria-label="Paginação de expedições">
            <button
              type="button"
              className={styles.btnPagina}
              disabled={pagina <= 1 || carregando}
              onClick={() => {
                setPagina((p) => Math.max(1, p - 1));
                conteudoRef.current?.scrollTo({ top: 0 });
              }}
            >
              <ChevronLeft size={14} aria-hidden="true" /> Anterior
            </button>
            <span>
              Página {pagina} de {Math.max(1, paginacao?.totalPaginas ?? 1)}
            </span>
            <button
              type="button"
              className={styles.btnPagina}
              disabled={pagina >= Math.max(1, paginacao?.totalPaginas ?? 1) || carregando}
              onClick={() => {
                setPagina((p) => p + 1);
                conteudoRef.current?.scrollTo({ top: 0 });
              }}
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
