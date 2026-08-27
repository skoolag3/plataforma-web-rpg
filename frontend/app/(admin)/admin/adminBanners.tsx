"use client";

import { Clock3, RefreshCw, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import {
  forcarAdminBanner,
  listarAdminBanners,
  type AdminBannersResponse,
} from "../../lib/admin";
import styles from "../../styles/admin/adminBanners.module.css";
import { AdminLayout } from "./adminShared";

function formatarTempo(ms: number) {
  const segundos = Math.max(0, Math.floor(ms / 1000));
  const minutos = Math.floor(segundos / 60);
  return `${String(minutos).padStart(2, "0")}:${String(segundos % 60).padStart(2, "0")}`;
}

export function AdminBanners() {
  const [dados, setDados] = useState<AdminBannersResponse | null>(null);
  const [agora, setAgora] = useState(Date.now());
  const [forcandoId, setForcandoId] = useState("");

  const carregar = useCallback(async () => {
    try {
      setDados(await listarAdminBanners());
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
          <button type="button" onClick={() => void carregar()}>
            <RefreshCw aria-hidden="true" /> Atualizar
          </button>
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
                    {banner.totalCartas} cartas, {banner.custoGiro} Rubys por giro
                  </small>
                </div>
                <p>
                  {banner.raridades.map((item) => (
                    <span key={item.raridade}>
                      {item.raridade} <b>{item.total}</b>
                    </span>
                  ))}
                </p>
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
              </article>
            );
          })}
        </div>
      </section>
    </AdminLayout>
  );
}
