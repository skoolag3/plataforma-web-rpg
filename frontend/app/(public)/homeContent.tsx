"use client";

import { useRouter } from "next/navigation";
import { useEffect, useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuthChange } from "../lib/auth";
import { LandingContent } from "./landingContent";

export function HomeContent() {
  const router = useRouter();
  const estaAutenticado = useSyncExternalStore(
    subscribeAuthChange,
    isAuthenticated,
    () => false,
  );

  useEffect(() => {
    if (estaAutenticado) {
      router.replace("/home");
    }
  }, [estaAutenticado, router]);

  if (estaAutenticado) {
    return <main aria-label="Verificando sessao" className="publicRouteLoading" />;
  }

  return <LandingContent />;
}
