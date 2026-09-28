"use client";

import {
  Gem,
  Map,
  PackagePlus,
  PauseCircle,
  PlayCircle,
  Pencil,
  Trash2,
  X,
  Swords,
} from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import {
  atualizarProdutoExpedicao,
  criarProdutoExpedicao,
  excluirProdutoExpedicao,
  obterAdminCampanha,
  type AdminCampanhaPainel,
  type AdminProdutoExpedicao,
  type SalvarProdutoExpedicaoPayload,
} from "../../lib/admin";
import styles from "../../styles/admin/adminCampanha.module.css";
import { AdminLayout } from "./adminShared";

const produtoInicial: SalvarProdutoExpedicaoPayload = {
  nome: "", descricao: "", tema: "FOGO", tipo: "RECORRENTE", ativo: true, peso: 100,
  inicioEm: null, fimEm: null, recompensaFacil: 25, recompensaMedia: 25,
  recompensaDificil: 25, recompensaChefe: 100, percentualMantidoDerrota: 70,
  bossNome: "Guardião da Expedição",
  bossPersonalidade: "Orgulhoso, estratégico e provocador, mas respeita a coragem.",
  bossProvocacao: "Você atravessou minha trilha. Agora prove que merece sair dela.",
  bossPerguntas: ["Por que você merece atravessar meu domínio?", "O que faria se sua carta mais forte caísse agora?", "Qual sacrifício aceitaria para vencer esta batalha?", "O que distingue coragem de imprudência?"],
  bossCartas: [],
};

export function AdminCampanha() {
  const [painel, setPainel] = useState<AdminCampanhaPainel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [produtoId, setProdutoId] = useState<string | null>(null);
  const [produto, setProduto] = useState<SalvarProdutoExpedicaoPayload | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await obterAdminCampanha();
      setPainel(dados);
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao carregar campanha.",
      );
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function abrirProduto(item?: AdminProdutoExpedicao) {
    setProdutoId(item?.id ?? null);
    setProduto(item ? {
      nome: item.nome, descricao: item.descricao, tema: item.tema, tipo: item.tipo,
      ativo: item.ativo, peso: item.peso, inicioEm: item.inicioEm, fimEm: item.fimEm,
      recompensaFacil: item.recompensaFacil, recompensaMedia: item.recompensaMedia,
      recompensaDificil: item.recompensaDificil, recompensaChefe: item.recompensaChefe,
      percentualMantidoDerrota: item.percentualMantidoDerrota, bossNome: item.bossNome,
      bossPersonalidade: item.bossPersonalidade, bossProvocacao: item.bossProvocacao,
      bossPerguntas: item.bossPerguntas, bossCartas: item.bossCartas,
    } : { ...produtoInicial, bossPerguntas: [...produtoInicial.bossPerguntas] });
    setConfirmandoExclusao(false);
  }

  async function salvarProduto() {
    if (!produto) return;
    setSalvando(true);
    try {
      const res = produtoId
        ? await atualizarProdutoExpedicao(produtoId, produto)
        : await criarProdutoExpedicao(produto);
      notificarSucesso(res.message, "Catálogo atualizado");
      setProduto(null);
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao salvar produto.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function excluirProduto() {
    if (!produtoId) return;
    if (!confirmandoExclusao) { setConfirmandoExclusao(true); return; }
    setSalvando(true);
    try {
      const res = await excluirProdutoExpedicao(produtoId);
      notificarSucesso(res.message, "Produto removido");
      setProduto(null);
      await carregar();
    } catch (erro) {
      notificarErro(erro instanceof Error ? erro.message : "Erro ao excluir produto.");
    } finally { setSalvando(false); }
  }

  return (
    <AdminLayout
      title="Campanha e expedições"
      subtitle="Acompanhe as jornadas e ajuste as regras das próximas trilhas."
    >
      <section className={styles.metricas}>
        <Metrica
          icone={<Map />}
          rotulo="Expedições"
          valor={painel?.metricas.total ?? 0}
        />
        <Metrica
          icone={<Swords />}
          rotulo="Em andamento"
          valor={painel?.metricas.ativas ?? 0}
        />
        <Metrica
          icone={<PlayCircle />}
          rotulo="Concluídas"
          valor={painel?.metricas.concluidas ?? 0}
        />
        <Metrica
          icone={<PauseCircle />}
          rotulo="Encerradas"
          valor={
            (painel?.metricas.falhas ?? 0) + (painel?.metricas.abandonadas ?? 0)
          }
        />
      </section>

      <section className={styles.catalogo}>
        <header>
          <div><h2>Produtos de expedição</h2><p>O jogador recebe um produto do pool conforme peso e período.</p></div>
          <button type="button" onClick={() => abrirProduto()}><PackagePlus /> Novo produto</button>
        </header>
        <div className={styles.produtos}>
          {(painel?.produtos ?? []).map((item) => (
            <article key={item.id} data-ativo={item.ativo}>
              <div className={styles.produtoTopo}>
                <span data-tema={item.tema}>{item.tema}</span>
                <small>{item.tipo === "EVENTO" ? "Evento limitado" : "Recorrente"}</small>
                <button type="button" aria-label={`Editar ${item.nome}`} onClick={() => abrirProduto(item)}><Pencil /></button>
              </div>
              <h3>{item.nome}</h3><p>{item.descricao}</p>
              <footer><span>Peso <strong>{item.peso}</strong></span><span>Chefe <strong>{item.recompensaChefe} Rubys</strong></span><span>{item.ativo ? "No pool" : "Pausado"}</span></footer>
            </article>
          ))}
        </div>
      </section>

      {produto ? (
        <div className={styles.modalProdutoBackdrop} role="presentation">
          <section className={styles.modalProduto} role="dialog" aria-modal="true" aria-labelledby="titulo-produto">
          <header>
            <div><h2 id="titulo-produto">{produtoId ? "Editar produto" : "Novo produto"}</h2><p>A configuração será copiada para cada nova jornada.</p></div>
            <button type="button" aria-label="Fechar" onClick={() => setProduto(null)}><X /></button>
          </header>
          <div className={styles.formProduto}>
            <label>Nome<input value={produto.nome} onChange={(e) => setProduto({...produto, nome: e.target.value})} /></label>
            <label className={styles.campoLargo}>Descrição<input value={produto.descricao} onChange={(e) => setProduto({...produto, descricao: e.target.value})} /></label>
            <label>Tema<input value={produto.tema} onChange={(e) => setProduto({...produto, tema: e.target.value})} /></label>
            <label>Tipo<select value={produto.tipo} onChange={(e) => setProduto({...produto, tipo: e.target.value as "RECORRENTE" | "EVENTO"})}><option value="RECORRENTE">Recorrente</option><option value="EVENTO">Evento</option></select></label>
            <CampoProduto rotulo="Peso no sorteio" valor={produto.peso} alterar={(peso) => setProduto({...produto, peso})} />
            <CampoProduto rotulo="Rota fácil" valor={produto.recompensaFacil} alterar={(recompensaFacil) => setProduto({...produto, recompensaFacil})} />
            <CampoProduto rotulo="Rota média" valor={produto.recompensaMedia} alterar={(recompensaMedia) => setProduto({...produto, recompensaMedia})} />
            <CampoProduto rotulo="Rota difícil" valor={produto.recompensaDificil} alterar={(recompensaDificil) => setProduto({...produto, recompensaDificil})} />
            <CampoProduto rotulo="Chefe final" valor={produto.recompensaChefe} alterar={(recompensaChefe) => setProduto({...produto, recompensaChefe})} />
            <CampoProduto rotulo="Mantido na derrota (%)" valor={produto.percentualMantidoDerrota} alterar={(percentualMantidoDerrota) => setProduto({...produto, percentualMantidoDerrota})} />
            <label>Início do evento<input type="datetime-local" value={paraInputData(produto.inicioEm)} onChange={(e) => setProduto({...produto, inicioEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
            <label>Fim do evento<input type="datetime-local" value={paraInputData(produto.fimEm)} onChange={(e) => setProduto({...produto, fimEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
            <label className={styles.campoLargo}>Nome do boss<input value={produto.bossNome} onChange={(e) => setProduto({...produto, bossNome: e.target.value})} /></label>
            <label className={styles.campoLargo}>Personalidade do boss<textarea value={produto.bossPersonalidade} onChange={(e) => setProduto({...produto, bossPersonalidade: e.target.value})} /></label>
            <label className={styles.campoLargo}>Provocação<textarea value={produto.bossProvocacao} onChange={(e) => setProduto({...produto, bossProvocacao: e.target.value})} /></label>
            {produto.bossPerguntas.map((pergunta, indice) => (
              <label key={indice}>Pergunta {indice + 1}<input value={pergunta} onChange={(e) => {
                const bossPerguntas = [...produto.bossPerguntas];
                bossPerguntas[indice] = e.target.value;
                setProduto({...produto, bossPerguntas});
              }} /></label>
            ))}
            <label className={styles.ativoProduto}><input type="checkbox" checked={produto.ativo} onChange={(e) => setProduto({...produto, ativo: e.target.checked})} /> Disponível no pool</label>
          </div>
          <footer>
            {produtoId ? <button className={styles.excluirProduto} type="button" onClick={() => void excluirProduto()}><Trash2 />{confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}</button> : <span />}
            <button className={styles.salvarProduto} type="button" disabled={salvando} onClick={() => void salvarProduto()}>{salvando ? "Salvando..." : "Salvar produto"}</button>
          </footer>
          </section>
        </div>
      ) : null}

      <section className={styles.historico}>
        <header>
          <h2>Expedições recentes</h2>
          <p>Últimas jornadas iniciadas pelos jogadores.</p>
        </header>
        <div className={styles.tabelaWrap}>
          <table>
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Deck</th>
                <th>Status</th>
                <th>Etapa</th>
                <th>Rubys</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {(painel?.recentes ?? []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.jogador}</strong>
                    <small>{item.email}</small>
                  </td>
                  <td>{item.deck}</td>
                  <td>
                    <span data-status={item.status}>
                      {formatarStatus(item.status)}
                    </span>
                  </td>
                  <td>{Math.min(item.etapaAtual + 1, 4)}/4</td>
                  <td>
                    <Gem /> {item.rubys}
                  </td>
                  <td>
                    {new Date(item.criadoEm).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {!painel?.recentes.length ? (
                <tr>
                  <td colSpan={6}>Nenhuma expedição registrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

function Metrica({
  icone,
  rotulo,
  valor,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: number;
}) {
  return (
    <article>
      <span>{icone}</span>
      <div>
        <small>{rotulo}</small>
        <strong>{valor}</strong>
      </div>
    </article>
  );
}

function CampoProduto({ rotulo, valor, alterar }: { rotulo: string; valor: number; alterar: (valor: number) => void }) {
  return (
    <label>{rotulo}<input type="number" min={0} value={valor} onChange={(e) => alterar(Math.max(0, Number(e.target.value) || 0))} /></label>
  );
}

function paraInputData(valor: string | null) {
  if (!valor) return "";
  const data = new Date(valor);
  return new Date(data.getTime() - data.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
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
