"use client";

import {
  Boxes,
  Gem,
  Home,
  Layers,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  Swords,
  ShoppingBag,
  Trophy,
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import {
  clearSession,
  getStoredUser,
  getToken,
  subscribeAuthChange,
} from "../lib/auth";
import { buscarPerfilApi } from "../lib/perfil";
import styles from "../styles/privateNavbar.module.css";
import { IconeRuby } from "./iconeRuby";
import { Correio } from "./correio";
import {
  criarEstiloMolduraPerfil,
  type ConfigVisualCarta,
} from "./cartaMontada";
import {
  ExpandableTabs,
  type AbaExpansivel,
  type SeparadorAbas,
} from "./ui/expandableTabs";

const links = [
  { href: "/home", label: "Início", icon: Home },
  { href: "/cartas", label: "Coleção", icon: Layers },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "/gacha", label: "Gacha", icon: Sparkles },
  { href: "/loja", label: "Loja", icon: ShoppingBag },
  { href: "/partida", label: "Arena", icon: Swords },
  { href: "/ranking", label: "Ranking", icon: Trophy },
];

export function PrivateNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [aberto, setAberto] = useState(false);
  const [resumoPerfil, setResumoPerfil] = useState({
    rubys: 0,
    avatarUrl: null as string | null,
    molduraUrl: null as string | null,
    molduraConfig: null as ConfigVisualCarta | null,
    molduraClasse: "molduraPadrao",
  });
  const usuario = useSyncExternalStore(
    subscribeAuthChange,
    getStoredUser,
    () => null,
  );

  useEffect(() => {
    function carregarResumoPerfil() {
      const token = getToken();
      if (!token) return;

      void buscarPerfilApi(token)
        .then((perfil) =>
          setResumoPerfil({
            rubys: perfil.rubys,
            avatarUrl: perfil.avatarUrl ?? null,
            molduraUrl: perfil.molduraUrl ?? null,
            molduraConfig: perfil.molduraConfig ?? null,
            molduraClasse: perfil.molduraClasse,
          }),
        )
        .catch(() => undefined);
    }

    carregarResumoPerfil();
    window.addEventListener("perfil-atualizado", carregarResumoPerfil);
    return () =>
      window.removeEventListener("perfil-atualizado", carregarResumoPerfil);
  }, [usuario?.id]);

  function sair() {
    clearSession();
    router.replace("/");
  }

  const itensNavegacao: Array<AbaExpansivel | SeparadorAbas> = links.map(
    (item) => ({
      titulo: item.label,
      icone: item.icon,
      href: item.href,
      ativa: pathname === item.href,
      aoClicar: () => setAberto(false),
    }),
  );

  if (usuario?.is_admin) {
    itensNavegacao.push(
      { tipo: "separador" },
      {
        titulo: "Admin",
        icone: ShieldCheck,
        href: "/admin",
        aoClicar: () => setAberto(false),
      },
    );
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link
          href="/home"
          className={styles.brand}
          onClick={() => setAberto(false)}
        >
          <span>
            <Gem aria-hidden="true" />
          </span>
          <strong>
            Anime<em>Cards</em>
          </strong>
        </Link>
        <button
          className={styles.menu}
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          aria-label="Abrir menu"
        >
          {aberto ? <X /> : <Menu />}
        </button>
        <ExpandableTabs
          className={`${styles.links} ${aberto ? styles.linksAbertos : ""}`}
          ariaLabel="Navegação do jogador"
          itens={itensNavegacao}
        />
        <div className={styles.usuario}>
          <div className={styles.saldos} aria-label="Saldos do jogador">
            <span title="Rubys">
              <IconeRuby />
              {resumoPerfil.rubys.toLocaleString("pt-BR")}
            </span>
          </div>
          <div className={styles.correioArea}>
            <Correio />
          </div>
          <Link
            href="/perfil"
            className={
              pathname === "/perfil" ? styles.perfilUsuarioAtivo : undefined
            }
            aria-label="Abrir perfil"
            title="Abrir perfil"
            aria-current={pathname === "/perfil" ? "page" : undefined}
          >
            <span
              className={`${styles.avatarVisual} ${styles[resumoPerfil.molduraClasse] ?? ""}`}
            >
              <span
                className={styles.fotoAvatar}
                style={
                  resumoPerfil.avatarUrl
                    ? { backgroundImage: `url("${resumoPerfil.avatarUrl}")` }
                    : undefined
                }
              >
                {!resumoPerfil.avatarUrl ? <User aria-hidden="true" /> : null}
              </span>
              {resumoPerfil.molduraUrl ? (
                <i
                  className={styles.molduraImagem}
                  style={{
                    ...criarEstiloMolduraPerfil(resumoPerfil.molduraConfig),
                    backgroundImage: `url("${resumoPerfil.molduraUrl}")`,
                  }}
                  aria-hidden="true"
                />
              ) : null}
            </span>
            <div>
              <strong>{usuario?.nome ?? "Jogador"}</strong>
              <small>Nível {usuario?.nivel ?? 1}</small>
            </div>
          </Link>
          <button type="button" onClick={sair} title="Sair">
            <LogOut />
          </button>
        </div>
      </nav>
    </header>
  );
}
