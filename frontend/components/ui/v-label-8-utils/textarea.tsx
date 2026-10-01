import * as React from "react";
import { cn } from "@/lib/utils";

export type TextareaProps = React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, ...props }, ref) => <textarea
    ref={ref}
    className={cn("flex min-h-20 w-full rounded-md border border-[#717d9e5c] bg-[#020610bf] px-3 py-2 text-sm text-white outline-none placeholder:text-[#8790a3] focus-visible:border-violet-500 focus-visible:ring-2 focus-visible:ring-violet-500/25 disabled:cursor-not-allowed disabled:opacity-50", className)}
    {...props}
  />,
);
Textarea.displayName = "Textarea";
