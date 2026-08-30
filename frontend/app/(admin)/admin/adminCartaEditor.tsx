"use client";

import { ChevronDown, Power, RefreshCw, Save, Trash2, X } from "lucide-react";
import {
  useEffect,
  useState,
  type ChangeEvent,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  obterImpactoAdminCarta,
  uploadCartaAssets,
  type AdminCarta,
  type CreateAdminCartaPayload,
  type UpdateAdminCartaPayload,
} from "../../lib/admin";
import {
  normalizarConfigVisual,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import editorStyles from "../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import {
  CampoArquivo,
  ControleVisualCarta,
  ElementoSelect,
  PreviewCarta,
  classesCarta,
  classeRaridade,
  obterElementoVisual,
  raridades,
} from "./adminCartaVisual";
import { AdminCartaHabilidades } from "./adminCartaHabilidades";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

type CartaFormState = {
  nome: string;
  raridade: CreateAdminCartaPayload["raridade"];
  elemento: CreateAdminCartaPayload["elemento"];
  classe: string;
  custo: string;
  hpBase: string;
  danoBase: string;
  defesaBase: string;
  habilidadesIds: string[];
  ativo: boolean;
  configVisual: ConfigVisualCarta;
};

export function CartaEditor({
  carta,
  onClose,
  onSave,
  onDelete,
  onDirtyChange,
  salvando,
}: {
  carta: AdminCarta;
  onClose: () => void;
  onSave: (payload: UpdateAdminCartaPayload) => Promise<void>;
  onDelete: () => Promise<void>;
  onDirtyChange: (alterado: boolean) => void;
  salvando: boolean;
}) {
  const [form, setForm] = useState<CartaFormState>(() => cartaToForm(carta));

  const [foto, setFoto] = useState<File | null>(null);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [molduraPreviewUrl, setMolduraPreviewUrl] = useState<string | null>(
    null,
  );
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [confirmandoExclusao, setConfirmandoExclusao] = useState(false);
  const [confirmacaoExclusao, setConfirmacaoExclusao] = useState("");
  const [impactoExclusao, setImpactoExclusao] = useState<number | null>(null);
  const [impactoStatus, setImpactoStatus] = useState<number | null>(null);
  const [carregandoImpacto, setCarregandoImpacto] = useState(false);
  const formAlterado =
    foto !== null ||
    moldura !== null ||
    JSON.stringify(form) !== JSON.stringify(cartaToForm(carta));

  useEffect(() => {
    onDirtyChange(formAlterado);
    return () => onDirtyChange(false);
  }, [formAlterado, onDirtyChange]);

  useEffect(() => {
    function confirmarSaida(event: BeforeUnloadEvent) {
      if (!formAlterado) return;
      event.preventDefault();
    }

    window.addEventListener("beforeunload", confirmarSaida);
    return () => window.removeEventListener("beforeunload", confirmarSaida);
  }, [formAlterado]);

  function updateField<K extends keyof CartaFormState>(
    field: K,
    value: CartaFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function restaurarInformacoesSalvas() {
    const salvo = cartaToForm(carta);
    setForm((atual) => ({
      ...atual,
      nome: salvo.nome,
      raridade: salvo.raridade,
      elemento: salvo.elemento,
      classe: salvo.classe,
      habilidadesIds: salvo.habilidadesIds,
      ativo: salvo.ativo,
    }));
  }

  function restaurarEstatisticasSalvas() {
    const salvo = cartaToForm(carta);
    setForm((atual) => ({
      ...atual,
      custo: salvo.custo,
      hpBase: salvo.hpBase,
      danoBase: salvo.danoBase,
      defesaBase: salvo.defesaBase,
    }));
  }

  function handleFotoChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setFoto(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleMolduraChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    setMoldura(file);
    setMolduraPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErroLocal(null);

    try {
      const payload: UpdateAdminCartaPayload = {
        nome: form.nome.trim(),
        raridade: form.raridade,
        elemento: form.elemento,
        classe: form.classe.trim() || undefined,
        custo: toNumber(form.custo, "Custo"),
        hpBase: toNumber(form.hpBase, "HP"),
        danoBase: toNumber(form.danoBase, "ATK"),
        defesaBase: toNumber(form.defesaBase, "DEF"),
        habilidadesIds: form.habilidadesIds,
        ativo: form.ativo,
        confirmarImpacto: carta.ativo && !form.ativo,
        configVisual: form.configVisual,
      };

      if (foto || moldura) {
        const formData = new FormData();
        if (foto) formData.append("foto", foto);
        if (moldura) formData.append("moldura", moldura);

        const upload = await uploadCartaAssets(formData);
        payload.foto = upload.foto?.url ?? carta.foto ?? undefined;
        payload.moldura = upload.moldura?.url ?? carta.moldura ?? undefined;
      } else {
        payload.foto = carta.foto ?? undefined;
        payload.moldura = carta.moldura ?? undefined;
      }

      await onSave(payload);
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a carta.",
      );
    }
  }

  async function verificarImpacto(
    definirImpacto: (quantidade: number) => void,
  ) {
    setErroLocal(null);
    setCarregandoImpacto(true);

    try {
      const impacto = await obterImpactoAdminCarta(carta.id);
      definirImpacto(impacto.usuariosComCarta);
    } catch (error) {
      setErroLocal(
        error instanceof Error
          ? error.message
          : "Não foi possível verificar os usuários afetados.",
      );
    } finally {
      setCarregandoImpacto(false);
    }
  }

  async function prepararAlteracaoStatus() {
    if (!form.ativo) {
      updateField("ativo", true);
      return;
    }

    await verificarImpacto(setImpactoStatus);
  }

  async function confirmarDesativacao() {
    updateField("ativo", false);
    setImpactoStatus(null);
  }

  async function continuarExclusao() {
    if (confirmacaoExclusao !== carta.nome) {
      setErroLocal("Digite exatamente o nome da carta para continuar.");
      return;
    }

    await verificarImpacto(setImpactoExclusao);
  }

  async function handleDelete() {
    if (confirmacaoExclusao !== carta.nome) {
      setErroLocal(
        "Digite exatamente o nome da carta para confirmar a remoção.",
      );
      return;
    }

    if (impactoExclusao === null) {
      setErroLocal(
        "Verifique o impacto nos usuários antes de remover a carta.",
      );
      return;
    }

    setErroLocal(null);
    await onDelete();
  }

  const cardImage = previewUrl ?? carta.foto ?? undefined;
  const cardFrame = molduraPreviewUrl ?? carta.moldura ?? undefined;

  return (
    <form className={styles.editPanel} onSubmit={handleSubmit}>
      <header>
        <div>
          <h2>Editando carta</h2>
          <p
            className={styles.nomeCartaElemento}
            style={
              {
                "--elemento-cor": obterElementoVisual(form.elemento).cor,
              } as CSSProperties
            }
          >
            {carta.nome}
          </p>
        </div>
        <button type="button" onClick={onClose} aria-label="Fechar editor">
          <X aria-hidden="true" />
        </button>
      </header>
      {erroLocal ? <p className={styles.feedbackError}>{erroLocal}</p> : null}
      <section className={styles.editorGrid}>
        <div className={styles.formPanel}>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Informações</strong>
                <small>Identidade, classificação e efeitos da carta</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}>
                <button type="button" onClick={restaurarInformacoesSalvas}>
                  <RefreshCw aria-hidden="true" /> Restaurar informações
                </button>
              </div>
              <label>
                Nome
                <input
                  className={styles.nomePersonagemElemento}
                  style={
                    {
                      "--elemento-cor": obterElementoVisual(form.elemento).cor,
                    } as CSSProperties
                  }
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                />
              </label>
              <label>
                Raridade
                <select
                  className={`${styles.selectRaridade} ${classeRaridade(form.raridade)}`}
                  value={form.raridade}
                  onChange={(event) =>
                    updateField(
                      "raridade",
                      event.target.value as CartaFormState["raridade"],
                    )
                  }
                >
                  {raridades.map((raridade) => (
                    <option className={classeRaridade(raridade)} key={raridade}>
                      {raridade}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Elemento
                <ElementoSelect
                  value={form.elemento}
                  onChange={(value) => {
                    if (value) updateField("elemento", value);
                  }}
                />
              </label>
              <label>
                Classe
                <select
                  value={form.classe}
                  onChange={(event) =>
                    updateField("classe", event.target.value)
                  }
                >
                  <option value="">Selecione</option>
                  {form.classe &&
                  !classesCarta.includes(
                    form.classe as (typeof classesCarta)[number],
                  ) ? (
                    <option value={form.classe}>{form.classe} (legada)</option>
                  ) : null}
                  {classesCarta.map((classe) => (
                    <option key={classe}>{classe}</option>
                  ))}
                </select>
              </label>
              <AdminCartaHabilidades
                selecionadasIds={form.habilidadesIds}
                habilidadesIniciais={carta.habilidades}
                aoAlterar={(ids) => updateField("habilidadesIds", ids)}
              />
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Estatísticas</strong>
                <small>Custo, vida, ataque e defesa</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <div className={styles.sectionResetRow}>
                <button type="button" onClick={restaurarEstatisticasSalvas}>
                  <RefreshCw aria-hidden="true" /> Restaurar estatísticas
                </button>
              </div>
              <label>
                Custo
                <input
                  inputMode="numeric"
                  value={form.custo}
                  onChange={(event) => updateField("custo", event.target.value)}
                />
              </label>
              <label>
                HP
                <input
                  inputMode="numeric"
                  value={form.hpBase}
                  onChange={(event) =>
                    updateField("hpBase", event.target.value)
                  }
                />
              </label>
              <label>
                ATK
                <input
                  inputMode="numeric"
                  value={form.danoBase}
                  onChange={(event) =>
                    updateField("danoBase", event.target.value)
                  }
                />
              </label>
              <label>
                DEF
                <input
                  inputMode="numeric"
                  value={form.defesaBase}
                  onChange={(event) =>
                    updateField("defesaBase", event.target.value)
                  }
                />
              </label>
            </div>
          </details>
          <details className={styles.editorSection}>
            <summary>
              <span>
                <strong>Personalizar</strong>
                <small>Arte, moldura e encaixe visual</small>
              </span>
              <ChevronDown aria-hidden="true" />
            </summary>
            <div className={styles.editorSectionContent}>
              <CampoArquivo
                rotulo="Foto/personagem"
                accept="image/*"
                ajuda="PNG, JPG ou WEBP, até 5 MB."
                onChange={handleFotoChange}
              />
              <CampoArquivo
                rotulo="Moldura"
                accept="image/png,image/webp"
                ajuda="PNG ou WEBP transparente, proporção 2:3."
                onChange={handleMolduraChange}
              />
              <ControleVisualCarta
                value={form.configVisual}
                arte={cardImage}
                moldura={cardFrame}
                onChange={(configVisual) =>
                  updateField("configVisual", configVisual)
                }
              />
            </div>
          </details>
          <details
            className={`${styles.editorSection} ${styles.advancedSection}`}
          >
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
                  <strong>
                    {form.ativo ? "Carta ativa" : "Carta inativa"}
                  </strong>
                  <small>
                    {form.ativo
                      ? "A carta pode aparecer no jogo e nas coleções."
                      : "A carta permanece cadastrada, mas não fica disponível no jogo."}
                  </small>
                </div>
                {impactoStatus === null ? (
                  <button
                    type="button"
                    onClick={() => void prepararAlteracaoStatus()}
                    disabled={salvando || carregandoImpacto}
                  >
                    <Power aria-hidden="true" />
                    {carregandoImpacto
                      ? "Verificando..."
                      : form.ativo
                        ? "Desativar carta"
                        : "Ativar carta"}
                  </button>
                ) : (
                  <div className={styles.impactConfirmation}>
                    <strong>{mensagemImpacto(impactoStatus)}</strong>
                    <span>Deseja mesmo desativar esta carta?</span>
                    <div>
                      <button
                        type="button"
                        onClick={() => setImpactoStatus(null)}
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => void confirmarDesativacao()}
                        disabled={salvando}
                      >
                        Confirmar desativação
                      </button>
                    </div>
                  </div>
                )}
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
                      Digite <strong>{carta.nome}</strong> para confirmar
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
                          carregandoImpacto ||
                          confirmacaoExclusao !== carta.nome
                        }
                      >
                        {carregandoImpacto
                          ? "Verificando usuários..."
                          : "Continuar"}
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
        </div>
        <aside className={styles.previewPanel}>
          <h2>Pré-visualização</h2>
          <PreviewCarta
            arte={cardImage}
            moldura={cardFrame}
            nome={form.nome || "Carta"}
            raridade={form.raridade}
            elemento={form.elemento}
            classe={form.classe}
            hpBase={Number(form.hpBase) || 0}
            danoBase={Number(form.danoBase) || 0}
            defesaBase={Number(form.defesaBase) || 0}
            configVisual={form.configVisual}
          />
          <div className={styles.editorActions}>
            <button type="button" onClick={onClose}>
              Cancelar
            </button>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={salvando}
            >
              <Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </aside>
      </section>
    </form>
  );
}

function cartaToForm(carta: AdminCarta): CartaFormState {
  return {
    nome: carta.nome,
    raridade: carta.raridade,
    elemento: carta.elemento,
    classe: carta.classe ?? "",
    custo: carta.custo?.toString() ?? "0",
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

function mensagemImpacto(usuariosComCarta: number) {
  if (usuariosComCarta === 0) {
    return "Nenhum usuário possui esta carta atualmente.";
  }

  if (usuariosComCarta === 1) {
    return "Há 1 usuário com esta carta.";
  }

  return `Há ${usuariosComCarta} usuários com esta carta.`;
}

function toNumber(value: string, label: string) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} precisa ser um número inteiro positivo.`);
  }

  return number;
}
