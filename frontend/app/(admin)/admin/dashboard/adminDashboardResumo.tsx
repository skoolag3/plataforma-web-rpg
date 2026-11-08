import {
  ArrowUpRight,
  CalendarRange,
  Coins,
  Plus,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type {
  AdminDashboardResumo,
  PeriodoDashboardAdmin,
} from "../../../lib/admin";
import styles from "../../../styles/admin/adminDashboardResumo.module.css";

type Props = {
  resumo: AdminDashboardResumo | null;
  periodo: PeriodoDashboardAdmin;
  onChangePeriodo: (periodo: PeriodoDashboardAdmin) => void;
  carregando: boolean;
  onAtualizar: () => Promise<void>;
  onAbrirUsuariosRecentes?: () => void;
  onAbrirExpedicoes?: () => void;
  onAbrirPityGacha?: () => void;
};

type Metrica = {
  label: string;
  pergunta: string;
  valor: string;
  destaque: string;
  detalhe: string;
  progresso?: number;
  tom?: "verde" | "roxo" | "amarelo";
  icon: LucideIcon;
  href?: string;
  onClick?: () => void;
};

const formatarNmr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);

const formatarMoeda = (valor: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valor);

const rotuloPeriodo: Record<PeriodoDashboardAdmin, string> = {
  "7d": "Últimos 7 dias",
  "30d": "Últimos 30 dias",
  tudo: "Todo o período",
};

export function DashboardResumo({
  resumo,
  periodo,
  onChangePeriodo,
  carregando,
  onAtualizar,
  onAbrirUsuariosRecentes,
  onAbrirExpedicoes,
  onAbrirPityGacha,
}: Props) {
  const metricas = resumo?.metricas;
  const combate = resumo?.combate;
  const economia = resumo?.economia;
  const saude = resumo?.saudeCatalogo;

  const taxaEngajamento = metricas?.usuariosAtivos
    ? Math.min(
        100,
        Math.round((metricas.usuariosLoginPeriodo / metricas.usuariosAtivos) * 100),
      )
    : 0;

  const pendenciasCatalogo =
    (saude?.cartasSemHabilidade ?? 0) +
    (saude?.cartasForaDeBanner ?? 0) +
    (saude?.habilidadesRascunho ?? 0);

  const percentualProntas = metricas?.cartasAtivas
    ? Math.max(
        0,
        Math.round(
          ((metricas.cartasAtivas - (saude?.cartasSemHabilidade ?? 0)) /
            metricas.cartasAtivas) *
            100,
        ),
      )
    : 100;

  const itensPendentes: string[] = [];
  if ((saude?.cartasSemHabilidade ?? 0) > 0) {
    const nomes = saude?.nomesSemHabilidade?.slice(0, 2).join(", ");
    itensPendentes.push(
      nomes
        ? `Sem skill: ${nomes}`
        : `${saude?.cartasSemHabilidade} carta sem skill`,
    );
  }
  if ((saude?.cartasForaDeBanner ?? 0) > 0) {
    const nomes = saude?.nomesForaDeBanner?.slice(0, 2).join(", ");
    itensPendentes.push(
      nomes
        ? `Sem banner: ${nomes}`
        : `${saude?.cartasForaDeBanner} fora de banner`,
    );
  }
  if ((saude?.habilidadesRascunho ?? 0) > 0) {
    const nomes = saude?.nomesSkillsRascunho?.slice(0, 2).join(", ");
    itensPendentes.push(
      nomes
        ? `Rascunho: ${nomes}`
        : `${saude?.habilidadesRascunho} skill rascunho`,
    );
  }

  const cards: Metrica[] = [
    {
      label: "Jogadores ativos",
      pergunta: `${taxaEngajamento}% acessaram no período`,
      valor: formatarNmr(metricas?.usuariosLoginPeriodo ?? 0),
      destaque: `+${formatarNmr(metricas?.usuariosNovosPeriodo ?? 0)} novos`,
      detalhe: `${formatarNmr(metricas?.usuariosAtivos ?? 0)} contas ativas`,
      progresso: taxaEngajamento,
      tom: "verde",
      icon: Users,
      onClick: onAbrirUsuariosRecentes,
      href: "/admin/usuarios",
    },
    {
      label: "Expedições PVE",
      pergunta: `${combate?.mediaTurnos ?? 0} turnos médios · +${formatarNmr(combate?.rubysRecompensados ?? 0)} rubys`,
      valor: formatarNmr(combate?.expedicoes.total ?? 0),
      destaque: `${combate?.expedicoes.concluidas ?? 0} vencidas`,
      detalhe: `${combate?.expedicoes.ativas ?? 0} em andamento · ${formatarNmr(combate?.partidasPeriodo ?? 0)} batalhas`,
      progresso: combate?.expedicoes.taxaConclusao ?? 0,
      tom: "roxo",
      icon: Swords,
      onClick: onAbrirExpedicoes,
      href: "/admin/usuarios/expedicoes",
    },
    {
      label: "Invocações Gacha",
      pergunta: `Pity médio: ${economia?.pityMedio ?? 0}`,
      valor: formatarNmr(economia?.girosGachaPeriodo ?? 0),
      destaque: `${formatarNmr(economia?.rubysGastosGachaPeriodo ?? 0)} rubys`,
      detalhe: `Loja: ${formatarMoeda(economia?.receitaBrlPeriodo ?? 0)}`,
      icon: Coins,
      onClick: onAbrirPityGacha,
      href: "/admin/banners",
    },
    {
      label: "Catálogo & Skills",
      pergunta: `${formatarNmr(metricas?.cartasAtivas ?? 0)} cartas · ${saude?.bannersAtivos ?? 0} banners ativos`,
      valor: `${percentualProntas}%`,
      destaque:
        itensPendentes.length === 0
          ? "Catálogo completo"
          : itensPendentes[0],
      detalhe:
        itensPendentes.length === 0
          ? "Todas as cartas com skill e banner"
          : itensPendentes.join(" · "),
      progresso: percentualProntas,
      tom: pendenciasCatalogo > 0 ? "amarelo" : "verde",
      icon: pendenciasCatalogo > 0 ? ShieldAlert : Sparkles,
      href: "/admin/cartas",
    },
  ];

  return (
    <>
      <section className={styles.cabecalhoOperacional}>
        <div className={styles.statusOperacional}>
          <span>
            <i /> Visão analítica · {rotuloPeriodo[periodo]}
          </span>
          <strong>
            {formatarNmr(metricas?.rubysEmCirculacao ?? 0)} rubys em circulação
            · {formatarNmr(metricas?.partidas ?? 0)} partidas registradas
          </strong>
        </div>

        <div className={styles.controlesTopo}>
          <div
            className={styles.filtroPeriodo}
            role="group"
            aria-label="Filtrar período do dashboard"
          >
            <CalendarRange />
            {(["7d", "30d", "tudo"] as PeriodoDashboardAdmin[]).map((item) => (
              <button
                key={item}
                type="button"
                data-ativo={periodo === item || undefined}
                onClick={() => onChangePeriodo(item)}
              >
                {item === "7d" ? "7 dias" : item === "30d" ? "30 dias" : "Tudo"}
              </button>
            ))}
          </div>

          <div className={styles.acoes}>
            <Link href="/admin/cartas/nova">
              <Plus /> Nova carta
            </Link>
            <button
              type="button"
              onClick={() => void onAtualizar()}
              disabled={carregando}
              aria-label="Atualizar dados do dashboard"
            >
              <RefreshCw className={carregando ? styles.iconeGirando : ""} />{" "}
              Atualizar
            </button>
          </div>
        </div>
      </section>

      <section className={styles.metricas} aria-label="Indicadores de operação">
        {cards.map(
          ({
            label,
            pergunta,
            valor,
            destaque,
            detalhe,
            progresso,
            tom,
            icon: Icon,
            href,
            onClick,
          }) => {
            const conteudo = (
              <>
                <div className={styles.metricaTopo}>
                  <span className={styles.metricaIcone}>
                    <Icon />
                  </span>
                  <div>
                    <span className={styles.metricaLabel}>{label}</span>
                    <small className={styles.metricaPergunta}>{pergunta}</small>
                  </div>
                  <ArrowUpRight className={styles.metricaSeta} />
                </div>

                <div className={styles.metricaLinha}>
                  <strong>{valor}</strong>
                  <span className={styles.metricaDestaque}>{destaque}</span>
                </div>
                <small className={styles.metricaDetalhe}>{detalhe}</small>

                {progresso !== undefined ? (
                  <span className={styles.progresso}>
                    <i style={{ width: `${progresso}%` }} />
                  </span>
                ) : null}
              </>
            );

            if (onClick) {
              return (
                <button
                  type="button"
                  className={styles.metrica}
                  data-tom={tom}
                  key={label}
                  onClick={onClick}
                >
                  {conteudo}
                </button>
              );
            }

            return (
              <Link
                className={styles.metrica}
                data-tom={tom}
                href={href ?? "#"}
                key={label}
              >
                {conteudo}
              </Link>
            );
          },
        )}
      </section>
    </>
  );
}
