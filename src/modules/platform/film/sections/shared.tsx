"use client";

// Shared pieces for the OS sections of every Platform page: real candles from
// the live feed, a chart window, and process steps that tick with the scroll.
import { animate, backOut, useInView, useMotionValueEvent } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CandleChart, Chip, Steps, Win, useAfvarReducedMotion, useSection, useSectionRamp, type AppGlyphName, type ChartLevel2 } from "@/modules/afvarOs";
import { useLiveMarket, type HomeQuote } from "@/modules/home/kit";
import { STATUS_LABEL, asOfText } from "../market/analysis";

export const SYM: Record<string, string> = { XAUUSD: "Gold", XAGUSD: "Silver", WTI: "Crude oil", EURUSD: "EUR/USD", USDJPY: "USD/JPY", GBPUSD: "GBP/USD", NZDUSD: "NZD/USD", "BTC-USD": "Bitcoin" };

export function useQuote(key: string): HomeQuote | undefined {
  return useLiveMarket().quotes[key];
}

/** Range of the newest candles, worked out from the real feed (null until candles arrive). */
export function useRange(key: string, n = 44) {
  const q = useQuote(key);
  return useMemo(() => {
    const c = (q?.candles ?? []).slice(-n);
    if (c.length < 2) return null;
    const hi = Math.max(...c.map((k) => k.h));
    const lo = Math.min(...c.map((k) => k.l));
    const sma20 = c.length >= 20 ? c.slice(-20).reduce((s, k) => s + k.c, 0) / 20 : null;
    const last = c[c.length - 1].c;
    const first = c[0].o;
    return { hi, lo, mid: (hi + lo) / 2, sma20, last, chg: ((last - first) / first) * 100, d: q?.decimals ?? 2 };
  }, [q, n]);
}

/** A price with the instrument's decimals, or "—". */
export const fmt = (v: number | null | undefined, d = 2) => (v == null ? "—" : v.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));

/** "Live · Gold-API.com (spot) · 06:40 UTC" for a quote. */
export function sourceLine(q: HomeQuote | undefined): string {
  if (!q || q.status === "snapshot") return "Stored values · not live";
  return `${STATUS_LABEL[q.status]} · ${q.source ?? "provider"} · ${asOfText(q.asOf)}`;
}

export function StatusChip({ q }: { q: HomeQuote | undefined }) {
  const s = q?.status ?? "snapshot";
  return <Chip tone={s === "live" ? "live" : s === "delayed" ? "delayed" : "stale"}>{STATUS_LABEL[s]}</Chip>;
}

/** A chart window: real hourly candles of one market, labelled with its source and time. */
export function ChartWin({
  k,
  at = 0,
  out,
  x,
  y,
  w,
  h,
  title,
  levels,
  trend,
  averages,
  marks,
  band,
  cross,
  event,
  drawFrom,
  ai,
  last = 44,
  head = true,
  z,
}: {
  k: string;
  at?: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title?: string;
  levels?: ChartLevel2[];
  trend?: readonly [readonly [number, number], readonly [number, number]];
  averages?: { len: number; dash?: boolean }[];
  marks?: { i: number; side: "buy" | "sell"; label?: string }[];
  band?: readonly [number, number];
  cross?: number;
  event?: { i: number; label: string };
  /** Section progress window in which the AI drawing appears. */
  drawFrom?: readonly [number, number];
  ai?: boolean;
  /** How many of the newest candles to show. */
  last?: number;
  head?: boolean;
  z?: number;
}) {
  const q = useQuote(k);
  const draw = useSectionRamp(drawFrom?.[0] ?? -1, drawFrom?.[1] ?? 0);
  const candles = (q?.candles ?? []).slice(-last);
  // Cards (phones, tablets): draw the chart at the card's real width so labels keep their shape.
  const { mode } = useSection();
  const [box, setBox] = useState<HTMLDivElement | null>(null);
  const cardW = useElementWidth(mode === "stack" ? box : null);
  const stack = mode === "stack";
  const cw = stack ? Math.max(240, cardW || 320) : Math.max(200, w - 28);
  const ch = stack ? Math.round(Math.min(300, Math.max(190, cw * 0.62))) : Math.max(100, h - (head ? 74 : 50));
  return (
    <Win at={at} out={out} x={x} y={y} w={w} h={h} title={title ?? `Market data · ${SYM[k] ?? k} · 1H`} glyph="chart" ai={ai} z={z}>
      <div className="flex h-full flex-col">
        {head ? (
          <div className="mb-1.5 flex items-center gap-2">
            <StatusChip q={q} />
            <span className="truncate font-mono text-[10px] text-[#92A399]">{sourceLine(q)}</span>
          </div>
        ) : null}
        <div ref={setBox} className="min-h-0 flex-1" style={stack ? { height: ch } : undefined}>
          <CandleChart candles={candles} decimals={q?.decimals ?? 2} width={cw} height={ch} levels={levels} trend={trend} averages={averages} marks={marks} band={band} cross={cross} event={event} draw={drawFrom ? draw : undefined} last={q?.last} />
        </div>
      </div>
    </Win>
  );
}

/** Process steps that tick, one by one, as the section scrolls (`at[i]` = when step i completes). */
export function ScrollSteps({ items, at, refusedAt }: { items: readonly { label: string; detail: string }[]; at: readonly number[]; refusedAt?: number }) {
  const { p, mode } = useSection();
  const [v, setV] = useState(mode === "stack" ? 1 : p.get());
  useMotionValueEvent(p, "change", setV);
  const now = mode === "stack" ? 1 : v;
  return <Steps items={items.map((s, i) => ({ ...s, state: refusedAt !== undefined && i === refusedAt && now >= at[i] ? "no" : now >= at[i] ? "ok" : "idle" }))} />;
}

const k01 = (v: number) => Math.min(1, Math.max(0, v));
const out3 = (k: number) => 1 - (1 - k) ** 3;

/**
 * The lines of a window arriving one by one. On the desk they follow the section's
 * scroll (line i from `at + i * step`); on cards they play in order once the card is
 * in view. `pop` springs each line up in place instead of sliding it in from the left.
 * Styles go on the children directly, so `last:` borders inside keep working.
 */
export function Seq({ at, step = 0.03, pop = false, className, children }: { at: number; step?: number; pop?: boolean; className?: string; children: ReactNode }) {
  const { p, mode } = useSection();
  const reduced = useAfvarReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const seen = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const desk = mode === "desk";
  const paint = useCallback(
    (k: (i: number) => number) => {
      Array.from(ref.current?.children ?? []).forEach((c, i) => {
        const v = k(i);
        const st = (c as HTMLElement).style;
        st.opacity = String(v);
        st.transform = v >= 1 ? "" : pop ? `scale(${0.4 + 0.6 * backOut(v)})` : `translateX(${-14 * (1 - out3(v))}px)`;
      });
    },
    [pop],
  );
  const onDesk = useCallback((v: number) => paint((i) => k01((v - at - i * step) / 0.05)), [paint, at, step]);
  useMotionValueEvent(p, "change", (v) => desk && onDesk(v));
  useEffect(() => {
    if (desk) return onDesk(p.get());
    if (reduced) return paint(() => 1);
    if (!seen) return paint(() => 0);
    const n = ref.current?.children.length ?? 0;
    const end = n * 0.06 + 0.35;
    const c = animate(0, end, { duration: end, ease: "linear", onUpdate: (t) => paint((i) => k01((t - i * 0.06) / 0.35)) });
    return () => c.stop();
  }, [desk, reduced, seen, onDesk, paint, p]);
  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

/** A price that counts up from 0 to `to` as it arrives (with the scroll on the desk, once in view on cards). */
export function Count({ at, to, format }: { at: number; to: number; format: (v: number) => string }) {
  const { p, mode } = useSection();
  const reduced = useAfvarReducedMotion();
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, { once: true });
  const desk = mode === "desk";
  const write = useCallback(
    (k: number) => {
      if (ref.current) ref.current.textContent = format(k >= 1 ? to : Math.round(to * out3(k)));
    },
    [format, to],
  );
  useMotionValueEvent(p, "change", (v) => desk && write(k01((v - at) / 0.12)));
  useEffect(() => {
    if (desk) return write(k01((p.get() - at) / 0.12));
    if (reduced || !seen) return write(reduced ? 1 : 0);
    const c = animate(0, 1, { duration: 0.9, ease: "linear", onUpdate: write });
    return () => c.stop();
  }, [desk, reduced, seen, write, at, p]);
  return (
    <span ref={ref} className="tabular-nums">
      {format(to)}
    </span>
  );
}

/** A simple text block inside a window. */
export function Para({ children, gold = false }: { children: ReactNode; gold?: boolean }) {
  return <p className={`m-0 text-[13.5px] leading-relaxed ${gold ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{children}</p>;
}

export type { AppGlyphName };

/** Width of an element, kept current with a ResizeObserver (0 until measured). */
function useElementWidth(el: HTMLElement | null): number {
  const [w, setW] = useState(0);
  useEffect(() => {
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, [el]);
  return w;
}
