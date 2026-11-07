"use client";

import {
  ChevronLeft,
  ChevronRight,
  Coins,
  Gem,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { type CSSProperties, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  obterAdminPityHistorico,
  type AdminLogPityGacha,
} from "../../lib/admin";
import styles from "../../styles/admin/modalDashboardCards.module.css";
import { useAdminRaridades } from "./useAdminRaridades";

function formatarDataHoraCompleta(dataStr: string | null) {
  if (!dataStr) return "-";
  const data = new Date(dataStr);
  if (Number.isNaN(data.getTime())) return "-";
  const diaMesAno = new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(data);
  const horaMinSeg = new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(data);
  return `${diaMesAno}, ${horaMinSeg}`;
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

export function ModalPityGacha({ aoFechar }: Props) {
  const raridades = useAdminRaridades();
  const [logs, setLogs] = useState<AdminLogPityGacha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroRaridade, setFiltroRaridade] = useState<string>("todas");
  const [pagina, setPagina] = useState(1);
  const aoFecharRef = useRef(aoFechar);
  const conteudoRef = useRef<HTMLDivElement | null>(null);

  const raridadesOrdenadas = useMemo(
    () => [...raridades].sort((a, b) => b.ordem - a.ordem),
    [raridades],
  );

  const mapaRaridades = useMemo(
    () => new Map(raridades.map((item) => [item.codigo.toUpperCase(), item])),
    [raridades],
  );

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

  async function carregarPities() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await obterAdminPityHistorico(100);
      setLogs(lista);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro ao carregar histórico de pity.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarPities();
  }, []);

  const logsFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return logs.filter((log) => {
      if (
        filtroRaridade !== "todas" &&
        log.carta.raridade.toUpperCase() !== filtroRaridade.toUpperCase()
      ) {
        return false;
      }

      if (!termo) return true;
      return (
        log.carta.nome.toLowerCase().includes(termo) ||
        log.jogador.nome.toLowerCase().includes(termo) ||
        log.jogador.email.toLowerCase().includes(termo) ||
        log.banner.nome.toLowerCase().includes(termo)
      );
    });
  }, [logs, busca, filtroRaridade]);

  const totalPaginas = Math.max(1, Math.ceil(logsFiltrados.length / ITENS_POR_PAGINA));
  const paginaAtual = Math.min(pagina, totalPaginas);

  const logsPaginados = useMemo(() => {
    const inicio = (paginaAtual - 1) * ITENS_POR_PAGINA;
    return logsFiltrados.slice(inicio, inicio + ITENS_POR_PAGINA);
  }, [logsFiltrados, paginaAtual]);

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
        aria-labelledby="titulo-pity-gacha"
      >
        <header className={styles.cabecalho}>
          <div className={styles.cabecalhoInfo}>
            <span className={styles.iconeTopo}>
              <Coins aria-hidden="true" />
            </span>
            <div>
              <h3 id="titulo-pity-gacha">Últimas Cartas no Pity & Gacha</h3>
              <p>Histórico recente de invocações, contagem de pity e horário exato de cada obtenção.</p>
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
              placeholder="Buscar por carta, jogador ou banner..."
              value={busca}
              onChange={(e) => {
                setBusca(e.target.value);
                setPagina(1);
              }}
            />
          </div>

          <select
            className={styles.selectFiltro}
            value={filtroRaridade}
            onChange={(e) => {
              setFiltroRaridade(e.target.value);
              setPagina(1);
            }}
          >
            <option value="todas">Todas as raridades</option>
            {raridadesOrdenadas.map((raridade) => (
              <option key={raridade.codigo} value={raridade.codigo}>
                {raridade.nome}
              </option>
            ))}
          </select>

          <span className={styles.tagContador}>
            <Sparkles size={13} aria-hidden="true" />
            {logsFiltrados.length} {logsFiltrados.length === 1 ? "invocação" : "invocações"}
          </span>
        </div>

        <div className={styles.conteudo} ref={conteudoRef}>
          {carregando ? (
            <div className={styles.carregandoWrap}>
              <RefreshCw aria-hidden="true" />
              <span>Carregando histórico do pity...</span>
            </div>
          ) : erro ? (
            <div className={styles.estadoVazio}>
              <p>{erro}</p>
              <button
                type="button"
                className={styles.btnFecharRodape}
                onClick={() => void carregarPities()}
              >
                Tentar novamente
              </button>
            </div>
          ) : logsFiltrados.length === 0 ? (
            <div className={styles.estadoVazio}>
              <p>Nenhuma invocação encontrada com os filtros selecionados.</p>
            </div>
          ) : (
            <div className={styles.tabelaWrap}>
              <table className={styles.tabela}>
                <colgroup>
                  <col style={{ width: "26%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "21%" }} />
                  <col style={{ width: "13%" }} />
                  <col style={{ width: "17%" }} />
                  <col style={{ width: "10%" }} />
                </colgroup>
                <thead>
                  <tr>
                    <th scope="col">Carta Obtida</th>
                    <th scope="col">Pity</th>
                    <th scope="col">Jogador</th>
                    <th scope="col">Banner</th>
                    <th scope="col">Obtida em</th>
                    <th scope="col" className={styles.colunaDireita}>Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {logsPaginados.map((item) => {
                    const infoRaridade = mapaRaridades.get(item.carta.raridade.toUpperCase());
                    return (
                      <tr key={item.id}>
                        <td data-label="Carta">
                          <div className={styles.cartaCell}>
                            <div className={styles.cartaMiniatura}>
                              {item.carta.foto ? (
                                <Image
                                  src={item.carta.foto}
                                  alt=""
                                  width={36}
                                  height={45}
                                />
                              ) : (
                                <ImageIcon size={16} color="#717d9e" />
                              )}
                            </div>
                            <div className={styles.cartaTextos}>
                              <span className={styles.cartaNome} title={item.carta.nome}>
                                {item.carta.nome}
                              </span>
                              <div className={styles.cartaTags}>
                                <span
                                  className={`${styles.raridadeTag} ${styles.raridadeDinamica}`}
                                  style={
                                    infoRaridade
                                      ? ({ "--cor-raridade": infoRaridade.cor } as CSSProperties)
                                      : undefined
                                  }
                                >
                                  {infoRaridade?.nome ?? item.carta.raridade}
                                </span>
                                <span className={styles.elementoTag}>
                                  {item.carta.elemento}
                                </span>
                              </div>
                            </div>
                          </div>
                        </td>
                        <td data-label="Pity">
                          <div className={styles.pityWrap}>
                            <span className={styles.pityBadge}>
                              Pity <span className={styles.pityDestaque}>#{item.pityContador}</span>
                            </span>
                            {item.foiPityGarantido ? (
                              <span className={styles.pityGarantidoTag}>Garantido</span>
                            ) : item.limitePityBanner ? (
                              <small style={{ fontSize: "0.62rem", color: "#8790a3" }}>
                                Limite: {item.limitePityBanner}
                              </small>
                            ) : null}
                          </div>
                        </td>
                        <td data-label="Jogador">
                          <div className={styles.jogadorWrap}>
                            <div className={styles.avatarWrap}>
                              {item.jogador.avatarUrl ? (
                                <Image
                                  src={item.jogador.avatarUrl}
                                  alt=""
                                  width={32}
                                  height={32}
                                  className={styles.avatarImg}
                                />
                              ) : (
                                <span className={styles.avatarPlaceholder}>
                                  {item.jogador.nome.charAt(0)}
                                </span>
                              )}
                            </div>
                            <div className={styles.jogadorTextos}>
                              <strong className={styles.jogadorNome} title={item.jogador.nome}>
                                <span className={styles.jogadorNomeTexto}>{item.jogador.nome}</span>
                              </strong>
                              <small className={styles.jogadorEmail} title={item.jogador.email}>
                                {item.jogador.email}
                              </small>
                            </div>
                          </div>
                        </td>
                        <td data-label="Banner">
                          <span className={styles.deckBadge} title={item.banner.nome}>
                            {item.banner.nome}
                          </span>
                        </td>
                        <td data-label="Obtida em">
                          <div className={styles.horarioWrap}>
                            <span className={styles.horarioExato}>
                              {formatarDataHoraCompleta(item.dataHora)}
                            </span>
                            <span className={styles.tempoRelativo}>
                              {formatarTempoRelativo(item.dataHora)}
                            </span>
                          </div>
                        </td>
                        <td data-label="Custo" className={styles.colunaDireita}>
                          <span className={styles.rubysCell}>
                            <Gem size={13} aria-hidden="true" />
                            {item.rubysGastos.toLocaleString("pt-BR")}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <footer className={styles.rodape}>
          <nav className={styles.paginacao} aria-label="Paginação do histórico de pity">
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
