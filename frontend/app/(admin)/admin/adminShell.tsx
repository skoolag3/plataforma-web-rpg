"use client";

import { Cartas, NovaCarta } from "./adminCartas";
import { AdminDashboard } from "./adminDashboard";
import { AdminBanners } from "./adminBanners";
import { DecksNpc } from "./adminDecksNpc";
import { Habilidades } from "./adminHabilidades";
import { Usuarios } from "./adminUsuarios";

type AdminView =
  | "dashboard"
  | "cartas"
  | "nova-carta"
  | "habilidades"
  | "decks"
  | "usuarios"
  | "banners";

export function AdminScreen({ view }: { view: AdminView }) {
  if (view === "cartas") return <Cartas />;
  if (view === "nova-carta") return <NovaCarta />;
  if (view === "habilidades") return <Habilidades />;
  if (view === "decks") return <DecksNpc />;
  if (view === "usuarios") return <Usuarios />;
  if (view === "banners") return <AdminBanners />;
  return <AdminDashboard />;
}
