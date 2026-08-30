"use client";

import {
  BanknoteArrowDown,
  BanknoteArrowUp,
  History,
  ReceiptText,
  ShieldCheck,
  UserCog,
  Sparkles,
  X,
} from "lucide-react";
import { useMemo, useState, type FormEvent } from "react";
import type {
  AdminUsuario,
  AdminUsuarioAtividade,
  AjusteSaldoUsuarioPayload,
} from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminUsuarios.module.css";
import colecaoStyles from "../../styles/admin/adminUsuarioColecao.module.css";
import financeiroStyles from "../../styles/admin/adminUsuarioFinanceiro.module.css";

import { IconeRuby } from "../../components/iconeRuby";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  featureStyles,
  colecaoStyles,
  financeiroStyles,
);

type FiltroAtividade = "TODOS" | "ECONOMIA" | "COMPRAS" | "ADMIN";

type Props = {
  usuario: AdminUsuario;
  atividades: AdminUsuarioAtividade[];
  carregando: boolean;
  salvando: boolean;
  onAjustarSaldo: (payload: AjusteSaldoUsuarioPayload) => Promise<boolean>;
};

const iconesAtividade = {
  COMPRA: ReceiptText,
  GACHA: Sparkles,
  ADMIN: UserCog,
};

function formatNumber(valor: number) {
  return new Intl.NumberFormat("pt-BR").format(valor);
}

function formatDateTime(valor: string | null) {
  if (!valor) return "Data não informada";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(valor));
}

function formatValor(item: AdminUsuarioAtividade) {
  if (item.valor === null || !item.unidade) return null;
  if (item.unidade === "BRL") {
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(item.valor);
  }
  const sinal = item.valor > 0 ? "+" : "";
  return `${sinal}${formatNumber(item.valor)} Rubys`;
}

export function AdminUsuarioFinanceiro({
  usuario,
  atividades,
  carregando,
  salvando,
  onAjustarSaldo,
}: Props) {
  const [operacao, setOperacao] = useState<"adicionar" | "retirar">(
    "adicionar",
  );
  const [rubys, setRubys] = useState("0");
  const [motivo, setMotivo] = useState("");
  const [filtro, setFiltro] = useState<FiltroAtividade>("TODOS");
  const [ajusteAberto, setAjusteAberto] = useState(false);
  const [pagina, setPagina] = useState(1);

  const atividadesFiltradas = useMemo(
    () =>
      atividades.filter((item) => {
        if (filtro === "ECONOMIA")
          return item.tipo === "RUBY" || item.tipo === "GACHA";
        if (filtro === "COMPRAS") return item.tipo === "COMPRA";
        if (filtro === "ADMIN")
          return item.tipo === "ADMIN" || Boolean(item.autoria);
        return true;
      }),
    [atividades, filtro],
  );
  const totalPaginas = Math.max(1, Math.ceil(atividadesFiltradas.length / 10));
  const atividadesPagina = atividadesFiltradas.slice(
    (pagina - 1) * 10,
    pagina * 10,
  );

  async function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sinal = operacao === "adicionar" ? 1 : -1;
    const ajustado = await onAjustarSaldo({
      rubys: Math.max(0, Number(rubys) || 0) * sinal,
      motivo: motivo.trim(),
    });
    if (ajustado) {
      setRubys("0");
      setMotivo("");
    }
  }

  return (
    <section className={styles.usuarioFinanceiro}>
      <div className={styles.usuarioSaldoCompacto}>
        <span>
          <IconeRuby />
          <small>Rubys</small>
          <strong>{formatNumber(usuario.rubys)}</strong>
        </span>
        <details
          open={ajusteAberto}
          onToggle={(event) => setAjusteAberto(event.currentTarget.open)}
        >
          <summary
            aria-label={
              ajusteAberto ? "Fechar ajuste de saldo" : "Ajustar saldo"
            }
          >
            {ajusteAberto ? (
              <X />
            ) : (
              <>
                <BanknoteArrowUp /> Ajustar saldo
              </>
            )}
          </summary>
          <form onSubmit={salvar}>
            <div className={styles.usuarioOperacaoSaldo}>
              <button
                type="button"
                className={
                  operacao === "adicionar"
                    ? `${styles.usuarioOperacaoAtiva} ${styles.operacaoAdicionar}`
                    : ""
                }
                onClick={() => setOperacao("adicionar")}
              >
                <BanknoteArrowUp /> Adicionar
              </button>
              <button
                type="button"
                className={
                  operacao === "retirar"
                    ? `${styles.usuarioOperacaoAtiva} ${styles.operacaoRetirar}`
                    : ""
                }
                onClick={() => setOperacao("retirar")}
              >
                <BanknoteArrowDown /> Retirar
              </button>
            </div>
            <div className={styles.usuarioSaldoLinha}>
              <label>
                <span>Rubys</span>
                <input
                  type="number"
                  min="0"
                  max="1000000"
                  value={rubys}
                  onChange={(event) => setRubys(event.target.value)}
                />
              </label>
              <label className={styles.usuarioMotivoSaldo}>
                <span>Motivo obrigatório</span>
                <input
                  value={motivo}
                  onChange={(event) => setMotivo(event.target.value)}
                  minLength={3}
                  maxLength={180}
                  placeholder="Ex.: correção do suporte"
                  required
                />
              </label>
              <button type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Confirmar"}
              </button>
            </div>
            <p>
              <ShieldCheck /> A autoria deste ajuste será registrada
              automaticamente.
            </p>
          </form>
        </details>
      </div>

      <div className={styles.usuarioExtratoTopo}>
        <div>
          <History />
          <span>
            <small>Histórico da conta</small>
            <strong>Transações e auditoria</strong>
          </span>
        </div>
        <nav aria-label="Filtrar histórico">
          {(["TODOS", "ECONOMIA", "COMPRAS", "ADMIN"] as FiltroAtividade[]).map(
            (item) => (
              <button
                key={item}
                type="button"
                className={filtro === item ? styles.usuarioFiltroAtivo : ""}
                onClick={() => {
                  setFiltro(item);
                  setPagina(1);
                }}
              >
                {item === "ECONOMIA"
                  ? "Economia"
                  : item === "COMPRAS"
                    ? "Compras"
                    : item === "ADMIN"
                      ? "Admin"
                      : "Tudo"}
              </button>
            ),
          )}
        </nav>
      </div>

      {carregando ? (
        <p className={styles.feedbackInfo}>Carregando movimentações...</p>
      ) : null}
      <div className={styles.usuarioLinhaTempo}>
        {atividadesPagina.map((item) => {
          const Icone =
            item.tipo === "RUBY" ? null : iconesAtividade[item.tipo];
          const valor = formatValor(item);
          return (
            <article key={item.id} data-tipo={item.tipo}>
              <span className={styles.usuarioAtividadeIcone}>
                {Icone ? <Icone /> : <IconeRuby />}
              </span>
              <div>
                <strong>{item.titulo}</strong>
                <p>{item.descricao || "Sem descrição adicional."}</p>
                <small>
                  {formatDateTime(item.criadoEm)}
                  {item.autoria ? ` · por ${item.autoria.nome}` : ""}
                </small>
              </div>
              {valor ? (
                <b
                  className={
                    item.natureza === "ENTRADA"
                      ? styles.usuarioValorEntrada
                      : item.natureza === "SAIDA"
                        ? styles.usuarioValorSaida
                        : ""
                  }
                >
                  {valor}
                </b>
              ) : item.autoria ? (
                <span className={styles.usuarioAutoria}>
                  <ShieldCheck /> {item.autoria.email}
                </span>
              ) : null}
            </article>
          );
        })}
        {!carregando && !atividadesFiltradas.length ? (
          <div className={styles.usuarioExtratoVazio}>
            <ReceiptText />
            <strong>Nenhum registro neste filtro</strong>
            <p>As próximas movimentações aparecerão aqui.</p>
          </div>
        ) : null}
      </div>
      {atividadesFiltradas.length > 10 ? (
        <nav
          className={styles.usuarioPaginacao}
          aria-label="Paginação do histórico"
        >
          <button
            type="button"
            disabled={pagina === 1}
            onClick={() => setPagina((atual) => atual - 1)}
          >
            Anterior
          </button>
          <span>
            {pagina} / {totalPaginas}
          </span>
          <button
            type="button"
            disabled={pagina >= totalPaginas}
            onClick={() => setPagina((atual) => atual + 1)}
          >
            Próxima
          </button>
        </nav>
      ) : null}
    </section>
  );
}
