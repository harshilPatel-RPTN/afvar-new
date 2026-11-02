"use client";

// Small building blocks for OS window content (rows, status chips, steps).
import type { ReactNode } from "react";

export function Row({ k, v, gold = false }: { k: ReactNode; v?: ReactNode; gold?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-3 border-b border-[rgba(255,255,255,0.06)] py-[7px] text-[13px] last:border-b-0 ${gold ? "rounded-md border border-[rgba(168,222,194,0.55)] px-2" : ""}`}>
      {/* Cards (phones, tablets): wrap instead of cutting. */}
      <span className="min-w-0 truncate text-[#F2F5F2] [.afv-stack_&]:min-w-min [.afv-stack_&]:whitespace-normal [.afv-stack_&]:break-words">{k}</span>
      {v !== undefined ? <span className="shrink-0 font-mono text-[11.5px] text-[#B7C5BC] [.afv-stack_&]:min-w-0 [.afv-stack_&]:shrink [.afv-stack_&]:break-words [.afv-stack_&]:text-right">{v}</span> : null}
    </div>
  );
}

const DOT = { live: "bg-[#00E676]", delayed: "bg-[#F6B94A]", stale: "bg-[#92A399]", sample: "bg-[#92A399]", gold: "bg-[#A8DEC2]", plain: "bg-[#92A399]", red: "bg-[#FF4D4D]" } as const;
export function Chip({ children, tone = "plain" }: { children: ReactNode; tone?: keyof typeof DOT }) {
  const ring = tone === "gold" ? "border-[rgba(168,222,194,0.55)] text-[#A8DEC2]" : tone === "red" ? "border-[rgba(255,77,77,0.55)] text-[#FF8A8A]" : "border-[rgba(255,255,255,0.16)] text-[#C9CFD1]";
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

/** Stations of a process: done (mint ✓), refused (red ✕) or waiting. `thread` (0–1) draws the line that joins them. */
export function Steps({ items, thread }: { items: readonly { label: string; detail: string; state: "ok" | "no" | "idle" }[]; thread?: number }) {
  const line = thread !== undefined && items.length > 1;
  return (
    <div className="relative">
      {line ? (
        <span aria-hidden="true" className="pointer-events-none absolute bottom-[17px] left-[8.5px] top-[17px] w-px bg-[rgba(255,255,255,0.1)]">
          <span className="absolute inset-0 origin-top bg-[rgba(168,222,194,0.75)] transition-transform duration-500 ease-out" style={{ transform: `scaleY(${thread})` }} />
        </span>
      ) : null}
      {items.map((s) => (
        <div key={s.label} className="flex items-center gap-2.5 border-b border-[rgba(255,255,255,0.06)] py-[7px] last:border-b-0">
          <span className={`relative grid shrink-0 place-items-center rounded-full ${line ? "bg-[#101315]" : ""}`}>
            <span
              className={`grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border font-mono text-[10px] ${
                s.state === "ok" ? "border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.18)] text-[#A8DEC2]" : s.state === "no" ? "border-[rgba(255,77,77,0.6)] bg-[rgba(255,77,77,0.15)] text-[#FF8A8A]" : "border-[rgba(255,255,255,0.2)] text-[#92A399]"
              }`}
            >
              {s.state === "ok" ? "✓" : s.state === "no" ? "✕" : "·"}
            </span>
          </span>
          <b className={`w-[120px] shrink-0 text-[13px] font-semibold [.afv-stack_&]:w-[104px] ${s.state === "no" ? "text-[#FF8A8A]" : "text-[#F2F5F2]"}`}>{s.label}</b>
          <span className="min-w-0 truncate font-mono text-[11px] text-[#B7C5BC] [.afv-stack_&]:whitespace-normal [.afv-stack_&]:break-words">{s.detail}</span>
        </div>
      ))}
    </div>
  );
}
