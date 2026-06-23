"use client";

import {
  Clock3,
  Gem,
  House,
  Layers3,
  LogOut,
  ShoppingCart,
  Sparkles,
  Trophy,
  UserRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { clearSession } from "../../../lib/auth";
import styles from "../../../styles/perfil/perfilLayout.module.css";

const linksMenu = [
  { href: "/dashboard", rotulo: "Início", icone: House },
  { href: "/cartas", rotulo: "Coleção", icone: Layers3 },
  { href: "/decks", rotulo: "Decks", icone: Layers3 },
  { href: "#loja", rotulo: "Loja", icone: ShoppingCart },
  { href: "#gacha", rotulo: "Gacha", icone: Sparkles },
  { href: "#historico", rotulo: "Histórico", icone: Clock3 },
  { href: "#ranking", rotulo: "Ranking", icone: Trophy },
  { href: "/perfil", rotulo: "Perfil", icone: UserRound },
];

export function SidebarPerfil() {
  const caminho = usePathname();
  const router = useRouter();

  function sair() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  return (
    <aside className={styles.sidebarPerfil}>
      <Link href="/dashboard" className={styles.marcaPerfil}>
        <span className={styles.simboloMarca}>
          <Gem aria-hidden="true" />
        </span>
        <span>
          <strong>Anime Cards</strong>
          <small>RPG Online</small>
        </span>
      </Link>

      <nav className={styles.menuPerfil} aria-label="Navegação do jogador">
        {linksMenu.map(({ href, rotulo, icone: Icone }) => {
          const ativo = href === "/perfil" && caminho === href;

          return (
            <Link
              href={href}
              key={rotulo}
              className={[styles.linkMenu, ativo ? styles.linkMenuAtivo : ""].join(
                " ",
              )}
              aria-current={ativo ? "page" : undefined}
            >
              <Icone aria-hidden="true" />
              <span>{rotulo}</span>
            </Link>
          );
        })}

        <button type="button" className={styles.linkMenu} onClick={sair}>
          <LogOut aria-hidden="true" />
          <span>Sair</span>
        </button>
      </nav>

      <div className={styles.arteSidebar} aria-hidden="true">
        <Sparkles />
        <span>Monte seu legado</span>
      </div>
    </aside>
  );
}
