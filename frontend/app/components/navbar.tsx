"use client";

import { faRightFromBracket, faRightToBracket, faUserPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearSession, isAuthenticated, subscribeAuthChange } from "../lib/auth";
import styles from "./navbar.module.css";

const linksNav = [
  { href: "/", label: "Home", private: false },
  { href: "/#noticias", label: "Noticias", private: false },
];

export function Navbar() {
  const router = useRouter();
  const caminho = usePathname();
  const estaAutenticado = useSyncExternalStore(
    subscribeAuthChange,
    isAuthenticated,
    () => false,
  );

  function sair() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  const linksVisiveis = linksNav.filter((link) => {
    if (estaAutenticado) {
      return true;
    }

    return !link.private;
  });

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
          {linksVisiveis.map((link) => {
            const estaAtivo =
              link.href === "/"
                ? caminho === "/"
                : !link.href.includes("#") && caminho === link.href;

            return (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
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
            <button
              type="button"
              onClick={sair}
              className={styles.btn}
            >
              <FontAwesomeIcon icon={faRightFromBracket} aria-hidden="true" />
              <span className={styles.textoAcao}>Sair</span>
            </button>
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
