"use client";

import { faGaugeHigh, faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Home, Newspaper } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuthChange } from "../lib/auth";
import styles from "../styles/navbar.module.css";
import { ExpandableTabs } from "./ui/expandableTabs";

const linksNav = [
  { href: "/#home", label: "Home", secao: "home", icon: Home },
  {
    href: "/#noticias",
    label: "Notícias",
    secao: "noticias",
    icon: Newspaper,
  },
];

export function Navbar() {
  const caminho = usePathname();
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

  function navegarParaSecao(evento: MouseEvent<HTMLAnchorElement>, secao: string) {
    if (caminho !== "/") return;

    const destino = document.getElementById(secao);
    if (!destino) return;

    evento.preventDefault();
    const reduzirMovimento = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    destino.scrollIntoView({ behavior: reduzirMovimento ? "auto" : "smooth", block: "start" });
    window.history.replaceState(null, "", "/");
    setSecaoAtiva(secao);
  }

  if (
    ["/home", "/perfil", "/cartas", "/decks", "/gacha", "/partida"].some(
      (rota) => caminho === rota || caminho.startsWith(`${rota}/`),
    ) ||
    caminho.startsWith("/admin")
  ) {
    return null;
  }

  return (
    <header className={styles.cabecalho}>
      <nav className={styles.nav}>
        <Link href="/" className={styles.marca}>
          <span className={styles.seloMarca}>
            RPG
          </span>
          <span className={styles.nomeMarca}>
            Anime<span className={styles.destaqueMarca}>Cards</span>
          </span>
        </Link>

        <ExpandableTabs
          className={styles.linksNav}
          ariaLabel="Navegação principal"
          itens={linksNav.map((link) => ({
            titulo: link.label,
            icone: link.icon,
            href: link.href,
            ativa: caminho === "/" && secaoAtiva === link.secao,
            aoClicar: (evento) => navegarParaSecao(evento, link.secao),
          }))}
        />

        <div className={styles.acoes}>
          {estaAutenticado ? (
            <Link
              href="/home"
              className={styles.btn}
            >
              <FontAwesomeIcon icon={faGaugeHigh} aria-hidden="true" />
              <span className={styles.textoAcao}>Meu painel</span>
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className={styles.btn}
              >
                <FontAwesomeIcon icon={faRightToBracket} aria-hidden="true" />
                <span className={styles.textoAcao}>Entrar</span>
              </Link>
              <Link
                href="/cadastro"
                className={styles.btnPrimario}
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
