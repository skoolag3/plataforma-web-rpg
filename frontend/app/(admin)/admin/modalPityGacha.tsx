"use client";

import {
  Coins,
  Gem,
  Image as ImageIcon,
  RefreshCw,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  obterAdminPityHistorico,
  type AdminLogPityGacha,
} from "../../lib/admin";
import styles from "../../styles/admin/modalDashboardCards.module.css";

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
  return `${diaMesAno} às ${horaMinSeg}`;
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

function obterClasseRaridade(raridade: string) {
  switch (raridade.toUpperCase()) {
    case "UR":
      return styles.raridadeUR;
    case "SSR":
      return styles.raridadeSSR;
    case "SR":
      return styles.raridadeSR;
    case "R":
      return styles.raridadeR;
    default:
      return styles.raridadeN;
  }
}

type Props = {
  aoFechar: () => void;
};

export function ModalPityGacha({ aoFechar }: Props) {
  const [logs, setLogs] = useState<AdminLogPityGacha[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroRaridade, setFiltroRaridade] = useState<string>("todas");
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

  async function carregarPities() {
    setCarregando(true);
    setErro(null);
    try {
      const lista = await obterAdminPityHistorico(60);
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
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>

          <select
            className={styles.selectFiltro}
            value={filtroRaridade}
            onChange={(e) => setFiltroRaridade(e.target.value)}
          >
            <option value="todas">Todas as raridades</option>
            <option value="UR">UR (Ultra Raras)</option>
            <option value="SSR">SSR (Super Super Raras)</option>
            <option value="SR">SR (Super Raras)</option>
            <option value="R">R (Raras)</option>
            <option value="N">N (Normais)</option>
          </select>

          <span className={styles.tagContador}>
            <Sparkles size={13} aria-hidden="true" />
            {logsFiltrados.length} {logsFiltrados.length === 1 ? "invocação" : "invocações"}
          </span>
        </div>

        <div className={styles.conteudo}>
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
                <thead>
                  <tr>
                    <th scope="col">Carta Obtida</th>
                    <th scope="col">Pity no Pull</th>
                    <th scope="col">Jogador</th>
                    <th scope="col">Banner</th>
                    <th scope="col">Horário da Obtenção</th>
                    <th scope="col">Custo</th>
                  </tr>
                </thead>
                <tbody>
                  {logsFiltrados.map((item) => (
                    <tr key={item.id}>
                      <td>
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
                            <span className={styles.cartaNome}>{item.carta.nome}</span>
                            <div className={styles.cartaTags}>
                              <span
                                className={`${styles.raridadeTag} ${obterClasseRaridade(item.carta.raridade)}`}
                              >
                                {item.carta.raridade}
                              </span>
                              <span className={styles.elementoTag}>
                                {item.carta.elemento}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
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
                      <td>
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
                            <strong className={styles.jogadorNome}>{item.jogador.nome}</strong>
                            <small className={styles.jogadorEmail}>{item.jogador.email}</small>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={styles.deckBadge}>{item.banner.nome}</span>
                      </td>
                      <td>
                        <div className={styles.horarioWrap}>
                          <span className={styles.horarioExato}>
                            {formatarDataHoraCompleta(item.dataHora)}
                          </span>
                          <span className={styles.tempoRelativo}>
                            {formatarTempoRelativo(item.dataHora)}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={styles.rubysCell}>
                          <Gem size={13} aria-hidden="true" />
                          {item.rubysGastos}
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
          <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
            Exibindo as {logs.length} invocações mais recentes registradas.
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
