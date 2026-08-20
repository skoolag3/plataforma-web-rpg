"use client";

import { Activity, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { obterAdminDashboard, type AdminDashboardResumo } from "../../lib/admin";
import styles from "../../styles/admin/admin.module.css";
import { Cartas, NovaCarta } from "./adminCartas";
import { DecksNpc } from "./adminDecksNpc";
import { Habilidades } from "./adminHabilidades";
import { AdminLayout, DataTable } from "./adminShared";
import { Usuarios } from "./adminUsuarios";

type AdminView =
  | "dashboard"
  | "cartas"
  | "nova-carta"
  | "habilidades"
  | "decks"
  | "usuarios"
  | "banners";

const banners = [
  ["Eclipse Roxo", "Limitado", "27/06/2026", "10/07/2026", "Ativo"],
  ["Convocacao da Luz", "Limitado", "20/06/2026", "03/07/2026", "Ativo"],
  ["Herois do Reino", "Padrao", "01/06/2026", "-", "Ativo"],
  ["Convocacao de Iniciantes", "Iniciante", "-", "-", "Ativo"],
];

const raridades = ["UR", "SSR", "SR", "R", "N"] as const;

function classeRaridade(raridade: string) {
  const classes: Record<string, string> = {
    UR: styles.raridadeUR,
    SSR: styles.raridadeSSR,
    SR: styles.raridadeSR,
    R: styles.raridadeR,
    N: styles.raridadeN,
  };
  return classes[raridade] ?? "";
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit" }).format(new Date(value));
}

function Dashboard() {
  const [resumo, setResumo] = useState<AdminDashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(null);

    try {
      setResumo(await obterAdminDashboard());
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível carregar o painel.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDashboard();
  }, []);

  const metricas = resumo?.metricas;
  const raridadesResumo = resumo?.raridades ?? [];
  const totalRaridades = raridadesResumo.reduce((total, item) => total + item.total, 0);

  return (
    <AdminLayout title="Dashboard" subtitle="Visão geral da plataforma">
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {carregando ? <p className={styles.feedbackInfo}>Carregando dashboard...</p> : null}
      <section className={styles.metrics}>
        {[
          ["Usuários", formatNumber(metricas?.usuarios ?? 0), `${formatNumber(metricas?.usuariosAtivos ?? 0)} ativos`],
          ["Cartas", formatNumber(metricas?.cartas ?? 0), `${formatNumber(metricas?.cartasAtivas ?? 0)} ativas`],
          ["Partidas Jogadas", formatNumber(metricas?.partidas ?? 0), "total registrado"],
          ["Rubys em circulação", formatNumber(metricas?.rubysEmCirculacao ?? 0), "saldo em usuários"],
        ].map(([label, value, detail]) => (
          <article className={styles.metricCard} key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small>{detail}</small>
          </article>
        ))}
      </section>

      <section className={styles.dashboardGrid}>
        <article className={styles.chartCard}>
          <h2>Distribuicao de Raridades</h2>
          <div className={styles.lineChart}>
            {raridades.map((raridade) => {
              const total = raridadesResumo.find((item) => item.raridade === raridade)?.total ?? 0;
              const height = totalRaridades ? Math.max(10, (total / totalRaridades) * 100) : 10;
              return (
                <span className={classeRaridade(raridade)} key={raridade} title={`${raridade}: ${total}`} style={{ height: `${height}%` }}>
                  {raridade}
                </span>
              );
            })}
          </div>
        </article>
        <article className={styles.chartCard}>
          <h2>Total de Cartas</h2>
          <div className={styles.donut}>
            <span>Total<br />{formatNumber(metricas?.cartas ?? 0)}</span>
          </div>
        </article>
        <article className={styles.panelCard}>
          <h2>Atividade Recente</h2>
          {(resumo?.atividadeRecente.length ? resumo.atividadeRecente : []).map((item) => (
            <p key={`${item.texto}-${item.data}`}>
              <Activity aria-hidden="true" />
              {item.texto}
              <span>{formatDate(item.data)}</span>
            </p>
          ))}
          {!resumo?.atividadeRecente.length ? <p>Nenhuma atividade recente</p> : null}
        </article>
        <article className={styles.panelCard}>
          <h2>Top Cartas no Inventario</h2>
          {(resumo?.topCartas.length ? resumo.topCartas : []).map((item, index) => (
            <p key={`${item.id}-${index}`}>
              <strong>{index + 1}</strong>
              {item.nome}
              <span>{formatNumber(item.quantidade)}</span>
            </p>
          ))}
          {!resumo?.topCartas.length ? <p>Nenhum inventario registrado</p> : null}
        </article>
      </section>
    </AdminLayout>
  );
}

function Banners() {
  return (
    <AdminLayout title="Banners / Gacha" subtitle="Gerencie os banners disponiveis.">
      <div className={styles.toolbar}><span /><button className={styles.primaryBtn}><Plus aria-hidden="true" /> Novo Banner</button></div>
      <DataTable headers={["Banner", "Tipo", "Inicio", "Fim", "Status"]} rows={banners} />
    </AdminLayout>
  );
}

export function AdminScreen({ view }: { view: AdminView }) {
  if (view === "cartas") return <Cartas />;
  if (view === "nova-carta") return <NovaCarta />;
  if (view === "habilidades") return <Habilidades />;
  if (view === "decks") return <DecksNpc />;
  if (view === "usuarios") return <Usuarios />;
  if (view === "banners") return <Banners />;
  return <Dashboard />;
}
