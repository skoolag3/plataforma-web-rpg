"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, Minus } from "lucide-react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";
import styles from "./checkbox-1.module.css";

const checkboxVariants = cva(styles.checkbox, {
  variants: {
    size: {
      sm: styles.pequeno,
      md: styles.medio,
      lg: styles.grande,
    },
  },
  defaultVariants: { size: "md" },
});

export function Checkbox({
  className,
  size,
  ...props
}: React.ComponentProps<typeof CheckboxPrimitive.Root> & VariantProps<typeof checkboxVariants>) {
  return (
    <CheckboxPrimitive.Root
      data-slot="checkbox"
      className={cn(checkboxVariants({ size }), className)}
      {...props}
    >
      <CheckboxPrimitive.Indicator className={styles.indicador}>
        <Check className={styles.iconeCheck} aria-hidden="true" />
        <Minus className={styles.iconeMenos} aria-hidden="true" />
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
