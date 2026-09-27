import { CartaMontada } from "../../../components/cartaMontada";
import { RarityBadge } from "./rarityBadge";
import type { CartaGachaVisual } from "../types";
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
  return (
    <button
      type="button"
      className={styles.rewardCard}
      data-destaque={destaque || undefined}
      onClick={onDetalhes}
      aria-label={`Ver detalhes de ${carta.nome}`}
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
        {!carta.nova && carta.valorVenda ? (
          <span className={styles.vendaDuplicata}>
            <small>Carta repetida</small>
            <strong>+{carta.valorVenda.toLocaleString("pt-BR")} Rubys</strong>
          </span>
        ) : null}
      </div>
      <span className={styles.rewardInfo}>
        <strong>{carta.nome}</strong>
        <span>
          <RarityBadge raridade={carta.raridade} />
          <small>{carta.nova ? "Novo" : "Cópia"}</small>
        </span>
      </span>
    </button>
  );
}
