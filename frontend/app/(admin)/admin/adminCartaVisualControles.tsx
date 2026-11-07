"use client";

import { UserRound } from "lucide-react";
import {
  criarConfigVisualPadrao,
  criarEstiloMolduraPerfil,
  type ConfigVisualCarta,
} from "../../components/cartaMontada";
import sharedStyles from "../../styles/admin/adminShared.module.css";
import visualStyles from "../../styles/admin/adminCartaVisual.module.css";
import { combinarEstilos } from "./combinarEstilos";

const styles = combinarEstilos(sharedStyles, visualStyles);

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
          onClick={() =>
            onChange({
              ...criarConfigVisualPadrao(),
              fotoPerfil: value.fotoPerfil,
            })
          }
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
              onChange={(valor) => atualizarMolduraPerfil("escalaX", valor)}
            />
            <ControleFaixa
              rotulo="Altura"
              value={value.molduraPerfil.escalaY}
              min={0.5}
              max={2}
              step={0.01}
              onChange={(valor) => atualizarMolduraPerfil("escalaY", valor)}
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
              onChange={(valor) => atualizarMolduraPerfil("rotacao", valor)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export function ControleFaixa({
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
    <div className={styles.controleFaixa}>
      <span>
        {rotulo}
        <span className={styles.valorFaixa}>
          <input
            key={value}
            type="number"
            aria-label={`${rotulo}: valor`}
            defaultValue={Number(value.toFixed(2))}
            min={min}
            max={max}
            step={step}
            onBlur={(event) => {
              const numero = Number(event.target.value);
              if (!Number.isFinite(numero)) {
                event.target.value = String(value);
                return;
              }
              const ajustado = Math.min(max, Math.max(min, numero));
              event.target.value = String(ajustado);
              onChange(ajustado);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
          />
          {sufixo}
        </span>
      </span>
      <input
        type="range"
        aria-label={`${rotulo}: ajuste`}
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={(event) => onChange(Number(event.target.value))}
      />
    </div>
  );
}
