"use client";

import { ShieldCheck, Swords } from "lucide-react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  buscarPartidaAtual,
  executarTurno,
  iniciarPartida,
  listarDecks,
  type Deck,
  type EstadoPartida,
} from "../../lib/jogo";
import styles from "../../styles/partida.module.css";
import { MesaBatalha } from "./mesaBatalha";
import { PartidaPreparacao } from "./partidaPreparacao";

export default function PartidaPage() {
  const router = useRouter();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [idDeck, setIdDeck] = useState("");
  const [partida, setPartida] = useState<EstadoPartida | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");

  useEffect(() => {
    Promise.all([listarDecks(), buscarPartidaAtual()])
      .then(([lista, atual]) => {
        setDecks(lista);
        setPartida(atual);
        const preferido =
          lista.find((deck) => deck.ativo && deck.completo) ??
          lista.find((deck) => deck.completo);
        setIdDeck(preferido?.id ?? "");
      })
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível preparar a arena.",
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  async function comecar() {
    if (!idDeck) return;
    setProcessando(true);
    setErro("");
    try {
      setPartida(await iniciarPartida(idDeck));
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar a batalha.",
      );
    } finally {
      setProcessando(false);
    }
  }

  async function atacar() {
    if (!partida) return;
    setProcessando(true);
    setErro("");
    try {
      setPartida(await executarTurno(partida.id));
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
            <h1>Arena por turnos</h1>
            <p>
              Escolha o deck, respeite a ordem das cartas e avance um turno por
              ação.
            </p>
          </div>
          <strong>
            <Swords /> Batalha 1×1
          </strong>
        </header>
        {carregando ? (
          <div className={styles.carregando}>Preparando arena...</div>
        ) : partida ? (
          <MesaBatalha
            partida={partida}
            processando={processando}
            erro={erro}
            onAtacar={atacar}
            textoFinal={partida.expedicao ? "Voltar à expedição" : undefined}
            onNovaBatalha={() => {
              if (partida.expedicao) {
                router.push("/expedicao");
                return;
              }
              setPartida(null);
              setErro("");
            }}
          />
        ) : (
          <PartidaPreparacao
            decks={decks}
            idSelecionado={idDeck}
            carregando={processando}
            erro={erro}
            onSelecionar={setIdDeck}
            onIniciar={() => void comecar()}
          />
        )}
      </section>
    </main>
  );
}
