"use client";

import type { ButtonHTMLAttributes } from "react";

const VARIANTS = {
  primary: "afvar-glass-primary",
  ghost:
    "border border-border-subtle text-foreground hover:bg-surface-raised",
  danger: "afvar-glass-primary",
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
      className={`afvar-glass-button rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:opacity-50 ${VARIANTS[variant]} ${className}`}
      {...props}
    />
  );
}
