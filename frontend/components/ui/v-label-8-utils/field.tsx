import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Field = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => <div ref={ref} className={cn("grid gap-2", className)} {...props} />,
);
Field.displayName = "Field";
