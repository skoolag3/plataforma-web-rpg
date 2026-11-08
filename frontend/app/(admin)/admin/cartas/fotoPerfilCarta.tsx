"use client";

import { useState } from "react";
import { ControleFaixa } from "./adminCartaVisual";
import visualStyles from "../../../styles/admin/adminCartaVisual.module.css";
import styles from "../../../styles/admin/fotoPerfilCarta.module.css";

export type AjusteFotoPerfil = { zoom: number; x: number; y: number };
export const ajusteFotoPerfilPadrao: AjusteFotoPerfil = { zoom: 1, x: 0, y: 0 };

type PropsFotoPerfilCarta = {
  arte?: string;
  ajuste: AjusteFotoPerfil;
  aoAlterar: (ajuste: AjusteFotoPerfil) => void;
};

export function FotoPerfilCarta({ arte, ajuste, aoAlterar }: PropsFotoPerfilCarta) {
  const [dimensoes, setDimensoes] = useState({ largura: 0, altura: 0 });
  const ladoPreview = 120;
  const escala = dimensoes.largura && dimensoes.altura
    ? Math.max(ladoPreview / dimensoes.largura, ladoPreview / dimensoes.altura) * ajuste.zoom
    : 1;
  const largura = dimensoes.largura * escala;
  const altura = dimensoes.altura * escala;
  const deslocamentoX = ajuste.x / 100 * Math.max(0, (largura - ladoPreview) / 2);
  const deslocamentoY = ajuste.y / 100 * Math.max(0, (altura - ladoPreview) / 2);

  return (
    <section className={`${visualStyles.controleVisual} ${styles.editorFoto}`} aria-label="Recorte da foto do perfil">
      <header>
        <div><strong>Ícone do perfil</strong><small>Recorte 1:1 da arte desta carta.</small></div>
        <button type="button" onClick={() => aoAlterar(ajusteFotoPerfilPadrao)} disabled={!arte}>Centralizar</button>
      </header>
      <div className={visualStyles.grupoControles}>
        <strong>Foto do perfil</strong>
        <div className={visualStyles.presetPerfilGrid}>
        <div className={`${visualStyles.previewAvatarPerfil} ${styles.recorte}`}>
          {arte ? <img
            key={arte}
            src={arte}
            alt="Prévia quadrada da foto de perfil"
            onLoad={(evento) => setDimensoes({ largura: evento.currentTarget.naturalWidth, altura: evento.currentTarget.naturalHeight })}
            style={dimensoes.largura ? {
              width: largura,
              height: altura,
              transform: `translate(calc(-50% + ${deslocamentoX}px), calc(-50% + ${deslocamentoY}px))`,
            } : undefined}
          /> : <span>Escolha a arte da carta primeiro.</span>}
        </div>
        <div className={visualStyles.controlesPresetPerfil}>
          <ControleFaixa rotulo="Zoom" value={ajuste.zoom} min={1} max={3} step={0.05} sufixo="×" onChange={(zoom) => aoAlterar({ ...ajuste, zoom })} />
          <ControleFaixa rotulo="Horizontal" value={ajuste.x} min={-100} max={100} step={1} sufixo="%" onChange={(x) => aoAlterar({ ...ajuste, x })} />
          <ControleFaixa rotulo="Vertical" value={ajuste.y} min={-100} max={100} step={1} sufixo="%" onChange={(y) => aoAlterar({ ...ajuste, y })} />
        </div>
        </div>
      </div>
    </section>
  );
}

export async function gerarFotoPerfilCarta(arte: string, ajuste: AjusteFotoPerfil): Promise<File> {
  const imagem = new Image();
  imagem.crossOrigin = "anonymous";
  imagem.src = arte;
  try {
    await imagem.decode();
  } catch {
    throw new Error("Não foi possível carregar a arte para gerar o ícone do perfil.");
  }

  const tamanho = 512;
  const escala = Math.max(tamanho / imagem.naturalWidth, tamanho / imagem.naturalHeight) * ajuste.zoom;
  const larguraOrigem = tamanho / escala;
  const alturaOrigem = tamanho / escala;
  const limiteX = (imagem.naturalWidth - larguraOrigem) / 2;
  const limiteY = (imagem.naturalHeight - alturaOrigem) / 2;
  const origemX = limiteX - ajuste.x / 100 * limiteX;
  const origemY = limiteY - ajuste.y / 100 * limiteY;
  const canvas = document.createElement("canvas");
  canvas.width = tamanho;
  canvas.height = tamanho;
  const contexto = canvas.getContext("2d");
  if (!contexto) throw new Error("Não foi possível gerar o ícone do perfil.");
  contexto.drawImage(imagem, origemX, origemY, larguraOrigem, alturaOrigem, 0, 0, tamanho, tamanho);
  let blob: Blob | null;
  try {
    blob = await new Promise<Blob | null>((resolver) => canvas.toBlob(resolver, "image/png"));
  } catch {
    throw new Error("A arte não permite gerar o recorte. Envie a imagem da carta novamente.");
  }
  if (!blob) throw new Error("Não foi possível gerar o ícone do perfil.");
  return new File([blob], "foto-perfil-carta.png", { type: "image/png" });
}
