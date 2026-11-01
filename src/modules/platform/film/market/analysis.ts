// What the Market Data film says about a chart, worked out from the real
// closes on screen (the home market feed: up to 60 hourly closes per lane).
// Plain descriptions of the past only — no forecasts, no signals.
import type { HomeQuote } from "@/modules/home/kit";

export interface Range {
  high: number;
  low: number;
  /** Index of the high / low close. */
  hiAt: number;
  loAt: number;
  /** Width of the range as % of the low. */
  widthPct: number;
}

export function rangeOf(closes: readonly number[]): Range {
  let hiAt = 0;
  let loAt = 0;
  closes.forEach((v, i) => {
    if (v > closes[hiAt]) hiAt = i;
    if (v < closes[loAt]) loAt = i;
  });
  const high = closes[hiAt] ?? 0;
  const low = closes[loAt] ?? 0;
  return { high, low, hiAt, loAt, widthPct: low > 0 ? ((high - low) / low) * 100 : 0 };
}

export type Trend = "rising" | "falling" | "sideways";

/** Average of the last third against the first third; under ±0.15% counts as sideways. */
export function trendOf(closes: readonly number[]): { trend: Trend; pct: number } {
  const n = closes.length;
  if (n < 6) return { trend: "sideways", pct: 0 };
  const k = Math.max(2, Math.floor(n / 3));
  const avg = (xs: readonly number[]) => xs.reduce((s, v) => s + v, 0) / xs.length;
  const a = avg(closes.slice(0, k));
  const b = avg(closes.slice(n - k));
  const pct = a > 0 ? ((b - a) / a) * 100 : 0;
  return { trend: pct > 0.15 ? "rising" : pct < -0.15 ? "falling" : "sideways", pct };
}

/**
 * The trend line the film draws: falling → through the highest close of each
 * half (lower highs); rising → through the lowest close of each half (higher
 * lows); sideways → none.
 */
export function swingLine(closes: readonly number[]): { i0: number; v0: number; i1: number; v1: number; kind: "lower highs" | "higher lows" } | null {
  const { trend } = trendOf(closes);
  const n = closes.length;
  if (trend === "sideways" || n < 6) return null;
  const half = Math.floor(n / 2);
  const pick = (from: number, to: number, better: (a: number, b: number) => boolean) => {
    let at = from;
    for (let i = from; i < to; i++) if (better(closes[i], closes[at])) at = i;
    return at;
  };
  if (trend === "falling") {
    const i0 = pick(0, half, (a, b) => a > b);
    const i1 = pick(half, n, (a, b) => a > b);
    return closes[i1] < closes[i0] ? { i0, v0: closes[i0], i1, v1: closes[i1], kind: "lower highs" } : null;
  }
  const i0 = pick(0, half, (a, b) => a < b);
  const i1 = pick(half, n, (a, b) => a < b);
  return closes[i1] > closes[i0] ? { i0, v0: closes[i0], i1, v1: closes[i1], kind: "higher lows" } : null;
}

/** Change over the last `n` closes, in %. */
export function lastMovePct(closes: readonly number[], n = 5): number {
  if (closes.length <= n) return 0;
  const a = closes[closes.length - 1 - n];
  const b = closes[closes.length - 1];
  return a > 0 ? ((b - a) / a) * 100 : 0;
}

/** The lane that moved most since its previous close (by absolute %). */
export function biggestMover(quotes: Record<string, HomeQuote>, keys: readonly string[]): { key: string; quote: HomeQuote } | null {
  let best: { key: string; quote: HomeQuote } | null = null;
  for (const key of keys) {
    const q = quotes[key];
    if (!q) continue;
    if (!best || Math.abs(q.changePct) > Math.abs(best.quote.changePct)) best = { key, quote: q };
  }
  return best;
}

export const STATUS_LABEL: Record<HomeQuote["status"], string> = { live: "Live", delayed: "Delayed", snapshot: "Stored" };

/** "06:12 UTC" for a provider time; "stored" before the first real price. */
export function asOfText(asOf: number | null): string {
  if (!asOf) return "stored";
  const d = new Date(asOf);
  return `${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`;
}

/** "+1.20%" / "−2.90%" with a real minus sign. */
export function signedPct(pct: number, digits = 2): string {
  return `${pct >= 0 ? "+" : "−"}${Math.abs(pct).toFixed(digits)}%`;
}
