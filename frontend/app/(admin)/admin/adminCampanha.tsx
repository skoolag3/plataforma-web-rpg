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
import { SwitchToggle } from "../../../components/ui/switch";
import { AdminCampanhaCatalogo } from "./adminCampanhaCatalogo";
import { AdminCampanhaSecoes, secoesIniciais } from "./adminCampanhaSecoes";
import { AdminLayout } from "./adminShared";

const produtoInicial: SalvarProdutoExpedicaoPayload = {
  nome: "", descricao: "", tema: "", tipo: "RECORRENTE", ativo: true, peso: 100,
  inicioEm: null, fimEm: null, recompensaFacil: 20, recompensaMedia: 35,
  recompensaDificil: 50, recompensaChefe: 100, percentualMantidoDerrota: 70,
  bossNome: "Guardião da Expedição",
  bossPersonalidade: "Orgulhoso, estratégico e provocador, mas respeita a coragem.",
  bossProvocacao: "Você atravessou minha trilha. Agora prove que merece sair dela.",
  bossPerguntas: ["Por que você merece atravessar meu domínio?", "O que faria se sua carta mais forte caísse agora?", "Qual sacrifício aceitaria para vencer esta batalha?", "O que distingue coragem de imprudência?"],
  bossCartas: [],
  secoes: secoesIniciais(),
};

const etapasProduto = ["Campanha", "Seções", "Recompensas", "Disponibilidade", "Boss"] as const;

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
      secoes: item.secoes.map((secao, indice) => secao.tipo === "BATALHA"
        ? { ...secao, caminhos: secao.caminhos.slice(0, 3), grupo: secao.grupo ?? (indice < 2 ? 1 : indice) }
        : secao),
    } : {
      ...produtoInicial,
      tema: tema ?? temaSelecionado ?? painel?.produtos[0]?.tema ?? produtoInicial.tema,
      bossPerguntas: [...produtoInicial.bossPerguntas],
      secoes: secoesIniciais(),
    });
    setConfirmandoExclusao(false);
  }

  function avancarEtapa() {
    if (!produto) return;
    if (etapaProduto === 0 && (!produto.nome.trim() || !produto.descricao.trim() || !produto.tema.trim())) {
      setErroEtapa("Preencha nome, descrição e tema para continuar.");
      return;
    }
    if (etapaProduto === 3 && produto.inicioEm && produto.fimEm && new Date(produto.inicioEm) >= new Date(produto.fimEm)) {
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
      subtitle="Primeiro escolha um tema. Depois configure a campanha que poderá aparecer nas expedições."
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
                <p>{produtoId ? `Tema ${produto.tema} · alterações só entram em vigor ao salvar` : `Tema ${produto.tema} · avance pelas etapas para criar`}</p>
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
                  <div><h3>Identifique esta jornada</h3><p>O nome e a descrição ajudam a distinguir campanhas dentro do mesmo tema.</p></div>
                </div>
                <div className={styles.selecaoTema}>
                  <strong>Tema selecionado: {produto.tema}</strong>
                  <small>Para usar outro tema, feche esta janela e escolha-o no catálogo.</small>
                </div>
                <div className={styles.formProduto}>
                  <label>Nome da campanha<input maxLength={100} value={produto.nome} placeholder="Ex.: Expedição Arcana" onChange={(e) => setProduto({...produto, nome: e.target.value})} /><small>Nome exibido para identificar esta jornada.</small></label>
                  <label>Descrição da jornada<input maxLength={300} value={produto.descricao} placeholder="Ex.: Atravesse ruínas arcanas até o guardião final" onChange={(e) => setProduto({...produto, descricao: e.target.value})} /><small>Resuma o cenário e o objetivo da expedição.</small></label>
                  <label>Tipo de campanha<select value={produto.tipo} onChange={(e) => setProduto({...produto, tipo: e.target.value as "RECORRENTE" | "EVENTO"})}><option value="RECORRENTE">Recorrente</option><option value="EVENTO">Evento</option></select><small>{produto.tipo === "EVENTO" ? "Você poderá definir um período na etapa Disponibilidade." : "Pode ficar disponível continuamente ou por um período."}</small></label>
                </div>
              </> : null}

              {etapaProduto === 1 ? <AdminCampanhaSecoes secoes={produto.secoes} percentualMantidoPadrao={produto.percentualMantidoDerrota} cartas={painel?.cartas ?? []} alterar={(secoes) => setProduto({ ...produto, secoes })} /> : null}

              {etapaProduto === 2 ? <>
                <div className={styles.introEtapa}>
                  <span><Map aria-hidden="true" /></span>
                  <div><h3>Recompensa final</h3><p>Os ganhos e as perdas das batalhas são definidos em cada seção. Configure aqui o chefe final.</p></div>
                </div>
                <div className={styles.formProduto}>
                  <CampoProduto rotulo="Chefe final (Rubys)" valor={produto.recompensaChefe} alterar={(recompensaChefe) => setProduto({...produto, recompensaChefe})} />
                  <label>Perda ao ser derrotado pelo chefe (%)<input type="number" min="0" max="100" value={100 - (produto.secoes.at(-1)?.percentualMantidoDerrota ?? produto.percentualMantidoDerrota)} onChange={(evento) => setProduto({...produto, secoes: produto.secoes.map((secao) => secao.tipo === "BOSS" ? { ...secao, percentualMantidoDerrota: 100 - Math.min(100, Math.max(0, Number(evento.target.value))) } : secao)})} /></label>
                </div>
                <p className={styles.ajudaEtapa}>A porcentagem afeta apenas a recompensa prevista para a batalha perdida. Vitórias anteriores já estão asseguradas.</p>
              </> : null}

              {etapaProduto === 3 ? <>
                <div className={styles.introEtapa}>
                  <span><Map aria-hidden="true" /></span>
                  <div><h3>Quando esta campanha aparece?</h3><p>Escolha o período e a frequência no sorteio de novas expedições.</p></div>
                </div>
                <div className={styles.publicarCampanha}>
                  <SwitchToggle checked={produto.ativo} onChange={(ativo) => setProduto({...produto, ativo})} aria-label="Disponibilizar no sorteio" />
                  <span><strong>Incluir no sorteio de expedições</strong><small>{produto.ativo ? (produto.inicioEm || produto.fimEm ? "Disponível somente no período definido." : "Disponível assim que você salvar.") : "Desativada: jogadores não receberão esta campanha."}</small></span>
                </div>
                <div className={styles.periodoEvento}>
                  <strong>Período de disponibilidade</strong>
                  <p>Deixe as datas vazias para disponibilizar sem limite de tempo. Você também pode preencher só o início ou só o fim.</p>
                  <div className={styles.formProduto}>
                    <label>Começa em<input type="datetime-local" value={paraInputData(produto.inicioEm)} onChange={(e) => setProduto({...produto, inicioEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
                    <label>Termina em<input type="datetime-local" value={paraInputData(produto.fimEm)} onChange={(e) => setProduto({...produto, fimEm: e.target.value ? new Date(e.target.value).toISOString() : null})} /></label>
                  </div>
                </div>
                <details className={styles.opcaoAvancada}>
                  <summary>Ajustar frequência no sorteio (opcional)</summary>
                  <div className={styles.pesoSorteio}>
                    <CampoProduto rotulo="Peso no sorteio" valor={produto.peso} alterar={(peso) => setProduto({...produto, peso})} />
                    <p>Com o mesmo peso das outras campanhas, todas têm chances iguais. Aumente este número se quiser que esta apareça mais vezes.</p>
                  </div>
                </details>
              </> : null}

              {etapaProduto === 4 ? <>
                <div className={styles.introEtapa}>
                  <span><Swords aria-hidden="true" /></span>
                  <div><h3>Prepare o boss final</h3><p>Escreva a fala do boss e as quatro perguntas que o jogador responderá.</p></div>
                </div>
                <div className={styles.formProduto}>
                  <label className={styles.campoLargo}>Nome do boss<input maxLength={100} value={produto.bossNome} onChange={(e) => setProduto({...produto, bossNome: e.target.value})} /><small>Aparece no confronto final.</small></label>
                  <label className={styles.campoLargo}>Personalidade do boss<textarea maxLength={600} value={produto.bossPersonalidade} onChange={(e) => setProduto({...produto, bossPersonalidade: e.target.value})} /><small>Orientação para o diálogo antes da batalha.</small></label>
                  <label className={styles.campoLargo}>Provocação inicial<textarea maxLength={500} value={produto.bossProvocacao} onChange={(e) => setProduto({...produto, bossProvocacao: e.target.value})} /><small>Primeira fala exibida ao jogador.</small></label>
                  {produto.bossPerguntas.map((pergunta, indice) => (
                    <label key={indice}>Pergunta {indice + 1}<input maxLength={250} value={pergunta} onChange={(e) => {
                      const bossPerguntas = [...produto.bossPerguntas];
                      bossPerguntas[indice] = e.target.value;
                      setProduto({...produto, bossPerguntas});
                    }} /></label>
                  ))}
                </div>
              </> : null}
              {erroEtapa ? <p className={styles.erroEtapa} role="alert">{erroEtapa}</p> : null}
            </div>
            <footer>
              {produtoId ? <button className={styles.excluirProduto} type="button" disabled={salvando} onClick={() => void excluirProduto()}><Trash2 />{confirmandoExclusao ? "Confirmar exclusão" : "Excluir"}</button> : <span />}
              <div className={styles.acoesEtapa}>
                {etapaProduto > 0 ? <button className={styles.voltarEtapa} type="button" disabled={salvando} onClick={() => { setEtapaProduto((etapa) => etapa - 1); setErroEtapa(""); }}>Voltar</button> : null}
                {etapaProduto < etapasProduto.length - 1
                  ? <button className={styles.salvarProduto} type="button" onClick={avancarEtapa}>Próximo: {etapasProduto[etapaProduto + 1]}</button>
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
