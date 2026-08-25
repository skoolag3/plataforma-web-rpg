"use client";

import { Layers, ReceiptText, UserRound, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  ajustarColecaoAdminUsuario,
  ajustarSaldoAdminUsuario,
  obterAtividadeAdminUsuario,
  obterColecaoAdminUsuario,
  type AdminUsuario,
  type AdminUsuarioAtividade,
  type AdminUsuarioCarta,
  type AjusteSaldoUsuarioPayload,
} from "../../lib/admin";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import featureStyles from "../../styles/admin/adminUsuarios.module.css";

import { AdminUsuarioColecao } from "./adminUsuarioColecao";
import { AdminUsuarioFinanceiro } from "./adminUsuarioFinanceiro";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, featureStyles);


type AbaUsuario = "resumo" | "colecao" | "financeiro";

type Props = {
  usuario: AdminUsuario;
  onClose: () => void;
  onUpdateUsuario: (usuario: AdminUsuario) => void;
};

function formatNumber(value: number) {
  return new Intl.NumberFormat("pt-BR").format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

export function AdminUsuarioPainel({ usuario, onClose, onUpdateUsuario }: Props) {
  const [aba, setAba] = useState<AbaUsuario>("resumo");
  const [colecao, setColecao] = useState<AdminUsuarioCarta[]>([]);
  const [atividades, setAtividades] = useState<AdminUsuarioAtividade[]>([]);
  const [colecaoCarregada, setColecaoCarregada] = useState(false);
  const [atividadeCarregada, setAtividadeCarregada] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (aba !== "colecao" || colecaoCarregada) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    obterColecaoAdminUsuario(usuario.id)
      .then((res) => { if (ativo) { setColecao(res); setColecaoCarregada(true); } })
      .catch((error) => { if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o inventário."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [aba, colecaoCarregada, usuario.id]);

  useEffect(() => {
    if (aba !== "financeiro" || atividadeCarregada) return;
    let ativo = true;
    setCarregando(true);
    setErro(null);
    obterAtividadeAdminUsuario(usuario.id)
      .then((res) => { if (ativo) { setAtividades(res); setAtividadeCarregada(true); } })
      .catch((error) => { if (ativo) setErro(error instanceof Error ? error.message : "Não foi possível carregar o histórico."); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, [aba, atividadeCarregada, usuario.id]);

  async function ajustarCarta(carta: AdminUsuarioCarta, quantidade: number) {
    setSalvando(true);
    setErro(null);
    setFeedback(null);
    try {
      setColecao(await ajustarColecaoAdminUsuario(usuario.id, carta.id, quantidade));
      setAtividadeCarregada(false);
      setFeedback(quantidade > 0 ? `${carta.nome} adicionada ao inventário.` : `Uma cópia de ${carta.nome} foi removida.`);
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível ajustar o inventário.");
    } finally {
      setSalvando(false);
    }
  }

  async function ajustarSaldo(payload: AjusteSaldoUsuarioPayload) {
    if (payload.rubys === 0) {
      setErro("Informe uma quantidade de Rubys.");
      return false;
    }
    setSalvando(true);
    setErro(null);
    setFeedback(null);
    try {
      const atualizado = await ajustarSaldoAdminUsuario(usuario.id, payload);
      onUpdateUsuario(atualizado);
      setAtividades(await obterAtividadeAdminUsuario(usuario.id));
      setAtividadeCarregada(true);
      setFeedback("Saldo atualizado com autoria registrada.");
      return true;
    } catch (error) {
      setErro(error instanceof Error ? error.message : "Não foi possível ajustar o saldo.");
      return false;
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className={styles.modalBackdrop} role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`${styles.usuarioPainel} ${styles.usuarioModal}`} role="dialog" aria-modal="true" aria-labelledby="usuario-painel-titulo">
        <header className={styles.usuarioPainelTopo}>
          <span className={styles.usuarioAvatar}><UserRound aria-hidden="true" /></span>
          <div><h2 id="usuario-painel-titulo">{usuario.nome}</h2><p>{usuario.email}</p></div>
          <button type="button" onClick={onClose} aria-label="Fechar gerenciamento"><X aria-hidden="true" /></button>
        </header>

        <nav className={styles.usuarioTabs} aria-label="Opções do usuário">
          <button type="button" className={aba === "resumo" ? styles.usuarioTabAtiva : ""} onClick={() => setAba("resumo")}><UserRound /> Resumo</button>
          <button type="button" className={aba === "colecao" ? styles.usuarioTabAtiva : ""} onClick={() => setAba("colecao")}><Layers /> Coleção</button>
          <button type="button" className={aba === "financeiro" ? styles.usuarioTabAtiva : ""} onClick={() => setAba("financeiro")}><ReceiptText /> Financeiro</button>
        </nav>

        {erro ? <p className={styles.feedbackError}>{erro}</p> : null}
        {feedback ? <p className={styles.feedbackSuccess}>{feedback}</p> : null}

        {aba === "resumo" ? (
          <div className={styles.usuarioResumo}>
            <span><small>Nível</small><strong>{usuario.nivel}</strong></span>
            <span><small>Partidas</small><strong>{formatNumber(usuario.partidas)}</strong></span>
            <span><small>Rubys</small><strong>{formatNumber(usuario.rubys)}</strong></span>
            <span><small>E-mail</small><strong>{usuario.emailVerificado ? "Verificado" : "Pendente"}</strong></span>
            <span><small>Último login</small><strong>{formatDate(usuario.ultimoLoginEm)}</strong></span>
          </div>
        ) : null}

        {aba === "colecao" ? <AdminUsuarioColecao colecao={colecao} carregando={carregando} salvando={salvando} onAjustar={ajustarCarta} /> : null}
        {aba === "financeiro" ? <AdminUsuarioFinanceiro usuario={usuario} atividades={atividades} carregando={carregando} salvando={salvando} onAjustarSaldo={ajustarSaldo} /> : null}
      </section>
    </div>
  );
}
