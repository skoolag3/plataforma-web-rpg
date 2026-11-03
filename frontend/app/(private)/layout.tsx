"use client";

import { useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { clearSession, getProfile, getToken } from "../lib/auth";
import styles from "../styles/privateLayout.module.css";
import { PrivateNavbar } from "../components/privateNavbar";
import { RaridadesJogoProvider } from "../components/raridadesJogo";
import { AbstractCubeIsometricLoader } from "../../components/ui/abstract-cube-isometric-loader";

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
          <AbstractCubeIsometricLoader dotSize={7} gap={5} bloom label="Validando sessão" />
          <strong>Preparando sua jornada</strong>
          <p>Validando sessão e carregando seus dados...</p>
        </section>
      </main>
    );
  }

  return (
    <div className={styles.privateShell}>
      <PrivateNavbar />
      <RaridadesJogoProvider><div className={styles.privateContent}>{children}</div></RaridadesJogoProvider>
    </div>
  );
}
