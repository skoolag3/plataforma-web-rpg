"use client";

import { Plus } from "lucide-react";
import styles from "../../styles/admin/adminShared.module.css";
import { AdminLayout, DataTable } from "./adminShared";

const banners = [
  ["Eclipse Roxo", "Limitado", "27/06/2026", "10/07/2026", "Ativo"],
  ["Convocacao da Luz", "Limitado", "20/06/2026", "03/07/2026", "Ativo"],
  ["Herois do Reino", "Padrao", "01/06/2026", "-", "Ativo"],
  ["Convocacao de Iniciantes", "Iniciante", "-", "-", "Ativo"],
];

export function AdminBanners() {
  return (
    <AdminLayout
      title="Banners / Gacha"
      subtitle="Gerencie os banners disponíveis."
    >
      <div className={styles.toolbar}>
        <span />
        <button className={styles.primaryBtn}>
          <Plus aria-hidden="true" /> Novo banner
        </button>
      </div>
      <DataTable
        headers={["Banner", "Tipo", "Início", "Fim", "Status"]}
        rows={banners}
      />
    </AdminLayout>
  );
}
