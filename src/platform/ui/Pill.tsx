"use client";

import type { ReactNode } from "react";

/** Rounded tag/toggle, e.g. verdict factors or timeframe switches. */
export function Pill({
  active = false,
  onClick,
  children,
}: {
  active?: boolean;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
        active
          ? "border-accent bg-accent/15 text-accent"
          : "border-border-subtle text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
