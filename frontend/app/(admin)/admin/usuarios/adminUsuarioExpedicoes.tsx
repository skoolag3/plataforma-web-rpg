"use client";

import { ChevronDown, ChevronLeft, ChevronRight, Gem, Map as MapIcon, ScrollText, Swords, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { usePortalPronto } from "../../../hooks/usePortalPronto";
import {
  obterExpedicoesAdminUsuario, obterLogLutaAdminUsuario,
  type AdminUsuarioExpedicoesPagina, type AdminUsuarioLogLuta,
} from "../../../lib/admin";
import styles from "../../../styles/admin/adminUsuarioExpedicoes.module.css";

function nomeStatus(valor: string) {
  return ({ EM_ANDAMENTO: "Em andamento", CONCLUIDA: "Concluída", FALHOU: "Derrota", ABANDONADA: "Abandonada", VITORIA: "Vitória", DERROTA: "Derrota" } as Record<string, string>)[valor] ?? valor;
}

function dataHora(valor: string | null) {
  return valor ? new Date(valor).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" }) : "Sem data";
}

export function AdminUsuarioExpedicoes({ id }: { id: string }) {
  const [pagina, setPagina] = useState(1);
  const [dados, setDados] = useState<AdminUsuarioExpedicoesPagina | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [expedicaoAberta, setExpedicaoAberta] = useState<string | null>(null);
  const [lutaAberta, setLutaAberta] = useState<string | null>(null);
  const [log, setLog] = useState<AdminUsuarioLogLuta | null>(null);
  const [carregandoLog, setCarregandoLog] = useState(false);
  const [erroLog, setErroLog] = useState<string | null>(null);
  const portalPronto = usePortalPronto();

  useEffect(() => {
    if (!lutaAberta) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      event.stopImmediatePropagation();
      setLutaAberta(null);
    }
    window.addEventListener("keydown", fecharComEscape, true);
    return () => {
      document.body.style.overflow = overflowAnterior;
      window.removeEventListener("keydown", fecharComEscape, true);
    };
  }, [lutaAberta]);

  useEffect(() => {
    let ativo = true;
    void obterExpedicoesAdminUsuario(id, pagina)
      .then((resultado) => { if (ativo) setDados(resultado); })
      .catch((error) => { if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar as expedições."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [id, pagina]);

  useEffect(() => {
    if (!expedicaoAberta || !lutaAberta) return;
    let ativo = true;
    void obterLogLutaAdminUsuario(id, expedicaoAberta, lutaAberta)
      .then((resultado) => { if (ativo) setLog(resultado); })
      .catch((error) => { if (ativo) setErroLog(error instanceof Error ? error.message : "Não foi possível carregar o chatlog."); })
      .finally(() => { if (ativo) setCarregandoLog(false); });
    return () => { ativo = false; };
  }, [id, expedicaoAberta, lutaAberta]);

  const turnos = useMemo(() => {
    const grupos = new Map<number, NonNullable<typeof log>["eventos"]>();
    for (const evento of log?.eventos ?? []) grupos.set(evento.turno, [...(grupos.get(evento.turno) ?? []), evento]);
    return [...grupos].sort(([a], [b]) => a - b);
  }, [log]);
  const expedicaoSelecionada = dados?.itens.find((item) => item.id === expedicaoAberta);
  const indiceLuta = expedicaoSelecionada?.lutas.findIndex((luta) => luta.id === lutaAberta) ?? -1;
  const lutaSelecionada = indiceLuta >= 0 ? expedicaoSelecionada?.lutas[indiceLuta] : null;

  function abrirExpedicao(idExpedicao: string) {
    setExpedicaoAberta((atual) => atual === idExpedicao ? null : idExpedicao);
    setLutaAberta(null);
    setLog(null);
  }

  function mudarPagina(proxima: number) {
    setCarregando(true);
    setErro(null);
    setPagina(proxima);
    setExpedicaoAberta(null);
    setLutaAberta(null);
    setLog(null);
  }

  return <><section className={styles.painel} aria-label="Expedições do usuário">
    <header className={styles.topo}>
      <span><MapIcon aria-hidden="true" /><span><small>Atividade de jogo</small><strong>Expedições do usuário</strong></span></span>
      <b>{dados?.total ?? 0} registros</b>
    </header>
    {carregando ? <p className={styles.mensagem}>Carregando expedições...</p> : null}
    {erro ? <p className={styles.erro}>{erro}</p> : null}
    {!carregando && !erro && dados?.total === 0 ? <p className={styles.vazio}>Este usuário ainda não iniciou nenhuma expedição.</p> : null}

    {!carregando && !erro ? <div className={styles.lista}>
      {dados?.itens.map((item) => <article key={item.id} className={styles.expedicao}>
        <button type="button" className={styles.linhaExpedicao} aria-expanded={expedicaoAberta === item.id} onClick={() => abrirExpedicao(item.id)}>
          <span className={styles.identidade}><strong>{item.deck}</strong><small>{dataHora(item.criadoEm)}</small></span>
          <span className={styles.status} data-status={item.status}>{nomeStatus(item.status)}</span>
          <small>Etapa {item.etapaAtual + 1}</small>
          <b><Gem aria-hidden="true" /> {item.rubys}</b>
          <ChevronDown className={styles.seta} aria-hidden="true" />
        </button>
        {expedicaoAberta === item.id ? <div className={styles.detalhesExpedicao}>
          <h4><Swords aria-hidden="true" /> Lutas da expedição <span>{item.lutas.length}</span></h4>
          {item.lutas.length === 0 ? <p className={styles.vazioLutas}>Ainda não há lutas registradas nesta expedição.</p> : null}
          <div className={styles.listaLutas}>
            {item.lutas.map((luta, indice) => <div key={luta.id} className={styles.luta}>
              <button type="button" className={styles.linhaLuta} aria-haspopup="dialog" data-ativo={lutaAberta === luta.id} onClick={() => { setLutaAberta(luta.id); setCarregandoLog(true); setLog(null); setErroLog(null); }}>
                <span><strong>Luta {indice + 1}{luta.etapa !== null ? ` · Etapa ${luta.etapa + 1}` : ""}</strong><small>{dataHora(luta.iniciadoEm)} · {luta.turnos} turnos</small></span>
                <span className={styles.status} data-status={luta.resultado}>{nomeStatus(luta.resultado)}</span>
                <b><Gem aria-hidden="true" /> {luta.rubys}</b>
                <ScrollText className={styles.seta} aria-hidden="true" />
              </button>
            </div>)}
          </div>
        </div> : null}
      </article>)}
    </div> : null}

    {!carregando && !erro && dados && dados.totalPaginas > 1 ? <nav className={styles.paginacao} aria-label="Páginas de expedições">
      <button type="button" disabled={pagina <= 1} onClick={() => mudarPagina(pagina - 1)}><ChevronLeft aria-hidden="true" /> Anterior</button>
      <span>Página {pagina} de {dados.totalPaginas}</span>
      <button type="button" disabled={pagina >= dados.totalPaginas} onClick={() => mudarPagina(pagina + 1)}>Próxima <ChevronRight aria-hidden="true" /></button>
    </nav> : null}
  </section>
    {portalPronto && lutaAberta && lutaSelecionada ? createPortal(<div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setLutaAberta(null); }}>
      <section className={styles.modalChatlog} role="dialog" aria-modal="true" aria-labelledby="chatlog-titulo">
        <header className={styles.modalCabecalho}>
          <span className={styles.modalIcone}><ScrollText aria-hidden="true" /></span>
          <span className={styles.modalIdentidade}>
            <small>Registro da batalha</small>
            <strong id="chatlog-titulo">Chatlog · Luta {indiceLuta + 1}{lutaSelecionada.etapa !== null ? ` · Etapa ${lutaSelecionada.etapa + 1}` : ""}</strong>
            <small>{dataHora(lutaSelecionada.iniciadoEm)} · {lutaSelecionada.turnos} turnos</small>
          </span>
          <button type="button" className={styles.modalFechar} aria-label="Fechar chatlog" onClick={() => setLutaAberta(null)}><X aria-hidden="true" /></button>
        </header>
        <div className={styles.modalResumo}><span className={styles.status} data-status={lutaSelecionada.resultado}>{nomeStatus(lutaSelecionada.resultado)}</span><b><Gem aria-hidden="true" /> {lutaSelecionada.rubys} Rubys</b></div>
        <div className={styles.chatlog}>
          {carregandoLog ? <p className={styles.mensagem}>Carregando chatlog...</p> : null}
          {erroLog ? <p className={styles.erro}>{erroLog}</p> : null}
          {!carregandoLog && !erroLog && log?.eventos.length === 0 ? <p className={styles.vazioLutas}>Esta luta não possui eventos registrados.</p> : null}
          {turnos.map(([turno, eventos]) => <div key={turno} className={styles.turno}>
            <h5>{turno === 0 ? "Preparação" : `Turno ${turno}`}</h5>
            {eventos.map((evento) => <div key={evento.id} className={styles.evento} data-origem={evento.origem ?? "SISTEMA"}>
              <small>{evento.tipo}</small><p>{evento.texto}</p>
            </div>)}
          </div>)}
        </div>
      </section>
    </div>, document.body) : null}
  </>;
}
