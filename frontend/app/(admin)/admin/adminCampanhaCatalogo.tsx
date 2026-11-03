"use client";

import { ArrowLeft, ArrowUpRight, Flame, Layers3, Plus, Sparkles, X } from "lucide-react";
import { useState, type FormEvent } from "react";
import type { AdminProdutoExpedicao } from "../../lib/admin";
import styles from "../../styles/admin/adminCampanhaCatalogo.module.css";

type Props = {
  temas: { nome: string }[];
  produtos: AdminProdutoExpedicao[];
  temaSelecionado: string | null;
  selecionarTema: (tema: string | null) => void;
  criarTema: (nome: string) => Promise<void>;
  novaCampanha: (tema: string) => void;
  editarCampanha: (produto: AdminProdutoExpedicao) => void;
};

export function situacaoCampanha(produto: AdminProdutoExpedicao, agora = Date.now()) {
  if (!produto.ativo) return "pausada";
  if (produto.inicioEm && new Date(produto.inicioEm).getTime() > agora) return "agendada";
  if (produto.fimEm && new Date(produto.fimEm).getTime() < agora) return "encerrada";
  return "disponivel";
}

const rotulosSituacao = {
  disponivel: "Disponível agora",
  agendada: "Agendada",
  encerrada: "Fora do período",
  pausada: "Pausada",
};

export function AdminCampanhaCatalogo({
  temas, produtos, temaSelecionado, selecionarTema, criarTema, novaCampanha, editarCampanha,
}: Props) {
  const [mostrarNovoTema, setMostrarNovoTema] = useState(false);
  const [nomeNovoTema, setNomeNovoTema] = useState("");
  const [erroNovoTema, setErroNovoTema] = useState("");
  const [salvandoTema, setSalvandoTema] = useState(false);
  const temaAtual = temaSelecionado && temas.some((tema) => tema.nome === temaSelecionado)
    ? temaSelecionado : null;
  const campanhasDoTema = produtos.filter((produto) => produto.tema.trim().toUpperCase() === temaAtual);

  async function handleCriarTema(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    if (!nomeNovoTema.trim()) {
      setErroNovoTema("Informe o nome do tema.");
      return;
    }
    setSalvandoTema(true);
    setErroNovoTema("");
    try {
      await criarTema(nomeNovoTema);
      setMostrarNovoTema(false);
      setNomeNovoTema("");
    } catch (erro) {
      setErroNovoTema(erro instanceof Error ? erro.message : "Não foi possível criar o tema.");
    } finally {
      setSalvandoTema(false);
    }
  }

  return (
    <>
      {temaAtual ? <section className={styles.catalogo} aria-labelledby="titulo-catalogo">
        <header className={styles.cabecalhoCatalogo}>
          <div>
            <button type="button" className={styles.voltarTemas} onClick={() => selecionarTema(null)}><ArrowLeft aria-hidden="true" /> Voltar aos temas</button>
            <span className={styles.sobretitulo}>Tema · {formatarTema(temaAtual)}</span>
            <h2 id="titulo-catalogo">Campanhas de {formatarTema(temaAtual)}</h2>
            <p>Escolha uma campanha para editar ou crie outra jornada dentro deste tema.</p>
          </div>
          <button type="button" className={styles.novaCampanha} onClick={() => novaCampanha(temaAtual)}>
            <Plus aria-hidden="true" /> Nova campanha
          </button>
        </header>
        {campanhasDoTema.length ? <div className={styles.listaCampanhas}>
          <div className={styles.listaCampanhasTopo}>
            <h3>Campanhas neste tema <span>{campanhasDoTema.length}</span></h3>
            <p>Selecione uma campanha para configurar a jornada.</p>
          </div>
          <div className={styles.campanhasGrid}>
            {campanhasDoTema.map((produto) => <CampanhaCard key={produto.id} produto={produto} editarCampanha={editarCampanha} />)}
          </div>
        </div> : <div className={styles.catalogoVazio}>
          <Sparkles aria-hidden="true" />
          <h3>Nenhuma campanha neste tema ainda</h3>
          <p>Crie o primeiro cenário para {formatarTema(temaAtual)}. Você pode adicionar outras campanhas depois.</p>
          <button type="button" className={styles.novaCampanha} onClick={() => novaCampanha(temaAtual)}><Plus aria-hidden="true" /> Criar campanha</button>
        </div>}
      </section> : <>
        <section className={styles.catalogo} aria-labelledby="titulo-catalogo">
          <header className={styles.cabecalhoCatalogo}>
            <div>
              <span className={styles.sobretitulo}>Expedições</span>
              <h2 id="titulo-catalogo">Campanhas por tema</h2>
              <p>Abra um tema para editar uma campanha ou criar outra. As campanhas disponíveis entram no sorteio dos jogadores.</p>
            </div>
            <button type="button" className={styles.novaCampanha} onClick={() => { setMostrarNovoTema(true); setErroNovoTema(""); }}>
              <Plus aria-hidden="true" /> Novo tema
            </button>
          </header>

          {temas.length ? <div className={styles.temasCatalogo} role="group" aria-label="Temas do catálogo">
              {temas.map(({ nome }) => {
                const campanhas = produtos.filter((produto) => produto.tema.trim().toUpperCase() === nome);
                const ativas = campanhas.filter((produto) => situacaoCampanha(produto) === "disponivel").length;
                return (
                  <button key={nome} type="button" className={styles.cardTema} onClick={() => selecionarTema(nome)}>
                    <span className={styles.iconeTema} aria-hidden="true">{nome === "FOGO" ? <Flame /> : <Layers3 />}</span>
                    <strong>{formatarTema(nome)}</strong>
                    <small>{campanhas.length} {campanhas.length === 1 ? "campanha" : "campanhas"}</small>
                    <span className={styles.temaCampanhas}>{campanhas.length ? campanhas.slice(0, 3).map((produto) => <span key={produto.id}>{produto.nome} <em>{rotulosSituacao[situacaoCampanha(produto)]}</em></span>) : <span>Nenhuma campanha criada</span>}{campanhas.length > 3 ? <span>+ {campanhas.length - 3} outras</span> : null}</span>
                    <span className={styles.temaRodape}>{ativas} {ativas === 1 ? "campanha no sorteio" : "campanhas no sorteio"}<ArrowUpRight aria-hidden="true" /></span>
                  </button>
                );
              })}
            </div> : <div className={styles.catalogoVazio}>
            <Sparkles aria-hidden="true" />
            <h3>Nenhum tema cadastrado</h3>
            <p>Crie um tema para começar a organizar suas campanhas.</p>
            <button type="button" className={styles.novaCampanha} onClick={() => setMostrarNovoTema(true)}><Plus aria-hidden="true" /> Criar tema</button>
          </div>}
        </section>

      </>}

      {mostrarNovoTema ? <div className={styles.modalTemaBackdrop} role="presentation">
        <form className={styles.modalTema} role="dialog" aria-modal="true" aria-labelledby="titulo-novo-tema" onSubmit={(evento) => void handleCriarTema(evento)}>
          <header><div><h2 id="titulo-novo-tema">Novo tema</h2><p>Depois de criar o tema, abra-o para adicionar campanhas.</p></div><button type="button" aria-label="Fechar" disabled={salvandoTema} onClick={() => setMostrarNovoTema(false)}><X aria-hidden="true" /></button></header>
          <label>Nome do tema<input maxLength={40} value={nomeNovoTema} placeholder="Ex.: Fogo, Água, Gelo, Evento" onChange={(evento) => setNomeNovoTema(evento.target.value)} /></label>
          {erroNovoTema ? <p className={styles.erroTema} role="alert">{erroNovoTema}</p> : null}
          <footer><button type="button" className={styles.cancelarTema} disabled={salvandoTema} onClick={() => setMostrarNovoTema(false)}>Cancelar</button><button type="submit" className={styles.novaCampanha} disabled={salvandoTema}>{salvandoTema ? "Criando..." : "Criar tema"}</button></footer>
        </form>
      </div> : null}
    </>
  );
}

function CampanhaCard({ produto, editarCampanha }: {
  produto: AdminProdutoExpedicao;
  editarCampanha: (produto: AdminProdutoExpedicao) => void;
}) {
  const situacao = situacaoCampanha(produto);
  return (
    <article className={styles.campanhaCard}>
      <div className={styles.campanhaPrincipal}>
        <div className={styles.campanhaCardTopo}>
          <span className={styles.situacaoCampanha} data-situacao={situacao}>{rotulosSituacao[situacao]}</span>
          <span>{produto.tipo === "EVENTO" ? "Evento" : "Recorrente"}</span>
        </div>
        <h4>{produto.nome}</h4>
        <p>{produto.descricao}</p>
      </div>
      <div className={styles.campanhaDados}>
        <span><small>Boss</small><strong>{produto.bossNome}</strong></span>
        <span><small>Chefe final</small><strong>{produto.recompensaChefe} Rubys</strong></span>
      </div>
      <button type="button" className={styles.editarCampanha} onClick={() => editarCampanha(produto)}>
        Ver e editar campanha <ArrowUpRight aria-hidden="true" />
      </button>
    </article>
  );
}

function formatarTema(tema: string) {
  const texto = tema.trim().toLocaleLowerCase("pt-BR");
  return texto.charAt(0).toLocaleUpperCase("pt-BR") + texto.slice(1);
}
