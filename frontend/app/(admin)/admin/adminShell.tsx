"use client";

import { Cartas, NovaCarta } from "./adminCartas";
import { AdminHistoricoCartas } from "./adminHistoricoCartas";
import { AdminDashboard } from "./adminDashboard";
import { AdminBanners } from "./adminBanners";
import { AdminCampanha } from "./adminCampanha";
import { AdminExpedicoes } from "./adminExpedicoes";
import { Habilidades } from "./adminHabilidades";
import { Usuarios } from "./adminUsuarios";

type AdminView =
  | "dashboard"
  | "cartas"
  | "historico-cartas"
  | "nova-carta"
  | "habilidades"
  | "usuarios"
  | "banners"
  | "campanha"
  | "expedicoes";

export function AdminScreen({ view }: { view: AdminView }) {
  if (view === "cartas") return <Cartas />;
  if (view === "historico-cartas") return <AdminHistoricoCartas />;
  if (view === "nova-carta") return <NovaCarta />;
  if (view === "habilidades") return <Habilidades />;
  if (view === "usuarios") return <Usuarios />;
  if (view === "banners") return <AdminBanners />;
  if (view === "campanha") return <AdminCampanha />;
  if (view === "expedicoes") return <AdminExpedicoes />;
  return <AdminDashboard />;
}
