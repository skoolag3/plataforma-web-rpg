"use client";

import { ChevronDown, Power, RefreshCw, Save, Trash2, X } from "lucide-react";
import {
  useEffect,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { createPortal } from "react-dom";
import {
  obterImpactoAdminCarta,
  uploadCartaAssets,
  type AdminCarta,
  type CreateAdminCartaPayload,
  type UpdateAdminCartaPayload,
} from "../../lib/admin";
import { SelectPadrao } from "../../components/ui/controlesFormulario";
import {
  normalizarConfigVisual,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import { obterValorVendaCarta } from "../../lib/valorVendaCarta";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import editorStyles from "../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import {
  CampoArquivo,
  ControleVisualCarta,
  ElementoSelect,
  PreviewCarta,
  obterElementoVisual,
} from "./adminCartaVisual";
import { useAdminRaridades } from "./useAdminRaridades";
import { AdminCartaHabilidades } from "./adminCartaHabilidades";
import { combinarEstilos } from "./combinarEstilos";
import { AdminClasseSelect } from "./adminClasseSelect";
import { FotoPerfilCarta, gerarFotoPerfilCarta, type AjusteFotoPerfil } from "./fotoPerfilCarta";
import { formularioCartaAlterado } from "./adminCartaEditor.estado";
import { DetalheCarta } from "../../(private)/cartas/components/detalheCarta";
import { mapearCarta } from "../../(private)/cartas/cardData";
import type { CartaColecao } from "../../lib/jogo";
import { styles as inventarioStyles } from "../../(private)/cartas/styles";

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
  idClasse: string;
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
  onSave: (payload: UpdateAdminCartaPayload) => Promise<AdminCarta>;
  onDelete: () => Promise<void>;
  onDirtyChange: (alterado: boolean) => void;
  salvando: boolean;
}) {
  const raridades = useAdminRaridades();
  const [form, setForm] = useState<CartaFormState>(() => cartaToForm(carta));
  const [formSalvo, setFormSalvo] = useState<CartaFormState>(() =>
    cartaToForm(carta),
  );

  const [foto, setFoto] = useState<File | null>(null);
  const [fotoRemovida, setFotoRemovida] = useState(false);
  const [ajusteFotoPerfil, setAjusteFotoPerfil] = useState<AjusteFotoPerfil>(() => normalizarConfigVisual(carta.configVisual).fotoPerfil);
  const [fotoPerfilAlterada, setFotoPerfilAlterada] = useState(false);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [molduraRemovida, setMolduraRemovida] = useState(false);
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
  const [detalhesAbertos, setDetalhesAbertos] = useState(false);
  const [portalPronto, setPortalPronto] = useState(false);
  const formAlterado = formularioCartaAlterado(
    form,
    formSalvo,
    foto !== null || fotoPerfilAlterada || moldura !== null || fotoRemovida || molduraRemovida,
  );

  useEffect(() => {
    onDirtyChange(formAlterado);
    return () => onDirtyChange(false);
  }, [formAlterado, onDirtyChange]);

  useEffect(() => setPortalPronto(true), []);

  useEffect(() => {
    if (!detalhesAbertos) return;
    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setDetalhesAbertos(false);
    }
    document.addEventListener("keydown", fecharComEscape);
    return () => document.removeEventListener("keydown", fecharComEscape);
  }, [detalhesAbertos]);

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

  function alterarRaridade(raridade: CartaFormState["raridade"]) {
    setForm((atual) => ({
      ...atual,
      raridade,
      custo: String(raridades.find((item) => item.codigo === raridade)?.valorVenda ?? obterValorVendaCarta(raridade)),
    }));
  }

  function restaurarInformacoesSalvas() {
    const salvo = cartaToForm(carta);
    setForm((atual) => ({
      ...atual,
      nome: salvo.nome,
      raridade: salvo.raridade,
      elemento: salvo.elemento,
      classe: salvo.classe,
      idClasse: salvo.idClasse,
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

  function handleFotoChange(arquivos: File[]) {
    const file = arquivos[0] ?? null;
    if (file) setFotoRemovida(false);
    setFoto(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleMolduraChange(arquivos: File[]) {
    const file = arquivos[0] ?? null;
    if (file) setMolduraRemovida(false);
    setMoldura(file);
    setMolduraPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function removerImagem(tipo: "foto" | "moldura") {
    if (tipo === "foto") {
      handleFotoChange([]);
      setFotoRemovida(true);
      setFotoPerfilAlterada(false);
    } else {
      handleMolduraChange([]);
      setMolduraRemovida(true);
    }
  }

  async function baixarImagem(url: string, nome: string) {
    try {
      const resposta = await fetch(url);
      if (!resposta.ok) throw new Error();
      const arquivo = URL.createObjectURL(await resposta.blob());
      const link = document.createElement("a");
      link.href = arquivo;
      const extensao = resposta.headers.get("content-type")?.includes("jpeg") ? "jpg" : resposta.headers.get("content-type")?.includes("webp") ? "webp" : "png";
      link.download = `${nome}.${extensao}`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(arquivo), 1000);
    } catch {
      setErroLocal("Não foi possível baixar a imagem. Tente novamente.");
    }
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
        idClasse: form.idClasse || null,
        custo: toNumber(form.custo, "Valor de venda"),
        hpBase: toNumber(form.hpBase, "HP"),
        danoBase: toNumber(form.danoBase, "ATK"),
        defesaBase: toNumber(form.defesaBase, "DEF"),
        habilidadesIds: form.habilidadesIds,
        ativo: form.ativo,
        confirmarImpacto: carta.ativo && !form.ativo,
        configVisual: form.configVisual,
      };

      const fotoPerfil = cardImage && !fotoRemovida && (foto || fotoPerfilAlterada)
        ? await gerarFotoPerfilCarta(cardImage, ajusteFotoPerfil)
        : null;
      if (foto || fotoPerfil || moldura) {
        const formData = new FormData();
        if (foto) formData.append("foto", foto);
        if (fotoPerfil) formData.append("fotoPerfil", fotoPerfil);
        if (moldura) formData.append("moldura", moldura);

        const upload = await uploadCartaAssets(formData);
        payload.foto = fotoRemovida ? null : upload.foto?.url ?? carta.foto ?? null;
        payload.fotoPerfil = fotoRemovida ? null : upload.fotoPerfil?.url ?? carta.fotoPerfil ?? null;
        payload.moldura = molduraRemovida ? null : upload.moldura?.url ?? carta.moldura ?? null;
      } else {
        payload.foto = fotoRemovida ? null : carta.foto;
        payload.fotoPerfil = fotoRemovida ? null : carta.fotoPerfil;
        payload.moldura = molduraRemovida ? null : carta.moldura;
      }

      const atualizada = await onSave(payload);
      const novoFormSalvo = cartaToForm(atualizada);
      setForm(novoFormSalvo);
      setFormSalvo(novoFormSalvo);
      setAjusteFotoPerfil(
        normalizarConfigVisual(atualizada.configVisual).fotoPerfil,
      );
      setFoto(null);
      setFotoRemovida(false);
      setMoldura(null);
      setMolduraRemovida(false);
      setFotoPerfilAlterada(false);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      setMolduraPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      onDirtyChange(false);
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

  const cardImage = fotoRemovida ? undefined : previewUrl ?? carta.foto ?? undefined;
  const cardFrame = molduraRemovida ? undefined : molduraPreviewUrl ?? carta.moldura ?? undefined;
  const cartaDetalhe = mapearCarta({
    id: carta.id,
    nome: form.nome || "Carta",
    raridade: form.raridade,
    elemento: form.elemento,
    classe: form.classe || "Sem classe",
    prioridadeAtaque: carta.classeDetalhes?.prioridadeAtaque ?? 50,
    custo: Number(form.custo) || 0,
    hpBase: Number(form.hpBase) || 0,
    danoBase: Number(form.danoBase) || 0,
    defesaBase: Number(form.defesaBase) || 0,
    habilidades: carta.habilidades.filter((habilidade) =>
      form.habilidadesIds.includes(habilidade.id),
    ),
    passiva: carta.passiva,
    foto: cardImage ?? null,
    moldura: cardFrame ?? null,
    configVisual: form.configVisual,
    quantidade: 1,
    obtida: true,
    obtidaEm: null,
  } satisfies CartaColecao);

  return (
    <>
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
              <div className={styles.campoDropdown}>
                <span>Raridade</span>
                <SelectPadrao
                  valor={form.raridade}
                  aoAlterar={(valor) =>
                    alterarRaridade(valor as CartaFormState["raridade"])
                  }
                  placeholder="Raridade"
                  opcoes={raridades.map((raridade) => ({
                    valor: raridade.codigo,
                    label: raridade.nome,
                    cor: raridade.cor,
                  }))}
                />
              </div>
              <label className={styles.campoElemento}>
                Elemento
                <ElementoSelect
                  value={form.elemento}
                  onChange={(value) => {
                    if (value) updateField("elemento", value);
                  }}
                />
              </label>
              <AdminClasseSelect
                idClasse={form.idClasse}
                classeLegada={form.classe}
                aoSelecionar={(classe) =>
                  setForm((atual) => ({
                    ...atual,
                    idClasse: classe?.id ?? "",
                    classe: classe?.nome ?? "",
                  }))
                }
              />
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
                <small>Valor de venda, vida, ataque e defesa</small>
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
                Valor de venda em Rubys
                <input
                  inputMode="numeric"
                  value={form.custo}
                  readOnly
                  title="Valor de venda definido automaticamente pela raridade"
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
              <div className={styles.campoImagemEditor}>
                <CampoArquivo rotulo="Foto/personagem" rotuloBotao={cardImage ? "Modificar imagem" : "Escolher imagem"} accept="image/*" ajuda="PNG, JPG ou WEBP, até 5 MB." onFilesSelected={handleFotoChange} />
                {cardImage ? <div className={styles.acoesImagem}><button type="button" onClick={() => void baixarImagem(cardImage, `${form.nome || "carta"}-foto`)}>Baixar imagem</button><button type="button" onClick={() => removerImagem("foto")}>Remover imagem</button></div> : null}
              </div>
              <div className={styles.campoImagemEditor}>
                <CampoArquivo rotulo="Moldura" rotuloBotao={cardFrame ? "Modificar imagem" : "Escolher moldura"} accept="image/png,image/webp" ajuda="PNG ou WEBP transparente, até 5 MB. Ajuste o encaixe no compositor." onFilesSelected={handleMolduraChange} />
                {cardFrame ? <div className={styles.acoesImagem}><button type="button" onClick={() => void baixarImagem(cardFrame, `${form.nome || "carta"}-moldura`)}>Baixar imagem</button><button type="button" onClick={() => removerImagem("moldura")}>Remover imagem</button></div> : null}
              </div>
              <ControleVisualCarta
                value={form.configVisual}
                arte={cardImage}
                moldura={cardFrame}
                onChange={(configVisual) =>
                  updateField("configVisual", configVisual)
                }
              />
              <FotoPerfilCarta arte={cardImage} ajuste={ajusteFotoPerfil} aoAlterar={(ajuste) => {
                setAjusteFotoPerfil(ajuste);
                setFotoPerfilAlterada(true);
                updateField("configVisual", { ...form.configVisual, fotoPerfil: ajuste });
              }} />
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
            configVisual={form.configVisual}
            onAbrirDetalhes={() => setDetalhesAbertos(true)}
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
    {detalhesAbertos && portalPronto
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

function cartaToForm(carta: AdminCarta): CartaFormState {
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
