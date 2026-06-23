"use client";

import { UserCog } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, getProfile, getToken } from "../lib/auth";
import styles from "../styles/privateLayout.module.css";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [validando, setValidando] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    getProfile(token)
      .then(() => setValidando(false))
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  if (validando) {
    return (
      <main className="min-h-[calc(100vh-65px)] bg-zinc-950 px-6 py-12 text-zinc-50">
        <section className="mx-auto w-full max-w-6xl">
          <p className="text-zinc-300">Validando sessao...</p>
        </section>
      </main>
    );
  }

  return (
    <>
      {pathname !== "/perfil" ? (
        <Link
          href="/perfil"
          className={styles.atalhoPerfil}
          aria-label="Gerenciar perfil"
          title="Gerenciar perfil"
        >
          <UserCog aria-hidden="true" />
        </Link>
      ) : null}
      {children}
    </>
  );
}
