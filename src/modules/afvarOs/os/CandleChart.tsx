"use client";

// A real candlestick chart for AFVAR OS windows. It draws only the candles it
// is given (real hourly OHLC from the feeds) — it never invents a candle. Gold
// marks what the AI added (levels, trend, averages); green / red mean up / down.
//
//   <CandleChart candles={q.candles} decimals={2} levels={[{ v: 4050, label: "AI high", tone: "gold" }]} />
import type { MotionValue } from "framer-motion";
import { motion, useMotionValue } from "framer-motion";
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
const TONE = { gold: "#E9B44C", ink: "#C9CFD1", up: "#00E676", down: "#FF6B6B" } as const;

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
  const reveal = draw ?? one;
  if (candles.length < 2) {
    return (
      <div className="grid h-full min-h-[120px] place-items-center font-mono text-[11px] uppercase tracking-[0.14em] text-[#6D7578]">
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
    <svg viewBox={`0 0 ${width} ${height}`} className="block h-full w-full" preserveAspectRatio="none" role="img" aria-label={`Candlestick chart, ${n} candles, last ${fmt(tagV)}`}>
      {[0, 1, 2, 3, 4].map((k) => {
        const v = lo + ((hi - lo) * (k + 0.5)) / 5;
        return (
          <g key={k}>
            <line x1={0} x2={width - R} y1={Y(v)} y2={Y(v)} stroke="rgba(255,255,255,0.055)" />
            {priceAxis ? (
              <text x={width - R + 6} y={Y(v) + 3} fill="#6D7578" fontFamily="var(--font-mono, monospace)" fontSize={9}>
                {fmt(v)}
              </text>
            ) : null}
          </g>
        );
      })}
      {band ? <rect x={X(band[0]) - step / 2} y={T} width={X(band[1]) - X(band[0]) + step} height={height - T - B} fill="rgba(233,180,76,0.09)" stroke="rgba(233,180,76,0.45)" strokeDasharray="3 3" /> : null}
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
      <motion.g style={{ opacity: reveal }}>
        {avg.map((a) => (
          <polyline key={a.len} points={a.pts} fill="none" stroke="#E9B44C" strokeWidth={1.5} strokeDasharray={a.dash ? "4 3" : undefined} />
        ))}
        {levels.map((l) => {
          const c = TONE[l.tone ?? "gold"];
          return (
            <g key={`${l.v}-${l.label}`}>
              <line x1={4} x2={width - R} y1={Y(l.v)} y2={Y(l.v)} stroke={c} strokeWidth={l.solid ? 1.6 : 1.2} strokeDasharray={l.solid ? undefined : "5 4"} />
              {l.label && priceAxis ? (
                <>
                  <rect x={width - R + 2} y={Y(l.v) - 8} width={R - 4} height={15} rx={2} fill={c} opacity={0.16} />
                  <text x={width - R + 6} y={Y(l.v) + 3} fill={c} fontFamily="var(--font-mono, monospace)" fontSize={9}>
                    {l.label}
                  </text>
                </>
              ) : null}
            </g>
          );
        })}
        {trend ? <line x1={X(trend[0][0])} y1={Y(trend[0][1])} x2={X(trend[1][0])} y2={Y(trend[1][1])} stroke="#E9B44C" strokeWidth={1.8} /> : null}
      </motion.g>
      {marks.map((m) => {
        const k = candles[m.i];
        if (!k) return null;
        const buy = m.side === "buy";
        const y = buy ? Y(k.l) + 12 : Y(k.h) - 12;
        return (
          <g key={`${m.i}-${m.side}`}>
            <path d={`M${X(m.i) - 5} ${buy ? y + 6 : y - 6} L${X(m.i)} ${y} L${X(m.i) + 5} ${buy ? y + 6 : y - 6}`} fill="none" stroke="#F5F7F7" strokeWidth={1.8} />
            {m.label ? (
              <text x={X(m.i) + 8} y={buy ? y + 10 : y - 4} fill="#F5F7F7" fontFamily="var(--font-mono, monospace)" fontSize={9}>
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
          <rect x={10} y={T + 4} width={290} height={18} rx={3} fill="#0B0E10" stroke="rgba(255,255,255,0.14)" />
          <text x={16} y={T + 16} fill="#C9CFD1" fontFamily="var(--font-mono, monospace)" fontSize={9.5}>
            O {fmt(candles[cross].o)} H {fmt(candles[cross].h)} L {fmt(candles[cross].l)} C {fmt(candles[cross].c)}
          </text>
        </g>
      ) : null}
      {event && candles[event.i] ? (
        <g>
          <line x1={X(event.i)} x2={X(event.i)} y1={T} y2={height - B} stroke="#E9B44C" strokeWidth={1.2} />
          <rect x={X(event.i) - 30} y={T} width={60} height={15} rx={3} fill="#E9B44C" />
          <text x={X(event.i)} y={T + 11} textAnchor="middle" fill="#1A1206" fontFamily="var(--font-mono, monospace)" fontSize={9}>
            {event.label}
          </text>
        </g>
      ) : null}
      {priceAxis ? (
        <g>
          <rect x={width - R + 2} y={Y(tagV) - 8} width={R - 4} height={16} rx={2} fill={tagV >= lastC.o ? UP : DOWN} />
          <text x={width - R + 6} y={Y(tagV) + 3} fill="#050607" fontFamily="var(--font-mono, monospace)" fontSize={9} fontWeight={700}>
            {fmt(tagV)}
          </text>
        </g>
      ) : null}
      {axis
        ? [0, 1, 2, 3].map((k) => {
            const i = Math.round(((n - 1) * (k + 0.5)) / 4);
            return (
              <text key={k} x={X(i)} y={height - 4} textAnchor="middle" fill="#6D7578" fontFamily="var(--font-mono, monospace)" fontSize={9}>
                {hours(i)}
              </text>
            );
          })
        : null}
    </svg>
  );
}

