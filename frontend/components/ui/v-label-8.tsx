"use client";

import { useId, useState, type ChangeEvent, type TextareaHTMLAttributes } from "react";
import { Field } from "@/components/ui/v-label-8-utils/field";
import { Label } from "@/components/ui/v-label-8-utils/label";
import { Textarea } from "@/components/ui/v-label-8-utils/textarea";
import { cn } from "@/lib/utils";
import styles from "./v-label-8.module.css";

type Props = Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> & {
  rotulo?: string;
  onChange?: (evento: ChangeEvent<HTMLTextAreaElement>) => void;
  className?: string;
};

export default function VLabel8({
  rotulo = "Bio",
  id,
  maxLength = 200,
  value,
  defaultValue,
  onChange,
  className,
  ...props
}: Props) {
  const idGerado = useId();
  const [texto, setTexto] = useState(String(defaultValue ?? ""));
  const valorAtual = value === undefined ? texto : String(value);

  function atualizar(evento: ChangeEvent<HTMLTextAreaElement>) {
    if (value === undefined) setTexto(evento.target.value);
    onChange?.(evento);
  }

  return <Field className={cn("w-full", className)}>
    <Label className={cn(styles.rotuloContador, "gap-3 text-[#d3d7e0]")} htmlFor={id ?? idGerado}>
      {rotulo}
      <span className="text-[#9da5b8] tabular-nums" aria-live="polite">{valorAtual.length}/{maxLength}</span>
    </Label>
    <Textarea id={id ?? idGerado} maxLength={maxLength} value={valorAtual} onChange={atualizar} {...props} />
  </Field>;
}
