"use client";

// A real candlestick chart for AFVAR OS windows. It draws only the candles it
// is given (real hourly OHLC from the feeds) — it never invents a candle. Gold
// marks what the AI added (levels, trend, averages); green / red mean up / down.
//
//   <CandleChart candles={q.candles} decimals={2} levels={[{ v: 4050, label: "AI high", tone: "gold" }]} />
import type { MotionValue } from "framer-motion";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { useMemo } from "react";

export interface ChartCandle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}
export interface ChartLevel2 {
  v: number;
  label?: string;
  tone?: "gold" | "ink" | "up" | "down";
  solid?: boolean;
}

const UP = "#00E676";
const DOWN = "#FF4D4D";
const TONE = { gold: "#A8DEC2", ink: "#C9CFD1", up: "#00E676", down: "#FF6B6B" } as const;

export function CandleChart({
  candles,
  decimals = 2,
  width = 600,
  height = 300,
  axis = true,
  priceAxis = true,
  levels = [],
  trend,
  averages = [],
  marks = [],
  band,
  cross,
  event,
  live = false,
  draw,
  reveal,
  last,
}: {
  candles: readonly ChartCandle[];
  decimals?: number;
  /** Design size (the SVG scales to its box). */
  width?: number;
  height?: number;
  axis?: boolean;
  priceAxis?: boolean;
  levels?: readonly ChartLevel2[];
  /** AI trend line between two candle indexes, at the given prices. */
  trend?: readonly [readonly [number, number], readonly [number, number]];
  /** Moving averages of the closes (AI-added → gold). */
  averages?: readonly { len: number; dash?: boolean }[];
  marks?: readonly { i: number; side: "buy" | "sell"; label?: string }[];
  band?: readonly [number, number];
  cross?: number;
  event?: { i: number; label: string };
  /** The newest candle is still forming (drawn dashed). */
  live?: boolean;
  /** 0→1: how much of the AI drawing (levels, trend, averages) is shown — tie it to scroll. */
  draw?: MotionValue<number>;
  /** 0→1: the whole chart wipes in left → right (the candles are the real ones; only the view is clipped). */
  reveal?: MotionValue<number>;
  /** Override for the last-price tag (e.g. the spot price). */
  last?: number;
}) {
  const g = useMemo(() => {
    const n = candles.length;
    const ys = [...candles.flatMap((k) => [k.h, k.l]), ...levels.map((l) => l.v)];
    let lo = Math.min(...ys);
    let hi = Math.max(...ys);
    const pad = (hi - lo || 1) * 0.08;
    lo -= pad;
    hi += pad;
    const R = priceAxis ? 62 : 6;
    const B = axis ? 18 : 6;
    const T = 6;
    const step = (width - 4 - R) / Math.max(1, n);
    const X = (i: number) => 4 + step * (i + 0.5);
    const Y = (v: number) => T + ((hi - v) / (hi - lo)) * (height - T - B);
    return { n, lo, hi, R, B, T, step, bw: Math.max(1.4, step * 0.62), X, Y };
  }, [candles, levels, width, height, axis, priceAxis]);

  const one = useMotionValue(1);
  const shown = reveal ?? one;
  const clipPath = useTransform(shown, (v) => (v >= 1 ? "none" : `inset(0 ${((1 - v) * 100).toFixed(2)}% 0 0)`));
  // The AI drawing (levels, trend, averages) follows the candles: it fades in over the last
  // fifth of the wipe, on top of its own `draw` ramp.
  const drawn = useTransform([draw ?? one, shown], ([d, r]: number[]) => d * Math.min(1, Math.max(0, (r - 0.8) / 0.2)));
  if (candles.length < 2) {
    return (
      <div className="grid h-full min-h-[120px] place-items-center font-mono text-[11px] uppercase tracking-[0.14em] text-[#92A399]">
        Waiting for candles from the feed
      </div>
    );
  }
  const fmt = (v: number) => v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const { n, lo, hi, R, B, T, step, bw, X, Y } = g;
  const lastC = candles[n - 1];
  const tagV = last ?? lastC.c;
  const avg = averages.map((a) => {
    const pts: string[] = [];
    candles.forEach((_, i) => {
      if (i < a.len - 1) return;
      let s = 0;
      for (let k = i - a.len + 1; k <= i; k++) s += candles[k].c;
      pts.push(`${X(i).toFixed(1)},${Y(s / a.len).toFixed(1)}`);
    });
    return { ...a, pts: pts.join(" ") };
  });
  const hours = (i: number) => {
    const d = new Date(candles[i].t);
    return `${String(d.getUTCHours()).padStart(2, "0")}:00`;
  };

  return (
    <motion.svg viewBox={`0 0 ${width} ${height}`} className="block h-full w-full" preserveAspectRatio="none" role="img" aria-label={`Candlestick chart, ${n} candles, last ${fmt(tagV)}`} style={{ clipPath }}>
      {[0, 1, 2, 3, 4].map((k) => {
        const v = lo + ((hi - lo) * (k + 0.5)) / 5;
        return (
          <g key={k}>
            <line x1={0} x2={width - R} y1={Y(v)} y2={Y(v)} stroke="rgba(255,255,255,0.055)" />
            {priceAxis ? (
              <text x={width - R + 6} y={Y(v) + 3} fill="#92A399" fontFamily="var(--font-mono, monospace)" fontSize={9}>
                {fmt(v)}
              </text>
            ) : null}
          </g>
        );
      })}
      {band ? <rect x={X(band[0]) - step / 2} y={T} width={X(band[1]) - X(band[0]) + step} height={height - T - B} fill="rgba(168,222,194,0.09)" stroke="rgba(168,222,194,0.45)" strokeDasharray="3 3" /> : null}
      {candles.map((k, i) => {
        const up = k.c >= k.o;
        const col = up ? UP : DOWN;
        const forming = live && i === n - 1;
        const y0 = Y(Math.max(k.o, k.c));
        const y1 = Y(Math.min(k.o, k.c));
        return (
          <g key={k.t}>
            <line x1={X(i)} x2={X(i)} y1={Y(k.h)} y2={Y(k.l)} stroke={col} strokeWidth={1} />
            <rect x={X(i) - bw / 2} y={y0} width={bw} height={Math.max(1.2, y1 - y0)} fill={forming ? "none" : col} stroke={col} strokeDasharray={forming ? "2 2" : undefined} rx={0.6} />
          </g>
        );
      })}
      <motion.g style={{ opacity: drawn }}>
        {avg.map((a) => (
          <polyline key={a.len} points={a.pts} fill="none" stroke="#A8DEC2" strokeWidth={1.5} strokeDasharray={a.dash ? "4 3" : undefined} />
        ))}
        {levels.map((l) => {
          const c = TONE[l.tone ?? "gold"];
          return (
            <g key={`${l.v}-${l.label}`}>
              <line x1={4} x2={width - R} y1={Y(l.v)} y2={Y(l.v)} stroke={c} strokeWidth={l.solid ? 1.6 : 1.2} strokeDasharray={l.solid ? undefined : "5 4"} />
              {l.label && priceAxis ? (
                // ~5.4 px per mono character at 9 px: a label wider than the price axis sits inside the
                // plot instead, right-aligned above its line, so it is never cut by the chart's edge.
                l.label.length * 5.4 <= R - 10 ? (
                  <>
                    <rect x={width - R + 2} y={Y(l.v) - 8} width={R - 4} height={15} rx={2} fill={c} opacity={0.16} />
                    <text x={width - R + 6} y={Y(l.v) + 3} fill={c} fontFamily="var(--font-mono, monospace)" fontSize={9}>
                      {l.label}
                    </text>
                  </>
                ) : (
                  <>
                    <rect x={width - R - 8 - l.label.length * 5.4} y={Y(l.v) - 17} width={l.label.length * 5.4 + 6} height={13} rx={2} fill="#0B0F10" opacity={0.85} />
                    <text x={width - R - 5} y={Y(l.v) - 7} textAnchor="end" fill={c} fontFamily="var(--font-mono, monospace)" fontSize={9}>
                      {l.label}
                    </text>
                  </>
                )
              ) : null}
            </g>
          );
        })}
        {trend ? <line x1={X(trend[0][0])} y1={Y(trend[0][1])} x2={X(trend[1][0])} y2={Y(trend[1][1])} stroke="#A8DEC2" strokeWidth={1.8} /> : null}
      </motion.g>
      {marks.map((m) => {
        const k = candles[m.i];
        if (!k) return null;
        const buy = m.side === "buy";
        const y = buy ? Y(k.l) + 12 : Y(k.h) - 12;
        return (
          <g key={`${m.i}-${m.side}`}>
            <path d={`M${X(m.i) - 5} ${buy ? y + 6 : y - 6} L${X(m.i)} ${y} L${X(m.i) + 5} ${buy ? y + 6 : y - 6}`} fill="none" stroke="#F2F5F2" strokeWidth={1.8} />
            {m.label ? (
              <text x={X(m.i) + 8} y={buy ? y + 10 : y - 4} fill="#F2F5F2" fontFamily="var(--font-mono, monospace)" fontSize={9}>
                {m.label}
              </text>
            ) : null}
          </g>
        );
      })}
      {cross !== undefined && candles[cross] ? (
        <g>
          <line x1={X(cross)} x2={X(cross)} y1={T} y2={height - B} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
          <line x1={4} x2={width - R} y1={Y(candles[cross].c)} y2={Y(candles[cross].c)} stroke="rgba(255,255,255,0.35)" strokeDasharray="3 3" />
          {width - R >= 300 ? (
            <>
              <rect x={10} y={T + 4} width={290} height={18} rx={3} fill="#06110C" stroke="rgba(255,255,255,0.14)" />
              <text x={16} y={T + 16} fill="#C9CFD1" fontFamily="var(--font-mono, monospace)" fontSize={9.5}>
                O {fmt(candles[cross].o)} H {fmt(candles[cross].h)} L {fmt(candles[cross].l)} C {fmt(candles[cross].c)}
              </text>
            </>
          ) : (
            // Narrow charts (phone cards): the same four values on two lines, so none is cut.
            <>
              <rect x={10} y={T + 4} width={150} height={30} rx={3} fill="#06110C" stroke="rgba(255,255,255,0.14)" />
              <text x={16} y={T + 16} fill="#C9CFD1" fontFamily="var(--font-mono, monospace)" fontSize={9.5}>
                O {fmt(candles[cross].o)} H {fmt(candles[cross].h)}
              </text>
              <text x={16} y={T + 28} fill="#C9CFD1" fontFamily="var(--font-mono, monospace)" fontSize={9.5}>
                L {fmt(candles[cross].l)} C {fmt(candles[cross].c)}
              </text>
            </>
          )}
        </g>
      ) : null}
      {event && candles[event.i] ? (
        <g>
          <line x1={X(event.i)} x2={X(event.i)} y1={T} y2={height - B} stroke="#A8DEC2" strokeWidth={1.2} />
          <rect x={X(event.i) - 30} y={T} width={60} height={15} rx={3} fill="#A8DEC2" />
          <text x={X(event.i)} y={T + 11} textAnchor="middle" fill="#06110C" fontFamily="var(--font-mono, monospace)" fontSize={9}>
            {event.label}
          </text>
        </g>
      ) : null}
      {priceAxis ? (
        <g>
          <rect x={width - R + 2} y={Y(tagV) - 8} width={R - 4} height={16} rx={2} fill={tagV >= lastC.o ? UP : DOWN} />
          <text x={width - R + 6} y={Y(tagV) + 3} fill="#040404" fontFamily="var(--font-mono, monospace)" fontSize={9} fontWeight={700}>
            {fmt(tagV)}
          </text>
        </g>
      ) : null}
      {axis
        ? [0, 1, 2, 3].map((k) => {
            const i = Math.round(((n - 1) * (k + 0.5)) / 4);
            return (
              <text key={k} x={X(i)} y={height - 4} textAnchor="middle" fill="#92A399" fontFamily="var(--font-mono, monospace)" fontSize={9}>
                {hours(i)}
              </text>
            );
          })
        : null}
    </motion.svg>
  );
}

