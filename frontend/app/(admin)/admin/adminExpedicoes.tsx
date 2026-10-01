"use client";

import { ChevronLeft, ChevronRight, Gem, Map, PauseCircle, PlayCircle, Swords, Users } from "lucide-react";
import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { useEffect, useState } from "react";
import { obterAdminExpedicoes, type AdminExpedicoesPainel } from "../../lib/admin";
import styles from "../../styles/admin/adminExpedicoes.module.css";
import { AdminLayout } from "./adminShared";

export function AdminExpedicoes() {
  const [pagina, setPagina] = useState(1);
  const [painel, setPainel] = useState<AdminExpedicoesPainel | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;

    void obterAdminExpedicoes(pagina)
      .then((dados) => {
        if (cancelado) return;
        if (dados.paginacao.pagina !== pagina) {
          setPagina(dados.paginacao.pagina);
          return;
        }
        setPainel(dados);
      })
      .catch((falha) => {
        if (!cancelado) setErro(falha instanceof Error ? falha.message : "Não foi possível carregar as expedições.");
      })
      .finally(() => {
        if (!cancelado) setCarregando(false);
      });

    return () => { cancelado = true; };
  }, [pagina, tentativa]);

  function mudarPagina(novaPagina: number) {
    setCarregando(true);
    setErro("");
    setPainel(null);
    setPagina(novaPagina);
  }

  function tentarNovamente() {
    setCarregando(true);
    setErro("");
    setTentativa((valor) => valor + 1);
  }

  const paginacao = painel?.paginacao;
  const paginas = paginacao ? paginasVisiveis(paginacao.pagina, paginacao.totalPaginas) : [];
  const inicio = paginacao && paginacao.total > 0
    ? (paginacao.pagina - 1) * paginacao.porPagina + 1
    : 0;
  const fim = paginacao ? Math.min(paginacao.pagina * paginacao.porPagina, paginacao.total) : 0;

  return (
    <AdminLayout
      title="Expedições dos jogadores"
      subtitle="Acompanhe jornadas em andamento e consulte o histórico completo."
    >
      <nav className={styles.navegacaoUsuarios} aria-label="Navegação de usuários">
        <Link href="/admin/usuarios"><Users aria-hidden="true" /> Usuários cadastrados</Link>
        <span aria-current="page"><Map aria-hidden="true" /> Histórico de expedições</span>
      </nav>
      {painel ? <section className={styles.metricas} aria-label="Resumo das expedições">
        <Metrica icone={<Map />} rotulo="Expedições" valor={painel.metricas.total} />
        <Metrica icone={<Swords />} rotulo="Em andamento" valor={painel.metricas.ativas} />
        <Metrica icone={<PlayCircle />} rotulo="Concluídas" valor={painel.metricas.concluidas} />
        <Metrica icone={<PauseCircle />} rotulo="Encerradas" valor={painel.metricas.falhas + painel.metricas.abandonadas} />
      </section> : null}

      <section className={styles.historico} aria-labelledby="titulo-historico" aria-busy={carregando}>
        <header>
          <div>
            <h2 id="titulo-historico">Histórico de expedições</h2>
            <p>Jornadas ordenadas da mais recente para a mais antiga.</p>
          </div>
          {paginacao ? <span className={styles.totalRegistros}>{paginacao.total} {paginacao.total === 1 ? "registro" : "registros"}</span> : null}
        </header>

        {carregando ? <p className={styles.mensagem}>Carregando expedições...</p> : null}
        {erro ? <div className={styles.erro} role="alert"><span>{erro}</span><button type="button" onClick={tentarNovamente}>Tentar novamente</button></div> : null}

        {painel ? <>
          <div className={styles.tabelaWrap}>
            <table>
              <thead>
                <tr>
                  <th scope="col">Jogador</th>
                  <th scope="col">Deck</th>
                  <th scope="col">Status</th>
                  <th scope="col">Etapa</th>
                  <th scope="col">Rubys</th>
                  <th scope="col">Início</th>
                </tr>
              </thead>
              <tbody>
                {painel.expedicoes.map((item) => (
                  <tr key={item.id}>
                    <td><strong>{item.jogador}</strong><small>{item.email}</small></td>
                    <td>{item.deck}</td>
                    <td><span className={styles.status} data-status={item.status}>{formatarStatus(item.status)}</span></td>
                    <td>{Math.min(item.etapaAtual + 1, 4)}/4</td>
                    <td><span className={styles.rubys}><Gem aria-hidden="true" /> {item.rubys}</span></td>
                    <td>{new Date(item.criadoEm).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  </tr>
                ))}
                {!painel.expedicoes.length ? <tr><td colSpan={6} className={styles.vazio}>Nenhuma expedição registrada.</td></tr> : null}
              </tbody>
            </table>
          </div>

          <footer className={styles.rodapeTabela}>
            <span>Mostrando {inicio}–{fim} de {paginacao?.total ?? 0}</span>
            {paginacao && paginacao.totalPaginas > 1 ? <nav className={styles.paginacao} aria-label="Páginas do histórico">
              <button type="button" aria-label="Página anterior" disabled={pagina === 1} onClick={() => mudarPagina(pagina - 1)}><ChevronLeft aria-hidden="true" /></button>
              {paginas.map((numero, indice) => <Fragment key={numero}>
                {indice > 0 && numero > paginas[indice - 1] + 1 ? <span aria-hidden="true">…</span> : null}
                <button type="button" aria-label={`Página ${numero}`} aria-current={pagina === numero ? "page" : undefined} onClick={() => mudarPagina(numero)}>{numero}</button>
              </Fragment>)}
              <button type="button" aria-label="Próxima página" disabled={pagina === paginacao.totalPaginas} onClick={() => mudarPagina(pagina + 1)}><ChevronRight aria-hidden="true" /></button>
            </nav> : null}
          </footer>
        </> : null}
      </section>
    </AdminLayout>
  );
}

function Metrica({ icone, rotulo, valor }: { icone: ReactNode; rotulo: string; valor: number }) {
  return <article><span>{icone}</span><div><small>{rotulo}</small><strong>{valor}</strong></div></article>;
}

function paginasVisiveis(atual: number, total: number) {
  return [...new Set([1, atual - 1, atual, atual + 1, total])]
    .filter((numero) => numero >= 1 && numero <= total)
    .sort((a, b) => a - b);
}

function formatarStatus(status: string) {
  const nomes: Record<string, string> = {
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    FALHOU: "Derrota",
    ABANDONADA: "Abandonada",
  };
  return nomes[status] ?? status;
}
