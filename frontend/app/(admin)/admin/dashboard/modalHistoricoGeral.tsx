"use client";

import {
  Activity,
  ChevronLeft,
  ChevronRight,
  FileText,
  History,
  Plus,
  RefreshCw,
  RotateCcw,
  Search,
  ShieldCheck,
  Trash2,
  X,
} from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import {
  listarHistoricoAdminCartas,
  type AdminCartaHistorico,
  type AdminCartasHistoricoPainel,
  type AdminDashboardResumo,
} from "../../../lib/admin";
import styles from "../../../styles/admin/modalHistoricoGeral.module.css";

const nomesCampos: Record<string, string> = {
  nome: "Nome",
  elemento: "Elemento",
  raridade: "Raridade",
  idClasse: "Classe",
  hpBase: "HP",
  danoBase: "Dano",
  defesaBase: "Defesa",
  passiva: "Passiva",
  foto: "Imagem",
  moldura: "Moldura",
  configVisual: "Visual",
  ativo: "Status",
  habilidades: "Habilidades",
};

const iconesAcao = {
  CRIADA: Plus,
  ALTERADA: RefreshCw,
  REMOVIDA: Trash2,
  RESTAURADA: RotateCcw,
};

function resumoAlteracoes(registro: AdminCartaHistorico) {
  const campos = Object.keys(registro.alteracoes ?? {});
  if (!campos.length) return null;
  return campos.map((campo) => nomesCampos[campo] ?? campo).join(", ");
}

function valorAlteracao(campo: string, valor: unknown) {
  if (campo === "ativo") return valor ? "Ativa" : "Inativa";
  if (valor === null || valor === undefined || valor === "") return "Vazio";
  if (
    [
      "foto",
      "moldura",
      "configVisual",
      "passiva",
      "habilidades",
      "idClasse",
    ].includes(campo)
  ) {
    if (campo === "habilidades" && Array.isArray(valor)) {
      return (
        valor
          .map((item) =>
            typeof item === "object" && item !== null && "nome" in item
              ? String(item.nome)
              : "Habilidade",
          )
          .join(", ") || "Nenhuma"
      );
    }
    return campo === "foto" || campo === "moldura" ? "Definida" : "Configuração";
  }
  return String(valor);
}

function formatarData(data: string | Date | null) {
  if (!data) return "Data não informada";
  const d = typeof data === "string" ? new Date(data) : data;
  return d.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  });
}

type Props = {
  resumo: AdminDashboardResumo | null;
  aoFechar: () => void;
};

export function ModalHistoricoGeral({ resumo, aoFechar }: Props) {
  const [abaAtiva, setAbaAtiva] = useState<"cartas" | "atividade" | "saude">(
    "cartas",
  );
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [acao, setAcao] = useState("");
  const [pagina, setPagina] = useState(1);
  const [painelCartas, setPainelCartas] =
    useState<AdminCartasHistoricoPainel | null>(null);
  const [carregandoCartas, setCarregandoCartas] = useState(true);
  const [erroCartas, setErroCartas] = useState<string | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const modalRef = useRef<HTMLElement>(null);
  const aoFecharRef = useRef(aoFechar);

  useEffect(() => {
    aoFecharRef.current = aoFechar;
  }, [aoFechar]);

  useEffect(() => {
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        aoFecharRef.current();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setPagina(1);
      setBuscaAplicada(busca.trim());
    }, 280);
    return () => window.clearTimeout(timer);
  }, [busca]);

  useEffect(() => {
    let ativo = true;
    setCarregandoCartas(true);
    setErroCartas(null);

    void listarHistoricoAdminCartas({
      pagina,
      busca: buscaAplicada,
      acao,
    })
      .then((res) => {
        if (ativo) setPainelCartas(res);
      })
      .catch((falha) => {
        if (ativo) {
          setErroCartas(
            falha instanceof Error
              ? falha.message
              : "Não foi possível carregar o histórico de cartas.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregandoCartas(false);
      });

    return () => {
      ativo = false;
    };
  }, [pagina, buscaAplicada, acao, tentativa]);

  function onSubmitBusca(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault();
    setPagina(1);
    setBuscaAplicada(busca.trim());
  }

  const modalJSX = (
    <div
      className={styles.fundo}
      role="presentation"
      onMouseDown={(evento) => {
        if (evento.target === evento.currentTarget) aoFechar();
      }}
    >
      <section
        ref={modalRef}
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-historico-geral"
      >
        <header className={styles.cabecalho}>
          <div className={styles.cabecalhoInfo}>
            <span className={styles.iconeTopo}>
              <Activity aria-hidden="true" />
            </span>
            <div>
              <h3 id="titulo-historico-geral">
                Saúde do Catálogo & Auditoria Geral
              </h3>
              <p>
                Histórico consolidado de alterações de cartas, integridade e
                registros do sistema.
              </p>
            </div>
          </div>
          <button
            type="button"
            className={styles.btnFechar}
            onClick={aoFechar}
            aria-label="Fechar histórico"
          >
            <X aria-hidden="true" />
          </button>
        </header>

        <nav className={styles.abas} aria-label="Abas de histórico e auditoria">
          <button
            type="button"
            className={styles.aba}
            data-ativo={abaAtiva === "cartas" ? "true" : undefined}
            onClick={() => setAbaAtiva("cartas")}
          >
            <FileText aria-hidden="true" /> Histórico de Cartas
            {painelCartas ? (
              <span className={styles.badgeContador}>
                {painelCartas.paginacao.total}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={styles.aba}
            data-ativo={abaAtiva === "atividade" ? "true" : undefined}
            onClick={() => setAbaAtiva("atividade")}
          >
            <History aria-hidden="true" /> Atividade Geral
            {resumo?.atividadeRecente?.length ? (
              <span className={styles.badgeContador}>
                {resumo.atividadeRecente.length}
              </span>
            ) : null}
          </button>
          <button
            type="button"
            className={styles.aba}
            data-ativo={abaAtiva === "saude" ? "true" : undefined}
            onClick={() => setAbaAtiva("saude")}
          >
            <ShieldCheck aria-hidden="true" /> Integridade do Catálogo
          </button>
        </nav>

        {abaAtiva === "cartas" && (
          <form className={styles.filtros} onSubmit={onSubmitBusca}>
            <div className={styles.busca}>
              <Search aria-hidden="true" />
              <input
                type="search"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar carta no histórico..."
                aria-label="Buscar carta no histórico"
              />
            </div>
            <select
              className={styles.seletorAcao}
              value={acao}
              onChange={(e) => {
                setPagina(1);
                setAcao(e.target.value);
              }}
              aria-label="Filtrar por tipo de ação"
            >
              <option value="">Todas as ações</option>
              <option value="CRIADA">Criadas</option>
              <option value="ALTERADA">Alteradas</option>
              <option value="REMOVIDA">Removidas</option>
              <option value="RESTAURADA">Restauradas</option>
            </select>
          </form>
        )}

        <div className={styles.corpoScroll}>
          {abaAtiva === "cartas" && (
            <>
              {carregandoCartas ? (
                <p className={styles.estadoCarregando}>
                  Carregando histórico de cartas...
                </p>
              ) : erroCartas ? (
                <p className={styles.estadoErro} role="alert">
                  {erroCartas}
                  <button
                    type="button"
                    className={styles.btnTentarNovamente}
                    onClick={() => setTentativa((t) => t + 1)}
                  >
                    Tentar novamente
                  </button>
                </p>
              ) : !painelCartas?.registros.length ? (
                <p className={styles.estadoVazio}>
                  Nenhum registro de carta encontrado com os filtros atuais.
                </p>
              ) : (
                <div className={styles.listaCartas}>
                  {painelCartas.registros.map((item) => {
                    const Icone = iconesAcao[item.acao] ?? RefreshCw;
                    return (
                      <article key={item.id} className={styles.itemCarta}>
                        <span className={styles.tagAcao} data-acao={item.acao}>
                          <Icone aria-hidden="true" />
                          {item.acao === "CRIADA"
                            ? "Criada"
                            : item.acao === "REMOVIDA"
                              ? "Removida"
                              : item.acao === "RESTAURADA"
                                ? "Restaurada"
                                : "Alterada"}
                        </span>
                        <div className={styles.itemCartaInfo}>
                          <span className={styles.itemCartaNome}>
                            {item.nomeCarta}
                          </span>
                          {resumoAlteracoes(item) ? (
                            <details className={styles.detalhesCampos}>
                              <summary>
                                Modificações: {resumoAlteracoes(item)}
                              </summary>
                              <ul>
                                {Object.entries(item.alteracoes ?? {}).map(
                                  ([campo, valores]) => (
                                    <li key={campo}>
                                      <strong>
                                        {nomesCampos[campo] ?? campo}:
                                      </strong>{" "}
                                      {valorAlteracao(campo, valores.antes)} →{" "}
                                      {valorAlteracao(campo, valores.depois)}
                                    </li>
                                  ),
                                )}
                              </ul>
                            </details>
                          ) : null}
                        </div>
                        <span
                          className={styles.itemAutor}
                          title={item.autor?.email}
                        >
                          {item.autor?.nome ?? "Ação do sistema"}
                        </span>
                        <time
                          className={styles.itemData}
                          dateTime={item.criadoEm}
                        >
                          {formatarData(item.criadoEm)}
                        </time>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}

          {abaAtiva === "atividade" && (
            <div className={styles.timelineAtividade}>
              {!resumo?.atividadeRecente?.length ? (
                <p className={styles.estadoVazio}>
                  Nenhuma atividade registrada no período do painel.
                </p>
              ) : (
                resumo.atividadeRecente.map((item, idx) => (
                  <article
                    key={`${item.texto}-${idx}`}
                    className={styles.itemAtividade}
                  >
                    <div className={styles.itemAtividadeCorpo}>
                      <i
                        className={styles.bolinhaTipo}
                        data-tipo={item.tipo}
                        aria-hidden="true"
                      />
                      <div className={styles.itemAtividadeTexto}>
                        <strong>{item.texto}</strong>
                        <span>
                          {item.detalhe} · Status: {item.status}
                        </span>
                      </div>
                    </div>
                    <time className={styles.itemAtividadeData}>
                      {formatarData(item.data)}
                    </time>
                  </article>
                ))
              )}
            </div>
          )}

          {abaAtiva === "saude" && (
            <div className={styles.saudeGrid}>
              <article className={styles.saudeCard}>
                <header>
                  <span>Cartas Ativas</span>
                  <Activity aria-hidden="true" />
                </header>
                <span className={styles.saudeCardValor} data-ok="true">
                  {resumo?.metricas.cartasAtivas ?? 0}
                </span>
                <span className={styles.saudeCardDesc}>
                  Total de cartas disponíveis para os jogadores no jogo.
                </span>
              </article>

              <article className={styles.saudeCard}>
                <header>
                  <span>Sem Habilidade</span>
                  <ShieldCheck aria-hidden="true" />
                </header>
                <span
                  className={styles.saudeCardValor}
                  data-ok={
                    (resumo?.saudeCatalogo.cartasSemHabilidade ?? 0) === 0
                      ? "true"
                      : undefined
                  }
                  data-alerta={
                    (resumo?.saudeCatalogo.cartasSemHabilidade ?? 0) > 0
                      ? "true"
                      : undefined
                  }
                >
                  {resumo?.saudeCatalogo.cartasSemHabilidade ?? 0}
                </span>
                <span className={styles.saudeCardDesc}>
                  Cartas ativas que ainda não possuem nenhuma habilidade
                  vinculada.
                </span>
                {resumo?.saudeCatalogo.nomesSemHabilidade?.length ? (
                  <ul className={styles.listaPendencias}>
                    {resumo.saudeCatalogo.nomesSemHabilidade.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className={styles.saudeCard}>
                <header>
                  <span>Fora de Banner</span>
                  <Activity aria-hidden="true" />
                </header>
                <span
                  className={styles.saudeCardValor}
                  data-ok={
                    (resumo?.saudeCatalogo.cartasForaDeBanner ?? 0) === 0
                      ? "true"
                      : undefined
                  }
                  data-alerta={
                    (resumo?.saudeCatalogo.cartasForaDeBanner ?? 0) > 0
                      ? "true"
                      : undefined
                  }
                >
                  {resumo?.saudeCatalogo.cartasForaDeBanner ?? 0}
                </span>
                <span className={styles.saudeCardDesc}>
                  Cartas que não estão em nenhum banner ativo do Gacha.
                </span>
                {resumo?.saudeCatalogo.nomesForaDeBanner?.length ? (
                  <ul className={styles.listaPendencias}>
                    {resumo.saudeCatalogo.nomesForaDeBanner.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className={styles.saudeCard}>
                <header>
                  <span>Skills em Rascunho</span>
                  <Activity aria-hidden="true" />
                </header>
                <span
                  className={styles.saudeCardValor}
                  data-ok={
                    (resumo?.saudeCatalogo.habilidadesRascunho ?? 0) === 0
                      ? "true"
                      : undefined
                  }
                  data-alerta={
                    (resumo?.saudeCatalogo.habilidadesRascunho ?? 0) > 0
                      ? "true"
                      : undefined
                  }
                >
                  {resumo?.saudeCatalogo.habilidadesRascunho ?? 0}
                </span>
                <span className={styles.saudeCardDesc}>
                  Habilidades ainda não publicadas ou em edição.
                </span>
                {resumo?.saudeCatalogo.nomesSkillsRascunho?.length ? (
                  <ul className={styles.listaPendencias}>
                    {resumo.saudeCatalogo.nomesSkillsRascunho.map((n) => (
                      <li key={n}>{n}</li>
                    ))}
                  </ul>
                ) : null}
              </article>

              <article className={styles.saudeCard}>
                <header>
                  <span>Banners Ativos</span>
                  <Activity aria-hidden="true" />
                </header>
                <span className={styles.saudeCardValor} data-ok="true">
                  {resumo?.saudeCatalogo.bannersAtivos ?? 0}
                </span>
                <span className={styles.saudeCardDesc}>
                  Banners operacionais recebendo invocações dos jogadores.
                </span>
              </article>
            </div>
          )}
        </div>

        <footer className={styles.rodape}>
          {abaAtiva === "cartas" &&
          painelCartas &&
          painelCartas.paginacao.totalPaginas > 1 ? (
            <nav
              className={styles.paginacao}
              aria-label="Paginação do histórico de cartas"
            >
              <button
                type="button"
                className={styles.btnPagina}
                disabled={pagina <= 1 || carregandoCartas}
                onClick={() => setPagina((p) => p - 1)}
              >
                <ChevronLeft aria-hidden="true" /> Anterior
              </button>
              <span>
                Página {pagina} de {painelCartas.paginacao.totalPaginas}
              </span>
              <button
                type="button"
                className={styles.btnPagina}
                disabled={
                  pagina >= painelCartas.paginacao.totalPaginas ||
                  carregandoCartas
                }
                onClick={() => setPagina((p) => p + 1)}
              >
                Próxima <ChevronRight aria-hidden="true" />
              </button>
            </nav>
          ) : (
            <div />
          )}

          <button
            type="button"
            className={styles.btnFecharRodape}
            onClick={aoFechar}
          >
            Fechar
          </button>
        </footer>
      </section>
    </div>
  );

  if (typeof document === "undefined") return null;
  return createPortal(modalJSX, document.body);
}
