import {
  ArrowUpRight,
  CircleCheck,
  Layers,
  Plus,
  RefreshCw,
  Swords,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import type { AdminDashboardResumo } from "../../lib/admin";
import styles from "../../styles/admin/adminDashboardResumo.module.css";

type Props = {
  resumo: AdminDashboardResumo | null;
  carregando: boolean;
  onAtualizar: () => Promise<void>;
};
type Metrica = {
  label: string;
  valor: string;
  detalhe: string;
  progresso?: number;
  icon: LucideIcon;
  href: string;
};
const formatarNmr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);

export function DashboardResumo({ resumo, carregando, onAtualizar }: Props) {
  const metricas = resumo?.metricas;
  const percentualAtivos = metricas?.usuarios
    ? Math.round((metricas.usuariosAtivos / metricas.usuarios) * 100)
    : 0;
  const percentualPublicadas = metricas?.cartas
    ? Math.round((metricas.cartasAtivas / metricas.cartas) * 100)
    : 0;
  const cards: Metrica[] = [
    {
      label: "Jogadores",
      valor: formatarNmr(metricas?.usuarios ?? 0),
      detalhe: `${formatarNmr(metricas?.usuariosAtivos ?? 0)} contas ativas`,
      progresso: percentualAtivos,
      icon: Users,
      href: "/admin/usuarios",
    },
    {
      label: "Cartas",
      valor: formatarNmr(metricas?.cartas ?? 0),
      detalhe: `${formatarNmr(metricas?.cartasAtivas ?? 0)} publicadas`,
      progresso: percentualPublicadas,
      icon: Layers,
      href: "/admin/cartas",
    },
    {
      label: "Partidas",
      valor: formatarNmr(metricas?.partidas ?? 0),
      detalhe: "duelos registrados",
      icon: Swords,
      href: "/admin/decks-npc",
    },
    {
      label: "Rubys",
      valor: formatarNmr(metricas?.rubysEmCirculacao ?? 0),
      detalhe: "em circulação",
      icon: CircleCheck,
      href: "/admin/banners",
    },
  ];

  return (
    <>
      <section className={styles.cabecalhoOperacional}>
        <div className={styles.statusOperacional}>
          <span>
            <i /> Operação da plataforma
          </span>
          <strong>Controle rápido do ecossistema</strong>
          <small>
            {formatarNmr(metricas?.usuariosAtivos ?? 0)} jogadores ativos e{" "}
            {formatarNmr(metricas?.cartasAtivas ?? 0)} cartas disponíveis.
          </small>
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
      </section>
      <section className={styles.metricas} aria-label="Atalhos administrativos">
        {cards.map(({ label, valor, detalhe, progresso, icon: Icon, href }) => (
          <Link className={styles.metrica} href={href} key={label}>
            <span className={styles.metricaIcone}>
              <Icon />
            </span>
            <span>{label}</span>
            <strong>{valor}</strong>
            <small>{detalhe}</small>
            {progresso !== undefined ? (
              <span className={styles.progresso}>
                <i style={{ width: `${progresso}%` }} />
                <b>{progresso}%</b>
              </span>
            ) : null}
            <ArrowUpRight className={styles.metricaSeta} />
          </Link>
        ))}
      </section>
    </>
  );
}
