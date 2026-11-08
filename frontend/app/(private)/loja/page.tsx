"use client";

import { Check, Gem, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import {
  confirmarSessaoCheckoutRuby,
  iniciarCheckoutRuby,
  listarPacotesRuby,
  type PacoteRuby,
} from "../../lib/loja";
import { notificarSaldoAtualizado } from "../../lib/jogo";
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
  return (
    <Suspense fallback={<main className={styles.page}>Carregando loja...</main>}>
      <LojaConteudo />
    </Suspense>
  );
}

function LojaConteudo() {
  const parametros = useSearchParams();
  const [pacotes, setPacotes] = useState<PacoteRuby[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState("");
  const [erro, setErro] = useState("");
  const [confirmado, setConfirmado] = useState(false);
  const pagamento = parametros.get("pagamento");
  const sessionId = parametros.get("session_id");

  useEffect(() => {
    if (pagamento === "sucesso" && sessionId) {
      confirmarSessaoCheckoutRuby(sessionId)
        .then((res) => {
          if (res.confirmado) {
            setConfirmado(true);
            notificarSaldoAtualizado();
          }
        })
        .catch(() => undefined);
    }
  }, [pagamento, sessionId]);

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
        <h1>Escolha seu pacote de Rubys</h1>
        <p>Compare as opções e pague uma única vez, sem assinatura.</p>
        <small className={styles.notaStripe}>
          <ShieldCheck /> Crédito liberado após confirmação segura do Stripe.
        </small>
      </header>

      {pagamento === "sucesso" ? (
        <p className={styles.aviso} role="status">
          {confirmado
            ? "Pagamento confirmado pelo Stripe! Seus Rubys já foram creditados na sua conta."
            : "Retorno do pagamento recebido. Os Rubys serão liberados após a confirmação do Stripe."}
        </p>
      ) : pagamento === "cancelado" ? (
        <p className={styles.aviso} role="status">
          Pagamento cancelado. Nenhum pacote foi comprado.
        </p>
      ) : null}
      {erro ? <p className={styles.error} role="alert">{erro}</p> : null}
      {carregando ? (
        <p className={styles.empty}>Carregando bundles...</p>
      ) : pacotes.length === 0 ? (
        <p className={styles.empty}>Nenhum pacote disponível no momento.</p>
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
                <ul className={styles.beneficios}>
                  <li><Check /> Pagamento único</li>
                  <li><Check /> Crédito após confirmação</li>
                </ul>
                <div className={styles.preco}>
                  <strong>{moeda.format(preco)}</strong>
                  <small>
                    {moeda.format((preco / pacote.quantidade_rubys) * 100)} por 100 Rubys
                  </small>
                </div>
                <button
                  type="button"
                  disabled={processando !== ""}
                  onClick={() => void comprar(pacote.id)}
                >
                  {processando === pacote.id
                    ? "Abrindo pagamento..."
                    : `Comprar ${pacote.quantidade_rubys.toLocaleString("pt-BR")} Rubys`}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}
