"use client";

import {
  Map,
  Compass,
  Trash2,
  X,
  Swords,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import {
  atualizarProdutoExpedicao,
  criarProdutoExpedicao,
  criarTemaExpedicao,
  excluirProdutoExpedicao,
  obterAdminCampanha,
  type AdminCampanhaPainel,
  type AdminProdutoExpedicao,
  type SalvarProdutoExpedicaoPayload,
} from "../../lib/admin";
import styles from "../../styles/admin/adminCampanha.module.css";
import BasicSteps from "@/components/ui/steps";
import { AdminCampanhaCatalogo } from "./adminCampanhaCatalogo";
import { AdminLayout } from "./adminShared";

const produtoInicial: SalvarProdutoExpedicaoPayload = {
  nome: "", descricao: "", tema: "", tipo: "RECORRENTE", ativo: true, peso: 100,
  inicioEm: null, fimEm: null, recompensaFacil: 25, recompensaMedia: 25,
  recompensaDificil: 25, recompensaChefe: 100, percentualMantidoDerrota: 70,
  bossNome: "Guardião da Expedição",
  bossPersonalidade: "Orgulhoso, estratégico e provocador, mas respeita a coragem.",
  bossProvocacao: "Você atravessou minha trilha. Agora prove que merece sair dela.",
  bossPerguntas: ["Por que você merece atravessar meu domínio?", "O que faria se sua carta mais forte caísse agora?", "Qual sacrifício aceitaria para vencer esta batalha?", "O que distingue coragem de imprudência?"],
  bossCartas: [],
};

const etapasProduto = ["Identidade", "Regras da jornada", "Boss e publicação"] as const;

export function AdminCampanha() {
  const [painel, setPainel] = useState<AdminCampanhaPainel | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [produtoId, setProdutoId] = useState<string | null>(null);
  const [produto, setProduto] = useState<SalvarProdutoExpedicaoPayload | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [etapaProduto, setEtapaProduto] = useState(0);
  const [erroEtapa, setErroEtapa] = useState("");
  const [temaSelecionado, setTemaSelecionado] = useState<string | null>(null);

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

  function abrirProduto(item?: AdminProdutoExpedicao, tema?: string) {
    setEtapaProduto(0);
    setErroEtapa("");
    setProdutoId(item?.id ?? null);
    setProduto(item ? {
      nome: item.nome, descricao: item.descricao, tema: item.tema, tipo: item.tipo,
      ativo: item.ativo, peso: item.peso, inicioEm: item.inicioEm, fimEm: item.fimEm,
      recompensaFacil: item.recompensaFacil, recompensaMedia: item.recompensaMedia,
      recompensaDificil: item.recompensaDificil, recompensaChefe: item.recompensaChefe,
      percentualMantidoDerrota: item.percentualMantidoDerrota, bossNome: item.bossNome,
      bossPersonalidade: item.bossPersonalidade, bossProvocacao: item.bossProvocacao,
      bossPerguntas: item.bossPerguntas, bossCartas: item.bossCartas,
    } : {
      ...produtoInicial,
      tema: tema ?? temaSelecionado ?? painel?.produtos[0]?.tema ?? produtoInicial.tema,
      bossPerguntas: [...produtoInicial.bossPerguntas],
    });
    setConfirmandoExclusao(false);
  }

  function avancarEtapa() {
    if (!produto) return;
    if (etapaProduto === 0 && (!produto.nome.trim() || !produto.descricao.trim() || !produto.tema.trim())) {
      setErroEtapa("Preencha nome, descrição e tema para continuar.");
      return;
    }
    if (etapaProduto === 1 && produto.inicioEm && produto.fimEm && new Date(produto.inicioEm) >= new Date(produto.fimEm)) {
      setErroEtapa("O fim do evento deve ocorrer depois do início.");
      return;
    }
    setErroEtapa("");
    setEtapaProduto((etapa) => Math.min(etapa + 1, etapasProduto.length - 1));
  }

  async function salvarProduto() {
    if (!produto) return;
    setSalvando(true);
    try {
      const res = produtoId
        ? await atualizarProdutoExpedicao(produtoId, produto)
        : await criarProdutoExpedicao(produto);
      notificarSucesso(produtoId ? "Campanha atualizada." : "Campanha criada.", "Catálogo atualizado");
      setTemaSelecionado(res.produto.tema);
      setProduto(null);
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao salvar campanha.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function salvarTema(nome: string) {
    await criarTemaExpedicao(nome);
    setTemaSelecionado(null);
    await carregar();
    notificarSucesso("Tema criado.", "Catálogo atualizado");
  }

  async function excluirProduto() {
    if (!produtoId) return;
    if (!confirmandoExclusao) { setConfirmandoExclusao(true); return; }
    setSalvando(true);
    try {
      await excluirProdutoExpedicao(produtoId);
      notificarSucesso("Campanha excluída.", "Catálogo atualizado");
      setProduto(null);
      await carregar();
    } catch (erro) {
      notificarErro(erro instanceof Error ? erro.message : "Erro ao excluir campanha.");
    } finally { setSalvando(false); }
  }

  return (
    <AdminLayout
      title="Catálogo de campanhas"
      subtitle="Organize temas, crie cenários e acompanhe as campanhas disponíveis para sorteio."
    >
      <AdminCampanhaCatalogo
        temas={painel?.temas ?? []}
        produtos={painel?.produtos ?? []}
        temaSelecionado={temaSelecionado}
        selecionarTema={setTemaSelecionado}
        criarTema={salvarTema}
        novaCampanha={(tema) => abrirProduto(undefined, tema)}
        editarCampanha={(item) => abrirProduto(item)}
      />

      {produto ? (
        <div className={styles.modalProdutoBackdrop} role="presentation">
          <section className={styles.modalProduto} role="dialog" aria-modal="true" aria-labelledby="titulo-produto">
            <header>
              <div>
                <h2 id="titulo-produto">{produtoId ? "Editar campanha" : "Criar campanha"}</h2>
                <p>{produtoId ? "Ajuste o cenário e suas regras." : `Uma nova campanha para o tema ${produto.tema}.`}</p>
              </div>
              <button type="button" aria-label="Fechar" onClick={() => setProduto(null)}><X /></button>
            </header>
            <div className={styles.etapasProduto} aria-label="Etapas da campanha">
              <BasicSteps labels={etapasProduto} step={etapaProduto} disabled={salvando}
                onStepChange={(etapa) => { setEtapaProduto(etapa); setErroEtapa(""); }} />
            </div>
            <div className={styles.conteudoEtapa} key={etapaProduto}>
              {etapaProduto === 0 ? <>
                <div className={styles.introEtapa}>
                  <span><Compass aria-hidden="true" /></span>
                  <div><h3>Onde esta campanha acontece?</h3><p>Um tema pode reunir várias campanhas, cada uma com seu cenário e boss.</p></div>
                </div>
                <div className={styles.selecaoTema}>
                  <strong>Tema: {produto.tema}</strong>
                  <small>Esta campanha ficará dentro do tema selecionado no catálogo.</small>
                </div>
                <div className={styles.formProduto}>
                  <label>Nome da campanha<input maxLength={100} value={produto.nome} placeholder="Ex.: Fortaleza das Cinzas" onChange={(e) => setProduto({...produto, nome: e.target.value})} /></label>
                  <label className={styles.campoLargo}>Cenário e proposta<input maxLength={300} value={produto.descricao} placeholder="Descreva o que torna esta jornada diferente" onChange={(e) => setProduto({...produto, descricao: e.target.value})} /></label>
                  <label>Tipo de campanha<select value={produto.tipo} onChange={(e) => setProduto({...produto, tipo: e.target.value as "RECORRENTE" | "EVENTO"})}><option value="RECORRENTE">Recorrente</option><option value="EVENTO">Evento</option></select></label>
                </div>
              </> : null}

              {etapaProduto === 1 ? <>
                <div className={styles.introEtapa}>
                  <span><Map aria-hidden="true" /></span>
                  <div><h3>Como funciona a jornada?</h3><p>Defina as recompensas das rotas e quando esta campanha poderá aparecer.</p></div>
                </div>
                <div className={styles.formProduto}>
                  <CampoProduto rotulo="Rota fácil · Rubys" valor={produto.recompensaFacil} alterar={(recompensaFacil) => setProduto({...produto, recompensaFacil})} />
                  <CampoProduto rotulo="Rota média · Rubys" valor={produto.recompensaMedia} alterar={(recompensaMedia) => setProduto({...produto, recompensaMedia})} />
                  <CampoProduto rotulo="Rota difícil · Rubys" valor={produto.recompensaDificil} alterar={(recompensaDificil) => setProduto({...produto, recompensaDificil})} />
                  <CampoProduto rotulo="Chefe final · Rubys" valor={produto.recompensaChefe} alterar={(recompensaChefe) => setProduto({...produto, recompensaChefe})} />
                  <CampoProduto rotulo="Mantido na derrota (%)" valor={produto.percentualMantidoDerrota} alterar={(percentualMantidoDerrota) => setProduto({...produto, percentualMantidoDerrota})} />
                  <CampoProduto rotulo="Peso no sorteio" valor={produto.peso} alterar={(peso) => setProduto({...produto, peso})} />
                </div>
                <p className={styles.ajudaEtapa}>Quanto maior o peso, maior a chance de a campanha ser sorteada entre as disponíveis.</p>
                <div className={styles.periodoEvento}>
                  <strong>Período de disponibilidade</strong>
                  <p>Deixe as datas vazias para manter a campanha disponível sem limite de tempo.</p>
                  <div className={styles.formProduto}>
                    <label>Início<input type="datetime-local" value={paraInputData(produto.inicioEm)} onChange={(e) => setProduto({...produto, inicioEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
                    <label>Fim<input type="datetime-local" value={paraInputData(produto.fimEm)} onChange={(e) => setProduto({...produto, fimEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
                  </div>
                </div>
              </> : null}

              {etapaProduto === 2 ? <>
                <div className={styles.introEtapa}>
                  <span><Swords aria-hidden="true" /></span>
                  <div><h3>Quem espera no final?</h3><p>Dê identidade ao boss e prepare as perguntas do confronto.</p></div>
                </div>
                <div className={styles.formProduto}>
                  <label className={styles.campoLargo}>Nome do boss<input maxLength={100} value={produto.bossNome} onChange={(e) => setProduto({...produto, bossNome: e.target.value})} /></label>
                  <label className={styles.campoLargo}>Personalidade<textarea maxLength={600} value={produto.bossPersonalidade} onChange={(e) => setProduto({...produto, bossPersonalidade: e.target.value})} /></label>
                  <label className={styles.campoLargo}>Provocação<textarea maxLength={500} value={produto.bossProvocacao} onChange={(e) => setProduto({...produto, bossProvocacao: e.target.value})} /></label>
                  {produto.bossPerguntas.map((pergunta, indice) => (
                    <label key={indice}>Pergunta {indice + 1}<input maxLength={250} value={pergunta} onChange={(e) => {
                      const bossPerguntas = [...produto.bossPerguntas];
                      bossPerguntas[indice] = e.target.value;
                      setProduto({...produto, bossPerguntas});
                    }} /></label>
                  ))}
                </div>
                <label className={styles.publicarCampanha}>
                  <input type="checkbox" checked={produto.ativo} onChange={(e) => setProduto({...produto, ativo: e.target.checked})} />
                  <span><strong>Disponibilizar no sorteio</strong><small>{produto.inicioEm || produto.fimEm ? "A campanha só aparecerá durante o período definido." : "A campanha poderá aparecer assim que for salva."}</small></span>
                </label>
              </> : null}
              {erroEtapa ? <p className={styles.erroEtapa} role="alert">{erroEtapa}</p> : null}
            </div>
            <footer>
              {produtoId ? <button className={styles.excluirProduto} type="button" disabled={salvando} onClick={() => void excluirProduto()}><Trash2 />{confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}</button> : <span />}
              <div className={styles.acoesEtapa}>
                {etapaProduto > 0 ? <button className={styles.voltarEtapa} type="button" disabled={salvando} onClick={() => { setEtapaProduto((etapa) => etapa - 1); setErroEtapa(""); }}>Voltar</button> : null}
                {etapaProduto < etapasProduto.length - 1
                  ? <button className={styles.salvarProduto} type="button" onClick={avancarEtapa}>Próximo</button>
                  : <button className={styles.salvarProduto} type="button" disabled={salvando} onClick={() => void salvarProduto()}>{salvando ? "Salvando..." : "Salvar campanha"}</button>}
              </div>
            </footer>
          </section>
        </div>
      ) : null}

    </AdminLayout>
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
