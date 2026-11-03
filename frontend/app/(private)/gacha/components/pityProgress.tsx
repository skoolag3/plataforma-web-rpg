import styles from "../../../styles/gacha/gacha.module.css";
import { obterRaridadeJogo, useRaridadesJogo } from "../../../components/raridadesJogo";

type PityProgressProps = { atual: number; limite: number; raridade: string };

export function PityProgress({ atual, limite, raridade }: PityProgressProps) {
  const nomeRaridade = obterRaridadeJogo(useRaridadesJogo(), raridade)?.nome ?? raridade;
  const progresso = Math.min(100, Math.max(0, (atual / limite) * 100));
  return (
    <div className={styles.pity} aria-label={`Garantia ${nomeRaridade}: ${atual} de ${limite}`}>
      <div className={styles.pityCabecalho}>
        <span>Garantia {nomeRaridade}</span>
        <strong>{atual} / {limite}</strong>
      </div>
      <div className={styles.pityTrilho} role="progressbar" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={atual}>
        <span style={{ width: `${progresso}%` }} />
      </div>
      <small>{nomeRaridade} garantida em até {Math.max(0, limite - atual)} invocações</small>
    </div>
  );
}
