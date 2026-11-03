"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import styles from "./animated-check-box.module.css";

type NeonCheckboxProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label?: ReactNode;
  cor?: string;
};

export function NeonCheckbox({ label, cor = "#a78bfa", className, checked, defaultChecked, onChange, ...props }: NeonCheckboxProps) {
  const [interno, setInterno] = useState(Boolean(defaultChecked));
  const selecionado = checked ?? interno;

  return (
    <label className={cn(styles.campo, className)} style={{ "--corCheck": cor } as React.CSSProperties}>
      <input
        {...props}
        type="checkbox"
        checked={selecionado}
        onChange={(evento) => {
          if (checked === undefined) setInterno(evento.target.checked);
          onChange?.(evento);
        }}
      />
      <span className={styles.quadro} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none"><path d="m4 12 5 5L20 6" /></svg>
      </span>
      {label ? <span className={styles.rotulo}>{label}</span> : null}
    </label>
  );
}

export default NeonCheckbox;
