"use client";

import {
  Check,
  ChevronRight,
  Flag,
  Map,
  Route,
  Shield,
  Skull,
  Swords,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { IconeRuby } from "../../components/iconeRuby";
import {
  abandonarExpedicao,
  buscarExpedicaoAtual,
  escolherRotaExpedicao,
  iniciarExpedicao,
  listarDecks,
  type Deck,
  type EstadoExpedicao,
  type OpcaoExpedicao,
} from "../../lib/jogo";
import styles from "../../styles/expedicao.module.css";

const iconeDificuldade = {
  FACIL: Shield,
  MEDIA: Swords,
  DIFICIL: Skull,
  CHEFE: Flag,
};

export default function ExpedicaoPage() {
  const router = useRouter();
  const [expedicao, setExpedicao] = useState<EstadoExpedicao | null>(null);
  const [decks, setDecks] = useState<Deck[]>([]);
  const [idDeck, setIdDeck] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmandoAbandono, setConfirmandoAbandono] = useState(false);

  useEffect(() => {
    Promise.all([buscarExpedicaoAtual(), listarDecks()])
      .then(([atual, lista]) => {
        setExpedicao(atual);
        setDecks(lista);
        const deck =
          lista.find((item) => item.ativo && item.completo) ??
          lista.find((item) => item.completo);
        setIdDeck(deck?.id ?? "");
      })
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a Expedição.",
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  async function comecarExpedicao() {
    if (!idDeck) return;
    setProcessando(true);
    setErro("");
    try {
      setExpedicao(await iniciarExpedicao(idDeck));
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao iniciar.");
    } finally {
      setProcessando(false);
    }
  }

  async function escolherRota(opcao: OpcaoExpedicao) {
    if (!expedicao) return;
    setProcessando(true);
    setErro("");
    try {
      const atualizada = await escolherRotaExpedicao(expedicao.id, opcao.id);
      setExpedicao(atualizada);
      router.push("/partida");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Falha ao escolher a rota.",
      );
      setProcessando(false);
    }
  }

  async function abandonar() {
    if (!expedicao) return;
    if (!confirmandoAbandono) {
      setConfirmandoAbandono(true);
      return;
    }
    setProcessando(true);
    setErro("");
    try {
      setExpedicao(await abandonarExpedicao(expedicao.id));
      setConfirmandoAbandono(false);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Falha ao abandonar.");
    } finally {
      setProcessando(false);
    }
  }

  if (carregando) {
    return <main className={styles.estado}>Gerando mapa da Expedição...</main>;
  }

  return (
    <main className={styles.pagina}>
      <section className={styles.container}>
        <header className={styles.topo}>
          <div>
            <span>
              <Map /> Jornada procedural
            </span>
            <h1>Expedição</h1>
            <p>Escolha uma rota, vença três confrontos e alcance o chefe.</p>
          </div>
          {expedicao?.status === "EM_ANDAMENTO" ? (
            <button
              type="button"
              className={styles.btnAbandonar}
              onClick={() => void abandonar()}
              disabled={
                processando || expedicao.partidaAtual?.status === "EM_ANDAMENTO"
              }
            >
              {confirmandoAbandono ? "Confirmar abandono" : "Abandonar"}
            </button>
          ) : null}
        </header>

        {erro ? <p className={styles.erro}>{erro}</p> : null}

        {!expedicao || expedicao.status !== "EM_ANDAMENTO" ? (
          <NovaExpedicao
            decks={decks}
            idDeck={idDeck}
            expedicaoAnterior={expedicao}
            processando={processando}
            onSelecionar={setIdDeck}
            onIniciar={() => void comecarExpedicao()}
          />
        ) : (
          <>
            <MapaExpedicao expedicao={expedicao} />
            {expedicao.partidaAtual?.status === "EM_ANDAMENTO" ? (
              <section className={styles.batalhaPendente}>
                <Swords />
                <div>
                  <strong>Confronto em andamento</strong>
                  <p>Retorne à Arena para continuar esta etapa.</p>
                </div>
                <button type="button" onClick={() => router.push("/partida")}>
                  Continuar batalha <ChevronRight />
                </button>
              </section>
            ) : (
              <section className={styles.rotas}>
                <header>
                  <span>Etapa {expedicao.etapaAtual + 1} de 4</span>
                  <h2>
                    {expedicao.etapaAtual === 3
                      ? "O chefe bloqueia a saída"
                      : "Escolha a próxima trajetória"}
                  </h2>
                </header>
                <div className={styles.gradeRotas}>
                  {expedicao.opcoesAtuais.map((opcao) => {
                    const Icone = iconeDificuldade[opcao.dificuldade];
                    return (
                      <button
                        type="button"
                        key={opcao.id}
                        data-dificuldade={opcao.dificuldade}
                        onClick={() => void escolherRota(opcao)}
                        disabled={processando}
                      >
                        <span className={styles.iconeRota}>
                          <Icone />
                        </span>
                        <span>
                          <small>{opcao.risco}</small>
                          <strong>{opcao.titulo}</strong>
                          <p>{opcao.descricao}</p>
                        </span>
                        <ChevronRight />
                      </button>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </section>
    </main>
  );
}

function MapaExpedicao({ expedicao }: { expedicao: EstadoExpedicao }) {
  const pontos = [
    ...expedicao.etapas.map((etapa) => ({
      nome: `Etapa ${etapa.indice + 1}`,
      status: etapa.status,
      chefe: false,
    })),
    { nome: "Chefe", status: expedicao.chefe.status, chefe: true },
  ];
  return (
    <section className={styles.mapa}>
      <header>
        <span>
          <Route /> Mapa #{expedicao.seed.toString().slice(-6)}
        </span>
        <strong>{expedicao.deck.nome}</strong>
      </header>
      <div className={styles.trilha}>
        {pontos.map((ponto, indice) => (
          <div
            className={styles.ponto}
            data-status={ponto.status}
            key={ponto.nome}
          >
            <span>
              {ponto.chefe ? (
                <Flag />
              ) : ponto.status === "CONCLUIDA" ? (
                <Check />
              ) : (
                indice + 1
              )}
            </span>
            <small>{ponto.nome}</small>
          </div>
        ))}
      </div>
    </section>
  );
}

function NovaExpedicao({
  decks,
  idDeck,
  expedicaoAnterior,
  processando,
  onSelecionar,
  onIniciar,
}: {
  decks: Deck[];
  idDeck: string;
  expedicaoAnterior: EstadoExpedicao | null;
  processando: boolean;
  onSelecionar: (id: string) => void;
  onIniciar: () => void;
}) {
  const decksValidos = decks.filter((deck) => deck.completo);
  return (
    <section className={styles.novaExpedicao}>
      <div className={styles.resumoNova}>
        <Route />
        <span>
          <small>
            {expedicaoAnterior
              ? `Última expedição: ${expedicaoAnterior.status.toLowerCase()}`
              : "Nova jornada"}
          </small>
          <h2>Prepare o deck para uma nova trilha</h2>
          <p>O mapa terá três escolhas e um chefe final.</p>
        </span>
        <strong>
          <IconeRuby /> {expedicaoAnterior?.recompensaFinal ?? 100} Rubys no
          chefe
        </strong>
      </div>
      <label>
        Deck da Expedição
        <select value={idDeck} onChange={(e) => onSelecionar(e.target.value)}>
          <option value="">Selecione um deck</option>
          {decksValidos.map((deck) => (
            <option value={deck.id} key={deck.id}>
              {deck.nome} ({deck.cartas.length} cartas)
            </option>
          ))}
        </select>
      </label>
      <button
        type="button"
        className={styles.btnIniciar}
        onClick={onIniciar}
        disabled={!idDeck || processando}
      >
        <Map /> {processando ? "Gerando trilha..." : "Iniciar expedição"}
      </button>
    </section>
  );
}
