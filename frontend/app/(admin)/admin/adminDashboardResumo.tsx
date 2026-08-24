import {
  ArrowUpRight,
  Layers,
  Plus,
  RefreshCw,
  Sparkles,
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
  icon: LucideIcon;
  href: string;
};
const formatarNmr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);

export function DashboardResumo({ resumo, carregando, onAtualizar }: Props) {
  const metricas = resumo?.metricas;
  const cards: Metrica[] = [
    {
      label: "Jogadores",
      valor: formatarNmr(metricas?.usuarios ?? 0),
      detalhe: `${formatarNmr(metricas?.usuariosAtivos ?? 0)} ativos`,
      icon: Users,
      href: "/admin/usuarios",
    },
    {
      label: "Cartas",
      valor: formatarNmr(metricas?.cartas ?? 0),
      detalhe: `${formatarNmr(metricas?.cartasAtivas ?? 0)} publicadas`,
      icon: Layers,
      href: "/admin/cartas",
    },
    {
      label: "Habilidades",
      valor: "Gerenciar",
      detalhe: "regras do combate",
      icon: Sparkles,
      href: "/admin/habilidades",
    },
    {
      label: "Partidas",
      valor: formatarNmr(metricas?.partidas ?? 0),
      detalhe: "duelos registrados",
      icon: Swords,
      href: "/admin/decks-npc",
    },
  ];

  return (
    <>
      <section className={styles.acoes}>
        <div>
          <span>Visão geral</span>
          <strong>{formatarNmr(metricas?.rubysEmCirculacao ?? 0)} rubys</strong>
          <small>em circulação na plataforma</small>
        </div>
        <Link href="/admin/cartas/nova">
          <Plus /> Criar nova carta
        </Link>
        <button
          type="button"
          onClick={() => void onAtualizar()}
          disabled={carregando}
        >
          <RefreshCw className={carregando ? styles.iconeGirando : ""} />{" "}
          Atualizar dados
        </button>
      </section>
      <section className={styles.metricas} aria-label="Atalhos administrativos">
        {cards.map(({ label, valor, detalhe, icon: Icon, href }) => (
          <Link className={styles.metrica} href={href} key={label}>
            <span className={styles.metricaIcone}>
              <Icon />
            </span>
            <span>{label}</span>
            <strong>{valor}</strong>
            <small>{detalhe}</small>
            <ArrowUpRight className={styles.metricaSeta} />
          </Link>
        ))}
      </section>
    </>
  );
}
