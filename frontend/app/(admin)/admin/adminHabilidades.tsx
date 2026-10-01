"use client";

import {
  Edit3,
  FlaskConical,
  ListFilter,
  MoreHorizontal,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import {
  atualizarAdminHabilidade,
  criarAdminHabilidade,
  inativarAdminHabilidade,
  listarAdminHabilidades,
  publicarAdminHabilidade,
  type AdminHabilidade,
  type SalvarAdminHabilidadePayload,
} from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import featureStyles from "../../styles/admin/adminHabilidades.module.css";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";

import {
  AdminHabilidadeFormulario,
  type FormHabilidade,
} from "./adminHabilidadeFormulario";
import { AdminHabilidadeTeste } from "./adminHabilidadeTeste";
import { AdminLayout } from "./adminShared";
import { combinarEstilos } from "./combinarEstilos";
import { FiltroHabilidadesModal } from "./filtroHabilidadesModal";

const styles = combinarEstilos(sharedStyles, listaStyles, featureStyles);

const formularioVazio: FormHabilidade = {
  nome: "",
  descricao: "",
  tipoEfeito: "DANO",
  gatilho: "AO_ATACAR",
  alvo: "INIMIGO_ATIVO",
  unidade: "PERCENTUAL",
  valorBase: 100,
  formaAplicacao: "APOS_ACAO",
  requisitoTipo: "NENHUM",
  requisitoValor: 3,
  escalaTipo: "NENHUMA",
  escalaValor: 5,
  escalaLimite: 100,
};

function Status({ status }: { status: AdminHabilidade["status"] }) {
  const classe =
    status === "PUBLICADA"
      ? styles.statusAtivo
      : status === "RASCUNHO"
        ? styles.statusRascunho
        : styles.statusInativo;
  const texto =
    status === "PUBLICADA"
      ? "Publicada"
      : status === "RASCUNHO"
        ? "Rascunho"
        : "Inativa";
  return <span className={classe}>{texto}</span>;
}

function toForm(habilidade: AdminHabilidade): FormHabilidade {
  return {
    id: habilidade.id,
    nome: habilidade.nome,
    descricao: habilidade.descricao ?? "",
    tipoEfeito: habilidade.tipoEfeito,
    gatilho: habilidade.gatilho,
    alvo: habilidade.alvo,
    atributo: habilidade.atributo ?? undefined,
    unidade: habilidade.unidade,
    valorBase: habilidade.valorBase,
    formaAplicacao: habilidade.formaAplicacao,
    requisitoTipo: habilidade.requisitoTipo,
    requisitoValor: habilidade.requisitoValor ?? 3,
    escalaTipo: habilidade.escalaTipo,
    escalaValor: habilidade.escalaValor ?? 5,
    escalaLimite: habilidade.escalaLimite ?? habilidade.valorBase,
    duracaoTurnos: habilidade.duracaoTurnos ?? undefined,
  };
}

function toPayload(form: FormHabilidade): SalvarAdminHabilidadePayload {
  const alteraAtributo =
    form.tipoEfeito === "BUFF" || form.tipoEfeito === "DEBUFF";
  const aceitaDuracao = alteraAtributo || form.tipoEfeito === "ESCUDO";
  return {
    nome: form.nome.trim(),
    descricao: form.descricao?.trim() || undefined,
    tipoEfeito: form.tipoEfeito,
    gatilho: form.gatilho,
    alvo: form.alvo,
    atributo: alteraAtributo ? (form.atributo ?? "ATAQUE") : undefined,
    unidade: form.unidade,
    valorBase: form.valorBase,
    formaAplicacao: form.formaAplicacao,
    requisitoTipo: form.requisitoTipo,
    requisitoValor:
      form.requisitoTipo === "NENHUM" ? undefined : form.requisitoValor,
    escalaTipo: form.escalaTipo,
    escalaValor: form.escalaTipo === "NENHUMA" ? undefined : form.escalaValor,
    escalaLimite: form.escalaTipo === "NENHUMA" ? undefined : form.escalaLimite,
    duracaoTurnos: aceitaDuracao ? form.duracaoTurnos : undefined,
  };
}

export function Habilidades() {
  const [habilidades, setHabilidades] = useState<AdminHabilidade[]>([]);
  const [busca, setBusca] = useState("");
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);
  const btnFiltrosRef = useRef<HTMLButtonElement>(null);
  const [form, setForm] = useState<FormHabilidade | null>(null);
  const [habilidadeTeste, setHabilidadeTeste] =
    useState<AdminHabilidade | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [processandoId, setProcessandoId] = useState("");
  const [erro, setErro] = useState("");
  const [feedback, setFeedback] = useState("");

  function fecharModalFiltros() {
    setModalFiltrosAberto(false);
    requestAnimationFrame(() => btnFiltrosRef.current?.focus());
  }

  useEffect(() => {
    if (erro) notificarErro(erro);
  }, [erro]);

  useEffect(() => {
    if (feedback) notificarSucesso(feedback);
  }, [feedback]);

  useEffect(() => {
    let ativo = true;
    listarAdminHabilidades()
      .then((res) => {
        if (ativo) setHabilidades(res);
      })
      .catch((error) => {
        if (ativo)
          setErro(
            error instanceof Error
              ? error.message
              : "Erro ao carregar habilidades.",
          );
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, []);

  useEffect(() => {
    if (!form && !habilidadeTeste) return;
    const overflowAnterior = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setForm(null);
        setHabilidadeTeste(null);
      }
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.body.style.overflow = overflowAnterior;
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, [form, habilidadeTeste]);

  const tipos = useMemo(
    () =>
      [
        ...new Set(habilidades.map((habilidade) => habilidade.tipoEfeito)),
      ].sort(),
    [habilidades],
  );
  const habilidadesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return habilidades.filter((habilidade) => {
      const correspondeBusca =
        !termo ||
        [
          habilidade.nome,
          habilidade.tipoEfeito,
          habilidade.gatilho,
          habilidade.alvo,
        ].some((valor) => valor.toLocaleLowerCase("pt-BR").includes(termo));
      return (
        correspondeBusca &&
        (!filtroTipo || habilidade.tipoEfeito === filtroTipo) &&
        (!filtroStatus || habilidade.status === filtroStatus)
      );
    });
  }, [busca, filtroStatus, filtroTipo, habilidades]);

  function atualizarForm<K extends keyof FormHabilidade>(
    campo: K,
    valor: FormHabilidade[K],
  ) {
    setForm((atual) => {
      if (!atual) return atual;
      if (campo === "tipoEfeito" && valor === "CRITICO") {
        return {
          ...atual,
          tipoEfeito: "CRITICO",
          gatilho: "AO_ATACAR",
          alvo: "INIMIGO_ATIVO",
          atributo: undefined,
          unidade: "PERCENTUAL",
          valorBase: 50,
          formaAplicacao: "ANTES_ACAO",
          requisitoTipo: "CHANCE",
          requisitoValor: 25,
          escalaTipo: "NENHUMA",
          duracaoTurnos: undefined,
        };
      }
      if (campo === "tipoEfeito" && atual.tipoEfeito === "CRITICO") {
        return { ...atual, tipoEfeito: valor as AdminHabilidade["tipoEfeito"], requisitoTipo: "NENHUM", requisitoValor: undefined };
      }
      return { ...atual, [campo]: valor };
    });
  }

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!form) return;
    setSalvando(true);
    setErro("");
    setFeedback("");
    try {
      const salva = form.id
        ? await atualizarAdminHabilidade(form.id, toPayload(form))
        : await criarAdminHabilidade(toPayload(form));
      setHabilidades((atuais) =>
        form.id
          ? atuais.map((habilidade) =>
              habilidade.id === salva.id ? salva : habilidade,
            )
          : [salva, ...atuais],
      );
      setFeedback(
        form.id ? "Habilidade atualizada como rascunho." : "Rascunho criado.",
      );
      setForm(null);
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível salvar.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function inativar(habilidade: AdminHabilidade) {
    if (!window.confirm(`Inativar a habilidade ${habilidade.nome}?`)) return;
    setErro("");
    setFeedback("");
    try {
      const atualizada = await inativarAdminHabilidade(
        habilidade.id,
        habilidade.nome,
      );
      setHabilidades((atuais) =>
        atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
      );
      setFeedback("Habilidade inativada.");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível inativar.",
      );
    }
  }

  function atualizarHabilidade(atualizada: AdminHabilidade) {
    setHabilidades((atuais) =>
      atuais.map((item) => (item.id === atualizada.id ? atualizada : item)),
    );
    setHabilidadeTeste((atual) =>
      atual?.id === atualizada.id ? atualizada : atual,
    );
  }

  async function publicar(habilidade: AdminHabilidade) {
    if (!habilidade.testadaEm) {
      setErro("Execute ao menos um teste antes de publicar esta versão.");
      return;
    }
    if (!window.confirm(`Publicar a habilidade ${habilidade.nome}?`)) return;

    setProcessandoId(habilidade.id);
    setErro("");
    setFeedback("");
    try {
      const atualizada = await publicarAdminHabilidade(habilidade.id);
      atualizarHabilidade(atualizada);
      setFeedback("Habilidade publicada e disponível para vinculação.");
    } catch (error) {
      setErro(
        error instanceof Error ? error.message : "Não foi possível publicar.",
      );
    } finally {
      setProcessandoId("");
    }
  }

  return (
    <AdminLayout
      title="Habilidades"
      subtitle="Crie e organize as regras executadas pelo servidor."
    >
      <div className={`${styles.cartasWorkspace} ${styles.cartasWorkspaceUnica}`}>
        <section
          className={`${styles.cartasListaPanel} ${styles.habilidadesListaPanel}`}
        >
          <header className={styles.cartasListaTopo}>
            <div className={styles.cartasListaEsquerda}>
              <div className={styles.cartasListaTitulo}>
                <strong>Habilidades cadastradas</strong>
                <small>
                  {carregando
                    ? "Carregando..."
                    : `${habilidadesFiltradas.length} ${habilidadesFiltradas.length === 1 ? "resultado" : "resultados"}`}
                </small>
              </div>
              <form className={styles.pesquisaCartas} role="search" onSubmit={(evento) => evento.preventDefault()}>
                <input
                  type="search"
                  placeholder="Buscar habilidade..."
                  value={busca}
                  onChange={(evento) => setBusca(evento.target.value)}
                  aria-label="Buscar habilidades"
                />
                <button type="submit" aria-label="Pesquisar habilidades" title="Pesquisar habilidades">
                  <Search aria-hidden="true" />
                </button>
              </form>
              <button
                ref={btnFiltrosRef}
                type="button"
                className={styles.btnFiltros}
                aria-haspopup="dialog"
                aria-expanded={modalFiltrosAberto}
                aria-label="Abrir filtros de habilidades"
                data-ativo={filtroTipo || filtroStatus ? "true" : undefined}
                onClick={() => setModalFiltrosAberto(true)}
              >
                <ListFilter aria-hidden="true" /> Filtros
              </button>
            </div>
            <div className={styles.cartasListaAcoes}>
              <button
                type="button"
                className={styles.primaryBtn}
                onClick={() => setForm({ ...formularioVazio })}
              >
                <Plus aria-hidden="true" /> Nova habilidade
              </button>
            </div>
          </header>
          <div className={styles.tableWrap}>
            <table>
              <colgroup>
                <col className={styles.colunaHabilidade} />
                <col className={styles.colunaTipo} />
                <col className={styles.colunaGatilho} />
                <col className={styles.colunaAlvo} />
                <col className={styles.colunaStatus} />
                <col className={styles.colunaAcoes} />
              </colgroup>
              <thead>
                <tr>
                  <th>Habilidade</th>
                  <th>Tipo</th>
                  <th>Gatilho</th>
                  <th>Alvo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {!carregando && habilidadesFiltradas.length === 0 ? (
                  <tr className={styles.emptyTableRow}>
                    <td colSpan={6}>Nenhuma habilidade encontrada.</td>
                  </tr>
                ) : null}
                {habilidadesFiltradas.map((habilidade) => (
                  <tr key={habilidade.id}>
                    <td>
                      <span className={styles.habilidadeNome}>
                        <Sparkles aria-hidden="true" />
                        <span>
                          <strong>{habilidade.nome}</strong>
                          <small>
                            v{habilidade.versao}
                            {habilidade.testadaEm
                              ? " · testada"
                              : " · não testada"}
                          </small>
                        </span>
                      </span>
                    </td>
                    <td>{habilidade.tipoEfeito}</td>
                    <td>{habilidade.gatilho}</td>
                    <td>{habilidade.alvo}</td>
                    <td>
                      <Status status={habilidade.status} />
                    </td>
                    <td>
                      <details className={styles.menuAcoesCarta} name="acoes-habilidades">
                        <summary aria-label={`Ações de ${habilidade.nome}`}>
                          <MoreHorizontal aria-hidden="true" />
                        </summary>
                        <div>
                          <button type="button" onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            setForm(toForm(habilidade));
                          }}>
                            <Edit3 aria-hidden="true" /> Editar
                          </button>
                          <button type="button" disabled={habilidade.status === "INATIVA"} onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            setHabilidadeTeste(habilidade);
                          }}>
                            <FlaskConical aria-hidden="true" /> Testar
                          </button>
                          <button
                            type="button"
                            disabled={habilidade.status !== "RASCUNHO" || !habilidade.testadaEm || processandoId === habilidade.id}
                            title={habilidade.testadaEm ? "Publicar versão testada" : "Teste esta versão antes de publicar"}
                            onClick={(evento) => {
                              evento.currentTarget.closest("details")?.removeAttribute("open");
                              void publicar(habilidade);
                            }}
                          >
                            <Rocket aria-hidden="true" /> Publicar
                          </button>
                          <button type="button" disabled={habilidade.status === "INATIVA"} onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            void inativar(habilidade);
                          }}>
                            <Trash2 aria-hidden="true" /> Inativar
                          </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

      </div>

      {modalFiltrosAberto ? <FiltroHabilidadesModal
        tipo={filtroTipo}
        setTipo={setFiltroTipo}
        status={filtroStatus}
        setStatus={setFiltroStatus}
        tipos={tipos}
        aoFechar={fecharModalFiltros}
      /> : null}

      {form ? (
        <AdminHabilidadeFormulario
          form={form}
          salvando={salvando}
          aoAtualizar={atualizarForm}
          aoSalvar={salvar}
          aoFechar={() => setForm(null)}
        />
      ) : null}
      {habilidadeTeste ? (
        <AdminHabilidadeTeste
          habilidade={habilidadeTeste}
          aoTestar={atualizarHabilidade}
          aoFechar={() => setHabilidadeTeste(null)}
        />
      ) : null}
    </AdminLayout>
  );
}
