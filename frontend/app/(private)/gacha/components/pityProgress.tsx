import styles from "../../../styles/gacha/gacha.module.css";

type PityProgressProps = { atual: number; limite: number };

export function PityProgress({ atual, limite }: PityProgressProps) {
  const progresso = Math.min(100, Math.max(0, (atual / limite) * 100));
  return (
    <div className={styles.pity} aria-label={`Garantia UR: ${atual} de ${limite}`}>
      <div className={styles.pityCabecalho}>
        <span>Garantia UR</span>
        <strong>{atual} / {limite}</strong>
      </div>
      <div className={styles.pityTrilho} role="progressbar" aria-valuemin={0} aria-valuemax={limite} aria-valuenow={atual}>
        <span style={{ width: `${progresso}%` }} />
      </div>
      <small>UR garantida em até {Math.max(0, limite - atual)} invocações</small>
    </div>
  );
}
