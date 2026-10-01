"use client";

import { Steps } from "@ark-ui/react/steps";
import styles from "./steps.module.css";

type BasicStepsProps = {
  labels?: readonly string[];
  step?: number;
  onStepChange?: (step: number) => void;
  disabled?: boolean;
};

export default function BasicSteps({
  labels = ["Etapa 1", "Etapa 2", "Etapa 3", "Etapa 4"],
  step,
  onStepChange,
  disabled = false,
}: BasicStepsProps) {
  const etapaAtual = step ?? 0;

  return (
    <Steps.Root
      count={labels.length}
      defaultStep={0}
      step={step}
      onStepChange={({ step: proximaEtapa }) => onStepChange?.(proximaEtapa)}
      className={styles.root}
    >
      <Steps.List className={styles.list}>
        {labels.map((label, index) => (
          <Steps.Item
            key={label}
            index={index}
            className={styles.item}
            data-etapa={index < etapaAtual ? "concluida" : index === etapaAtual ? "atual" : "pendente"}
          >
            <Steps.Trigger
              type="button"
              disabled={disabled || (step !== undefined && index > step)}
              className={styles.trigger}
            >
              <Steps.Indicator className={styles.indicator}>
                {index + 1}
              </Steps.Indicator>
              <span className={styles.label}>
                {label}
              </span>
            </Steps.Trigger>
            <Steps.Separator
              hidden={index === labels.length - 1}
              className={styles.separator}
            />
          </Steps.Item>
        ))}
      </Steps.List>
    </Steps.Root>
  );
}
