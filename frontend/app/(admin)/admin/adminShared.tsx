"use client";

import { Bot, ChevronDown, Edit3, Eye, Gem, Home, ImagePlus, Layers, LogOut, MoreHorizontal, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import styles from "../../styles/admin/admin.module.css";

const nav = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/cartas", label: "Cartas", icon: Layers },
  { href: "/admin/habilidades", label: "Habilidades", icon: Sparkles },
  { href: "/admin/decks-npc", label: "Decks NPC", icon: Bot },
  { href: "/admin/usuarios", label: "Usuários", icon: Users },
  { href: "/admin/banners", label: "Gacha (Banners)", icon: ImagePlus },
];


function Status({ value }: { value: string }) {
  const ativo = value === "Ativo" || value === "Ativa";
  return <span className={ativo ? styles.statusAtivo : styles.statusInativo}>{value}</span>;
}

export function AdminLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  const pathname = usePathname();

  return (
    <main className={styles.adminPage}>
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span>
            <Gem aria-hidden="true" />
          </span>
          <div>
            <strong>Anime Cards</strong>
            <small>Admin</small>
          </div>
        </div>

        <nav className={styles.nav}>
          {nav.map((item) => {
            const Icon = item.icon;
            const active =
              item.href === "/admin" ? pathname === item.href : pathname.startsWith(item.href);
            return (
              <Link key={item.label} href={item.href} className={active ? styles.navActive : styles.navItem}>
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <Link href="/dashboard" className={styles.logout}>
          <LogOut aria-hidden="true" />
          Voltar ao jogo
        </Link>
      </aside>

      <section className={styles.content}>
        <header className={styles.topbar}>
          <div>
            <h1>{title}</h1>
            <p>{subtitle}</p>
          </div>
          <div className={styles.adminActions}>
            <Link href="/perfil" className={styles.adminUser}>
              <span>
                <Users aria-hidden="true" />
              </span>
              <div>
                <strong>Admin</strong>
                <small>Administrador</small>
              </div>
              <ChevronDown aria-hidden="true" />
            </Link>
          </div>
        </header>
        {children}
      </section>
    </main>
  );
}

export function DataTable({ headers, rows }: { headers: string[]; rows: string[][] }) {
  return (
    <div className={styles.tableWrap}>
      <table>
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header}>{header}</th>
            ))}
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.join("-")}>
              {row.map((cell, index) => (
                <td key={`${cell}-${index}`}>
                  {index === row.length - 1 ? <Status value={cell} /> : cell}
                </td>
              ))}
              <td>
                <span className={styles.rowActions}>
                  <Eye aria-hidden="true" />
                  <Edit3 aria-hidden="true" />
                  <MoreHorizontal aria-hidden="true" />
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
