"use client";

import { useCallback, useEffect, useState } from "react";
import {
  obterAdminDashboard,
  type AdminDashboardResumo,
  type PeriodoDashboardAdmin,
} from "../../lib/admin";
import styles from "../../styles/admin/adminShared.module.css";
import { AdminLayout } from "./adminShared";
import { DashboardPainel } from "./adminDashboardPainel";
import { DashboardResumo } from "./adminDashboardResumo";

export function AdminDashboard() {
  const [resumo, setResumo] = useState<AdminDashboardResumo | null>(null);
  const [periodo, setPeriodo] = useState<PeriodoDashboardAdmin>("7d");
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  const carregarDashboard = useCallback(
    async (periodoSelecionado: PeriodoDashboardAdmin = periodo) => {
      setCarregando(true);
      setErro(null);
      try {
        setResumo(await obterAdminDashboard(periodoSelecionado));
      } catch (error) {
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar o painel.",
        );
      } finally {
        setCarregando(false);
      }
    },
    [periodo],
  );

  useEffect(() => {
    void carregarDashboard(periodo);
  }, [carregarDashboard, periodo]);

  return (
    <AdminLayout
      title="Visão geral"
      subtitle="Diagnóstico operacional de retenção, combate, economia, gacha e saúde do catálogo."
    >
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      <DashboardResumo
        resumo={resumo}
        periodo={periodo}
        onChangePeriodo={setPeriodo}
        carregando={carregando}
        onAtualizar={() => carregarDashboard(periodo)}
      />
      <DashboardPainel
        resumo={resumo}
        periodo={periodo}
        carregando={carregando}
      />
    </AdminLayout>
  );
}
