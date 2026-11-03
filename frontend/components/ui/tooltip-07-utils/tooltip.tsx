"use client";

import { Portal } from "@ark-ui/react/portal";
import { Tooltip as TooltipPrimitive } from "@ark-ui/react/tooltip";
import { cloneElement, useRef } from "react";
import type { PointerEvent, MouseEvent, ReactElement, ReactNode } from "react";
import styles from "./tooltip.module.css";

export function Tooltip({ children }: { children: ReactNode }) {
  return <TooltipPrimitive.Root openDelay={180} closeDelay={100}>{children}</TooltipPrimitive.Root>;
}

export function TooltipTrigger({ render }: { render: ReactElement }) {
  const toque = useRef(false);
  const estavaAberto = useRef(false);
  const elemento = render as ReactElement<{
    onPointerDownCapture?: (event: PointerEvent<HTMLElement>) => void;
    onClick?: (event: MouseEvent<HTMLElement>) => void;
  }>;

  return (
    <TooltipPrimitive.Context>
      {(tooltip) => (
        <TooltipPrimitive.Trigger asChild>
          {cloneElement(elemento, {
            onPointerDownCapture: (event) => {
              elemento.props.onPointerDownCapture?.(event);
              toque.current = event.pointerType === "touch";
              estavaAberto.current = tooltip.open;
            },
            onClick: (event) => {
              elemento.props.onClick?.(event);
              if (toque.current) {
                toque.current = false;
                const abrir = !estavaAberto.current;
                queueMicrotask(() => tooltip.setOpen(abrir));
              }
            },
          })}
        </TooltipPrimitive.Trigger>
      )}
    </TooltipPrimitive.Context>
  );
}

export function TooltipContent({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <Portal>
      <TooltipPrimitive.Positioner className={styles.posicionador}>
        <TooltipPrimitive.Content className={`${styles.conteudo} ${className}`}>
          {children}
          <TooltipPrimitive.Arrow className={styles.seta}>
            <TooltipPrimitive.ArrowTip className={styles.pontaSeta} />
          </TooltipPrimitive.Arrow>
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Positioner>
    </Portal>
  );
}
