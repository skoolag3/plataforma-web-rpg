"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearSession, isAuthenticated, subscribeAuthChange } from "../lib/auth";

const links = [
  { href: "/", label: "Home", private: false },
  { href: "/cartas", label: "Cartas", private: true },
  { href: "/", label: "Como jogar", private: false },
  { href: "/", label: "Ranking", private: false },
  { href: "/", label: "Noticias", private: false },
  { href: "/dashboard", label: "Dashboard", private: true },
  { href: "/decks", label: "Decks", private: true },
];

export function Navbar() {
  const router = useRouter();
  const autenticado = useSyncExternalStore(
    subscribeAuthChange,
    isAuthenticated,
    () => false,
  );

  function sair() {
    clearSession();
    router.push("/");
    router.refresh();
  }

  const linksVisiveis = links.filter((link) => {
    if (autenticado) {
      return true;
    }

    return !link.private;
  });

  return (
    <header className="border-b border-violet-950/70 bg-[#05070f] text-zinc-50">
      <nav className="mx-auto flex min-h-16 w-full max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-3 sm:px-10">
        <Link href="/" className="flex items-center gap-3 text-base font-black italic tracking-wide">
          <span className="grid h-10 w-10 place-items-center rounded-lg border border-violet-500/50 bg-violet-950/40 text-violet-300">
            RPG
          </span>
          <span>
            ANIME<span className="text-violet-400">CARDS</span>
          </span>
        </Link>
        <div className="flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase text-zinc-300">
          {linksVisiveis.map((link) => (
            <Link
              key={`${link.href}-${link.label}`}
              href={link.href}
              className="rounded-md px-3 py-2 transition hover:bg-violet-950/50 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-2 text-xs font-bold uppercase">
          {autenticado ? (
            <button
              type="button"
              onClick={sair}
              className="rounded-md border border-violet-500/50 px-4 py-2 text-left text-violet-100 transition hover:bg-violet-950/50 hover:text-white"
            >
              Sair
            </button>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-md border border-violet-500/60 px-4 py-2 text-violet-100 transition hover:bg-violet-950/60 hover:text-white"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-md bg-violet-600 px-4 py-2 text-white shadow-lg shadow-violet-950/30 transition hover:bg-violet-500"
              >
                Registrar
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
