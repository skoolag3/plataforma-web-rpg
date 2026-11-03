"use client";

import { ArrowUpRight, ChevronDown, Gem, Info, Layers3, Pencil, Plus, Scissors, Shuffle, Swords, Trash2, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { CaminhoCampanha, SecaoCampanha } from "../../lib/admin";
import styles from "../../styles/admin/adminCampanhaSecoes.module.css";
import { adicionarGrupo as adicionarGrupoEstado, grupoDaEtapa, incluirEtapaNoGrupo, novoCaminho, removerEtapa, separarUltimaEtapa as separarEtapaEstado } from "./adminCampanhaSecoes.estado";

export { secoesIniciais } from "./adminCampanhaSecoes.estado";

type Props = {
  secoes: SecaoCampanha[];
  percentualMantidoPadrao: number;
  cartas: { id: string; nome: string }[];
  alterar: (secoes: SecaoCampanha[]) => void;
};

const dificuldades = ["FACIL", "MEDIA", "DIFICIL"] as const;
const rotulos = { FACIL: "Fácil", MEDIA: "Média", DIFICIL: "Difícil" };
const ganhosIniciais = { FACIL: 20, MEDIA: 35, DIFICIL: 50 };

export function AdminCampanhaSecoes({ secoes, percentualMantidoPadrao, cartas, alterar }: Props) {
  const [grupoAberto, setGrupoAberto] = useState<number | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const batalhas = secoes.flatMap((secao, indice) => secao.tipo === "BATALHA"
    ? [{ indice, secao, grupo: grupoDaEtapa(secao, indice)! }]
    : []);
  const grupos = [...new Set(batalhas.map((etapa) => etapa.grupo))].map((id) => ({
    id, etapas: batalhas.filter((etapa) => etapa.grupo === id),
  }));
  const grupoAtual = grupos.find((grupo) => grupo.id === grupoAberto);
  const caminhosPendentes = grupoAtual?.etapas.flatMap(({ secao }) => secao.tipo === "BATALHA"
    ? secao.caminhos.filter((caminho) => {
      if ((caminho.modoCartas ?? (caminho.cartas.length ? "MANUAL" : "ALEATORIO")) !== "MANUAL") return false;
      const quantidade = caminho.quantidadeCartas ?? 3;
      return caminho.mixed ? caminho.cartas.length < quantidade : caminho.cartas.length !== quantidade;
    }) : []) ?? [];

  useEffect(() => {
    if (grupoAberto === null) return;
    modalRef.current?.querySelector<HTMLButtonElement>("[data-fechar-modal]")?.focus();
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") setGrupoAberto(null);
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [grupoAberto]);

  function fecharModal() {
    const id = grupoAberto;
    setGrupoAberto(null);
    requestAnimationFrame(() => document.querySelector<HTMLButtonElement>(`[data-grupo="${id}"]`)?.focus());
  }

  function alterarEtapa(indice: number, caminhos: CaminhoCampanha[]) {
    alterar(secoes.map((secao, atual) => atual === indice && secao.tipo === "BATALHA"
      ? { ...secao, caminhos } : secao));
  }

  function alterarPerdaGrupo(grupo: number, percentualPerdido: number) {
    const percentualMantidoDerrota = 100 - Math.min(100, Math.max(0, percentualPerdido));
    alterar(secoes.map((secao, indice) => grupoDaEtapa(secao, indice) === grupo && secao.tipo === "BATALHA"
      ? { ...secao, percentualMantidoDerrota } : secao));
  }

  function expandirGrupo(id: number) {
    const proximas = incluirEtapaNoGrupo(secoes, id);
    if (proximas !== secoes) alterar(proximas);
    setGrupoAberto(id);
  }

  function separarUltimaEtapa(id: number) {
    const proximas = separarEtapaEstado(secoes, id);
    if (proximas !== secoes) alterar(proximas);
  }

  function adicionarGrupo() {
    const resultado = adicionarGrupoEstado(secoes);
    if (!resultado) return;
    alterar(resultado.secoes);
    setGrupoAberto(resultado.grupo);
  }

  return <div className={styles.secoes}>
    <div className={styles.intro}>
      <h3>Seções da jornada</h3>
      <p>Abra um bloco para configurar suas etapas. Você pode ampliá-lo; o boss permanece no final.</p>
    </div>

    {grupos.map((grupo) => {
      const primeira = grupo.etapas[0].indice + 1;
      const ultima = grupo.etapas.at(-1)!.indice + 1;
      const rotulo = primeira === ultima ? `Contendo etapa ${primeira}` : `Contendo etapas ${primeira}–${ultima}`;
      return <section key={grupo.id} className={styles.bloco}>
        <button type="button" className={styles.botaoBloco} data-grupo={grupo.id} onClick={() => setGrupoAberto(grupo.id)}>
          <span><small>Seção {grupos.indexOf(grupo) + 1}</small><strong>{rotulo}</strong><em>{grupo.etapas.length} {grupo.etapas.length === 1 ? "etapa de batalha" : "etapas de batalha"} · perde {100 - (grupo.etapas[0].secao.percentualMantidoDerrota ?? percentualMantidoPadrao)}% se perder</em></span>
          <ArrowUpRight aria-hidden="true" />
        </button>
      </section>;
    })}

    {secoes.length < 8 ? <button type="button" className={styles.adicionarSecao} onClick={adicionarGrupo}><Plus aria-hidden="true" /> Criar outra seção de batalha</button> : null}
    <div className={styles.bossFinal}><span>Etapa {secoes.length}</span><strong>Boss final</strong><small>Diálogo e cartas configurados na etapa Boss.</small></div>
    {grupoAtual ? createPortal(<div className={styles.modalBackdrop} onMouseDown={(evento) => { if (evento.target === evento.currentTarget) fecharModal(); }}>
      <div className={styles.modalSecao} role="dialog" aria-modal="true" aria-labelledby="titulo-modal-secao" ref={modalRef} onKeyDown={(evento) => {
        if (evento.key !== "Tab") return;
        const elementos = modalRef.current?.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select:not([disabled]), summary');
        if (!elementos?.length) return;
        const primeiro = elementos[0];
        const ultimo = elementos[elementos.length - 1];
        if (evento.shiftKey && document.activeElement === primeiro) { evento.preventDefault(); ultimo.focus(); }
        else if (!evento.shiftKey && document.activeElement === ultimo) { evento.preventDefault(); primeiro.focus(); }
      }}>
        <header className={styles.modalTopo}>
          <div><small>Configurar seção</small><h3 id="titulo-modal-secao">{grupoAtual.etapas.length === 1 ? `Etapa ${grupoAtual.etapas[0].indice + 1}` : `Etapas ${grupoAtual.etapas[0].indice + 1}–${grupoAtual.etapas.at(-1)!.indice + 1}`}</h3><p>Defina as batalhas de cada escolha. A posição das escolhas muda a cada expedição.</p></div>
          <button type="button" data-fechar-modal aria-label="Fechar seção" onClick={fecharModal}><X aria-hidden="true" /></button>
        </header>
        <div className={styles.modalConteudo}>
          <label className={styles.perdaSecao}>Perda ao ser derrotado nesta seção (%)
            <input type="number" min="0" max="100" value={100 - (grupoAtual.etapas[0].secao.percentualMantidoDerrota ?? percentualMantidoPadrao)} onChange={(evento) => alterarPerdaGrupo(grupoAtual.id, Number(evento.target.value))} />
            <small>Vale para todas as etapas deste bloco. Recompensas de vitórias anteriores permanecem asseguradas.</small>
          </label>
          <div className={styles.acoesBloco}>
            {secoes.length < 8 || grupoAtual.etapas.at(-1)!.indice + 1 < batalhas.length ? <button type="button" className={styles.adicionar} onClick={() => expandirGrupo(grupoAtual.id)}><Plus aria-hidden="true" /> Incluir etapa {grupoAtual.etapas.at(-1)!.indice + 2} neste bloco</button> : null}
            {grupoAtual.etapas.length > 1 ? <button type="button" className={styles.acaoSecundaria} onClick={() => separarUltimaEtapa(grupoAtual.id)}><Scissors aria-hidden="true" /> Separar etapa {grupoAtual.etapas.at(-1)!.indice + 1}</button> : null}
          </div>
          {grupoAtual.etapas.map(({ indice, secao }) => secao.tipo === "BATALHA" ? <EtapaBatalha key={indice}
            indice={indice} caminhos={secao.caminhos} cartas={cartas} totalEtapas={secoes.length}
            alterarCaminhos={(caminhos) => alterarEtapa(indice, caminhos)}
            remover={() => alterar(removerEtapa(secoes, indice))}
          /> : null)}
        </div>
        <footer className={styles.modalRodape}><span className={caminhosPendentes.length ? styles.avisoRodape : ""}>{caminhosPendentes.length ? `Complete a seleção manual de ${caminhosPendentes.length} ${caminhosPendentes.length === 1 ? "caminho" : "caminhos"}.` : "As alterações serão salvas junto com a campanha."}</span><button type="button" onClick={fecharModal} disabled={caminhosPendentes.length > 0}>Concluir seção</button></footer>
      </div>
    </div>, document.body) : null}
  </div>;
}

function EtapaBatalha({ indice, caminhos, cartas, totalEtapas, alterarCaminhos, remover }: {
  indice: number;
  caminhos: CaminhoCampanha[];
  cartas: { id: string; nome: string }[];
  totalEtapas: number;
  alterarCaminhos: (caminhos: CaminhoCampanha[]) => void;
  remover: () => void;
}) {
  function alterarCaminho(indiceCaminho: number, caminho: CaminhoCampanha) {
    alterarCaminhos(caminhos.map((atual, posicao) => posicao === indiceCaminho ? caminho : atual));
  }

  return <section className={styles.secao}>
    <header className={styles.cabecalhoEtapa}>
      <div className={styles.tituloEtapa}><span className={styles.numeroEtapa}>{indice + 1}</span><div><span>Etapa {indice + 1}</span><h4>Escolhas de batalha</h4><p>O jogador escolhe uma opção para enfrentar. A ordem aparece embaralhada no mapa.</p></div></div>
      {totalEtapas > 2 ? <button type="button" className={styles.remover} onClick={remover} aria-label={`Remover etapa ${indice + 1}`} title="Remover etapa"><Trash2 aria-hidden="true" /></button> : null}
    </header>
    <div className={styles.controlesEtapa}>
      <div className={styles.quantidade}><Layers3 aria-hidden="true" /><span>Escolhas nesta etapa</span><div className={styles.opcoesQuantidade} role="group" aria-label="Quantidade de escolhas nesta etapa">
        {[1, 2, 3].map((quantidade) => <button type="button" key={quantidade} aria-pressed={caminhos.length === quantidade} onClick={() => alterarCaminhos(Array.from({ length: quantidade }, (_, atual) => caminhos[atual] ?? novoCaminho(dificuldades[atual % dificuldades.length])))}>{quantidade}</button>)}
      </div></div>
      <span className={styles.ordemAleatoria}><Shuffle aria-hidden="true" /> Posições sorteadas em cada expedição</span>
    </div>
    <div className={styles.caminhos}>
      {caminhos.map((caminho, indiceCaminho) => {
        const modoCartas = caminho.modoCartas ?? (caminho.cartas.length ? "MANUAL" : "ALEATORIO");
        const quantidadeCartas = caminho.quantidadeCartas ?? 3;
        const selecaoIncompleta = modoCartas === "MANUAL" && (caminho.mixed ? caminho.cartas.length < quantidadeCartas : caminho.cartas.length !== quantidadeCartas);
        return <article key={indiceCaminho} className={`${styles.caminho} ${styles[`dificuldade${caminho.dificuldade}`]}`}>
          <div className={styles.caminhoTopo}><div><span className={styles.numeroEscolha}>Escolha {indiceCaminho + 1}</span><strong>{rotulos[caminho.dificuldade]}</strong></div>{caminhos.length > 1 ? <button type="button" className={styles.remover} onClick={() => alterarCaminhos(caminhos.filter((_, atual) => atual !== indiceCaminho))} aria-label={`Remover escolha ${indiceCaminho + 1}`} title="Remover escolha"><Trash2 aria-hidden="true" /></button> : null}</div>
          <div className={styles.resumoCaminho}><span><Swords aria-hidden="true" /> {quantidadeCartas} {quantidadeCartas === 1 ? "carta inimiga" : "cartas inimigas"}</span><span><Gem aria-hidden="true" /> {caminho.recompensa} Rubys</span></div>
          <div className={styles.campoPrincipal}>
            <label>Dificuldade da batalha<select value={caminho.dificuldade} onChange={(evento) => {
              const dificuldade = evento.target.value as CaminhoCampanha["dificuldade"];
              alterarCaminho(indiceCaminho, { ...caminho, dificuldade, recompensa: caminho.recompensa === ganhosIniciais[caminho.dificuldade] ? ganhosIniciais[dificuldade] : caminho.recompensa });
            }}>{dificuldades.map((dificuldade) => <option key={dificuldade} value={dificuldade}>{rotulos[dificuldade]}</option>)}</select></label>
            <label>Recompensa ao vencer<input type="number" min="0" max="10000" value={caminho.recompensa} onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, recompensa: Number(evento.target.value) })} /><small>Em Rubys. Ajuste conforme o risco desta escolha.</small></label>
          </div>
          <div className={styles.divisorCaminho} />
          <div className={styles.tituloConfiguracao}><Swords aria-hidden="true" /><div><strong>Adversário</strong><small>Defina quantas cartas entram na batalha e de onde vêm.</small></div></div>
          <label>Cartas na equipe inimiga<select value={quantidadeCartas} onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, quantidadeCartas: Number(evento.target.value) })}>{[1, 2, 3, 4, 5, 6].map((quantidade) => <option key={quantidade} value={quantidade}>{quantidade} {quantidade === 1 ? "carta" : "cartas"}</option>)}</select></label>
          <label>Como escolher as cartas?<select value={modoCartas} onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, modoCartas: evento.target.value as CaminhoCampanha["modoCartas"], cartas: evento.target.value === "ALEATORIO" ? [] : caminho.cartas })}><option value="ALEATORIO">Sorteio entre todas as cartas</option><option value="MANUAL">Eu escolho as cartas</option></select></label>
          {modoCartas === "MANUAL" ? <div className={styles.configuracaoCartas}>
            <label className={styles.opcaoMixed}><input type="checkbox" checked={caminho.mixed ?? false} onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, mixed: evento.target.checked })} /><span><strong>Sortear do meu conjunto (mixed)</strong><small>Ative para selecionar várias cartas possíveis e sortear {quantidadeCartas} a cada batalha.</small></span></label>
            <p className={selecaoIncompleta ? styles.avisoSelecao : styles.selecaoCompleta}>{selecaoIncompleta ? <Info aria-hidden="true" /> : null}{caminho.mixed ? `Selecione pelo menos ${quantidadeCartas} cartas. ${caminho.cartas.length} selecionadas.` : `Selecione exatamente ${quantidadeCartas} cartas. ${caminho.cartas.length} selecionadas.`}</p>
            <ListaCartas cartas={cartas} selecionadas={caminho.cartas} alterar={(selecionadas) => alterarCaminho(indiceCaminho, { ...caminho, cartas: selecionadas })} />
          </div> : <p className={styles.ajudaCartas}><Shuffle aria-hidden="true" /> O jogo sorteia {quantidadeCartas} {quantidadeCartas === 1 ? "carta ativa" : "cartas ativas"} para este adversário.</p>}
          <details className={styles.textoOpcional}><summary><Pencil aria-hidden="true" /><span>Nome e descrição exibidos ao jogador <small>Opcional · o jogo gera automaticamente se deixar vazio</small></span><ChevronDown aria-hidden="true" /></summary><div><label>Nome da escolha<input type="text" maxLength={80} value={caminho.titulo ?? ""} placeholder="Ex.: Ponte do Luar" onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, titulo: evento.target.value })} /></label><label>Descrição da escolha<input type="text" maxLength={240} value={caminho.descricao ?? ""} placeholder="Ex.: Guardas bloqueiam a passagem." onChange={(evento) => alterarCaminho(indiceCaminho, { ...caminho, descricao: evento.target.value })} /></label></div></details>
        </article>;
      })}
    </div>
  </section>;
}

function ListaCartas({ cartas, selecionadas, alterar }: {
  cartas: { id: string; nome: string }[];
  selecionadas: string[];
  alterar: (selecionadas: string[]) => void;
}) {
  const [busca, setBusca] = useState("");
  const cartasFiltradas = cartas.filter((carta) => carta.nome.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  cartasFiltradas.sort((primeira, segunda) => Number(selecionadas.includes(segunda.id)) - Number(selecionadas.includes(primeira.id)));

  return <div className={styles.seletorCartas}>
    <input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar carta pelo nome" aria-label="Buscar carta adversária" />
    <div className={styles.listaCartas}>
      {cartasFiltradas.length ? cartasFiltradas.map((carta) => <label key={carta.id}><input type="checkbox" checked={selecionadas.includes(carta.id)} onChange={(evento) => alterar(evento.target.checked ? [...selecionadas, carta.id] : selecionadas.filter((id) => id !== carta.id))} />{carta.nome}</label>) : <span className={styles.semCartas}>{cartas.length ? "Nenhuma carta encontrada." : "Cadastre cartas ativas para usar o modo manual."}</span>}
    </div>
  </div>;
}
