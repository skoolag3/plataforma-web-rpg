"use client";

import { Gem, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import {
  iniciarCheckoutRuby,
  listarPacotesRuby,
  type PacoteRuby,
} from "../../lib/loja";
import styles from "../../styles/loja.module.css";

const detalhesPacote: Record<
  string,
  { descricao: string; selo?: string; destaque?: boolean }
> = {
  rubys_leve: { descricao: "Para completar os primeiros giros." },
  rubys_medio: { descricao: "Uma reserva equilibrada para novos banners." },
  rubys_grande: {
    descricao: "Mais invocações com melhor custo por Ruby.",
    selo: "Mais escolhido",
    destaque: true,
  },
  rubys_lenda: {
    descricao: "Estoque reforçado para eventos e garantias.",
    selo: "Melhor valor",
  },
  rubys_eclipse: {
    descricao: "O maior bundle para colecionadores dedicados.",
    selo: "Máximo",
  },
};

const moeda = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
});

export default function LojaPage() {
  const [pacotes, setPacotes] = useState<PacoteRuby[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState("");
  const [erro, setErro] = useState("");

  useEffect(() => {
    listarPacotesRuby()
      .then(setPacotes)
      .catch((error) =>
        setErro(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar a loja.",
        ),
      )
      .finally(() => setCarregando(false));
  }, []);

  async function comprar(id: string) {
    setProcessando(id);
    setErro("");
    try {
      const { url } = await iniciarCheckoutRuby(id);
      window.location.assign(url);
    } catch (error) {
      setErro(
        error instanceof Error
          ? error.message
          : "Não foi possível iniciar o pagamento.",
      );
      setProcessando("");
    }
  }

  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <span>
          <ShoppingBag /> Loja de Rubys
        </span>
        <h1>Bundles para cada jornada</h1>
        <p>Escolha uma reserva de Rubys para suas próximas invocações.</p>
        <small className={styles.notaStripe}>
          <ShieldCheck /> Crédito liberado após confirmação segura do Stripe.
        </small>
      </header>

      {erro ? <p className={styles.error}>{erro}</p> : null}
      {carregando ? (
        <p className={styles.empty}>Carregando bundles...</p>
      ) : (
        <section className={styles.grid} aria-label="Bundles de Rubys">
          {pacotes.map((pacote) => {
            const detalhes = detalhesPacote[pacote.id_stripe] ?? {
              descricao: "Rubys creditados após a confirmação do pagamento.",
            };
            const preco = Number(pacote.preco_brl);

            return (
              <article
                className={`${styles.card} ${detalhes.destaque ? styles.destaque : ""}`}
                key={pacote.id}
              >
                <div className={styles.cardTopo}>
                  <div className={styles.icone}>
                    <Gem />
                  </div>
                  {detalhes.selo ? (
                    <span className={styles.selo}>
                      <Sparkles /> {detalhes.selo}
                    </span>
                  ) : null}
                </div>
                <h2>{pacote.nome}</h2>
                <p className={styles.descricao}>{detalhes.descricao}</p>
                <strong className={styles.quantidade}>
                  {pacote.quantidade_rubys.toLocaleString("pt-BR")}{" "}
                  <em>Rubys</em>
                </strong>
                <div className={styles.preco}>
                  <strong>{moeda.format(preco)}</strong>
                  <small>
                    {moeda.format((preco / pacote.quantidade_rubys) * 100)} a
                    cada 100
                  </small>
                </div>
                <button
                  type="button"
                  disabled={processando !== ""}
                  onClick={() => void comprar(pacote.id)}
                >
                  {processando === pacote.id
                    ? "Abrindo pagamento..."
                    : "Escolher bundle"}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
