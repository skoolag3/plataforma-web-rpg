"use client";

import {
  Clock3,
  Pencil,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
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
} from "../../lib/admin";
import styles from "../../styles/admin/adminBanners.module.css";
import { AdminLayout } from "./adminShared";
import { FormBanner } from "./formBanner";

function formatarTempo(ms: number) {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(segundos / 60);
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
  const tempoRestante = dados?.rotacao
    ? new Date(dados.rotacao.proximaRotacaoEm).getTime() - agora
    : 0;

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
      title="Rotação do gacha"
      subtitle="Controle o banner atual e acompanhe as chances do sorteio."
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
        <div className={styles.contador}>
          <Clock3 aria-hidden="true" />
          <span>
            <small>Próxima troca</small>
            <strong>{formatarTempo(tempoRestante)}</strong>
          </span>
        </div>
      </section>

      <section className={styles.probabilidades}>
        <header>
          <h2>Chances por raridade</h2>
          <p>Primeiro o servidor sorteia a raridade, depois a carta.</p>
        </header>
        <div>
          {(dados?.probabilidades ?? []).map((item) => (
            <span key={item.raridade} data-raridade={item.raridade}>
              <b>{item.raridade}</b>
              <strong>{item.percentual}%</strong>
            </span>
          ))}
        </div>
      </section>

      <section className={styles.listaBanners}>
        <header>
          <div>
            <h2>Banners cadastrados</h2>
            <p>Somente banners ativos participam da rotação automática.</p>
          </div>
          <div className={styles.acoesLista}>
            <button type="button" onClick={() => setEditando("novo")}>
              <Plus aria-hidden="true" /> Novo banner
            </button>
            <button type="button" onClick={() => void carregar()}>
              <RefreshCw aria-hidden="true" /> Atualizar
            </button>
          </div>
        </header>

        <div className={styles.gradeBanners}>
          {(dados?.banners ?? []).map((banner) => {
            const atual = banner.id === dados?.rotacao?.bannerAtualId;
            return (
              <article key={banner.id} data-atual={atual || undefined}>
                <div>
                  <span>
                    {atual ? "Em destaque" : banner.ativo ? "Ativo" : "Inativo"}
                  </span>
                  <strong>{banner.nome}</strong>
                  <small>
                    {banner.totalCartas} cartas, {banner.custoGiro} Rubys por
                    giro
                  </small>
                </div>
                <p>
                  {banner.raridades.map((item) => (
                    <span key={item.raridade}>
                      {item.raridade} <b>{item.total}</b>
                    </span>
                  ))}
                </p>
                <div className={styles.acoesBanner}>
                  <button
                    type="button"
                    disabled={!banner.ativo || atual || Boolean(forcandoId)}
                    onClick={() => void forcarBanner(banner.id)}
                  >
                    {forcandoId === banner.id
                      ? "Alterando..."
                      : atual
                        ? "Banner atual"
                        : "Forçar agora"}
                  </button>
                  <button type="button" onClick={() => setEditando(banner)}>
                    <Pencil aria-hidden="true" /> Editar
                  </button>
                  <button
                    type="button"
                    className={styles.btnExcluir}
                    onClick={() => setExcluindo(banner)}
                  >
                    <Trash2 aria-hidden="true" /> Excluir
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {editando ? (
        <FormBanner
          banner={editando === "novo" ? null : editando}
          cartas={cartas}
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
