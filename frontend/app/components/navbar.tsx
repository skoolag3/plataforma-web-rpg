"use client";

import { faGaugeHigh, faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";
import { useEffect, useState, useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuthChange } from "../lib/auth";
import styles from "../styles/navbar.module.css";

const linksNav = [
  { href: "/#home", label: "Home", secao: "home" },
  { href: "/#noticias", label: "Notícias", secao: "noticias" },
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

    function atualizarSecaoAtiva() {
      const secaoNoticias = document.getElementById("noticias");
      const inicioNoticias = secaoNoticias?.offsetTop ?? Number.POSITIVE_INFINITY;
      setSecaoAtiva(window.scrollY >= inicioNoticias - window.innerHeight * 0.38 ? "noticias" : "home");
    }

    atualizarSecaoAtiva();
    window.addEventListener("scroll", atualizarSecaoAtiva, { passive: true });
    return () => window.removeEventListener("scroll", atualizarSecaoAtiva);
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
    ["/dashboard", "/perfil", "/cartas", "/decks", "/gacha", "/partida"].some(
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

        <div className={styles.linksNav}>
          {linksNav.map((link) => {
            const estaAtivo = caminho === "/" && secaoAtiva === link.secao;

            return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              onClick={(evento) => navegarParaSecao(evento, link.secao)}
              className={[styles.link, estaAtivo ? styles.linkAtivo : ""].join(" ")}
              aria-current={estaAtivo ? "page" : undefined}
            >
              {link.label}
            </Link>
            );
          })}
        </div>

        <div className={styles.acoes}>
          {estaAutenticado ? (
            <Link
              href="/dashboard"
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
