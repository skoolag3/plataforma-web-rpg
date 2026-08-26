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
  User,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState, useSyncExternalStore } from "react";
import { clearSession, getStoredUser, getToken, subscribeAuthChange } from "../lib/auth";
import { buscarPerfilApi } from "../lib/perfil";
import styles from "../styles/privateNavbar.module.css";
import { IconeRuby } from "./iconeRuby";
import {
  criarEstiloMolduraPerfil,
  type ConfigVisualCarta,
} from "./cartaMontada";

const links = [
  { href: "/dashboard", label: "Início", icon: Home },
  { href: "/cartas", label: "Coleção", icon: Layers },
  { href: "/decks", label: "Decks", icon: Boxes },
  { href: "/gacha", label: "Gacha", icon: Sparkles },
  { href: "/partida", label: "Arena", icon: Swords },
  { href: "/perfil", label: "Perfil", icon: User },
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
        .then((perfil) => setResumoPerfil({
          rubys: perfil.rubys,
          avatarUrl: perfil.avatarUrl ?? null,
          molduraUrl: perfil.molduraUrl ?? null,
          molduraConfig: perfil.molduraConfig ?? null,
          molduraClasse: perfil.molduraClasse,
        }))
        .catch(() => undefined);
    }

    carregarResumoPerfil();
    window.addEventListener("perfil-atualizado", carregarResumoPerfil);
    return () => window.removeEventListener("perfil-atualizado", carregarResumoPerfil);
  }, [usuario?.id]);

  function sair() {
    clearSession();
    router.replace("/");
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.brand} onClick={() => setAberto(false)}>
          <span><Gem aria-hidden="true" /></span>
          <strong>Anime<em>Cards</em></strong>
        </Link>
        <button className={styles.menu} type="button" onClick={() => setAberto((valor) => !valor)} aria-label="Abrir menu">
          {aberto ? <X /> : <Menu />}
        </button>
        <div className={`${styles.links} ${aberto ? styles.linksAbertos : ""}`}>
          {links.map((item) => {
            const Icon = item.icon;
            const ativo = pathname === item.href;
            return <Link key={item.href} href={item.href} className={ativo ? styles.ativo : ""} onClick={() => setAberto(false)}><Icon /><span>{item.label}</span></Link>;
          })}
          {usuario?.is_admin ? <Link href="/admin" onClick={() => setAberto(false)}><ShieldCheck /><span>Admin</span></Link> : null}
        </div>
        <div className={styles.usuario}>
          <div className={styles.saldos} aria-label="Saldos do jogador">
            <span title="Rubys"><IconeRuby />{resumoPerfil.rubys.toLocaleString("pt-BR")}</span>
          </div>
          <Link href="/perfil">
            <span className={`${styles.avatarVisual} ${styles[resumoPerfil.molduraClasse] ?? ""}`}>
              <span
                className={styles.fotoAvatar}
                style={resumoPerfil.avatarUrl ? { backgroundImage: `url("${resumoPerfil.avatarUrl}")` } : undefined}
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
            <div><strong>{usuario?.nome ?? "Jogador"}</strong><small>Nível {usuario?.nivel ?? 1}</small></div>
          </Link>
          <button type="button" onClick={sair} title="Sair"><LogOut /></button>
        </div>
      </nav>
    </header>
  );
}
