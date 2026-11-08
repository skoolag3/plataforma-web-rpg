"use client";

import { Cartas, NovaCarta } from "../cartas/adminCartas";
import { AdminHistoricoCartas } from "../cartas/adminHistoricoCartas";
import { AdminDashboard } from "../dashboard/adminDashboard";
import { AdminBanners } from "../banners/adminBanners";
import { AdminCampanha } from "../campanha/adminCampanha";
import { AdminExpedicoes } from "../expedicoes/adminExpedicoes";
import { Habilidades } from "../habilidades/adminHabilidades";
import { Usuarios } from "../usuarios/adminUsuarios";

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
