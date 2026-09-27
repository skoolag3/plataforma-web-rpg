"use client";

import { Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buscarExpedicaoAtual,
  buscarPartidaAtual,
  escolherRotaExpedicao,
  executarTurno,
  responderBossExpedicao,
  type EstadoExpedicao,
  type EstadoPartida,
  type AcaoTurno,
} from "../../lib/jogo";
import styles from "../../styles/partida.module.css";
import { MesaBatalha } from "./mesaBatalha";
import { DialogoBoss } from "../expedicao/dialogoBoss";

export default function PartidaPage() {
  const router = useRouter();
  const [partida, setPartida] = useState<EstadoPartida | null>(null);
  const [expedicaoBoss, setExpedicaoBoss] = useState<EstadoExpedicao | null>(
    null,
  );
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([buscarPartidaAtual(), buscarExpedicaoAtual()])
      .then(([atual, expedicao]) => {
        if (atual) {
          setPartida(atual);
        } else if (
          window.location.search.includes("boss=1") &&
          expedicao?.status === "EM_ANDAMENTO" &&
          expedicao.chefe.status === "ATUAL" &&
          expedicao.dialogoBoss
        ) {
          setExpedicaoBoss(expedicao);
        } else {
          router.replace("/expedicao");
        }
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

  async function responderBoss(resposta: string) {
    if (!expedicaoBoss) return;
    setProcessando(true);
    setErro("");
    try {
      setExpedicaoBoss(
        await responderBossExpedicao(expedicaoBoss.id, resposta),
      );
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Falha ao responder ao boss.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function iniciarConfrontoBoss() {
    if (!expedicaoBoss?.dialogoBoss?.resultado) return;
    setProcessando(true);
    setErro("");
    try {
      await escolherRotaExpedicao(expedicaoBoss.id, expedicaoBoss.chefe.id);
      const atual = await buscarPartidaAtual();
      if (!atual)
        throw new Error("A batalha não foi encontrada. Recarregue a página.");
      setPartida(atual);
      setExpedicaoBoss(null);
      router.replace("/partida");
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Falha ao iniciar o confronto.",
      );
    } finally {
      setProcessando(false);
    }
  }

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
            <h1>Batalha da expedição</h1>
            <p>Avance um turno por ação.</p>
          </div>
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
        ) : expedicaoBoss?.dialogoBoss ? (
          <div className={styles.campoBoss}>
            <div className={styles.campoBossFundo} aria-hidden="true">
              <Swords />
              <span>Confronto final</span>
            </div>
            <div
              className={styles.dialogoBossOverlay}
              role="dialog"
              aria-modal="true"
              aria-label="Desafio do chefe final"
            >
              {erro ? <p className={styles.erro}>{erro}</p> : null}
              <DialogoBoss
                dialogo={expedicaoBoss.dialogoBoss}
                processando={processando}
                onResponder={(resposta) => void responderBoss(resposta)}
                onIniciar={() => void iniciarConfrontoBoss()}
              />
            </div>
          </div>
        ) : (
          <div className={styles.carregando}>
            {erro || "Retornando para a expedição..."}
          </div>
        )}
      </section>
    </main>
  );
}
