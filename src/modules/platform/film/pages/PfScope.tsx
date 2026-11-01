import type { ReactNode } from "react";
import "@/platform/ui/tokens.css";
import "../../platform.css";

/**
 * The platform kit's colour tokens, for older working components (forms, guide
 * steps) shown inside the new frame. The kit's own page scope is a full-screen
 * shell (min-height 100vh, charcoal canvas); here it only wraps a block, so it sizes
 * to its content and lets the shared colour field show unless `surface` is given.
 * (The kit's unlayered CSS outranks Tailwind's bg-* utilities, hence the inline style.)
 */
export function PfScope({ children, className = "", surface = "transparent" }: { children: ReactNode; className?: string; surface?: string }) {
  return (
    <div className={`ds-theme pf-theme ${className}`} style={{ minHeight: "auto", background: surface }}>
      {children}
    </div>
  );
}
