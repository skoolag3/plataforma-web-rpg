"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import {
  clearSession,
  getProfile,
  getToken,
  updateStoredUser,
} from "../lib/auth";
import styles from "../styles/privateLayout.module.css";

export default function AdminRouteLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [autorizado, setAutorizado] = useState(false);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    getProfile(token)
      .then((usuario) => {
        updateStoredUser(usuario);

        if (!usuario.is_admin) {
          router.replace("/home");
          return;
        }

        setAutorizado(true);
      })
      .catch(() => {
        clearSession();
        router.replace("/login");
      });
  }, [router]);

  if (!autorizado) {
    return (
      <main className={styles.loadingPage}>
        <section className={styles.loadingCard}>
          <span aria-hidden="true" />
          <strong>Validando acesso administrativo</strong>
          <p>Confirmando sua sessão e suas permissões...</p>
        </section>
      </main>
    );
  }

  return children;
}
