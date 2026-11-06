"use client";

import { useEffect, useSyncExternalStore } from "react";
import { isAuthenticated, subscribeAuthChange } from "../lib/auth";
import { LandingContent } from "./landingContent";
import { AbstractCubeIsometricLoader } from "../../components/ui/abstract-cube-isometric-loader";

export function HomeContent() {
  const estaAutenticado = useSyncExternalStore(
    subscribeAuthChange,
    isAuthenticated,
    () => false,
  );

  useEffect(() => {
    if (estaAutenticado) {
      window.location.replace("/home");
    }
  }, [estaAutenticado]);

  if (estaAutenticado) {
    return (
      <main aria-label="Entrando no jogo" className="publicRouteLoading">
        <section
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100svh",
            gap: "1.25rem",
            color: "#f8fafc",
            textAlign: "center",
            padding: "2rem",
          }}
        >
          <AbstractCubeIsometricLoader
            dotSize={7}
            gap={5}
            bloom
            label="Entrando no jogo"
          />
          <div>
            <strong
              style={{
                fontSize: "1.15rem",
                display: "block",
                marginBottom: "0.35rem",
                letterSpacing: "0.02em",
              }}
            >
              Entrando na arena
            </strong>
            <p style={{ color: "#a78bfa", fontSize: "0.88rem", margin: 0 }}>
              Preparando seus dados e abrindo o salão...
            </p>
          </div>
        </section>
      </main>
    );
  }

  return <LandingContent />;
}
