import type { RaridadeCarta } from "../types";
import styles from "../../../styles/gacha/gacha.module.css";

export function RarityBadge({ raridade }: { raridade: RaridadeCarta }) {
  return (
    <span className={styles.rarityBadge} data-raridade={raridade}>
      {raridade}
    </span>
  );
}
