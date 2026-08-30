"use client";

import { Gem, ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { listarPacotesRuby, iniciarCheckoutRuby, type PacoteRuby } from "../../lib/loja";
import styles from "../../styles/loja.module.css";

const nomes = ["Leve", "Médio", "Grande"];

export default function LojaPage() {
  const [pacotes, setPacotes] = useState<PacoteRuby[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [processando, setProcessando] = useState("");
  const [erro, setErro] = useState("");
  useEffect(() => { listarPacotesRuby().then(setPacotes).catch((e) => setErro(e instanceof Error ? e.message : "Não foi possível carregar a loja.")).finally(() => setCarregando(false)); }, []);
  async function comprar(id: string) { setProcessando(id); setErro(""); try { const { url } = await iniciarCheckoutRuby(id); window.location.assign(url); } catch (e) { setErro(e instanceof Error ? e.message : "Não foi possível iniciar o pagamento."); setProcessando(""); } }
  return <main className={styles.page}><header className={styles.header}><span><ShoppingBag /> Loja de Rubys</span><h1>Escolha seu pacote</h1><p>Adicione Rubys à sua conta.</p><small className={styles.notaStripe}>Pagamento processado com segurança pelo Stripe.</small></header>{erro ? <p className={styles.error}>{erro}</p> : null}{carregando ? <p className={styles.empty}>Carregando pacotes...</p> : <section className={styles.grid}>{pacotes.map((pacote, indice) => <article className={`${styles.card} ${indice === 1 ? styles.destaque : ""}`} key={pacote.id}><div className={styles.icone}><Gem /></div><small>{nomes[indice] ?? "Pacote"}</small><h2>{pacote.nome}</h2><strong className={styles.quantidade}>{pacote.quantidade_rubys.toLocaleString("pt-BR")} <em>Rubys</em></strong><p>Crédito imediato após a confirmação do pagamento.</p><button type="button" disabled={processando !== ""} onClick={() => void comprar(pacote.id)}>{processando === pacote.id ? "Abrindo pagamento..." : "Comprar pacote"}</button></article>)}</section>}</main>;
}
