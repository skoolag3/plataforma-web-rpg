"use client";

import {
  Clock3,
  ListFilter,
  MoreHorizontal,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import {
  atualizarAdminBanner,
  criarAdminBanner,
  forcarAdminBanner,
  listarAdminCartas,
  listarAdminBanners,
  removerAdminBanner,
  type AdminBanner,
  type AdminBannersResponse,
  type AdminCarta,
  type SalvarAdminBannerPayload,
} from "../../../lib/admin";
import styles from "../../../styles/admin/adminBanners.module.css";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import listaStyles from "../../../styles/admin/adminCartasLista.module.css";
import { AdminLayout, NomeComAlerta } from "../shared/adminShared";
import { combinarEstilos } from "../shared/combinarEstilos";
import { FiltroBannersModal } from "./filtroBannersModal";
import { FormBanner } from "./formBanner";

const lista = combinarEstilos(sharedStyles, listaStyles);

function formatarTempo(ms: number) {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(segundos / 60);
  const horas = Math.floor(minutos / 60);
  const dias = Math.floor(horas / 24);
  if (dias > 0) return `${dias}d ${horas % 24}h`;
  if (horas > 0) return `${horas}h ${minutos % 60}min`;
  return `${String(minutos).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
}

export function AdminBanners() {
  const [dados, setDados] = useState<AdminBannersResponse | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [forcandoId, setForcandoId] = useState("");
  const [cartas, setCartas] = useState<AdminCarta[]>([]);
  const [editando, setEditando] = useState<AdminBanner | "novo" | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [excluindo, setExcluindo] = useState<AdminBanner | null>(null);
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("");
  const [modalFiltrosAberto, setModalFiltrosAberto] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const [resBanners, resCartas] = await Promise.all([
        listarAdminBanners(),
        listarAdminCartas({ status: "ativas", ordem: "az" }),
      ]);
      setDados(resBanners);
      setCartas(resCartas);
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao carregar banners.",
      );
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const bannerAtual = useMemo(
    () =>
      dados?.banners.find(
        (banner) => banner.id === dados.rotacao?.bannerAtualId,
      ),
    [dados],
  );
  const tempoRestante = dados?.rotacao?.proximaRotacaoEm
    ? new Date(dados.rotacao.proximaRotacaoEm).getTime() - agora
    : 0;
  const bannersFiltrados = (dados?.banners ?? []).filter((banner) => {
    const atual = banner.id === dados?.rotacao?.bannerAtualId;
    const correspondeBusca = banner.nome.toLocaleLowerCase("pt-BR").includes(busca.trim().toLocaleLowerCase("pt-BR"));
    const correspondeStatus = !filtroStatus ||
      (filtroStatus === "destaque" && atual) ||
      (filtroStatus === "ativos" && banner.ativo) ||
      (filtroStatus === "inativos" && !banner.ativo);
    return correspondeBusca && correspondeStatus;
  });

  async function forcarBanner(idBanner: string) {
    setForcandoId(idBanner);
    try {
      const res = await forcarAdminBanner(idBanner);
      notificarSucesso(res.message, "Banner alterado");
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao forçar banner.",
      );
    } finally {
      setForcandoId("");
    }
  }

  async function salvarBanner(payload: SalvarAdminBannerPayload) {
    setSalvando(true);
    try {
      const res =
        editando && editando !== "novo"
          ? await atualizarAdminBanner(editando.id, payload)
          : await criarAdminBanner(payload);
      notificarSucesso(
        res.message,
        editando === "novo" ? "Banner criado" : "Banner atualizado",
      );
      setEditando(null);
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao salvar banner.",
      );
    } finally {
      setSalvando(false);
    }
  }

  async function confirmarExclusao() {
    if (!excluindo) return;
    setSalvando(true);
    try {
      const res = await removerAdminBanner(excluindo.id);
      notificarSucesso(res.message, "Banner excluído");
      setExcluindo(null);
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao excluir banner.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout
      title="Banners"
      subtitle="Monte os banners, defina chances, garantias e períodos de exibição."
    >
      <section className={styles.resumoRotacao}>
        <span className={styles.iconeAtual}>
          <ShieldCheck aria-hidden="true" />
        </span>
        <div>
          <small>Banner atual</small>
          <strong>{bannerAtual?.nome ?? "Aguardando rotação"}</strong>
          <span>
            {dados?.rotacao?.forcadoPorAdmin
              ? "Escolhido manualmente pelo admin"
              : "Escolhido automaticamente pelo servidor"}
          </span>
        </div>
        {dados?.rotacao?.proximaRotacaoEm ? <div className={styles.contador}>
          <Clock3 aria-hidden="true" />
          <span>
            <small>Próxima mudança</small>
            <strong>{formatarTempo(tempoRestante)}</strong>
          </span>
        </div> : null}
      </section>

      <section
        className={`${lista.cartasListaPanel} ${styles.listaBanners}`}
      >
        <header className={lista.cartasListaTopo}>
          <div className={lista.cartasListaEsquerda}>
            <div className={lista.cartasListaTitulo}>
              <strong>Banners cadastrados</strong>
              <small>{bannersFiltrados.length} {bannersFiltrados.length === 1 ? "resultado" : "resultados"}</small>
            </div>
            <div className={lista.pesquisaCartas} role="search">
              <input type="search" value={busca} onChange={(evento) => setBusca(evento.target.value)} placeholder="Buscar banner..." aria-label="Buscar banner por nome" />
              <span className={styles.iconeBusca}><Search aria-hidden="true" /></span>
            </div>
            <button type="button" className={lista.btnFiltros} data-ativo={filtroStatus ? "true" : undefined} aria-haspopup="dialog" aria-expanded={modalFiltrosAberto} onClick={() => setModalFiltrosAberto(true)}>
              <ListFilter aria-hidden="true" /> Filtros
            </button>
          </div>
          <div className={lista.cartasListaAcoes}>
            <button className={styles.btnAtualizar} type="button" onClick={() => void carregar()} aria-label="Atualizar banners" title="Atualizar banners">
              <RefreshCw aria-hidden="true" />
            </button>
            <button
              className={lista.primaryBtn}
              type="button"
              onClick={() => setEditando("novo")}
            >
              <Plus aria-hidden="true" /> Novo banner
            </button>
          </div>
        </header>

        <div className={`${lista.tableWrap} ${styles.tableWrap}`}>
          <table className={styles.tabelaBanners}>
            <colgroup>
              <col className={styles.colunaBanner} />
              <col className={styles.colunaPool} />
              <col className={styles.colunaStatus} />
              <col className={styles.colunaAcoes} />
            </colgroup>
            <thead>
              <tr>
                <th>Banner</th>
                <th>Pool</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {bannersFiltrados.map((banner) => {
                const atual = banner.id === dados?.rotacao?.bannerAtualId;
                const semCartas = banner.ativo && banner.totalCartas === 0;
                return (
                  <tr key={banner.id} data-atual={atual || undefined}>
                    <td data-label="Banner">
                      <div className={styles.bannerPrincipal}>
                        <NomeComAlerta
                          nome={banner.nome}
                          tom="vermelho"
                          motivo={
                            semCartas
                              ? "Banner ativo sem nenhuma carta no pool."
                              : null
                          }
                        />
                        <small>{banner.custoGiro} Rubys por giro</small>
                        <small>{banner.inicioEm ? `Início: ${new Date(banner.inicioEm).toLocaleString("pt-BR")}` : "Disponível imediatamente"}{banner.fimEm ? ` · Fim: ${new Date(banner.fimEm).toLocaleString("pt-BR")}` : ""}</small>
                      </div>
                    </td>
                    <td data-label="Pool">
                      <div className={styles.raridadesBanner}>
                        {banner.raridades.map((item) => (
                          <span key={item.raridade}>
                            {dados?.raridadesDisponiveis.find((raridade) => raridade.codigo === item.raridade)?.nome ?? item.raridade} <b>{item.total}</b>
                          </span>
                        ))}
                        <small>{banner.totalCartas} cartas</small>
                      </div>
                    </td>
                    <td data-label="Status">
                      <span
                        className={
                          atual || banner.ativo
                            ? lista.statusAtivo
                            : lista.statusInativo
                        }
                      >
                        {atual
                          ? "Em destaque"
                          : banner.ativo
                            ? "Ativo"
                            : "Inativo"}
                      </span>
                    </td>
                    <td data-label="Ações">
                      <details className={lista.menuAcoesCarta} name="acoes-banners">
                        <summary aria-label={`Ações de ${banner.nome}`}><MoreHorizontal aria-hidden="true" /></summary>
                        <div>
                        <button
                          type="button"
                          disabled={
                            !banner.ativo || atual || Boolean(forcandoId)
                          }
                          onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            void forcarBanner(banner.id);
                          }}
                        >
                          {forcandoId === banner.id
                            ? "Alterando..."
                            : atual
                              ? "Banner atual"
                              : "Forçar agora"}
                        </button>
                        <button
                          type="button"
                          onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            setEditando(banner);
                          }}
                        >
                          <Pencil aria-hidden="true" /> Editar
                        </button>
                        <button
                          type="button"
                          onClick={(evento) => {
                            evento.currentTarget.closest("details")?.removeAttribute("open");
                            setExcluindo(banner);
                          }}
                        >
                          <Trash2 aria-hidden="true" /> Excluir
                        </button>
                        </div>
                      </details>
                    </td>
                  </tr>
                );
              })}
              {dados && bannersFiltrados.length === 0 ? (
                <tr className={lista.emptyTableRow}>
                  <td colSpan={4}>{dados.banners.length ? "Nenhum banner encontrado." : "Nenhum banner cadastrado."}</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {modalFiltrosAberto ? <FiltroBannersModal status={filtroStatus} setStatus={setFiltroStatus} aoFechar={() => setModalFiltrosAberto(false)} /> : null}

      {editando ? (
        <FormBanner
          banner={editando === "novo" ? null : editando}
          cartas={cartas}
          raridades={dados?.raridadesDisponiveis ?? []}
          salvando={salvando}
          onFechar={() => setEditando(null)}
          onSalvar={(payload) => void salvarBanner(payload)}
        />
      ) : null}

      {excluindo ? (
        <div className={styles.modalFundo} role="presentation">
          <section
            className={styles.confirmarExclusao}
            role="alertdialog"
            aria-modal="true"
          >
            <Trash2 aria-hidden="true" />
            <h2>Excluir {excluindo.nome}?</h2>
            <p>
              A exclusão só será permitida se existir outro banner ativo e se
              este banner ainda não possuir giros no histórico.
            </p>
            <div>
              <button type="button" onClick={() => setExcluindo(null)}>
                Cancelar
              </button>
              <button
                type="button"
                disabled={salvando}
                onClick={() => void confirmarExclusao()}
              >
                {salvando ? "Excluindo..." : "Excluir banner"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </AdminLayout>
  );
}
