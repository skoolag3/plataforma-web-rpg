"use client";

import { ShieldCheck, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buscarPartidaAtual,
  executarTurno,
  type EstadoPartida,
  type AcaoTurno,
} from "../../lib/jogo";
import styles from "../../styles/partida.module.css";
import { MesaBatalha } from "./mesaBatalha";

export default function PartidaPage() {
  const router = useRouter();
  const [partida, setPartida] = useState<EstadoPartida | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    buscarPartidaAtual()
      .then((atual) => {
        if (!atual) {
          router.replace("/expedicao");
          return;
        }
        setPartida(atual);
      })
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível preparar a batalha.",
        ),
      )
      .finally(() => setCarregando(false));
  }, [router]);

  async function executarAcao(acao: AcaoTurno) {
    if (!partida) return;
    setProcessando(true);
    setErro("");
    try {
      setPartida(await executarTurno(partida.id, acao));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível executar o turno.",
      );
    } finally {
      setProcessando(false);
    }
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.container}>
        <header className={styles.topo}>
          <div>
            <span>
              <ShieldCheck /> Servidor autoritativo
            </span>
            <h1>Batalha da expedição</h1>
            <p>Respeite a ordem das cartas e avance um turno por ação.</p>
          </div>
          <strong>
            <Swords /> Batalha 1×1
          </strong>
        </header>
        {carregando ? (
          <div className={styles.carregando}>Preparando batalha...</div>
        ) : partida ? (
          <MesaBatalha
            partida={partida}
            processando={processando}
            erro={erro}
            onExecutarAcao={(acao) => void executarAcao(acao)}
            textoFinal={partida.expedicao ? "Voltar à expedição" : undefined}
            onNovaBatalha={() => router.push("/expedicao")}
          />
        ) : (
          <div className={styles.carregando}>
            {erro || "Retornando para a expedição..."}
          </div>
        )}
      </section>
    </main>
  );
}
