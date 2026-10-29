import type { ReactNode } from "react";

const TONES = {
  neutral: "bg-surface-raised text-muted",
  positive: "bg-positive/15 text-positive",
  negative: "bg-negative/15 text-negative",
  warning: "bg-warning/15 text-warning",
  accent: "bg-accent/15 text-accent",
} as const;

export type BadgeTone = keyof typeof TONES;

/** Small status label, e.g. LIVE / OFFLINE / BETA. */
export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: BadgeTone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${TONES[tone]}`}
    >
      {children}
    </span>
  );
}
