"use client";

import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "bg-accent text-white hover:bg-accent/85",
  ghost:
    "border border-border-subtle text-foreground hover:bg-surface-raised",
  danger: "bg-negative text-white hover:bg-negative/85",
} as const;

export type ButtonVariant = keyof typeof VARIANTS;

export function Button({
  variant = "primary",
  className = "",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      type="button"
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
