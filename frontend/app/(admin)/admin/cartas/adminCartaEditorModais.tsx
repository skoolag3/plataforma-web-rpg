"use client";

import { ChevronDown, Power, Trash2 } from "lucide-react";
import { createPortal } from "react-dom";
import type { AdminCarta, CreateAdminCartaPayload } from "../../../lib/admin";
import {
  normalizarConfigVisual,
  type ConfigVisualCarta,
} from "../../../components/cartaMontada";
import { obterValorVendaCarta } from "../../../lib/valorVendaCarta";
import { DetalheCarta } from "../../../(private)/cartas/components/detalheCarta";
import type { Card } from "../../../(private)/cartas/types";
import { styles as inventarioStyles } from "../../../(private)/cartas/styles";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import editorStyles from "../../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../../styles/admin/adminCartasLista.module.css";
import { combinarEstilos } from "../shared/combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

export type CartaFormState = {
  nome: string;
  raridade: CreateAdminCartaPayload["raridade"];
  elemento: CreateAdminCartaPayload["elemento"];
  classe: string;
  idClasse: string;
  custo: string;
  hpBase: string;
  danoBase: string;
  defesaBase: string;
  habilidadesIds: string[];
  ativo: boolean;
  configVisual: ConfigVisualCarta;
};

export function cartaToForm(carta: AdminCarta): CartaFormState {
  return {
    nome: carta.nome,
    raridade: carta.raridade,
    elemento: carta.elemento,
    classe: carta.classe ?? "",
    idClasse: carta.idClasse ?? "",
    custo: String(carta.custo ?? obterValorVendaCarta(carta.raridade)),
    hpBase: carta.hpBase.toString(),
    danoBase: carta.danoBase.toString(),
    defesaBase: carta.defesaBase.toString(),
    habilidadesIds: (carta.habilidades ?? []).map(
      (habilidade) => habilidade.id,
    ),
    ativo: carta.ativo,
    configVisual: normalizarConfigVisual(carta.configVisual),
  };
}

export function mensagemImpacto(usuariosComCarta: number) {
  if (usuariosComCarta === 0) {
    return "Nenhum usuário possui esta carta atualmente.";
  }

  if (usuariosComCarta === 1) {
    return "Há 1 usuário com esta carta.";
  }

  return `Há ${usuariosComCarta} usuários com esta carta.`;
}

export function toNumber(value: string, label: string) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} precisa ser um número inteiro positivo.`);
  }

  return number;
}

export async function baixarImagemCarta(
  url: string,
  nome: string,
  onErro: () => void,
) {
  try {
    const resposta = await fetch(url);
    if (!resposta.ok) throw new Error();
    const arquivo = URL.createObjectURL(await resposta.blob());
    const link = document.createElement("a");
    link.href = arquivo;
    const extensao = resposta.headers.get("content-type")?.includes("jpeg")
      ? "jpg"
      : resposta.headers.get("content-type")?.includes("webp")
        ? "webp"
        : "png";
    link.download = `${nome}.${extensao}`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(arquivo), 1000);
  } catch {
    onErro();
  }
}

export function SecaoAvancadaCartaEditor({
  nomeCarta,
  ativo,
  salvando,
  carregandoImpacto,
  confirmandoExclusao,
  setConfirmandoExclusao,
  confirmacaoExclusao,
  setConfirmacaoExclusao,
  impactoExclusao,
  setImpactoExclusao,
  prepararAlteracaoStatus,
  continuarExclusao,
  handleDelete,
}: {
  nomeCarta: string;
  ativo: boolean;
  salvando: boolean;
  carregandoImpacto: boolean;
  confirmandoExclusao: boolean;
  setConfirmandoExclusao: (valor: boolean) => void;
  confirmacaoExclusao: string;
  setConfirmacaoExclusao: (valor: string) => void;
  impactoExclusao: number | null;
  setImpactoExclusao: (valor: number | null) => void;
  prepararAlteracaoStatus: () => Promise<void>;
  continuarExclusao: () => Promise<void>;
  handleDelete: () => Promise<void>;
}) {
  return (
    <details className={`${styles.editorSection} ${styles.advancedSection}`}>
      <summary>
        <span>
          <strong>Avançado</strong>
          <small>Status, desativação e remoção da carta</small>
        </span>
        <ChevronDown aria-hidden="true" />
      </summary>
      <div
        className={`${styles.editorSectionContent} ${styles.advancedContent}`}
      >
        <div className={styles.statusManagement}>
          <div>
            <strong>{ativo ? "Carta ativa" : "Carta inativa"}</strong>
            <small>
              {ativo
                ? "A carta pode aparecer no jogo e nas coleções."
                : "A carta permanece cadastrada, mas não fica disponível no jogo."}
            </small>
          </div>
          <button
            type="button"
            onClick={() => void prepararAlteracaoStatus()}
            disabled={salvando || carregandoImpacto}
          >
            <Power aria-hidden="true" />
            {carregandoImpacto
              ? "Verificando..."
              : ativo
                ? "Desativar carta"
                : "Ativar carta"}
          </button>
        </div>

        <div className={styles.dangerZone}>
          <div>
            <strong>Remover carta</strong>
            <small>
              Faz uma exclusão lógica: a carta deixa de ser exibida, mas o
              registro continua preservado.
            </small>
          </div>
          {!confirmandoExclusao ? (
            <button
              type="button"
              className={styles.dangerButton}
              onClick={() => setConfirmandoExclusao(true)}
              disabled={salvando}
            >
              <Trash2 aria-hidden="true" /> Remover carta
            </button>
          ) : impactoExclusao === null ? (
            <div className={styles.deleteConfirmation}>
              <label>
                Digite <strong>{nomeCarta}</strong> para confirmar
                <input
                  value={confirmacaoExclusao}
                  onChange={(event) =>
                    setConfirmacaoExclusao(event.target.value)
                  }
                  autoComplete="off"
                />
              </label>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setConfirmandoExclusao(false);
                    setConfirmacaoExclusao("");
                    setImpactoExclusao(null);
                  }}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void continuarExclusao()}
                  disabled={
                    carregandoImpacto || confirmacaoExclusao !== nomeCarta
                  }
                >
                  {carregandoImpacto ? "Verificando usuários..." : "Continuar"}
                </button>
              </div>
            </div>
          ) : (
            <div
              className={`${styles.deleteConfirmation} ${styles.impactConfirmation}`}
            >
              <strong>{mensagemImpacto(impactoExclusao)}</strong>
              <span>Deseja mesmo remover esta carta?</span>
              <div>
                <button
                  type="button"
                  onClick={() => setImpactoExclusao(null)}
                >
                  Voltar
                </button>
                <button
                  type="button"
                  className={styles.dangerButton}
                  onClick={() => void handleDelete()}
                  disabled={salvando}
                >
                  <Trash2 aria-hidden="true" /> Sim, remover carta
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </details>
  );
}

export function ModaisCartaEditor({
  portalPronto,
  impactoStatus,
  setImpactoStatus,
  confirmarDesativacao,
  imagemParaRemover,
  setImagemParaRemover,
  removerImagem,
  detalhesAbertos,
  setDetalhesAbertos,
  cartaDetalhe,
}: {
  portalPronto: boolean;
  impactoStatus: number | null;
  setImpactoStatus: (valor: number | null) => void;
  confirmarDesativacao: () => void;
  imagemParaRemover: "foto" | "moldura" | null;
  setImagemParaRemover: (valor: "foto" | "moldura" | null) => void;
  removerImagem: (tipo: "foto" | "moldura") => void;
  detalhesAbertos: boolean;
  setDetalhesAbertos: (valor: boolean) => void;
  cartaDetalhe: Card;
}) {
  if (!portalPronto) return null;

  return (
    <>
      {impactoStatus !== null
        ? createPortal(
            <div
              className={styles.fundoConfirmacaoImagem}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setImpactoStatus(null);
                }
              }}
            >
              <section
                className={styles.confirmacaoImagem}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="titulo-confirmar-desativacao"
                aria-describedby="descricao-confirmar-desativacao"
                onKeyDown={(event) => {
                  if (event.key === "Escape") setImpactoStatus(null);
                }}
              >
                <h2 id="titulo-confirmar-desativacao">Desativar carta?</h2>
                <p id="descricao-confirmar-desativacao">
                  {mensagemImpacto(impactoStatus)} A alteração será aplicada
                  quando você clicar em Salvar.
                </p>
                <div className={styles.acoesConfirmacaoImagem}>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setImpactoStatus(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmarDesativacao()}
                  >
                    Confirmar desativação
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
      {imagemParaRemover
        ? createPortal(
            <div
              className={styles.fundoConfirmacaoImagem}
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setImagemParaRemover(null);
                }
              }}
            >
              <section
                className={styles.confirmacaoImagem}
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="titulo-confirmar-remocao-imagem"
                aria-describedby="descricao-confirmar-remocao-imagem"
              >
                <h2 id="titulo-confirmar-remocao-imagem">
                  Remover{" "}
                  {imagemParaRemover === "foto" ? "foto/personagem" : "moldura"}
                  ?
                </h2>
                <p id="descricao-confirmar-remocao-imagem">
                  A prévia ficará sem essa imagem. A alteração será aplicada à
                  carta quando você clicar em Salvar.
                </p>
                <div className={styles.acoesConfirmacaoImagem}>
                  <button
                    type="button"
                    autoFocus
                    onClick={() => setImagemParaRemover(null)}
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={() => removerImagem(imagemParaRemover)}
                  >
                    Remover imagem
                  </button>
                </div>
              </section>
            </div>,
            document.body,
          )
        : null}
      {detalhesAbertos
        ? createPortal(
            <div
              className={inventarioStyles.modalDetalhe}
              role="dialog"
              aria-modal="true"
              aria-label={`Detalhes da carta ${cartaDetalhe.nome}`}
              onClick={(event) => {
                if (event.target === event.currentTarget) {
                  setDetalhesAbertos(false);
                }
              }}
            >
              <DetalheCarta
                carta={cartaDetalhe}
                favorita={false}
                aoAlternarFavorita={() => undefined}
                aoAdicionarAoDeck={() => undefined}
                aoFechar={() => setDetalhesAbertos(false)}
                modoAdmin
              />
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
