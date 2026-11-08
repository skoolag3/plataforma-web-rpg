"use client";

import { LogOut, Menu, ShieldCheck, X } from "lucide-react";
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
  IconeColecao,
  IconeDecks,
  IconeExpedicao,
  IconeGacha,
  IconeInicio,
  IconeLoja,
  IconeRanking,
} from "./iconesNavbar";
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
  { href: "/home", label: "Início", icon: IconeInicio },
  { href: "/cartas", label: "Coleção", icon: IconeColecao },
  { href: "/decks", label: "Decks", icon: IconeDecks },
  { href: "/banners", label: "Banners", icon: IconeGacha },
  { href: "/loja", label: "Loja", icon: IconeLoja },
  { href: "/expedicao", label: "Expedição", icon: IconeExpedicao },
  { href: "/ranking", label: "Ranking", icon: IconeRanking },
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
    window.addEventListener("focus", carregarResumoPerfil);
    return () => {
      window.removeEventListener("perfil-atualizado", carregarResumoPerfil);
      window.removeEventListener("focus", carregarResumoPerfil);
    };
  }, [usuario?.id, pathname]);

  const [rotaExpedicaoSessao, setRotaExpedicaoSessao] = useState("/expedicao");

  useEffect(() => {
    const chave = "animecards_rota_expedicao_sessao";
    let ativo = true;
    if (pathname === "/partida" || pathname === "/expedicao") {
      const rota = `${pathname}${window.location.search}`;
      window.sessionStorage.setItem(chave, rota);
      queueMicrotask(() => { if (ativo) setRotaExpedicaoSessao(rota); });
    } else {
      const salva = window.sessionStorage.getItem(chave);
      if (salva) queueMicrotask(() => { if (ativo) setRotaExpedicaoSessao(salva); });
    }
    return () => { ativo = false; };
  }, [pathname]);

  function sair() {
    window.sessionStorage.removeItem("animecards_rota_expedicao_sessao");
    clearSession();
    router.replace("/");
  }

  const itensNavegacao: Array<AbaExpansivel | SeparadorAbas> = links.map(
    (item) => ({
      titulo: item.label,
      icone: item.icon,
      href:
        item.href === "/expedicao" &&
        pathname !== "/expedicao" &&
        pathname !== "/partida"
          ? rotaExpedicaoSessao
          : item.href,
      ativa:
        pathname === item.href ||
        (item.href === "/expedicao" && pathname === "/partida"),
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
          <strong>
            Anime<em>Cards</em>
          </strong>
        </Link>
        <button
          className={styles.menu}
          type="button"
          onClick={() => setAberto((valor) => !valor)}
          aria-label={aberto ? "Fechar menu" : "Abrir menu"}
          aria-expanded={aberto}
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
            <Link href="/loja" title="Ir à loja de Rubys" aria-label={`Ir à loja de Rubys, saldo ${resumoPerfil.rubys.toLocaleString("pt-BR")}`}>
              <IconeRuby />
              {resumoPerfil.rubys.toLocaleString("pt-BR")}
            </Link>
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
                style={{ backgroundImage: `url("${resumoPerfil.avatarUrl ?? "/avatar-padrao.svg"}")` }}
              />
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
