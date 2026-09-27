"use client";

import { Gem, Map, PauseCircle, PlayCircle, Save, Swords } from "lucide-react";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import {
  notificarErro,
  notificarSucesso,
} from "../../components/notificacoesGlobais";
import {
  atualizarAdminCampanha,
  obterAdminCampanha,
  type AdminCampanhaConfiguracao,
  type AdminCampanhaPainel,
} from "../../lib/admin";
import styles from "../../styles/admin/adminCampanha.module.css";
import { AdminLayout } from "./adminShared";
import { FormBoss } from "./formBoss";

type FormCampanha = Omit<AdminCampanhaConfiguracao, "atualizadoEm">;

export function AdminCampanha() {
  const [painel, setPainel] = useState<AdminCampanhaPainel | null>(null);
  const [form, setForm] = useState<FormCampanha | null>(null);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    try {
      const dados = await obterAdminCampanha();
      setPainel(dados);
      setForm({
        ativa: dados.configuracao.ativa,
        recompensaFacil: dados.configuracao.recompensaFacil,
        recompensaMedia: dados.configuracao.recompensaMedia,
        recompensaDificil: dados.configuracao.recompensaDificil,
        recompensaChefe: dados.configuracao.recompensaChefe,
        percentualMantidoDerrota: dados.configuracao.percentualMantidoDerrota,
      });
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao carregar campanha.",
      );
    }
  }, []);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  function alterarNumero(campo: keyof FormCampanha, valor: string) {
    setForm((atual) =>
      atual ? { ...atual, [campo]: Math.max(0, Number(valor) || 0) } : atual,
    );
  }

  async function salvar() {
    if (!form) return;
    setSalvando(true);
    try {
      const res = await atualizarAdminCampanha(form);
      notificarSucesso(res.message, "Campanha atualizada");
      await carregar();
    } catch (erro) {
      notificarErro(
        erro instanceof Error ? erro.message : "Erro ao salvar campanha.",
      );
    } finally {
      setSalvando(false);
    }
  }

  return (
    <AdminLayout
      title="Campanha e expedições"
      subtitle="Acompanhe as jornadas e ajuste as regras das próximas trilhas."
    >
      <section className={styles.metricas}>
        <Metrica
          icone={<Map />}
          rotulo="Expedições"
          valor={painel?.metricas.total ?? 0}
        />
        <Metrica
          icone={<Swords />}
          rotulo="Em andamento"
          valor={painel?.metricas.ativas ?? 0}
        />
        <Metrica
          icone={<PlayCircle />}
          rotulo="Concluídas"
          valor={painel?.metricas.concluidas ?? 0}
        />
        <Metrica
          icone={<PauseCircle />}
          rotulo="Encerradas"
          valor={
            (painel?.metricas.falhas ?? 0) + (painel?.metricas.abandonadas ?? 0)
          }
        />
      </section>

      {form ? (
        <section className={styles.configuracao}>
          <header>
            <div>
              <h2>Regras da próxima expedição</h2>
              <p>Expedições em andamento preservam a configuração original.</p>
            </div>
            <label className={styles.status}>
              <input
                type="checkbox"
                checked={form.ativa}
                onChange={(evento) =>
                  setForm({ ...form, ativa: evento.target.checked })
                }
              />
              {form.ativa ? "Campanha ativa" : "Novas jornadas pausadas"}
            </label>
          </header>
          <div className={styles.campos}>
            <Campo
              rotulo="Rota fácil"
              valor={form.recompensaFacil}
              onChange={(valor) => alterarNumero("recompensaFacil", valor)}
            />
            <Campo
              rotulo="Rota média"
              valor={form.recompensaMedia}
              onChange={(valor) => alterarNumero("recompensaMedia", valor)}
            />
            <Campo
              rotulo="Rota difícil"
              valor={form.recompensaDificil}
              onChange={(valor) => alterarNumero("recompensaDificil", valor)}
            />
            <Campo
              rotulo="Chefe final"
              valor={form.recompensaChefe}
              onChange={(valor) => alterarNumero("recompensaChefe", valor)}
            />
            <Campo
              rotulo="Mantido na derrota"
              valor={form.percentualMantidoDerrota}
              max={100}
              sufixo="%"
              onChange={(valor) =>
                alterarNumero("percentualMantidoDerrota", valor)
              }
            />
          </div>
          <button
            className={styles.salvar}
            type="button"
            disabled={salvando}
            onClick={() => void salvar()}
          >
            <Save /> {salvando ? "Salvando..." : "Salvar configuração"}
          </button>
        </section>
      ) : null}

      {painel?.boss ? (
        <FormBoss boss={painel.boss} onSalvo={() => void carregar()} />
      ) : null}

      <section className={styles.historico}>
        <header>
          <h2>Expedições recentes</h2>
          <p>Últimas jornadas iniciadas pelos jogadores.</p>
        </header>
        <div className={styles.tabelaWrap}>
          <table>
            <thead>
              <tr>
                <th>Jogador</th>
                <th>Deck</th>
                <th>Status</th>
                <th>Etapa</th>
                <th>Rubys</th>
                <th>Início</th>
              </tr>
            </thead>
            <tbody>
              {(painel?.recentes ?? []).map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.jogador}</strong>
                    <small>{item.email}</small>
                  </td>
                  <td>{item.deck}</td>
                  <td>
                    <span data-status={item.status}>
                      {formatarStatus(item.status)}
                    </span>
                  </td>
                  <td>{Math.min(item.etapaAtual + 1, 4)}/4</td>
                  <td>
                    <Gem /> {item.rubys}
                  </td>
                  <td>
                    {new Date(item.criadoEm).toLocaleString("pt-BR", {
                      dateStyle: "short",
                      timeStyle: "short",
                    })}
                  </td>
                </tr>
              ))}
              {!painel?.recentes.length ? (
                <tr>
                  <td colSpan={6}>Nenhuma expedição registrada.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </AdminLayout>
  );
}

function Metrica({
  icone,
  rotulo,
  valor,
}: {
  icone: ReactNode;
  rotulo: string;
  valor: number;
}) {
  return (
    <article>
      <span>{icone}</span>
      <div>
        <small>{rotulo}</small>
        <strong>{valor}</strong>
      </div>
    </article>
  );
}

function Campo({
  rotulo,
  valor,
  max = 10000,
  sufixo = "Rubys",
  onChange,
}: {
  rotulo: string;
  valor: number;
  max?: number;
  sufixo?: string;
  onChange: (valor: string) => void;
}) {
  return (
    <label>
      <span>{rotulo}</span>
      <div>
        <input
          type="number"
          min={0}
          max={max}
          value={valor}
          onChange={(evento) => onChange(evento.target.value)}
        />
        <small>{sufixo}</small>
      </div>
    </label>
  );
}

function formatarStatus(status: string) {
  const nomes: Record<string, string> = {
    EM_ANDAMENTO: "Em andamento",
    CONCLUIDA: "Concluída",
    FALHOU: "Derrota",
    ABANDONADA: "Abandonada",
  };
  return nomes[status] ?? status;
}
