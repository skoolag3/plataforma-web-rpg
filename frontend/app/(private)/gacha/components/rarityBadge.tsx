import type { RaridadeCarta } from "../types";
import styles from "../../../styles/gacha/gacha.module.css";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";

export function RarityBadge({ raridade }: { raridade: RaridadeCarta }) {
  const visual = obterRaridadeJogo(useRaridadesJogo(), raridade);
  return (
    <span className={styles.rarityBadge} data-raridade={raridade} style={visual ? { color: visual.cor, borderColor: visual.cor } : undefined}>
      {visual?.nome ?? raridade}
    </span>
  );
}
