"use client";

import { motion, useTransform } from "framer-motion";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { useLiveMarket, type Candle } from "@/modules/home/kit";
import "./footer-landing-candles.css";
import { useCachedScrollProgress } from "./footerLandingScroll";

/* Decorative candlestick backdrop for the footer landing pad: one chart per
 * side, climbing toward the outer edge. Shapes come from real hourly candles
 * (Gold on the left, Bitcoin on the right) with their own drift removed and a
 * rising trend laid under them, so bodies and wicks are real but the picture
 * always climbs outward. No numbers, no symbols: it's scenery, not a quote.
 * Before the feed answers (or if it never does) a seeded series stands in,
 * identical on server and client.
 *
 * Motion (CSS, paused off screen): candles grow one by one from the centre
 * outward and their wicks draw in; then the outermost candle ticks, a faint
 * price line scans, the chart breathes, and a small scroll parallax drifts it.
 * Reduced motion shows the finished chart, still. */

const COUNT = 40;
const VB_W = 400;
const VB_H = 1000;
/** Chart height in 0..1 (up): the centre-side end sits low, the outer end high. */
const BASE = 0.14;
const SPAN = 0.6;
const AMP = 0.13;

const SYMBOL = { left: "XAUUSD", right: "BTC-USD" } as const;
const SEED = { left: 0x5eed01, right: 0x5eed02 } as const;
/** The faint back layer (depth) is always seeded: it's texture, not data. */
const GHOST_SEED = { left: 0x9a057, right: 0x9a058 } as const;

type Bar = { o: number; h: number; l: number; c: number };

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic random-walk candles (same output on server and client). */
function seeded(seed: number): Bar[] {
  const rnd = mulberry32(seed);
  const bars: Bar[] = [];
  let price = 100;
  for (let i = 0; i < COUNT; i++) {
    const o = price;
    const c = o + (rnd() - 0.47) * 2.4;
    const h = Math.max(o, c) + rnd() * 1.1;
    const l = Math.min(o, c) - rnd() * 1.1;
    bars.push({ o, h, l, c });
    price = c;
  }
  return bars;
}

/** Detrend the candles and lay them on a rising path; returns values in 0..1 (up). */
function shape(bars: Bar[]): Bar[] {
  const n = bars.length;
  const mids = bars.map((b) => (b.o + b.c) / 2);
  const mx = (n - 1) / 2;
  const my = mids.reduce((s, v) => s + v, 0) / n;
  let num = 0;
  let den = 0;
  mids.forEach((v, i) => {
    num += (i - mx) * (v - my);
    den += (i - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  const fit = (i: number) => my + slope * (i - mx);
  let m = 0;
  bars.forEach((b, i) => {
    m = Math.max(m, Math.abs(b.h - fit(i)), Math.abs(b.l - fit(i)));
  });
  const scale = m > 0 ? AMP / m : 0;
  return bars.map((b, i) => {
    const t = n > 1 ? i / (n - 1) : 1;
    const trend = BASE + SPAN * t ** 1.2;
    const v = (p: number) => trend + (p - fit(i)) * scale;
    return { o: v(b.o), h: v(b.h), l: v(b.l), c: v(b.c) };
  });
}

function fromFeed(candles: readonly Candle[] | undefined): Bar[] | null {
  const ok = (candles ?? []).filter((k) => [k.o, k.h, k.l, k.c].every(Number.isFinite) && k.h >= k.l);
  return ok.length >= 16 ? ok.slice(-COUNT) : null;
}

type Shape = {
  x: number;
  w: number;
  bodyY: number;
  bodyH: number;
  wickTop: number;
  wickH: number;
  /** Where the wick draws out from (body centre), as % of the wick height. */
  origin: number;
  up: boolean;
};

function layout(bars: Bar[]): Shape[] {
  const step = VB_W / bars.length;
  const y = (v: number) => VB_H * (1 - v);
  return bars.map((b, i) => {
    let bodyY = y(Math.max(b.o, b.c));
    let bodyH = y(Math.min(b.o, b.c)) - bodyY;
    if (bodyH < 5) {
      bodyY -= (5 - bodyH) / 2;
      bodyH = 5;
    }
    const wickTop = Math.min(y(b.h), bodyY);
    const wickH = Math.max(Math.max(y(b.l), bodyY + bodyH) - wickTop, 1);
    return {
      x: i * step + step / 2,
      w: step * 0.56,
      bodyY,
      bodyH,
      wickTop,
      wickH,
      origin: ((bodyY + bodyH / 2 - wickTop) / wickH) * 100,
      up: b.c >= b.o,
    };
  });
}

export function FooterLandingCandles({ side }: { side: "left" | "right" }) {
  const root = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  const [active, setActive] = useState(false);
  const { quotes } = useLiveMarket();
  const feed = quotes[SYMBOL[side]]?.candles;
  // Live quotes arrive as fresh objects on every poll; key the chart on the bars' actual values so
  // an unchanged feed never re-lays-out (or re-renders) the SVG — that work landed mid-flight.
  const bars = fromFeed(feed);
  const barsKey = bars ? bars.map((b) => `${b.o},${b.h},${b.l},${b.c}`).join(";") : "";
  // eslint-disable-next-line react-hooks/exhaustive-deps -- keyed on content (barsKey), not on the feed's identity
  const shapes = useMemo(() => layout(shape(bars ?? seeded(SEED[side]))), [barsKey, side]);
  const ghost = useMemo(() => layout(shape(seeded(GHOST_SEED[side]))), [side]);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        setActive(entry.isIntersecting);
        if (entry.isIntersecting && entry.intersectionRatio >= 0.15) setShown(true);
      },
      { threshold: [0, 0.15] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const scrollYProgress = useCachedScrollProgress(root, "pass");
  const y = useTransform(scrollYProgress, [0, 1], [36, -36]);

  const last = shapes.length - 1;
  const step = VB_W / Math.max(shapes.length, 1);
  const newest = shapes[last];

  // The SVG only changes when the bars do; quote polls and IO flips re-render the root without rebuilding it.
  const chart = useMemo(
    () => (
      <div className="flc-chart">
        <svg className="flc-svg flc-ghost" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" focusable="false">
          {ghost.map((s, i) => (
            <g key={i} className={s.up ? "flc-gup" : "flc-gdown"}>
              <rect x={s.x - 0.6} y={s.wickTop} width={1.2} height={s.wickH} />
              <rect x={s.x - s.w / 2} y={s.bodyY} width={s.w} height={s.bodyH} />
            </g>
          ))}
        </svg>
        <svg className="flc-svg" viewBox={`0 0 ${VB_W} ${VB_H}`} preserveAspectRatio="none" focusable="false">
          {(["up", "down"] as const).map((tone) => (
            <g key={tone} className={`flc-tone flc-${tone}`}>
              {shapes.map((s, i) =>
                i === last || (s.up ? "up" : "down") !== tone ? null : <CandleShape key={i} s={s} i={i} step={step} />,
              )}
            </g>
          ))}
          {newest && (
            <g className={`flc-tone flc-new flc-${newest.up ? "up" : "down"}`}>
              <CandleShape s={newest} i={last} step={step} />
            </g>
          )}
        </svg>
        <span className="flc-scan" />
      </div>
    ),
    [ghost, shapes, last, step, newest],
  );

  return (
    <div
      ref={root}
      className="flc-root"
      data-side={side}
      data-shown={shown ? "" : undefined}
      data-active={active ? "" : undefined}
      aria-hidden="true"
    >
      <motion.div className="flc-par" style={{ y }}>
        {chart}
      </motion.div>
    </div>
  );
}

function CandleShape({ s, i, step }: { s: Shape; i: number; step: number }) {
  const wickW = Math.max(step * 0.09, 1.2);
  return (
    <g className="flc-c" style={{ "--i": i } as CSSProperties}>
      <rect
        className="flc-wick"
        x={s.x - wickW / 2}
        y={s.wickTop}
        width={wickW}
        height={s.wickH}
        style={{ transformOrigin: `50% ${s.origin}%` }}
      />
      <rect className="flc-body" x={s.x - s.w / 2} y={s.bodyY} width={s.w} height={s.bodyH} rx={Math.min(s.w * 0.12, 2)} />
    </g>
  );
}
