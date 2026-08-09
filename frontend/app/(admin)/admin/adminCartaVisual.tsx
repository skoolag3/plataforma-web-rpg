"use client";

import { Activity, ImagePlus } from "lucide-react";
import { useState, type ChangeEvent } from "react";
import {
  CartaMontada,
  PROPORCAO_CARTA,
  criarConfigVisualPadrao,
  type ConfigVisualCarta,
  type DimensoesImagem,
} from "../../components/cartaMontada";
import styles from "../../styles/admin/admin.module.css";

export const raridades = ["UR", "SSR", "SR", "R", "N"] as const;
export const elementos = [
  { value: "natureza", label: "Natureza" },
  { value: "agua", label: "Agua" },
  { value: "fogo", label: "Fogo" },
  { value: "sombra", label: "Sombra" },
  { value: "luz", label: "Luz" },
] as const;

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
  return <span className={`${styles.raridadeBadge} ${classeRaridade(value)}`}>{value}</span>;
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
          setNomeArquivo(event.target.files?.[0]?.name ?? "Nenhum arquivo selecionado");
          onChange(event);
        }}
      />
      <span className={styles.seletorArquivo}>
        <span className={styles.botaoArquivo}>Escolher</span>
        <span className={styles.nomeArquivo} title={nomeArquivo}>{nomeArquivo}</span>
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
  configVisual,
}: {
  arte?: string;
  moldura?: string;
  nome: string;
  raridade: string;
  configVisual: ConfigVisualCarta;
}) {
  const [dimensoesArte, setDimensoesArte] = useState<DimensoesImagem | null>(null);
  const [dimensoesMoldura, setDimensoesMoldura] = useState<DimensoesImagem | null>(null);
  const [fundoPreview, setFundoPreview] = useState<"branco" | "preto" | "verde">("preto");
  const [mostrarTextos, setMostrarTextos] = useState(true);
  const proporcoesDiferentes = Boolean(
    (dimensoesArte && Math.abs(dimensoesArte.largura / dimensoesArte.altura - PROPORCAO_CARTA) > 0.015)
      || (dimensoesMoldura && Math.abs(dimensoesMoldura.largura / dimensoesMoldura.altura - PROPORCAO_CARTA) > 0.015),
  );

  return (
    <div className={styles.cardPreviewMontagem}>
      <div className={styles.previewToolbar}>
        <button type="button" onClick={() => setMostrarTextos((atual) => !atual)} aria-pressed={mostrarTextos}>
          <Activity aria-hidden="true" /> {mostrarTextos ? "Ocultar textos" : "Visualizar textos"}
        </button>
      </div>
      <div className={`${styles.cardTemplateStage} ${styles[`fundoPreview${fundoPreview[0].toUpperCase()}${fundoPreview.slice(1)}`]}`}>
        <span className={styles.seletorFundo} role="group" aria-label="Cor de fundo da pre-visualizacao">
          {(["branco", "preto", "verde"] as const).map((cor) => (
            <button
              key={cor}
              type="button"
              className={styles[`amostra${cor[0].toUpperCase()}${cor.slice(1)}`]}
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
          config={configVisual}
          placeholder={<ImagePlus aria-label="Sem arte" />}
          onDimensoesArte={setDimensoesArte}
          onDimensoesMoldura={setDimensoesMoldura}
        >
          {mostrarTextos ? <span className={styles.cardPreviewConteudo}>
            <span className={styles.cardPreviewTitulo}>
              <strong>{nome}</strong>
              <Raridade value={raridade} />
            </span>
          </span> : null}
        </CartaMontada>
      </div>
      {proporcoesDiferentes ? (
        <small className={styles.avisoProporcao}>
          O padrao da carta e 2:3 (ex.: 1024x1536). Arte: {dimensoesArte ? `${dimensoesArte.largura}x${dimensoesArte.altura}` : "nao selecionada"}; moldura: {dimensoesMoldura ? `${dimensoesMoldura.largura}x${dimensoesMoldura.altura}` : "nao selecionada"}.
        </small>
      ) : null}
    </div>
  );
}

export function ControleVisualCarta({
  value,
  onChange,
}: {
  value: ConfigVisualCarta;
  onChange: (value: ConfigVisualCarta) => void;
}) {
  function atualizarArte(campo: keyof ConfigVisualCarta["arte"], valor: number) {
    onChange({ ...value, arte: { ...value.arte, [campo]: valor } });
  }

  function atualizarMoldura(campo: keyof ConfigVisualCarta["moldura"], valor: number) {
    onChange({ ...value, moldura: { ...value.moldura, [campo]: valor } });
  }

  return (
    <section className={styles.controleVisual}>
      <header>
        <div>
          <strong>Compositor da carta</strong>
          <small>Ajuste cada camada sem alterar os arquivos originais.</small>
        </div>
        <button type="button" onClick={() => onChange(criarConfigVisualPadrao())}>Resetar</button>
      </header>
      <div className={styles.grupoControles}>
        <strong>Arte</strong>
        <ControleFaixa rotulo="Zoom" value={value.arte.escala} min={0.7} max={2} step={0.01} onChange={(valor) => atualizarArte("escala", valor)} />
        <ControleFaixa rotulo="Horizontal" value={value.arte.x} min={-50} max={50} step={1} sufixo="%" onChange={(valor) => atualizarArte("x", valor)} />
        <ControleFaixa rotulo="Vertical" value={value.arte.y} min={-50} max={50} step={1} sufixo="%" onChange={(valor) => atualizarArte("y", valor)} />
        <ControleFaixa rotulo="Rotacao" value={value.arte.rotacao} min={-15} max={15} step={0.5} sufixo="°" onChange={(valor) => atualizarArte("rotacao", valor)} />
      </div>
      <div className={styles.grupoControles}>
        <strong>Moldura</strong>
        <ControleFaixa rotulo="Largura" value={value.moldura.escalaX} min={0.6} max={1.7} step={0.01} onChange={(valor) => atualizarMoldura("escalaX", valor)} />
        <ControleFaixa rotulo="Altura" value={value.moldura.escalaY} min={0.6} max={1.7} step={0.01} onChange={(valor) => atualizarMoldura("escalaY", valor)} />
        <ControleFaixa rotulo="Horizontal" value={value.moldura.x} min={-35} max={35} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("x", valor)} />
        <ControleFaixa rotulo="Vertical" value={value.moldura.y} min={-35} max={35} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("y", valor)} />
        <ControleFaixa rotulo="Rotacao" value={value.moldura.rotacao} min={-10} max={10} step={0.5} sufixo="°" onChange={(valor) => atualizarMoldura("rotacao", valor)} />
        <span className={styles.subtituloControle}>Bordas independentes</span>
        <ControleFaixa rotulo="Lado esquerdo" value={value.moldura.esquerda} min={-25} max={50} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("esquerda", valor)} />
        <ControleFaixa rotulo="Lado direito" value={value.moldura.direita} min={-25} max={50} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("direita", valor)} />
        <ControleFaixa rotulo="Topo" value={value.moldura.topo} min={-25} max={50} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("topo", valor)} />
        <ControleFaixa rotulo="Base" value={value.moldura.base} min={-25} max={50} step={0.5} sufixo="%" onChange={(valor) => atualizarMoldura("base", valor)} />
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
      <span>{rotulo}<output>{Number(value.toFixed(2))}{sufixo}</output></span>
      <input type="range" value={value} min={min} max={max} step={step} onChange={(event) => onChange(Number(event.target.value))} />
    </label>
  );
}
