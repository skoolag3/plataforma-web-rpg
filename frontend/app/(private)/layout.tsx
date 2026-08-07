"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, getProfile, getToken } from "../lib/auth";
import styles from "../styles/privateLayout.module.css";
import { PrivateNavbar } from "../components/privateNavbar";

export default function PrivateLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
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
      <main className={styles.loadingPage}>
        <section className={styles.loadingCard}>
          <span aria-hidden="true" />
          <strong>Preparando sua jornada</strong>
          <p>Validando sessão e carregando seus dados...</p>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.privateShell}>
      <PrivateNavbar />
      <div className={styles.privateContent}>{children}</div>
    </div>
  );
}
