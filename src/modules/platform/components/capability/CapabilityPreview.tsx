"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { Capability, CapabilitySlug } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { MacWindow } from "../mac/MacWindow";
import { ScrollSettle } from "../mac/motion-kit";
import { AvailabilityBadge } from "../shared";
import { PREVIEW_ANCHOR, useFeatureFocus } from "./FeatureFocus";

/**
 * WF04 "Capability interface preview" — an interactive sample app window.
 * Schematic only: shapes, no prices, names or results (DESIGN-GUIDE §0.3.3,
 * WA-T06). Feature list and sample controls are real buttons.
 */
export function CapabilityPreview({ capability: c }: { capability: Capability }) {
  return (
    <ScrollSettle className="mx-auto mt-16 max-w-5xl scroll-mt-24 sm:mt-20">
      <section id={PREVIEW_ANCHOR} aria-label={`Interactive sample preview of ${c.title}. Not live data.`}>
        <PreviewWindow capability={c} interactive />
        <p className="mt-5 text-center text-[13px] text-(--text-muted)">Interactive sample · not live data · final asset pending</p>
      </section>
    </ScrollSettle>
  );
}

const AUTOPLAY_MS = 2600;
// Charts and alerts rebuild their scene for each feature; the others keep
// running state (message thread, hover) and just follow the focused feature.
const REPLAY_PER_FEATURE = new Set<CapabilitySlug>(["charts", "alerts"]);

/**
 * The app window. `interactive` (capability pages) makes the feature list and
 * sample controls operable; the overview's sticky tour uses the passive form.
 * Either way it autoplays through features while visible until the visitor
 * picks one, and replays its entrance each time it comes into view.
 */
export function PreviewWindow({ capability: c, interactive = false }: { capability: Capability; interactive?: boolean }) {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.35 });
  const { selected, pinned, select } = useFeatureFocus();
  const index = Math.min(selected, c.features.length - 1);
  const feature = c.features[index];

  useEffect(() => {
    if (still || pinned || !visible) return;
    const t = setTimeout(() => select((index + 1) % c.features.length, false), AUTOPLAY_MS);
    return () => clearTimeout(t);
  }, [index, pinned, still, visible, select, c.features.length]);

  const animate = !still && visible;

  return (
    <div ref={ref}>
      <MacWindow
        title={c.title}
        className="!rounded-[14px]"
        toolbar={<span className="rounded-[5px] bg-white/[0.06] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-(--text-muted)">Sample</span>}
        bodyClassName="grid h-[340px] grid-cols-1 sm:h-[420px] sm:grid-cols-[190px_1fr]"
      >
        <aside className="pf-sidebar hidden overflow-y-auto p-3 sm:block">
          <div className="flex items-center gap-2 px-1 pb-3">
            <AppIcon icon={c.icon} tone={c.tone} size={22} />
            <span className="truncate text-[12px] font-semibold">{c.title}</span>
          </div>
          <div role={interactive ? "group" : undefined} aria-label={interactive ? `${c.title} features` : undefined} className="space-y-px">
            {c.features.map((f, i) => {
              const on = i === index;
              const cls = `relative flex w-full items-center gap-2 rounded-[5px] px-2 py-[5px] text-left text-[11.5px] transition-colors ${on ? "text-(--text-primary)" : "text-(--text-secondary) hover:bg-white/5"}`;
              const inner = (
                <>
                  {on && <motion.span layoutId={`pf-side-${c.slug}-${interactive}`} className="absolute inset-0 rounded-[5px] bg-white/10" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
                  <PIcon name={f.icon} size={13} weight={on ? "fill" : "regular"} className={`relative ${on ? "text-(--accent)" : ""}`} />
                  <span className="relative truncate">{f.title}</span>
                </>
              );
              return interactive ? (
                <button key={f.title} type="button" aria-pressed={on} onClick={() => select(i, true)} className={cls}>
                  {inner}
                </button>
              ) : (
                <div key={f.title} className={cls}>
                  {inner}
                </div>
              );
            })}
          </div>
        </aside>

        <div className="relative flex min-w-0 flex-col overflow-hidden bg-(--mac-window)">
          <div className="flex items-center gap-3 border-b border-white/[0.06] px-5 py-3">
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={feature.title}
                className="flex min-w-0 flex-1 items-center gap-3"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
              >
                <PIcon name={feature.icon} size={18} weight="duotone" className="text-(--accent)" />
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold">{feature.title}</p>
                  <p className="truncate text-[11.5px] text-(--text-muted)">{feature.description}</p>
                </div>
              </motion.div>
            </AnimatePresence>
            <AvailabilityBadge value={feature.availability} className="hidden md:inline-flex" />
          </div>
          {interactive && (
            <div className="flex gap-1 overflow-x-auto border-b border-white/[0.06] px-3 py-2 sm:hidden">
              {c.features.map((f, i) => (
                <button
                  key={f.title}
                  type="button"
                  aria-pressed={i === index}
                  onClick={() => select(i, true)}
                  className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${i === index ? "bg-(--accent) text-(--text-inverse)" : "bg-white/5 text-(--text-secondary)"}`}
                >
                  {f.title}
                </button>
              ))}
            </div>
          )}
          <div className="relative min-h-0 flex-1 p-5">
            {/* Remount on entering view so the scene replays; scenes that rebuild per feature also remount on feature change. */}
            <Sketch key={`${REPLAY_PER_FEATURE.has(c.slug) ? index : 0}-${visible}`} slug={c.slug} focus={index} animate={animate} interactive={interactive} />
          </div>
        </div>
      </MacWindow>
    </div>
  );
}

type SketchProps = { focus: number; animate: boolean; interactive: boolean };

export function Sketch({ slug, ...p }: SketchProps & { slug: CapabilitySlug }) {
  switch (slug) {
    case "charts":
      return <ChartsSketch {...p} />;
    case "research":
      return <ResearchSketch {...p} />;
    case "alerts":
      return <AlertsSketch {...p} />;
    case "trade-review":
      return <ReviewSketch {...p} />;
    case "community":
      return <CommunitySketch {...p} />;
  }
}

const rise = (animate: boolean, i: number) =>
  animate
    ? {
        initial: { opacity: 0, y: 10 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1] as const, delay: 0.05 + i * 0.05 },
      }
    : {};

/* ------------------------------------------------------------- charts */

// Deterministic schematic series per timeframe: shape only, no scale or values.
const SERIES = [
  [38, 46, 41, 55, 50, 62, 58, 49, 57, 66, 61, 72, 68, 60, 70, 78, 74, 82],
  [60, 55, 58, 50, 47, 52, 44, 48, 41, 46, 52, 49, 57, 63, 59, 66, 71, 68],
  [44, 49, 47, 53, 58, 55, 61, 57, 64, 60, 67, 63, 70, 66, 73, 69, 75, 80],
  [70, 64, 67, 58, 62, 55, 59, 52, 57, 63, 60, 68, 65, 72, 69, 76, 73, 79],
];
const TIMEFRAMES = ["1H", "4H", "1D", "1W"];

function ChartsSketch({ focus, animate, interactive }: SketchProps) {
  const [tf, setTf] = useState(focus % TIMEFRAMES.length);
  const [cross, setCross] = useState<number | null>(null);
  // Stretch the series to fill the plot height (12%–84%), keeping its shape.
  const raw = SERIES[tf];
  const lo = Math.min(...raw) - 6;
  const hi = Math.max(...raw);
  const series = raw.map((v) => 12 + ((v - lo) / (hi - lo)) * 72);

  return (
    <div className="flex h-full flex-col">
      <div className="mb-3 flex items-center gap-1">
        {TIMEFRAMES.map((t, i) =>
          interactive ? (
            <button
              key={t}
              type="button"
              aria-pressed={i === tf}
              aria-label={`Sample timeframe ${t}`}
              onClick={() => setTf(i)}
              className={`rounded-[5px] px-2 py-0.5 text-[11px] font-medium transition-colors ${i === tf ? "bg-white/10 text-(--text-primary)" : "text-(--text-muted) hover:text-(--text-primary)"}`}
            >
              {t}
            </button>
          ) : (
            <span key={t} className={`rounded-[5px] px-2 py-0.5 text-[11px] font-medium ${i === tf ? "bg-white/10" : "text-(--text-muted)"}`}>
              {t}
            </span>
          ),
        )}
        {interactive && <span className="ml-auto text-[10px] text-(--text-muted)">Hover the chart</span>}
      </div>
      <div
        className="relative flex flex-1 gap-[3%] px-1"
        aria-hidden="true"
        onPointerMove={(e) => {
          const box = e.currentTarget.getBoundingClientRect();
          setCross(Math.min(Math.max((e.clientX - box.left) / box.width, 0), 1));
        }}
        onPointerLeave={() => setCross(null)}
      >
        {[25, 50, 75].map((y) => (
          <span key={y} className="absolute inset-x-0 h-px bg-(--chart-grid)" style={{ top: `${y}%` }} />
        ))}
        {series.map((close, i) => {
          const open = i === 0 ? close - 6 : series[i - 1];
          const tone = close >= open ? "bg-(--positive)" : "bg-(--negative)";
          const low = Math.min(open, close) - 5;
          const high = Math.max(open, close) + 5;
          const hot = cross !== null && Math.round(cross * (series.length - 1)) === i;
          return (
            <motion.span
              key={`${tf}-${i}`}
              className="relative flex-1"
              initial={animate ? { opacity: 0, scaleY: 0.3 } : false}
              animate={{ opacity: hot || cross === null ? 1 : 0.55, scaleY: 1 }}
              style={{ transformOrigin: `50% ${100 - (open + close) / 2}%` }}
              transition={{ delay: animate ? i * 0.025 : 0, duration: 0.25 }}
            >
              <span className={`absolute left-1/2 w-px -translate-x-1/2 ${tone}`} style={{ bottom: `${low}%`, height: `${high - low}%` }} />
              <span className={`absolute inset-x-0 rounded-[1.5px] ${tone}`} style={{ bottom: `${Math.min(open, close)}%`, height: `${Math.max(Math.abs(close - open), 2)}%` }} />
            </motion.span>
          );
        })}
        {cross !== null && <span className="pointer-events-none absolute inset-y-0 w-px bg-white/40" style={{ left: `${cross * 100}%` }} />}
        {cross === null && animate && (
          <motion.span
            className="pointer-events-none absolute inset-y-0 w-px bg-white/25"
            animate={{ left: ["8%", "92%", "40%"] }}
            transition={{ duration: 4, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }}
          />
        )}
      </div>
    </div>
  );
}

/* ----------------------------------------------------------- research */

function ResearchSketch({ focus, animate }: SketchProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? focus % 3;
  return (
    <div className="space-y-2.5" aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          {...rise(animate, i)}
          onPointerEnter={() => setHover(i)}
          onPointerLeave={() => setHover(null)}
          className={`pf-group cursor-default p-3.5 transition-[background-color,box-shadow] duration-200 ${i === active ? "!bg-white/[0.07] shadow-[inset_0_0_0_1px_rgba(0,230,118,0.45)]" : ""}`}
        >
          <div className="flex items-center gap-2">
            <PIcon name={i === 0 ? "calendar" : "news"} size={14} className={i === 0 ? "text-(--ai)" : "text-(--text-muted)"} />
            <span className="pf-bar h-2 w-1/3" />
            <span className={`ml-auto h-1.5 w-8 rounded-full ${i === 1 ? "bg-(--negative)/70" : "bg-(--positive)/70"}`} />
          </div>
          <motion.div initial={false} animate={{ height: i === active ? "auto" : 0, opacity: i === active ? 1 : 0 }} className="overflow-hidden">
            <span className="pf-bar mt-3 h-1.5 w-full" />
            <span className="pf-bar mt-1.5 h-1.5 w-4/5" />
            <span className="mt-3 inline-flex items-center gap-1 text-[10px] text-(--text-link)">
              <PIcon name="link" size={11} /> Source
            </span>
          </motion.div>
        </motion.div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------- alerts */

function AlertsSketch({ focus, animate, interactive }: SketchProps) {
  const [on, setOn] = useState(!animate);
  const [step, setStep] = useState(animate ? 0 : 3);

  useEffect(() => {
    if (!animate) return;
    if (step < 3) {
      const t = setTimeout(() => setStep((s) => s + 1), 280);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setOn(true), 300);
    return () => clearTimeout(t);
  }, [step, animate]);

  return (
    <div className="mx-auto flex h-full max-w-md flex-col justify-center">
      <div className="pf-group" aria-hidden="true">
        {(["When", "And", "Then"] as const).map((label, i) => (
          <div key={label} className="flex items-center gap-3 px-4 py-3">
            <span className="w-10 text-[12px] font-semibold text-(--chart-purple)">{label}</span>
            <motion.span
              className="pf-bar h-2 flex-1 origin-left"
              initial={false}
              animate={{ scaleX: step > i ? 1 : 0.15, opacity: step > i ? 1 : 0.4 }}
              transition={{ duration: 0.25 }}
            />
            <span className={`h-5 w-16 rounded-[5px] transition-colors duration-300 ${step > i ? "bg-(--chart-purple)/25" : "bg-white/[0.07]"}`} />
          </div>
        ))}
      </div>
      <div className="pf-group mt-2 flex items-center justify-between px-4 py-3">
        <span className="flex items-center gap-2 text-[12px] text-(--text-secondary)">
          <PIcon name="bell" size={14} weight={on ? "fill" : "regular"} className={on ? "text-(--accent)" : ""} /> Notify me
          <span className="text-(--text-muted)">· sample</span>
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={on}
          aria-label="Sample alert switch"
          tabIndex={interactive ? 0 : -1}
          onClick={() => interactive && setOn((v) => !v)}
          className={`relative h-[22px] w-[38px] rounded-full transition-colors duration-200 ${on ? "bg-(--positive)" : "bg-(--surface-active)"}`}
        >
          <motion.span className="absolute top-[2px] h-[18px] w-[18px] rounded-full bg-white shadow" animate={{ left: on ? 18 : 2 }} transition={{ type: "spring", stiffness: 600, damping: 34 }} />
        </button>
      </div>
      <p className="mt-3 text-center text-[11px] text-(--text-muted)">
        {focus === 0 ? "You review and confirm a rule before it runs." : "Costs, assumptions and results stay visible."}
      </p>
    </div>
  );
}

/* --------------------------------------------------------- trade review */

const SEGMENTS = [
  { label: "Segment A", share: 0.42, color: "#00E676" },
  { label: "Segment B", share: 0.28, color: "#69F0AE" },
  { label: "Segment C", share: 0.18, color: "#e5484d" },
];
const RING_R = 46;
const RING_C = 2 * Math.PI * RING_R;
// Arc start offsets, each segment after the previous one plus a small gap.
const RING_STARTS = SEGMENTS.map((_, i) => SEGMENTS.slice(0, i).reduce((sum, s) => sum + s.share * RING_C + 3, 0));

function ReviewSketch({ focus, animate }: SketchProps) {
  const [hover, setHover] = useState<number | null>(null);
  const active = hover ?? focus % SEGMENTS.length;
  const r = RING_R;
  const circ = RING_C;
  return (
    <div className="grid h-full grid-cols-[160px_1fr] items-center gap-6 max-sm:grid-cols-1" aria-hidden="true">
      <div className="max-sm:hidden">
        <svg viewBox="0 0 120 120" className="mx-auto h-36 w-36 -rotate-90">
          <circle cx="60" cy="60" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
          {SEGMENTS.map((s, i) => {
            const dash = s.share * circ;
            const start = RING_STARTS[i];
            return (
              <motion.circle
                key={s.label}
                cx="60"
                cy="60"
                r={r}
                fill="none"
                stroke={s.color}
                strokeDashoffset={-start}
                onPointerEnter={() => setHover(i)}
                onPointerLeave={() => setHover(null)}
                initial={animate ? { strokeDasharray: `0 ${circ}` } : false}
                animate={{ strokeDasharray: `${dash} ${circ}`, strokeWidth: i === active ? 16 : 11, opacity: i === active ? 1 : 0.55 }}
                transition={{ delay: animate ? 0.1 + i * 0.1 : 0, duration: 0.4, ease: [0.25, 0.1, 0.25, 1] }}
                style={{ cursor: "pointer" }}
              />
            );
          })}
        </svg>
        <p className="mt-2 text-center text-[11px] text-(--text-muted)">{SEGMENTS[active].label} · sample</p>
      </div>
      <motion.div {...rise(animate, 1)} className="pf-group">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className={`flex items-center gap-3 px-3 py-2.5 transition-colors ${i === focus % 4 ? "bg-white/[0.05]" : ""}`}>
            <PIcon name="journal" size={14} className="text-(--accent)" />
            <span className="pf-bar h-1.5 w-1/4" />
            <span className="pf-bar h-1.5 flex-1" />
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-2 text-[11px] text-(--text-muted)">
          <PIcon name="lock" size={12} /> Read-only connection
        </div>
      </motion.div>
    </div>
  );
}

/* ----------------------------------------------------------- community */

function CommunitySketch({ animate }: SketchProps) {
  const [count, setCount] = useState(animate ? 1 : 3);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const t = setTimeout(
      () => {
        if (typing) {
          setTyping(false);
          setCount((n) => (n >= 5 ? 1 : n + 1));
        } else {
          setTyping(true);
        }
      },
      typing ? 900 : 700,
    );
    return () => clearTimeout(t);
  }, [typing, count, animate]);

  const messages = Array.from({ length: count }, (_, i) => i % 2 === 1);
  return (
    <div className="flex h-full flex-col justify-end gap-2 overflow-hidden" aria-hidden="true">
      <AnimatePresence initial={false}>
        {messages.slice(-4).map((mine, i, arr) => (
          <motion.div
            key={count - arr.length + i}
            layout
            initial={{ opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
            className={`flex items-end gap-2 ${mine ? "flex-row-reverse" : ""}`}
          >
            <span className={`h-6 w-6 shrink-0 rounded-full ${mine ? "bg-(--accent-dark)" : "bg-white/10"}`} />
            <div className={`max-w-[70%] rounded-[18px] px-3.5 py-2.5 ${mine ? "bg-(--accent)" : "bg-white/[0.07]"}`}>
              <span className={`block h-1.5 w-36 max-w-full rounded ${mine ? "bg-black/25" : "bg-white/15"}`} />
              <span className={`mt-1.5 block h-1.5 w-20 rounded ${mine ? "bg-black/15" : "bg-white/10"}`} />
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
      <div className="flex h-7 items-center">
        <AnimatePresence>
          {typing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="ml-8 flex gap-1 rounded-full bg-white/[0.07] px-3 py-2">
              {[0, 1, 2].map((d) => (
                <motion.span key={d} className="h-1.5 w-1.5 rounded-full bg-white/50" animate={{ y: [0, -3, 0] }} transition={{ duration: 0.6, repeat: Infinity, delay: d * 0.12 }} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
        <span className="ml-auto flex items-center gap-1.5 rounded-full bg-(--ai-bg) px-3 py-1 text-[11px] text-(--ai)">
          <PIcon name="sparkle" size={12} weight="fill" /> Discussion summary
        </span>
      </div>
    </div>
  );
}
