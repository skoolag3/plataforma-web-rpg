import { ListFilter, Plus, Search, Sparkles, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import {
  listarAdminHabilidades,
  type AdminCartaHabilidade,
  type AdminHabilidade,
} from "../../../lib/admin";
import { AjudaTiposHabilidade, referenciasTipo, TipoHabilidade } from "../habilidades/adminHabilidadeTipos";
import styles from "./adminCartaHabilidades.module.css";

type HabilidadeExibida = AdminHabilidade | AdminCartaHabilidade;

type Props = {
  selecionadasIds: string[];
  habilidadesIniciais?: AdminCartaHabilidade[];
  aoAlterar: (ids: string[]) => void;
};

const limiteHabilidades = 3;
const nomesGatilho: Record<AdminHabilidade["gatilho"], string> = {
  AO_ENTRAR: "Ao entrar",
  AO_ATACAR: "Ao atacar",
  AO_RECEBER_DANO: "Ao receber dano",
  INICIO_TURNO: "Início do turno",
  FIM_TURNO: "Fim do turno",
};

function normalizarBusca(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/_/g, " ").toLocaleLowerCase("pt-BR");
}

export function AdminCartaHabilidades({
  selecionadasIds,
  habilidadesIniciais = [],
  aoAlterar,
}: Props) {
  const [habilidades, setHabilidades] = useState<AdminHabilidade[]>([]);
  const [busca, setBusca] = useState("");
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);
  const [habilidadeParaRemover, setHabilidadeParaRemover] = useState<{ id: string; nome: string } | null>(null);
  const [tipoFiltro, setTipoFiltro] = useState<AdminHabilidade["tipoEfeito"] | "">("");
  const [gatilhoFiltro, setGatilhoFiltro] = useState<AdminHabilidade["gatilho"] | "">("");
  const [tipoRascunho, setTipoRascunho] = useState<typeof tipoFiltro>("");
  const [gatilhoRascunho, setGatilhoRascunho] = useState<typeof gatilhoFiltro>("");
  const btnFiltrosRef = useRef<HTMLButtonElement>(null);
  const btnRemoverRef = useRef<HTMLButtonElement>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");

  useEffect(() => {
    let ativo = true;
    listarAdminHabilidades()
      .then((res) => {
        if (ativo) setHabilidades(res);
      })
      .catch((error) => {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : "Não foi possível carregar as habilidades.",
          );
        }
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!filtrosAbertos) return;
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setFiltrosAbertos(false);
        btnFiltrosRef.current?.focus();
      }
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [filtrosAbertos]);

  useEffect(() => {
    if (!habilidadeParaRemover) return;
    function fecharComEscape(evento: KeyboardEvent) {
      if (evento.key === "Escape") {
        setHabilidadeParaRemover(null);
        btnRemoverRef.current?.focus();
      }
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [habilidadeParaRemover]);

  const todas = useMemo(() => {
    const mapa = new Map<string, HabilidadeExibida>();
    habilidadesIniciais.forEach((habilidade) =>
      mapa.set(habilidade.id, habilidade),
    );
    habilidades.forEach((habilidade) => mapa.set(habilidade.id, habilidade));
    return mapa;
  }, [habilidades, habilidadesIniciais]);

  const selecionadas = selecionadasIds.reduce<HabilidadeExibida[]>(
    (lista, id) => {
      const habilidade = todas.get(id);
      if (habilidade) lista.push(habilidade);
      return lista;
    },
    [],
  );
  const termo = normalizarBusca(busca.trim());
  const filtrosAtivos = Number(Boolean(tipoFiltro)) + Number(Boolean(gatilhoFiltro));
  const catalogo = habilidades.filter(
    (habilidade) =>
      habilidade.status === "PUBLICADA" &&
      !selecionadasIds.includes(habilidade.id) &&
      (!tipoFiltro || habilidade.tipoEfeito === tipoFiltro) &&
      (!gatilhoFiltro || habilidade.gatilho === gatilhoFiltro) &&
      (!termo ||
        [habilidade.nome, habilidade.tipoEfeito, referenciasTipo[habilidade.tipoEfeito].nome, habilidade.gatilho, nomesGatilho[habilidade.gatilho]].some(
          (valor) => normalizarBusca(valor).includes(termo),
        )),
  ).sort((a, b) => Date.parse(b.criadoEm) - Date.parse(a.criadoEm));

  function abrirFiltros() {
    setTipoRascunho(tipoFiltro);
    setGatilhoRascunho(gatilhoFiltro);
    setFiltrosAbertos(true);
  }

  function fecharFiltros() {
    setFiltrosAbertos(false);
    btnFiltrosRef.current?.focus();
  }

  function aplicarFiltros() {
    setTipoFiltro(tipoRascunho);
    setGatilhoFiltro(gatilhoRascunho);
    fecharFiltros();
  }

  function fecharRemocao() {
    setHabilidadeParaRemover(null);
    btnRemoverRef.current?.focus();
  }

  function confirmarRemocao() {
    if (!habilidadeParaRemover) return;
    aoAlterar(selecionadasIds.filter((id) => id !== habilidadeParaRemover.id));
    setHabilidadeParaRemover(null);
  }

  return (
    <section className={styles.painel}>
      <header className={styles.topo}>
        <div>
          <span className={styles.titulo}>
            <Sparkles aria-hidden="true" />
            <strong>Habilidades da carta</strong>
            <AjudaTiposHabilidade titulo="Entenda as cores dos tipos de habilidade" />
          </span>
          <small>Somente versões publicadas podem ser vinculadas.</small>
        </div>
        <span className={styles.contador}>
          {selecionadasIds.length}/{limiteHabilidades}
        </span>
      </header>

      {selecionadas.length ? (
        <div className={styles.selecionadas}>
          {selecionadas.map((habilidade, indice) => (
            <article key={habilidade.id}>
              <span className={styles.ordem}>{indice + 1}</span>
              <div className={styles.dados}>
                <strong>{habilidade.nome}</strong>
                <small
                  className={
                    habilidade.status !== "PUBLICADA"
                      ? styles.indisponivel
                      : undefined
                  }
                >
                  <TipoHabilidade tipo={habilidade.tipoEfeito} />
                  <span>· {nomesGatilho[habilidade.gatilho]} · v{habilidade.versao}</span>
                  {habilidade.status !== "PUBLICADA"
                    ? <span>· remova antes de salvar</span>
                    : ""}
                </small>
              </div>
              <div className={styles.acoes}>
                <button
                  type="button"
                  onClick={(event) => {
                    btnRemoverRef.current = event.currentTarget;
                    setHabilidadeParaRemover({ id: habilidade.id, nome: habilidade.nome });
                  }}
                  aria-label={`Remover ${habilidade.nome}`}
                >
                  <X aria-hidden="true" />
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <span className={styles.estado}>Nenhuma habilidade selecionada.</span>
      )}

      <div className={styles.busca} role="search">
        <Search aria-hidden="true" />
        <input
          aria-label="Buscar habilidade publicada por nome, tipo ou evento"
          value={busca}
          onChange={(event) => setBusca(event.target.value)}
          placeholder="Buscar por nome, tipo ou evento..."
        />
        {busca ? (
          <button type="button" className={styles.limparBusca} onClick={() => setBusca("")} aria-label="Limpar busca de habilidades">
            <X aria-hidden="true" />
          </button>
        ) : null}
        <button
          ref={btnFiltrosRef}
          type="button"
          className={styles.btnFiltros}
          aria-label={`Filtros de habilidades${filtrosAtivos ? `, ${filtrosAtivos} ativos` : ""}`}
          aria-haspopup="dialog"
          onClick={abrirFiltros}
        >
          <ListFilter aria-hidden="true" />
          <span>Filtros{filtrosAtivos ? ` ${filtrosAtivos}` : ""}</span>
        </button>
      </div>

      {erro ? <span className={styles.estado}>{erro}</span> : null}
      {carregando ? (
        <span className={styles.estado}>Carregando habilidades...</span>
      ) : (
        <div className={styles.catalogo}>
          {catalogo.map((habilidade) => (
            <article key={habilidade.id}>
              <span className={styles.ordem}>+</span>
              <div className={styles.dados}>
                <strong>{habilidade.nome}</strong>
                <small>
                  <TipoHabilidade tipo={habilidade.tipoEfeito} />
                  <span>· {nomesGatilho[habilidade.gatilho]} · v{habilidade.versao}</span>
                </small>
              </div>
              <button
                type="button"
                onClick={() => aoAlterar([...selecionadasIds, habilidade.id])}
                disabled={selecionadasIds.length >= limiteHabilidades}
                aria-label={`Adicionar ${habilidade.nome}`}
              >
                <Plus aria-hidden="true" />
              </button>
            </article>
          ))}
          {!catalogo.length ? (
            <span className={styles.estado}>
              {termo || filtrosAtivos ? "Nenhuma habilidade encontrada para esta busca." : "Nenhuma habilidade publicada disponível."}
            </span>
          ) : null}
        </div>
      )}
      {filtrosAbertos && typeof document !== "undefined"
        ? createPortal(
            <div className={styles.fundoFiltros} role="presentation" onClick={(event) => { if (event.target === event.currentTarget) fecharFiltros(); }}>
              <section className={styles.modalFiltros} role="dialog" aria-modal="true" aria-labelledby="titulo-filtros-habilidades">
                <header>
                  <div>
                    <strong id="titulo-filtros-habilidades">Filtrar habilidades</strong>
                    <small>Refine as habilidades publicadas disponíveis.</small>
                  </div>
                  <button type="button" className={styles.fecharFiltros} onClick={fecharFiltros} aria-label="Fechar filtros" autoFocus>
                    <X aria-hidden="true" />
                  </button>
                </header>
                <div className={styles.filtros}>
                  <div className={styles.campoFiltro}>
                    <span>Tipo de efeito</span>
                    <SelectPadrao
                      valor={tipoRascunho}
                      aoAlterar={(valor) => setTipoRascunho(valor as typeof tipoRascunho)}
                      placeholder="Todos os tipos"
                      ariaLabel="Tipo de efeito"
                      opcoes={[
                        { valor: "", label: "Todos os tipos" },
                        ...Object.entries(referenciasTipo).map(([tipo, referencia]) => ({
                          valor: tipo,
                          label: referencia.nome,
                          cor: referencia.cor,
                          icone: <span className={styles.marcaTipo} style={{ backgroundColor: referencia.cor }} aria-hidden="true" />,
                        })),
                      ]}
                    />
                  </div>
                  <label>
                    Evento
                    <select value={gatilhoRascunho} onChange={(event) => setGatilhoRascunho(event.target.value as typeof gatilhoRascunho)}>
                      <option value="">Todos os eventos</option>
                      {Object.entries(nomesGatilho).map(([gatilho, nome]) => (
                        <option key={gatilho} value={gatilho}>{nome}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <footer>
                  <button type="button" className={styles.limparFiltros} onClick={() => { setTipoRascunho(""); setGatilhoRascunho(""); }}>
                    Limpar
                  </button>
                  <button type="button" className={styles.aplicarFiltros} onClick={aplicarFiltros}>
                    Aplicar filtros
                  </button>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
      {habilidadeParaRemover && typeof document !== "undefined"
        ? createPortal(
            <div className={styles.fundoFiltros} role="presentation" onClick={(event) => { if (event.target === event.currentTarget) fecharRemocao(); }}>
              <section className={`${styles.modalFiltros} ${styles.modalRemocao}`} role="dialog" aria-modal="true" aria-labelledby="titulo-remover-habilidade" aria-describedby="descricao-remover-habilidade">
                <header>
                  <div>
                    <strong id="titulo-remover-habilidade">Remover habilidade da carta?</strong>
                    <small>Confirme antes de alterar esta carta.</small>
                  </div>
                  <button type="button" className={styles.fecharFiltros} onClick={fecharRemocao} aria-label="Fechar confirmação">
                    <X aria-hidden="true" />
                  </button>
                </header>
                <p id="descricao-remover-habilidade">
                  <strong>{habilidadeParaRemover.nome}</strong> deixará de estar vinculada a esta carta. A habilidade cadastrada não será excluída. Salve a carta para efetivar a mudança.
                </p>
                <footer>
                  <button type="button" className={styles.cancelarRemocao} onClick={fecharRemocao} autoFocus>Cancelar</button>
                  <button type="button" className={styles.confirmarRemocao} onClick={confirmarRemocao}>Remover da carta</button>
                </footer>
              </section>
            </div>,
            document.body,
          )
        : null}
    </section>
  );
}
