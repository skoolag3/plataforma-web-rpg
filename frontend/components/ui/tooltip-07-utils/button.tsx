import type { ButtonHTMLAttributes } from "react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "outline";
};

export function Button({ variant, className = "", ...props }: Props) {
  return (
    <button
      className={`${variant === "outline" ? "rounded-md border border-current px-4 py-2" : ""} ${className}`}
      {...props}
    />
  );
}
