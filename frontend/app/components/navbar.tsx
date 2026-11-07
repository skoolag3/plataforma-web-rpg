"use client";

import {
  faGamepad,
  faRightToBracket,
  faUserPlus,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuthChange } from "../lib/auth";
import { alterarModalAuth } from "../(public)/authNavegacao";
import styles from "../styles/navbar.module.css";
import { IconeInicio } from "./iconesNavbar";
import { ExpandableTabs } from "./ui/expandableTabs";
import { PrivateNavbar } from "./privateNavbar";

const linksNav = [
  { href: "/#home", label: "Home", secao: "home", icon: IconeInicio },
  {
    href: "/#noticias",
    label: "Notícias",
    secao: "noticias",
    icon: Newspaper,
  },
];

export function Navbar() {
  const caminho = usePathname();
  const emNoticia = caminho.startsWith("/noticias/");
  const [secaoAtiva, setSecaoAtiva] = useState("home");
  const estaAutenticado = useSyncExternalStore(
    subscribeAuthChange,
    isAuthenticated,
    () => false,
  );

  useEffect(() => {
    if (caminho !== "/") return;

    const secoes = linksNav
      .map((link) => document.getElementById(link.secao))
      .filter((secao): secao is HTMLElement => Boolean(secao));
    const observador = new IntersectionObserver(
      (entradas) => {
        const secaoVisivel = entradas
          .filter((entrada) => entrada.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (secaoVisivel) setSecaoAtiva(secaoVisivel.target.id);
      },
      { rootMargin: "-28% 0px -56%", threshold: [0.08, 0.25, 0.5] },
    );

    secoes.forEach((secao) => observador.observe(secao));
    return () => observador.disconnect();
  }, [caminho]);

  function navegarParaSecao(
    evento: MouseEvent<HTMLAnchorElement>,
    secao: string,
  ) {
    if (caminho !== "/") return;

    const destino = document.getElementById(secao);
    if (!destino) return;

    evento.preventDefault();
    const reduzirMovimento = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    destino.scrollIntoView({
      behavior: reduzirMovimento ? "auto" : "smooth",
      block: "start",
    });
    window.history.replaceState(null, "", "/");
    setSecaoAtiva(secao);
  }

  function abrirAcesso(
    evento: MouseEvent<HTMLAnchorElement>,
    modal: "login" | "cadastro",
  ) {
    if (
      caminho !== "/" ||
      evento.button !== 0 ||
      evento.ctrlKey ||
      evento.metaKey ||
      evento.shiftKey ||
      evento.altKey
    ) return;
    evento.preventDefault();
    alterarModalAuth(modal);
  }

  if (
    [
      "/home",
      "/perfil",
      "/cartas",
      "/decks",
      "/gacha",
      "/banners",
      "/loja",
      "/expedicao",
      "/partida",
      "/ranking",
    ].some((rota) => caminho === rota || caminho.startsWith(`${rota}/`)) ||
    caminho.startsWith("/admin")
  ) {
    return null;
  }

  if (emNoticia && estaAutenticado) {
    return (
      <div className={styles.cabecalhoJogador}>
        <PrivateNavbar />
      </div>
    );
  }

  return (
    <header className={styles.cabecalho}>
      <nav className={`${styles.nav} ${emNoticia ? styles.navNoticia : ""}`}>
        <Link href="/" className={styles.marca}>
          <span className={styles.nomeMarca}>
            Anime<span className={styles.destaqueMarca}>Cards</span>
          </span>
        </Link>

        {!emNoticia ? <ExpandableTabs
          className={styles.linksNav}
          ariaLabel="Navegação principal"
          itens={linksNav.map((link) => ({
            titulo: link.label,
            icone: link.icon,
            href: link.href,
            ativa: caminho === "/" && secaoAtiva === link.secao,
            aoClicar: (evento) => navegarParaSecao(evento, link.secao),
          }))}
        /> : null}

        <div className={styles.acoes}>
          {estaAutenticado ? (
            <Link href="/home" className={styles.btnPrimario}>
              <FontAwesomeIcon icon={faGamepad} aria-hidden="true" />
              <span className={styles.textoAcao}>Entrar no jogo</span>
            </Link>
          ) : (
            <>
              <Link
                href="/?auth=login"
                className={styles.btn}
                onClick={(evento) => abrirAcesso(evento, "login")}
              >
                <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
                <span className={styles.textoAcao}>Entrar</span>
              </Link>
              <Link
                href="/?auth=cadastro"
                className={styles.btnPrimario}
                onClick={(evento) => abrirAcesso(evento, "cadastro")}
              >
                <FontAwesomeIcon icon={faUserPlus} aria-hidden="true" />
                <span className={styles.textoAcao}>Registrar</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
