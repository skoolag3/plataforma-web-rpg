import { Activity, ArrowUpRight, Layers3 } from "lucide-react";
import Link from "next/link";
import type { AdminDashboardResumo } from "../../lib/admin";
import baseStyles from "../../styles/admin/adminShared.module.css";
import styles from "../../styles/admin/adminDashboardPainel.module.css";

const raridades = ["UR", "SSR", "SR", "R", "N"] as const;
const formatarNmr = (valor: number) =>
  new Intl.NumberFormat("pt-BR").format(valor);
const formatarData = (valor: string | null) =>
  valor
    ? new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(valor))
    : "-";

export function DashboardPainel({
  resumo,
  carregando,
}: {
  resumo: AdminDashboardResumo | null;
  carregando: boolean;
}) {
  const dadosRaridade = resumo?.raridades ?? [];
  const totalRaridades = dadosRaridade.reduce(
    (total, item) => total + item.total,
    0,
  );

  return (
    <section className={styles.grid}>
      <article className={`${baseStyles.chartCard} ${styles.card}`}>
        <header>
          <div>
            <small>Biblioteca</small>
            <h2>Distribuição de raridades</h2>
          </div>
          <strong>{formatarNmr(totalRaridades)} cartas</strong>
        </header>
        <div
          className={styles.faixaRaridades}
          aria-label="Proporção por raridade"
        >
          {raridades.map((raridade) => {
            const total =
              dadosRaridade.find((item) => item.raridade === raridade)?.total ??
              0;
            const percentual = totalRaridades
              ? (total / totalRaridades) * 100
              : 0;
            return percentual ? (
              <i
                key={raridade}
                data-raridade={raridade}
                style={{ width: `${percentual}%` }}
                title={`${raridade}: ${Math.round(percentual)}%`}
              />
            ) : null;
          })}
        </div>
        <div className={styles.raridades}>
          {raridades.map((raridade) => {
            const total =
              dadosRaridade.find((item) => item.raridade === raridade)?.total ??
              0;
            const percentual = totalRaridades
              ? (total / totalRaridades) * 100
              : 0;
            return (
              <div key={raridade}>
                <span data-raridade={raridade}>{raridade}</span>
                <div>
                  <strong>{total}</strong>
                  <small>{Math.round(percentual)}% do catálogo</small>
                </div>
              </div>
            );
          })}
        </div>
      </article>
      <article className={`${baseStyles.panelCard} ${styles.card}`}>
        <header>
          <div>
            <small>Auditoria</small>
            <h2>Atividade recente</h2>
          </div>
          <Activity />
        </header>
        <div className={styles.atividade}>
          {(resumo?.atividadeRecente ?? []).map((item) => (
            <p key={`${item.texto}-${item.data}`}>
              <i />
              <span>
                <strong>{item.texto}</strong>
                <small>{item.detalhe}</small>
              </span>
              <time>{formatarData(item.data)}</time>
            </p>
          ))}
          {!carregando && !resumo?.atividadeRecente.length ? (
            <p className={styles.estadoVazio}>Nenhuma atividade recente</p>
          ) : null}
        </div>
      </article>
      <article className={`${baseStyles.panelCard} ${styles.card}`}>
        <header>
          <div>
            <small>Coleções</small>
            <h2>Cartas mais encontradas</h2>
          </div>
          <Link href="/admin/cartas">
            Ver cartas <ArrowUpRight />
          </Link>
        </header>
        <div className={styles.ranking}>
          {(resumo?.topCartas ?? []).map((item, index) => (
            <p key={`${item.id}-${index}`}>
              <b>{String(index + 1).padStart(2, "0")}</b>
              <span>
                <strong>{item.nome}</strong>
                <small>{item.raridade}</small>
              </span>
              <em>{formatarNmr(item.quantidade)} cópias</em>
            </p>
          ))}
          {!carregando && !resumo?.topCartas.length ? (
            <p className={styles.estadoVazio}>Nenhum inventário registrado</p>
          ) : null}
        </div>
      </article>
      <nav className={styles.atalhos} aria-label="Acessos rápidos">
        <span>
          <Layers3 /> Configuração do jogo
        </span>
        <Link href="/admin/habilidades">
          Habilidades <ArrowUpRight />
        </Link>
        <Link href="/admin/decks-npc">
          Decks NPC <ArrowUpRight />
        </Link>
        <Link href="/admin/banners">
          Banners <ArrowUpRight />
        </Link>
        <Link href="/admin/campanha">
          Campanha <ArrowUpRight />
        </Link>
      </nav>
    </section>
  );
}
