"use client";

import { useState } from "react";
import { Segmented } from "@/platform/ui";
import { PIcon, type PlatformIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { SectionHeading } from "../shared";

/** Board-backed trust statements. Wording is fixed; do not soften or extend it. */
const PROMISES: { icon: PlatformIcon; title: string; line: string }[] = [
  { icon: "shield", title: "Never places orders", line: "AFVAR does not place, modify or close trading orders." },
  { icon: "lock", title: "Read-only connections", line: "Supported account connections are read-only." },
  { icon: "user", title: "Verified means verified", line: "Identity verification and verified trading records are different things." },
  { icon: "clock", title: "No fake live data", line: "Sample, delayed and stale data are always labelled." },
  { icon: "sliders", title: "You stay in control", line: "Review important actions. Stop speech or cancel a task at any time." },
  { icon: "check", title: "No silent success", line: "A result is shown as done only after it is checked." },
];

export function TrustSection() {
  return (
    <section aria-labelledby="trust-title" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="trust-title" title="Built to be trusted." summary="What AFVAR does — and what it never does." />
      <ul className="mx-auto mt-16 grid max-w-6xl gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {PROMISES.map((p, i) => (
          <Reveal key={p.title} as="li" delay={(i % 3) * 0.06} className="pf-tile p-8">
            <PIcon name={p.icon} size={28} className="text-(--accent)" />
            <h3 className="mt-5 text-[21px] font-semibold leading-tight tracking-[-0.02em]">{p.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-(--text-secondary)">{p.line}</p>
          </Reveal>
        ))}
      </ul>
      <Reveal className="mx-auto mt-5 max-w-6xl">
        <FreshnessDemo />
      </Reveal>
    </section>
  );
}

type Freshness = "live" | "delayed" | "stale" | "sample";

const FRESHNESS: Record<Freshness, { label: string; dot: string; source: string }> = {
  live: { label: "Live", dot: "bg-(--positive)", source: "Source time shown · updating" },
  delayed: { label: "Delayed", dot: "bg-[var(--warning,#f6b94a)]", source: "Delayed by the provider · delay shown" },
  stale: { label: "Stale", dot: "bg-[var(--warning,#f6b94a)]", source: "Source time shown · not updating" },
  sample: { label: "Sample", dot: "bg-(--text-muted)", source: "Sample data · not live" },
};

const ORDER: Freshness[] = ["live", "delayed", "stale", "sample"];

// Illustrative shape only: no axis, no numbers, no prices.
const LINE = "M0 62 L18 58 L34 64 L52 50 L70 54 L88 40 L106 46 L124 34 L142 38 L160 26 L178 32 L196 20 L214 24 L240 14";

function FreshnessDemo() {
  const [state, setState] = useState<Freshness>("live");
  const current = FRESHNESS[state];
  const stale = state === "stale";

  return (
    <div className="pf-tile grid gap-10 p-8 sm:p-10 lg:grid-cols-[1fr_1.1fr] lg:items-center">
      <div>
        <PIcon name="clock" size={28} className="text-(--accent)" />
        <h3 className="mt-5 text-[28px] font-semibold leading-tight tracking-[-0.025em]">Freshness, always labelled.</h3>
        <p className="mt-3 text-[17px] leading-relaxed text-(--text-secondary)">
          Every chart says where its data stands. When data goes stale, conclusions wait until it is fresh again.
        </p>
        <div className="mt-6">
          <Segmented
            label="Data freshness"
            value={state}
            onChange={setState}
            options={ORDER.map((value) => ({ value, label: FRESHNESS[value].label }))}
          />
        </div>
      </div>

      <figure className="pf-group overflow-hidden bg-(--surface-2)" aria-label="Demo chart card">
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <span className="text-[13px] font-semibold text-(--text-primary)">Gold chart</span>
          <span className="flex items-center gap-2">
            <span className="rounded-full bg-(--surface-3) px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em] text-(--text-muted)">Demo</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-(--surface-3) px-2.5 py-0.5 text-[12px] font-medium text-(--text-primary)">
              <span className={`h-1.5 w-1.5 rounded-full ${current.dot}`} aria-hidden="true" />
              {current.label}
            </span>
          </span>
        </div>
        <div className={`px-4 pb-2 transition-[filter,opacity] duration-300 ${stale ? "opacity-45 grayscale" : ""}`}>
          <svg viewBox="0 0 240 72" className="h-36 w-full" preserveAspectRatio="none" aria-hidden="true">
            {[18, 36, 54].map((y) => (
              <line key={y} x1="0" x2="240" y1={y} y2={y} stroke="var(--chart-grid)" strokeWidth="0.5" />
            ))}
            <path
              d={LINE}
              fill="none"
              stroke={stale ? "var(--text-muted)" : "var(--accent)"}
              strokeWidth="1.75"
              strokeLinejoin="round"
              strokeLinecap="round"
              strokeDasharray={state === "sample" ? "4 3" : undefined}
              vectorEffect="non-scaling-stroke"
            />
          </svg>
        </div>
        <figcaption aria-live="polite" className="border-t border-(--mac-hairline) px-4 py-3 text-[13px]">
          <span className="text-(--text-secondary)">{current.source}</span>
          {stale && (
            <span className="mt-1.5 flex items-center gap-1.5 font-medium text-[var(--warning,#f6b94a)]">
              <PIcon name="info" size={15} weight="fill" />
              Data stale — conclusions paused until fresh
            </span>
          )}
        </figcaption>
      </figure>
    </div>
  );
}
