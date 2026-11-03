import { Activity, ArrowUpRight, Layers3 } from "lucide-react";
import Link from "next/link";
import type {
  AdminDashboardResumo,
  PeriodoDashboardAdmin,
} from "../../lib/admin";
import baseStyles from "../../styles/admin/adminShared.module.css";
import styles from "../../styles/admin/adminDashboardPainel.module.css";
import { useAdminRaridades } from "./useAdminRaridades";

const formatarNmr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);

const formatarData = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(valor))
    : "-";

type SegmentoDonut = {
  label: string;
  valor: number;
  cor: string;
};

function GraficoDonut({
  segmentos,
  centroValor,
  centroLabel,
}: {
  segmentos: SegmentoDonut[];
  centroValor: string;
  centroLabel: string;
}) {
  const total = segmentos.reduce((acc, item) => acc + item.valor, 0);
  const raio = 38;
  const circunferencia = 2 * Math.PI * raio;

  return (
    <div className={styles.donutWrap}>
      <div className={styles.donutFigura}>
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={raio}
            fill="none"
            stroke="#161f33"
            strokeWidth="11"
          />
          {total > 0
            ? segmentos.reduce<{
                acumulado: number;
                elementos: React.ReactNode[];
              }>(
                (estado, seg) => {
                  if (seg.valor <= 0) return estado;
                  const frac = seg.valor / total;
                  const comprimento = frac * circunferencia;
                  const offset = -estado.acumulado * circunferencia;
                  estado.acumulado += frac;
                  estado.elementos.push(
                    <circle
                      key={seg.label}
                      cx="50"
                      cy="50"
                      r={raio}
                      fill="none"
                      stroke={seg.cor}
                      strokeWidth="11"
                      strokeDasharray={`${comprimento} ${circunferencia}`}
                      strokeDashoffset={offset}
                      strokeLinecap="butt"
                      transform="rotate(-90 50 50)"
                    />,
                  );
                  return estado;
                },
                { acumulado: 0, elementos: [] },
              ).elementos
            : null}
        </svg>
        <div className={styles.donutCentro}>
          <strong>{centroValor}</strong>
          <small>{centroLabel}</small>
        </div>
      </div>

      <ul className={styles.donutLegenda}>
        {segmentos.map((seg) => {
          const pct = total > 0 ? Math.round((seg.valor / total) * 100) : 0;
          return (
            <li key={seg.label}>
              <i style={{ backgroundColor: seg.cor }} />
              <span>{seg.label}</span>
              <strong>{formatarNmr(seg.valor)}</strong>
              <small>{pct}%</small>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function DashboardPainel({
  resumo,
  periodo,
  carregando,
}: {
  resumo: AdminDashboardResumo | null;
  periodo: PeriodoDashboardAdmin;
  carregando: boolean;
}) {
  const raridades = useAdminRaridades();
  const dadosRaridade = resumo?.raridades ?? [];
  const totalRaridades = dadosRaridade.reduce(
    (total, item) => total + item.total,
    0,
  );

  const combate = resumo?.combate;
  const economia = resumo?.economia;
  const saude = resumo?.saudeCatalogo;

  const segmentosCombate: SegmentoDonut[] = [
    { label: "Vitórias", valor: combate?.vitorias ?? 0, cor: "#a3e635" },
    { label: "Derrotas", valor: combate?.derrotas ?? 0, cor: "#f87171" },
    {
      label: "Abandonos",
      valor: combate?.abandonosPartida ?? 0,
      cor: "#fbbf24",
    },
  ];

  const colunasExpedicao = [
    {
      label: "Vencidas",
      valor: combate?.expedicoes.concluidas ?? 0,
      cor: "#a3e635",
    },
    {
      label: "Ativas",
      valor: combate?.expedicoes.ativas ?? 0,
      cor: "#38bdf8",
    },
    {
      label: "Falhas",
      valor: combate?.expedicoes.falhas ?? 0,
      cor: "#f87171",
    },
    {
      label: "Abandonos",
      valor: combate?.expedicoes.abandonadas ?? 0,
      cor: "#fbbf24",
    },
  ];
  const maxExpedicao = Math.max(
    1,
    ...colunasExpedicao.map((item) => item.valor),
  );

  const maxRubysFluxo = Math.max(
    1,
    economia?.rubysEmitidosPeriodo ?? 0,
    economia?.rubysConsumidosPeriodo ?? 0,
    economia?.rubysGastosGachaPeriodo ?? 0,
  );

  const maxBannerGiros = Math.max(
    1,
    ...(economia?.bannersMaisGirados ?? []).map((b) => b.giros),
  );

  const segmentosRaridade: SegmentoDonut[] = raridades.map((raridade) => ({
    label: raridade.nome,
    valor:
      dadosRaridade.find((item) => item.raridade === raridade.codigo)?.total ??
      0,
    cor: raridade.cor,
  }));

  const maxCopiasCarta = Math.max(
    1,
    ...(resumo?.topCartas ?? []).map((item) => item.quantidade),
  );

  const maxDecksCarta = Math.max(
    1,
    ...(resumo?.topDecks ?? []).map((item) => item.decks),
  );

  const cartasCompletas = Math.max(
    0,
    (resumo?.metricas.cartasAtivas ?? 0) - (saude?.cartasSemHabilidade ?? 0),
  );
  const segmentosSaude: SegmentoDonut[] = [
    { label: "Com skill", valor: cartasCompletas, cor: "#a3e635" },
    {
      label: saude?.nomesSemHabilidade?.length
        ? `Sem skill (${saude.nomesSemHabilidade.join(", ")})`
        : "Sem skill",
      valor: saude?.cartasSemHabilidade ?? 0,
      cor: "#f87171",
    },
    {
      label: saude?.nomesForaDeBanner?.length
        ? `Fora de banner (${saude.nomesForaDeBanner.join(", ")})`
        : "Fora de banner",
      valor: saude?.cartasForaDeBanner ?? 0,
      cor: "#fbbf24",
    },
    {
      label: saude?.nomesSkillsRascunho?.length
        ? `Rascunho (${saude.nomesSkillsRascunho.join(", ")})`
        : "Skills rasc.",
      valor: saude?.habilidadesRascunho ?? 0,
      cor: "#a78bfa",
    },
  ];

  return (
    <section className={styles.grid}>
      {/* 1. Gráfico Donut: Desfecho das Partidas */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Combate ({periodo.toUpperCase()})</small>
            <h2>Desfecho das Batalhas</h2>
          </div>
          <Link href="/admin/usuarios/expedicoes">
            Detalhes <ArrowUpRight />
          </Link>
        </header>
        <GraficoDonut
          segmentos={segmentosCombate}
          centroValor={`${combate?.taxaVitoria ?? 0}%`}
          centroLabel="vitórias"
        />
      </article>

      {/* 2. Gráfico de Colunas: Status das Expedições */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Progressão PVE ({periodo.toUpperCase()})</small>
            <h2>Funil de Expedições</h2>
          </div>
          <strong>{combate?.expedicoes.taxaConclusao ?? 0}% concluem</strong>
        </header>
        <div className={styles.graficoColunas}>
          {colunasExpedicao.map((col) => {
            const altura = Math.max(
              8,
              Math.round((col.valor / maxExpedicao) * 100),
            );
            return (
              <div key={col.label} className={styles.colunaItem}>
                <strong className={styles.colunaValor}>
                  {formatarNmr(col.valor)}
                </strong>
                <div className={styles.colunaTrilha}>
                  <i
                    style={{
                      height: `${col.valor > 0 ? altura : 4}%`,
                      backgroundColor: col.cor,
                    }}
                  />
                </div>
                <small>{col.label}</small>
              </div>
            );
          })}
        </div>
      </article>

      {/* 3. Gráfico de Barras: Fluxo de Rubys & Gacha */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Economia ({periodo.toUpperCase()})</small>
            <h2>Balanço de Rubys & Banners</h2>
          </div>
          <Link href="/admin/banners">
            Banners <ArrowUpRight />
          </Link>
        </header>

        <div className={styles.graficoBarras}>
          <div className={styles.barraLinha}>
            <div className={styles.barraCabecalho}>
              <span>Emitidos (Recompensas/Compras)</span>
              <strong data-cor="verde">
                +{formatarNmr(economia?.rubysEmitidosPeriodo ?? 0)}
              </strong>
            </div>
            <div className={styles.barraFundo}>
              <i
                style={{
                  width: `${Math.round(((economia?.rubysEmitidosPeriodo ?? 0) / maxRubysFluxo) * 100)}%`,
                  background: "linear-gradient(90deg, #84cc16, #bef264)",
                }}
              />
            </div>
          </div>

          <div className={styles.barraLinha}>
            <div className={styles.barraCabecalho}>
              <span>Queimados em Gacha</span>
              <strong data-cor="roxo">
                -{formatarNmr(economia?.rubysGastosGachaPeriodo ?? 0)}
              </strong>
            </div>
            <div className={styles.barraFundo}>
              <i
                style={{
                  width: `${Math.round(((economia?.rubysGastosGachaPeriodo ?? 0) / maxRubysFluxo) * 100)}%`,
                  background: "linear-gradient(90deg, #7c3aed, #a78bfa)",
                }}
              />
            </div>
          </div>

          {(economia?.bannersMaisGirados ?? []).slice(0, 2).map((banner) => (
            <div className={styles.barraLinha} key={banner.id}>
              <div className={styles.barraCabecalho}>
                <span>Banner: {banner.nome}</span>
                <strong>{formatarNmr(banner.giros)} giros</strong>
              </div>
              <div className={styles.barraFundo}>
                <i
                  style={{
                    width: `${Math.round((banner.giros / maxBannerGiros) * 100)}%`,
                    background: "linear-gradient(90deg, #06b6d4, #38bdf8)",
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </article>

      {/* 4. Gráfico Donut: Distribuição de Raridades */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Biblioteca</small>
            <h2>Distribuição de Raridades</h2>
          </div>
          <Link href="/admin/cartas/raridades">
            Raridades <ArrowUpRight />
          </Link>
        </header>
        <GraficoDonut
          segmentos={segmentosRaridade}
          centroValor={formatarNmr(totalRaridades)}
          centroLabel="cartas"
        />
      </article>

      {/* 5. Gráfico de Barras Horizontais: Meta & Estoque */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Populares</small>
            <h2>Top Cartas (Inventário & Decks)</h2>
          </div>
          <Link href="/admin/cartas">
            Ver cartas <ArrowUpRight />
          </Link>
        </header>

        <div className={styles.graficoBarras}>
          {(resumo?.topCartas ?? []).slice(0, 4).map((carta) => {
            const corRaridade =
              raridades.find((r) => r.codigo === carta.raridade)?.cor ??
              "#8b5cf6";
            const largura = Math.max(
              6,
              Math.round((carta.quantidade / maxCopiasCarta) * 100),
            );
            const decksCount =
              resumo?.topDecks.find((d) => d.id === carta.id)?.decks ?? 0;

            return (
              <div className={styles.barraLinha} key={carta.id ?? carta.nome}>
                <div className={styles.barraCabecalho}>
                  <span>
                    <b
                      className={styles.pontoCor}
                      style={{ backgroundColor: corRaridade }}
                    />
                    {carta.nome}
                  </span>
                  <strong>
                    {formatarNmr(carta.quantidade)} cópias
                    {decksCount > 0
                      ? ` · ${formatarNmr(decksCount)} decks`
                      : ""}
                  </strong>
                </div>
                <div className={styles.barraFundo}>
                  <i
                    style={{
                      width: `${largura}%`,
                      backgroundColor: corRaridade,
                    }}
                  />
                </div>
              </div>
            );
          })}
          {!carregando &&
          !(resumo?.topCartas.length || maxDecksCarta > 1) ? (
            <p className={styles.estadoVazio}>Nenhum inventário registrado</p>
          ) : null}
        </div>
      </article>

      {/* 6. Gráfico Donut + Timeline Curta: Saúde & Auditoria */}
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Integridade & Logs</small>
            <h2>Saúde do Catálogo & Auditoria</h2>
          </div>
          <Link href="/admin/cartas/historico">
            Histórico <Activity />
          </Link>
        </header>
        <GraficoDonut
          segmentos={segmentosSaude}
          centroValor={`${resumo?.metricas.cartasAtivas ?? 0}`}
          centroLabel="ativas"
        />
        <div className={styles.miniAuditoria}>
          {(resumo?.atividadeRecente ?? []).slice(0, 2).map((item, idx) => (
            <p key={`${item.texto}-${idx}`}>
              <i data-tipo={item.tipo} />
              <strong>{item.texto}</strong>
              <time>{formatarData(item.data)}</time>
            </p>
          ))}
        </div>
      </article>

      <nav className={styles.atalhos} aria-label="Acessos rápidos">
        <span>
          <Layers3 /> Configuração do jogo
        </span>
        <Link href="/admin/habilidades">
          Habilidades <ArrowUpRight />
        </Link>
        <Link href="/admin/cartas/raridades">
          Raridades <ArrowUpRight />
        </Link>
        <Link href="/admin/banners">
          Banners <ArrowUpRight />
        </Link>
        <Link href="/admin/campanha">
          Campanha <ArrowUpRight />
        </Link>
        <Link href="/admin/noticias">
          Notícias <ArrowUpRight />
        </Link>
      </nav>
    </section>
  );
}
