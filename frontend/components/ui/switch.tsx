"use client";

import { useState } from "react";
import styles from "./switch.module.css";

type SwitchProps = {
  checked: boolean;
  onChange?: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  "aria-label"?: string;
};

export function SwitchToggle({ checked, onChange, label, disabled, "aria-label": ariaLabel }: SwitchProps) {
  return (
    <span className={styles.campo}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        className={styles.trilho}
        data-checked={checked}
        onClick={() => onChange?.(!checked)}
      >
        <span className={styles.bolinha} />
      </button>
      {label ? <span className={styles.rotulo}>{label}</span> : null}
    </span>
  );
}

export function SpringToggle(props: SwitchProps) {
  const [pressionado, setPressionado] = useState(false);
  const { checked, onChange, label, disabled, "aria-label": ariaLabel } = props;
  return (
    <span className={styles.campo}>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={ariaLabel ?? label}
        disabled={disabled}
        className={styles.trilho}
        data-checked={checked}
        data-pressionado={pressionado}
        onPointerDown={() => setPressionado(true)}
        onPointerUp={() => setPressionado(false)}
        onPointerCancel={() => setPressionado(false)}
        onPointerLeave={() => setPressionado(false)}
        onClick={() => onChange?.(!checked)}
      >
        <span className={styles.bolinha} />
      </button>
      {label ? <span className={styles.rotulo}>{label}</span> : null}
    </span>
  );
}

export const Switch = SwitchToggle;
export default SwitchToggle;
