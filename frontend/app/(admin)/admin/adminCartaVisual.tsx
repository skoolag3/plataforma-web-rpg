"use client";

import {
  Activity,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleOff,
  ImagePlus,
  Trash2,
  UserRound,
} from "lucide-react";
import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type CSSProperties,
} from "react";
import {
  CartaMontada,
  PROPORCAO_CARTA,
  criarEstiloMolduraPerfil,
  criarConfigVisualPadrao,
  type ConfigVisualCarta,
  type DimensoesImagem,
} from "../../components/cartaMontada";
import { CartaVerso } from "../../components/cartaVerso";
import { elementosCarta } from "../../components/elementosCarta";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import editorStyles from "../../styles/admin/adminCartaEditor.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import listaStyles from "../../styles/admin/adminCartasLista.module.css";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(
  sharedStyles,
  listaStyles,
  editorStyles,
  visualStyles,
);

export const raridades = ["UR", "SSR", "SR", "R", "N"] as const;
export const classesCarta = [
  "Mago",
  "Espadachim",
  "Guerreiro",
  "Guardião",
  "Caçador",
  "Vidente",
] as const;
export const elementos = elementosCarta;

type ElementoValue = (typeof elementos)[number]["value"];

export function obterElementoVisual(value: string) {
  return elementos.find((elemento) => elemento.value === value) ?? elementos[0];
}

export function ElementoVisual({ value }: { value: string }) {
  const elemento = obterElementoVisual(value);
  const estilo = { "--elemento-cor": elemento.cor } as CSSProperties;

  return (
    <span className={styles.elementoVisual} style={estilo}>
      <span
        className={styles.elementoIcone}
        style={{ backgroundImage: `url("${elemento.icone}")` }}
        aria-hidden="true"
      />
      <strong>{elemento.label}</strong>
    </span>
  );
}

export function ElementoSelect({
  value,
  onChange,
  placeholder,
}: {
  value: ElementoValue | "";
  onChange: (value: ElementoValue | "") => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const elemento = elementos.find((item) => item.value === value);
  const estilo = {
    "--elemento-cor": elemento?.cor ?? "#cbd5e1",
  } as CSSProperties;

  useEffect(() => {
    function fecharAoClicarFora(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node))
        setAberto(false);
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  function selecionar(novoValor: ElementoValue | "") {
    onChange(novoValor);
    setAberto(false);
  }

  return (
    <span
      ref={containerRef}
      className={`${styles.elementoSelect} ${!elemento ? styles.elementoSelectVazio : ""}`}
      style={estilo}
    >
      <button
        type="button"
        className={styles.elementoSelectTrigger}
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span className={styles.elementoSelectValor}>
          {elemento ? (
            <span
              className={styles.elementoIcone}
              style={{ backgroundImage: `url("${elemento.icone}")` }}
              aria-hidden="true"
            />
          ) : null}
          <strong>{elemento?.label ?? placeholder ?? "Selecione"}</strong>
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {aberto ? (
        <span
          className={styles.elementoOpcoes}
          role="listbox"
          aria-label="Elementos"
        >
          {placeholder ? (
            <button
              type="button"
              role="option"
              aria-selected={!value}
              onClick={() => selecionar("")}
            >
              <span className={styles.elementoOpcaoNeutra}>{placeholder}</span>
              {!value ? <Check aria-hidden="true" /> : null}
            </button>
          ) : null}
          {elementos.map((opcao) => (
            <button
              type="button"
              role="option"
              aria-selected={value === opcao.value}
              key={opcao.value}
              onClick={() => selecionar(opcao.value)}
              style={{ "--elemento-cor": opcao.cor } as CSSProperties}
            >
              <span className={styles.elementoSelectValor}>
                <span
                  className={styles.elementoIcone}
                  style={{ backgroundImage: `url("${opcao.icone}")` }}
                  aria-hidden="true"
                />
                <strong>{opcao.label}</strong>
              </span>
              {value === opcao.value ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

const statusOpcoes = [
  { value: "ativas", label: "Ativas", cor: "#4ade80", Icone: CheckCircle2 },
  { value: "inativas", label: "Inativas", cor: "#fbbf24", Icone: CircleOff },
  { value: "removidas", label: "Removidas", cor: "#f87171", Icone: Trash2 },
] as const;

type StatusValue = (typeof statusOpcoes)[number]["value"];

export function StatusSelect({
  value,
  onChange,
}: {
  value: StatusValue | "";
  onChange: (value: StatusValue | "") => void;
}) {
  const [aberto, setAberto] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);
  const status = statusOpcoes.find((item) => item.value === value);
  const estilo = {
    "--elemento-cor": status?.cor ?? "#f8fafc",
  } as CSSProperties;

  useEffect(() => {
    function fecharAoClicarFora(event: PointerEvent) {
      if (!containerRef.current?.contains(event.target as Node))
        setAberto(false);
    }

    function fecharComEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setAberto(false);
    }

    document.addEventListener("pointerdown", fecharAoClicarFora);
    document.addEventListener("keydown", fecharComEscape);
    return () => {
      document.removeEventListener("pointerdown", fecharAoClicarFora);
      document.removeEventListener("keydown", fecharComEscape);
    };
  }, []);

  function selecionar(novoValor: StatusValue | "") {
    onChange(novoValor);
    setAberto(false);
  }

  return (
    <span
      ref={containerRef}
      className={`${styles.elementoSelect} ${!status ? styles.elementoSelectVazio : ""}`}
      style={estilo}
    >
      <button
        type="button"
        className={styles.elementoSelectTrigger}
        onClick={() => setAberto((atual) => !atual)}
        aria-haspopup="listbox"
        aria-expanded={aberto}
      >
        <span className={styles.elementoSelectValor}>
          {status ? (
            <status.Icone
              className={styles.statusSelectIcone}
              aria-hidden="true"
            />
          ) : null}
          <strong>{status?.label ?? "Status"}</strong>
        </span>
        <ChevronDown aria-hidden="true" />
      </button>
      {aberto ? (
        <span
          className={styles.elementoOpcoes}
          role="listbox"
          aria-label="Status da carta"
        >
          <button
            type="button"
            role="option"
            aria-selected={!value}
            onClick={() => selecionar("")}
          >
            <span className={styles.elementoOpcaoNeutra}>Status</span>
            {!value ? <Check aria-hidden="true" /> : null}
          </button>
          {statusOpcoes.map((opcao) => (
            <button
              type="button"
              role="option"
              aria-selected={value === opcao.value}
              key={opcao.value}
              onClick={() => selecionar(opcao.value)}
              style={{ "--elemento-cor": opcao.cor } as CSSProperties}
            >
              <span className={styles.elementoSelectValor}>
                <opcao.Icone
                  className={styles.statusSelectIcone}
                  aria-hidden="true"
                />
                <strong>{opcao.label}</strong>
              </span>
              {value === opcao.value ? <Check aria-hidden="true" /> : null}
            </button>
          ))}
        </span>
      ) : null}
    </span>
  );
}

export function classeRaridade(raridade: string) {
  const classes: Record<string, string> = {
    UR: styles.raridadeUR,
    SSR: styles.raridadeSSR,
    SR: styles.raridadeSR,
    R: styles.raridadeR,
    N: styles.raridadeN,
  };

  return classes[raridade] ?? "";
}

export function Raridade({ value }: { value: string }) {
  return (
    <span className={`${styles.raridadeBadge} ${classeRaridade(value)}`}>
      {value}
    </span>
  );
}

export function CampoArquivo({
  rotulo,
  accept,
  ajuda,
  onChange,
}: {
  rotulo: string;
  accept: string;
  ajuda?: string;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}) {
  const [nomeArquivo, setNomeArquivo] = useState("Nenhum arquivo selecionado");

  return (
    <label className={styles.campoArquivo}>
      <span className={styles.rotuloCampo}>{rotulo}</span>
      <input
        className={styles.inputArquivoOculto}
        type="file"
        accept={accept}
        onChange={(event) => {
          setNomeArquivo(
            event.target.files?.[0]?.name ?? "Nenhum arquivo selecionado",
          );
          onChange(event);
        }}
      />
      <span className={styles.seletorArquivo}>
        <span className={styles.botaoArquivo}>Escolher</span>
        <span className={styles.nomeArquivo} title={nomeArquivo}>
          {nomeArquivo}
        </span>
      </span>
      {ajuda ? <small>{ajuda}</small> : null}
    </label>
  );
}

export function PreviewCarta({
  arte,
  moldura,
  nome,
  raridade,
  elemento,
  classe,
  hpBase,
  danoBase,
  defesaBase,
  configVisual,
}: {
  arte?: string;
  moldura?: string;
  nome: string;
  raridade: string;
  elemento: "natureza" | "agua" | "fogo" | "sombra" | "luz";
  classe?: string;
  hpBase: number;
  danoBase: number;
  defesaBase: number;
  configVisual: ConfigVisualCarta;
}) {
  const [dimensoesArte, setDimensoesArte] = useState<DimensoesImagem | null>(
    null,
  );
  const [dimensoesMoldura, setDimensoesMoldura] =
    useState<DimensoesImagem | null>(null);
  const [fundoPreview, setFundoPreview] = useState<
    "branco" | "preto" | "verde"
  >("preto");
  const [mostrarTextos, setMostrarTextos] = useState(true);
  const proporcoesDiferentes = Boolean(
    (dimensoesArte &&
      Math.abs(dimensoesArte.largura / dimensoesArte.altura - PROPORCAO_CARTA) >
        0.015) ||
    (dimensoesMoldura &&
      Math.abs(
        dimensoesMoldura.largura / dimensoesMoldura.altura - PROPORCAO_CARTA,
      ) > 0.015),
  );

  return (
    <div className={styles.cardPreviewMontagem}>
      <div className={styles.previewToolbar}>
        <button
          type="button"
          onClick={() => setMostrarTextos((atual) => !atual)}
          aria-pressed={mostrarTextos}
        >
          <Activity aria-hidden="true" />{" "}
          {mostrarTextos ? "Ocultar textos" : "Visualizar textos"}
        </button>
      </div>
      <div
        className={`${styles.cardTemplateStage} ${styles[`fundoPreview${fundoPreview[0].toUpperCase()}${fundoPreview.slice(1)}`]}`}
      >
        <span
          className={styles.seletorFundo}
          role="group"
          aria-label="Cor de fundo da pre-visualizacao"
        >
          {(["branco", "preto", "verde"] as const).map((cor) => (
            <button
              key={cor}
              type="button"
              className={
                styles[`amostra${cor[0].toUpperCase()}${cor.slice(1)}`]
              }
              onClick={() => setFundoPreview(cor)}
              aria-label={`Fundo ${cor}`}
              aria-pressed={fundoPreview === cor}
              title={`Fundo ${cor}`}
            />
          ))}
        </span>
        <CartaMontada
          arte={arte}
          moldura={moldura}
          nome={mostrarTextos ? nome : undefined}
          raridade={mostrarTextos ? raridade : undefined}
          elemento={mostrarTextos ? elemento : undefined}
          config={configVisual}
          placeholder={<ImagePlus aria-label="Sem arte" />}
          onDimensoesArte={setDimensoesArte}
          onDimensoesMoldura={setDimensoesMoldura}
          verso={
            <CartaVerso
              nome={nome}
              raridade={raridade}
              elemento={elemento}
              classe={classe}
              hp={hpBase}
              ataque={danoBase}
              defesa={defesaBase}
            />
          }
        />
      </div>
      {proporcoesDiferentes ? (
        <small className={styles.avisoProporcao}>
          O padrão da carta é 2:3 (ex.: 1024x1536). Arte:{" "}
          {dimensoesArte
            ? `${dimensoesArte.largura}x${dimensoesArte.altura}`
            : "não selecionada"}
          ; moldura:{" "}
          {dimensoesMoldura
            ? `${dimensoesMoldura.largura}x${dimensoesMoldura.altura}`
            : "não selecionada"}
          .
        </small>
      ) : null}
    </div>
  );
}

export function ControleVisualCarta({
  value,
  onChange,
  arte,
  moldura,
}: {
  value: ConfigVisualCarta;
  onChange: (value: ConfigVisualCarta) => void;
  arte?: string;
  moldura?: string;
}) {
  function atualizarArte(
    campo: keyof ConfigVisualCarta["arte"],
    valor: number,
  ) {
    onChange({ ...value, arte: { ...value.arte, [campo]: valor } });
  }

  function atualizarMoldura(
    campo: keyof ConfigVisualCarta["moldura"],
    valor: number,
  ) {
    onChange({ ...value, moldura: { ...value.moldura, [campo]: valor } });
  }

  function atualizarMolduraPerfil(
    campo: keyof ConfigVisualCarta["molduraPerfil"],
    valor: number,
  ) {
    onChange({
      ...value,
      molduraPerfil: { ...value.molduraPerfil, [campo]: valor },
    });
  }

  return (
    <section className={styles.controleVisual}>
      <header>
        <div>
          <strong>Compositor da carta</strong>
          <small>Ajuste cada camada sem alterar os arquivos originais.</small>
        </div>
        <button
          type="button"
          onClick={() => onChange(criarConfigVisualPadrao())}
        >
          Resetar
        </button>
      </header>
      <div className={styles.grupoControles}>
        <strong>Arte</strong>
        <ControleFaixa
          rotulo="Zoom"
          value={value.arte.escala}
          min={0.7}
          max={2}
          step={0.01}
          onChange={(valor) => atualizarArte("escala", valor)}
        />
        <ControleFaixa
          rotulo="Horizontal"
          value={value.arte.x}
          min={-50}
          max={50}
          step={1}
          sufixo="%"
          onChange={(valor) => atualizarArte("x", valor)}
        />
        <ControleFaixa
          rotulo="Vertical"
          value={value.arte.y}
          min={-50}
          max={50}
          step={1}
          sufixo="%"
          onChange={(valor) => atualizarArte("y", valor)}
        />
        <ControleFaixa
          rotulo="Rotação"
          value={value.arte.rotacao}
          min={-15}
          max={15}
          step={0.5}
          sufixo="°"
          onChange={(valor) => atualizarArte("rotacao", valor)}
        />
      </div>
      <div className={styles.grupoControles}>
        <strong>Moldura</strong>
        <ControleFaixa
          rotulo="Largura"
          value={value.moldura.escalaX}
          min={0.6}
          max={1.7}
          step={0.01}
          onChange={(valor) => atualizarMoldura("escalaX", valor)}
        />
        <ControleFaixa
          rotulo="Altura"
          value={value.moldura.escalaY}
          min={0.6}
          max={1.7}
          step={0.01}
          onChange={(valor) => atualizarMoldura("escalaY", valor)}
        />
        <ControleFaixa
          rotulo="Horizontal"
          value={value.moldura.x}
          min={-35}
          max={35}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("x", valor)}
        />
        <ControleFaixa
          rotulo="Vertical"
          value={value.moldura.y}
          min={-35}
          max={35}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("y", valor)}
        />
        <ControleFaixa
          rotulo="Rotação"
          value={value.moldura.rotacao}
          min={-10}
          max={10}
          step={0.5}
          sufixo="°"
          onChange={(valor) => atualizarMoldura("rotacao", valor)}
        />
        <span className={styles.subtituloControle}>Bordas independentes</span>
        <ControleFaixa
          rotulo="Lado esquerdo"
          value={value.moldura.esquerda}
          min={-25}
          max={50}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("esquerda", valor)}
        />
        <ControleFaixa
          rotulo="Lado direito"
          value={value.moldura.direita}
          min={-25}
          max={50}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("direita", valor)}
        />
        <ControleFaixa
          rotulo="Topo"
          value={value.moldura.topo}
          min={-25}
          max={50}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("topo", valor)}
        />
        <ControleFaixa
          rotulo="Base"
          value={value.moldura.base}
          min={-25}
          max={50}
          step={0.5}
          sufixo="%"
          onChange={(valor) => atualizarMoldura("base", valor)}
        />
      </div>
      <div className={styles.grupoControles}>
        <strong>Preset da moldura no perfil</strong>
        <small className={styles.ajudaPresetPerfil}>
          Define o encaixe usado no avatar do jogador e na barra de navegação.
        </small>
        <div className={styles.presetPerfilGrid}>
          <span
            className={styles.previewAvatarPerfil}
            style={arte ? { backgroundImage: `url("${arte}")` } : undefined}
          >
            {!arte ? <UserRound aria-hidden="true" /> : null}
            {moldura ? (
              <i
                className={styles.previewMolduraPerfil}
                style={{
                  ...criarEstiloMolduraPerfil(value),
                  backgroundImage: `url("${moldura}")`,
                }}
                aria-hidden="true"
              />
            ) : null}
          </span>
          <div className={styles.controlesPresetPerfil}>
            <ControleFaixa
              rotulo="Largura"
              value={value.molduraPerfil.escalaX}
              min={0.5}
              max={2}
              step={0.01}
              onChange={(valor) =>
                atualizarMolduraPerfil("escalaX", valor)
              }
            />
            <ControleFaixa
              rotulo="Altura"
              value={value.molduraPerfil.escalaY}
              min={0.5}
              max={2}
              step={0.01}
              onChange={(valor) =>
                atualizarMolduraPerfil("escalaY", valor)
              }
            />
            <ControleFaixa
              rotulo="Horizontal"
              value={value.molduraPerfil.x}
              min={-50}
              max={50}
              step={0.5}
              sufixo="%"
              onChange={(valor) => atualizarMolduraPerfil("x", valor)}
            />
            <ControleFaixa
              rotulo="Vertical"
              value={value.molduraPerfil.y}
              min={-50}
              max={50}
              step={0.5}
              sufixo="%"
              onChange={(valor) => atualizarMolduraPerfil("y", valor)}
            />
            <ControleFaixa
              rotulo="Rotação"
              value={value.molduraPerfil.rotacao}
              min={-20}
              max={20}
              step={0.5}
              sufixo="°"
              onChange={(valor) =>
                atualizarMolduraPerfil("rotacao", valor)
              }
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function ControleFaixa({
  rotulo,
  value,
  min,
  max,
  step,
  sufixo = "",
  onChange,
}: {
  rotulo: string;
  value: number;
  min: number;
  max: number;
  step: number;
  sufixo?: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className={styles.controleFaixa}>
      <span>
        {rotulo}
        <output>
          {Number(value.toFixed(2))}
          {sufixo}
        </output>
      </span>
      <input
        type="range"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </label>
  );
}
