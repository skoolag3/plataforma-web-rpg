import { CartaMontada } from "../../../components/cartaMontada";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";
import { RarityBadge } from "./rarityBadge";
import type { CartaGachaVisual } from "../types";
import type { CSSProperties } from "react";
import styles from "../../../styles/gacha/gacha.module.css";

export function RewardCard({
  carta,
  destaque,
  onDetalhes,
}: {
  carta: CartaGachaVisual;
  destaque?: boolean;
  onDetalhes: () => void;
}) {
  const Icone = carta.icon;
  const corRaridade = obterRaridadeJogo(useRaridadesJogo(), carta.raridade)?.cor ?? "#94a3b8";
  return (
    <button
      type="button"
      className={styles.rewardCard}
      data-destaque={destaque || undefined}
      style={{ "--cor-raridade": corRaridade } as CSSProperties}
      onClick={onDetalhes}
      aria-label={`Ver detalhes de ${carta.nome}${carta.nova ? ", nova carta" : ", cópia vendida"}`}
    >
      <div className={styles.rewardArte}>
        <CartaMontada
          arte={carta.foto ?? undefined}
          moldura={carta.moldura ?? undefined}
          nome={carta.nome}
          raridade={carta.raridade}
          elemento={carta.elemento}
          config={carta.configVisual ?? undefined}
          placeholder={<Icone aria-hidden="true" />}
        />
        {!carta.nova && <span className={styles.seloVendido}>VENDIDO</span>}
      </div>
      <span className={styles.rewardInfo}>
        <strong>{carta.nome}</strong>
        <span>
          <RarityBadge raridade={carta.raridade} />
          <small>{carta.nova ? "Nova carta" : "Cópia vendida"}</small>
        </span>
        {!carta.nova && carta.valorVenda ? <b className={styles.rubysDuplicata}>+{carta.valorVenda.toLocaleString("pt-BR")} Rubys</b> : null}
      </span>
    </button>
  );
}
