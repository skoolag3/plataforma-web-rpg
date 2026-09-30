"use client";

import { Gem, Map } from "lucide-react";
import * as React from "react";
import { obterExpedicoesAdminUsuario, type AdminUsuarioExpedicao } from "../../lib/admin";
import styles from "../../styles/admin/adminUsuarioExpedicoes.module.css";

function status(status: string) {
  return ({ EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", FALHOU: "Derrota", ABANDONADA: "Abandonada" } as Record<string, string>)[status] ?? status;
}

export function AdminUsuarioExpedicoes({ id }: { id: string }) {
  const [itens, setItens] = React.useState<AdminUsuarioExpedicao[]>([]);
  const [carregando, setCarregando] = React.useState(true);
  const [erro, setErro] = React.useState<string | null>(null);

  React.useEffect(() => {
    let ativo = true;
    void obterExpedicoesAdminUsuario(id).then((dados) => { if (ativo) setItens(dados); }).catch((e) => { if (ativo) setErro(e instanceof Error ? e.message : "Não foi possível carregar as expedições."); }).finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id]);

  return <section className={styles.painel} aria-label="Expedições do usuário">
    <header><span><Map /><div><small>Atividade de jogo</small><strong>Expedições do usuário</strong></div></span><b>{itens.length} registros</b></header>
    {carregando ? <p className={styles.mensagem}>Carregando expedições...</p> : null}
    {erro ? <p className={styles.erro}>{erro}</p> : null}
    {!carregando && !erro && !itens.length ? <p className={styles.vazio}>Este usuário ainda não iniciou nenhuma expedição.</p> : null}
    <div className={styles.lista}>{itens.map((item) => <article key={item.id}>
      <div><strong>{item.deck}</strong><small>{new Date(item.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</small></div>
      <span data-status={item.status}>{status(item.status)}</span><small>Etapa {Math.min(item.etapaAtual + 1, 4)}/4</small><b><Gem /> {item.rubys}</b>
    </article>)}</div>
  </section>;
}
