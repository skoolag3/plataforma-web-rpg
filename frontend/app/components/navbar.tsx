"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSyncExternalStore } from "react";
import { clearSession, isAuthenticated, subscribeAuthChange } from "../lib/auth";

const links = [
  { href: "/", label: "Inicio" },
  { href: "/login", label: "Login" },
  { href: "/cadastro", label: "Cadastro" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/cartas", label: "Cartas" },
  { href: "/decks", label: "Decks" },
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
    router.push("/login");
    router.refresh();
  }

  const linksVisiveis = links.filter((link) => {
    if (autenticado) {
      return link.href !== "/login" && link.href !== "/cadastro";
    }

    return !["/dashboard", "/cartas", "/decks"].includes(link.href);
  });

  return (
    <header className="border-b border-zinc-800 bg-zinc-950 text-zinc-50">
      <nav className="mx-auto flex min-h-16 w-full max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="text-base font-semibold">
          Card Game RPG
        </Link>
        <div className="flex flex-wrap items-center gap-2 text-sm text-zinc-300">
          {linksVisiveis.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 transition hover:bg-zinc-900 hover:text-white"
            >
              {link.label}
            </Link>
          ))}
          {autenticado ? (
            <button
              type="button"
              onClick={sair}
              className="rounded-md px-3 py-2 text-left transition hover:bg-zinc-900 hover:text-white"
            >
              Sair
            </button>
          ) : null}
        </div>
      </nav>
    </header>
  );
}
