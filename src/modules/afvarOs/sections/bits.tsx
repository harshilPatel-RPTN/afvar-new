"use client";

// Small building blocks for OS window content (rows, status chips, steps).
import type { ReactNode } from "react";

export function Row({ k, v, gold = false }: { k: ReactNode; v?: ReactNode; gold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] py-[7px] text-[13px] last:border-b-0 ${gold ? "rounded-md border border-[rgba(233,180,76,0.55)] px-2" : ""}`}>
      <span className="min-w-0 truncate text-[#F5F7F7]">{k}</span>
      {v !== undefined ? <span className="shrink-0 font-mono text-[11.5px] text-[#A3AAAC]">{v}</span> : null}
    </div>
  );
}

const DOT = { live: "bg-[#00E676]", delayed: "bg-[#F6B94A]", stale: "bg-[#6D7578]", sample: "bg-[#6D7578]", gold: "bg-[#E9B44C]", plain: "bg-[#6D7578]", red: "bg-[#FF4D4D]" } as const;
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: keyof typeof DOT }) {
  const ring = tone === "gold" ? "border-[rgba(233,180,76,0.55)] text-[#E9B44C]" : tone === "red" ? "border-[rgba(255,77,77,0.55)] text-[#FF8A8A]" : "border-[rgba(255,255,255,0.16)] text-[#C9CFD1]";
  const hatch = tone === "sample" ? "bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.07)_0_4px,transparent_4px_8px)]" : "";
  return (
    <span className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] ${ring} ${hatch}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${DOT[tone]}`} />
      {children}
    </span>
  );
}

export function Pct({ v, digits = 2 }: { v: number; digits?: number }) {
  return <span className={`font-mono text-[11.5px] ${v >= 0 ? "text-[#00E676]" : "text-[#FF6B6B]"}`}>{`${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(digits)}%`}</span>;
}

/** Stations of a process: done (gold ✓), refused (red ✕) or waiting. */
export function Steps({ items }: { items: readonly { label: string; detail: string; state: "ok" | "no" | "idle" }[] }) {
  return (
    <div>
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-[7px] last:border-b-0">
          <span
            className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
              s.state === "ok" ? "border-[rgba(233,180,76,0.6)] bg-[rgba(233,180,76,0.18)] text-[#E9B44C]" : s.state === "no" ? "border-[rgba(255,77,77,0.6)] bg-[rgba(255,77,77,0.15)] text-[#FF8A8A]" : "border-[rgba(255,255,255,0.2)] text-[#6D7578]"
            }`}
          >
            {s.state === "ok" ? "✓" : s.state === "no" ? "✕" : "·"}
          </span>
          <b className={`w-[120px] shrink-0 text-[13px] font-semibold ${s.state === "no" ? "text-[#FF8A8A]" : "text-[#F5F7F7]"}`}>{s.label}</b>
          <span className="truncate font-mono text-[11px] text-[#A3AAAC]">{s.detail}</span>
        </div>
      ))}
    </div>
  );
}
