"use client";

import { useEffect, useState } from "react";
import {
  obterAdminDashboard,
  type AdminDashboardResumo,
} from "../../lib/admin";
import styles from "../../styles/admin/admin.module.css";
import { AdminLayout } from "./adminShared";
import { DashboardPainel } from "./adminDashboardPainel";
import { DashboardResumo } from "./adminDashboardResumo";

export function AdminDashboard() {
  const [resumo, setResumo] = useState<AdminDashboardResumo | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);

  async function carregarDashboard() {
    setCarregando(true);
    setErro(null);
    try {
      setResumo(await obterAdminDashboard());
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível carregar o painel.",
      );
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDashboard();
  }, []);

  return (
    <AdminLayout
      title="Central de controle"
      subtitle="Acompanhe o jogo e acesse o que precisa sem perder tempo."
    >
      {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
      {carregando ? (
        <p className={styles.feedbackInfo}>Carregando dashboard...</p>
      ) : null}
      <DashboardResumo
        resumo={resumo}
        carregando={carregando}
        onAtualizar={carregarDashboard}
      />
      <DashboardPainel resumo={resumo} />
    </AdminLayout>
  );
}
