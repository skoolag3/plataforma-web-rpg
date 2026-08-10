import {
  BookOpen,
  Boxes,
  Gem,
  Gift,
  Home,
  Layers,
  LogOut,
  Shirt,
  Sparkles,
  Trophy,
  User,
} from "lucide-react";
import Link from "next/link";

import { styles } from "../styles";

const navItems = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/cartas", label: "Coleção", icon: Layers, ativo: true },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "#", label: "Loja", icon: Shirt },
  { href: "/gacha", label: "Gacha", icon: Sparkles },
  { href: "#", label: "Histórico", icon: BookOpen },
  { href: "#", label: "Ranking", icon: Trophy },
  { href: "/perfil", label: "Perfil", icon: User },
  { href: "#", label: "Sair", icon: LogOut },
];

type SidebarColecaoProps = {
  recompensaResgatada: boolean;
  aoResgatarRecompensa: () => void;
};

export function SidebarColecao({
  recompensaResgatada,
  aoResgatarRecompensa,
}: SidebarColecaoProps) {
  return (
    <aside className={styles.sidebar} aria-label="Menu do inventário">
      <div className={styles.marca}>
        <span className={styles.marcaIcone}>
          <Gem aria-hidden="true" />
        </span>
        <span className={styles.marcaTexto}>
          <strong>Anime Cards</strong>
          <span>RPG Online</span>
        </span>
      </div>

      <nav className={styles.nav}>
        {navItems.map((item) => {
          const Icone = item.icon;
          const classe = item.ativo ? styles.navLinkAtivo : styles.navLink;

          return (
            <Link key={item.label} href={item.href} className={classe}>
              <Icone aria-hidden="true" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <section className={styles.presente} aria-label="Giro diário">
        <span className={styles.presenteIcone}>
          <Gift aria-hidden="true" />
        </span>
        <strong>
          {recompensaResgatada
            ? "Giro diário resgatado"
            : "Giro diário disponível!"}
        </strong>
        <p>
          {recompensaResgatada
            ? "Volte amanhã para novas recompensas."
            : "Resgate agora suas recompensas gratuitas."}
        </p>
        <button
          type="button"
          onClick={aoResgatarRecompensa}
          disabled={recompensaResgatada}
        >
          {recompensaResgatada ? "Resgatado" : "Resgatar"}
        </button>
      </section>
    </aside>
  );
}
