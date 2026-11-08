"use client";

import { ChevronDown, Power, RefreshCw, Save } from "lucide-react";
import Link from "next/link";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import {
  criarAdminCarta,
  uploadCartaAssets,
  type CreateAdminCartaPayload,
} from "../../../lib/admin";
import { SelectPadrao } from "../../../components/ui/controlesFormulario";
import {
  criarConfigVisualPadrao,
  type ConfigVisualCarta,
} from "../../../components/cartaMontada";
import {
  notificarErro,
  notificarSucesso,
} from "../../../components/notificacoesGlobais";
import sharedStyles from "../../../styles/admin/adminShared.module.css";
import editorStyles from "../../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../../styles/admin/adminCartasLista.module.css";
import { obterValorVendaCarta } from "../../../lib/valorVendaCarta";
import {
  CampoArquivo,
  ControleVisualCarta,
  ElementoSelect,
  PreviewCarta,
  obterElementoVisual,
} from "./adminCartaVisual";
import { useAdminRaridades } from "./useAdminRaridades";
import { AdminCartaHabilidades } from "./adminCartaHabilidades";
import { AdminClasseSelect } from "./adminClasseSelect";
import { FotoPerfilCarta, ajusteFotoPerfilPadrao, gerarFotoPerfilCarta, type AjusteFotoPerfil } from "./fotoPerfilCarta";
import { AdminLayout } from "../shared/adminShared";
import { combinarEstilos } from "../shared/combinarEstilos";

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

function criarFormularioNovaCarta(): CartaFormState {
  return {
    nome: "",
    raridade: "N",
    elemento: "natureza",
    classe: "",
    idClasse: "",
    custo: String(obterValorVendaCarta("N")),
    hpBase: "100",
    danoBase: "20",
    defesaBase: "10",
    habilidadesIds: [],
    ativo: true,
    configVisual: criarConfigVisualPadrao(),
  };
}

export function NovaCarta() {
  const raridades = useAdminRaridades();
  const [form, setForm] = useState<CartaFormState>(criarFormularioNovaCarta);
  const [foto, setFoto] = useState<File | null>(null);
  const [ajusteFotoPerfil, setAjusteFotoPerfil] = useState<AjusteFotoPerfil>(ajusteFotoPerfilPadrao);
  const [moldura, setMoldura] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [molduraPreviewUrl, setMolduraPreviewUrl] = useState<string | null>(
    null,
  );
  const [salvando, setSalvando] = useState(false);
  const envioEmAndamento = useRef(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  useEffect(() => {
    setForm((atual) => ({
      ...atual,
      custo: String(raridades.find((item) => item.codigo === atual.raridade)?.valorVenda ?? obterValorVendaCarta(atual.raridade)),
    }));
  }, [raridades]);

  useEffect(() => {
    if (!feedback) return;
    if (feedback.type === "success") notificarSucesso(feedback.text);
    else notificarErro(feedback.text);
  }, [feedback]);

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

  function resetarInformacoes() {
    const padrao = criarFormularioNovaCarta();
    setForm((atual) => ({
      ...atual,
      nome: padrao.nome,
      raridade: padrao.raridade,
      elemento: padrao.elemento,
      classe: padrao.classe,
      idClasse: padrao.idClasse,
      habilidadesIds: padrao.habilidadesIds,
      ativo: padrao.ativo,
    }));
  }

  function resetarEstatisticas() {
    const padrao = criarFormularioNovaCarta();
    setForm((atual) => ({
      ...atual,
      custo: padrao.custo,
      hpBase: padrao.hpBase,
      danoBase: padrao.danoBase,
      defesaBase: padrao.defesaBase,
    }));
  }

  function handleFotoChange(arquivos: File[]) {
    const file = arquivos[0] ?? null;
    setFoto(file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  function handleMolduraChange(arquivos: File[]) {
    const file = arquivos[0] ?? null;
    setMoldura(file);
    setMolduraPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return file ? URL.createObjectURL(file) : null;
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (envioEmAndamento.current) return;
    if (!form.idClasse) {
      setFeedback({ type: "error", text: "Selecione uma classe para a carta antes de salvar." });
      return;
    }
    envioEmAndamento.current = true;
    setFeedback(null);
    setSalvando(true);

    try {
      const payload: CreateAdminCartaPayload = {
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
        configVisual: form.configVisual,
      };

      const fotoPerfil = previewUrl ? await gerarFotoPerfilCarta(previewUrl, ajusteFotoPerfil) : null;
      if (foto || fotoPerfil || moldura) {
        const formData = new FormData();
        if (foto) formData.append("foto", foto);
        if (fotoPerfil) formData.append("fotoPerfil", fotoPerfil);
        if (moldura) formData.append("moldura", moldura);

        const upload = await uploadCartaAssets(formData);
        payload.foto = upload.foto?.url;
        payload.fotoPerfil = upload.fotoPerfil?.url;
        payload.moldura = upload.moldura?.url;
      }

      const carta = await criarAdminCarta(payload);
      setFeedback({
        type: "success",
        text: `Carta ${carta.nome} salva com sucesso.`,
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text:
          error instanceof Error
            ? error.message
            : "Não foi possível salvar a carta.",
      });
    } finally {
      envioEmAndamento.current = false;
      setSalvando(false);
    }
  }

  const cardImage = previewUrl ?? undefined;
  const cardFrame = molduraPreviewUrl ?? undefined;

  return (
    <AdminLayout
      title="Nova Carta"
      subtitle="Criar uma nova carta para o jogo."
    >
      <form className={styles.editorGrid} onSubmit={handleSubmit}>
        <section className={styles.formPanel}>
          <div className={styles.novaCartaStatus}>
            <span>
              <Power aria-hidden="true" />
              <strong>Status inicial</strong>
            </span>
            <div role="group" aria-label="Status inicial da carta">
              <button
                type="button"
                className={form.ativo ? styles.statusInicialAtivo : undefined}
                aria-pressed={form.ativo}
                onClick={() => updateField("ativo", true)}
              >
                Ativa
              </button>
              <button
                type="button"
                className={
                  !form.ativo ? styles.statusInicialInativo : undefined
                }
                aria-pressed={!form.ativo}
                onClick={() => updateField("ativo", false)}
              >
                Inativa
              </button>
            </div>
          </div>
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
                <button type="button" onClick={resetarInformacoes}>
                  <RefreshCw aria-hidden="true" /> Restaurar informações
                </button>
              </div>
              <label>
                Nome da carta
                <input
                  className={styles.nomePersonagemElemento}
                  style={
                    {
                      "--elemento-cor": obterElementoVisual(form.elemento).cor,
                    } as CSSProperties
                  }
                  value={form.nome}
                  onChange={(event) => updateField("nome", event.target.value)}
                  required
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
                <button type="button" onClick={resetarEstatisticas}>
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
              <CampoArquivo
                rotulo="Foto/personagem"
                accept="image/*"
                ajuda="PNG, JPG ou WEBP, até 5 MB."
                onFilesSelected={handleFotoChange}
              />
              <CampoArquivo
                rotulo="Moldura"
                accept="image/png,image/webp"
                ajuda="PNG ou WEBP transparente, até 5 MB. Ajuste o encaixe no compositor."
                onFilesSelected={handleMolduraChange}
              />
              <ControleVisualCarta
                value={form.configVisual}
                arte={cardImage}
                moldura={cardFrame}
                onChange={(configVisual) =>
                  updateField("configVisual", configVisual)
                }
              />
              <FotoPerfilCarta arte={previewUrl ?? undefined} ajuste={ajusteFotoPerfil} aoAlterar={(ajuste) => {
                setAjusteFotoPerfil(ajuste);
                updateField("configVisual", { ...form.configVisual, fotoPerfil: ajuste });
              }} />
            </div>
          </details>
        </section>
        <aside className={styles.previewPanel}>
          <h2>Pré-visualização</h2>
          <PreviewCarta
            arte={cardImage}
            moldura={cardFrame}
            nome={form.nome || "Nova Carta"}
            raridade={form.raridade}
            elemento={form.elemento}
            classe={form.classe}
            hpBase={Number(form.hpBase) || 0}
            danoBase={Number(form.danoBase) || 0}
            defesaBase={Number(form.defesaBase) || 0}
            configVisual={form.configVisual}
          />
          <div className={styles.editorActions}>
            <Link href="/admin/cartas">Cancelar</Link>
            <button
              type="submit"
              className={styles.primaryBtn}
              disabled={salvando}
            >
              <Save aria-hidden="true" /> {salvando ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </aside>
      </form>
    </AdminLayout>
  );
}

function toNumber(value: string, label: string) {
  const number = Number(value);

  if (!Number.isInteger(number) || number < 0) {
    throw new Error(`${label} precisa ser um número inteiro positivo.`);
  }

  return number;
}
