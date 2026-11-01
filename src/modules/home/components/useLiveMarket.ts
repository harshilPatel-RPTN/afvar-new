"use client";

// Quotes for the public home pages via /api/home/market. Each lane reports its
// own status: "live" (Gold-API spot for XAU/XAG, Binance for BTC), "delayed"
// (Yahoo: futures ~10 min, FX ~1–2 min) or "snapshot" (stored values shown
// before the first response or when the feed is down). Renders instantly from
// the snapshot and upgrades on the first poll. Values only change when the
// endpoint returns a new real price — no synthetic ticks (honesty contract).
import { useSyncExternalStore } from "react";
import { SNAPSHOT } from "../content";

export interface HomeQuote {
  name: string;
  last: number;
  changePct: number;
  decimals: number;
  closes: number[];
  /** Real hourly candles from the feed (empty for the stored snapshot: no candles are invented). */
  candles: Candle[];
  /** True once real data arrived (live OR delayed). Use `status` to label freshness. */
  live: boolean;
  status: QuoteStatus;
  /** Provider time of the price (epoch ms); null for the stored snapshot. */
  asOf: number | null;
  source: string | null;
  dir: 1 | -1 | 0;
}

export type QuoteStatus = "live" | "delayed" | "snapshot";
export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

type Quotes = Record<string, HomeQuote>;

const initial: Quotes = Object.fromEntries(
  Object.entries(SNAPSHOT).map(([symbol, q]) => [symbol, { ...q, candles: [] as Candle[], live: false, status: "snapshot" as const, asOf: null, source: null, dir: 0 as const }]),
);

interface MarketRow {
  symbol: string;
  price: number;
  prevClose: number;
  closes: number[];
  candles?: Candle[];
  status?: "live" | "delayed";
  asOf?: number;
  source?: string;
}
/* One shared poller for the whole page: every component that calls
 * useLiveMarket() subscribes to the same module-level store, so the page makes
 * a single /api/home/market request every 15s no matter how many quote
 * widgets are mounted. Polling starts with the first subscriber and stops when
 * the last one unmounts. */
interface MarketState {
  quotes: Quotes;
  updatedAt: number | null;
}

let state: MarketState = { quotes: initial, updatedAt: null };
const SERVER_STATE: MarketState = { quotes: initial, updatedAt: null };
const subscribers = new Set<() => void>();
let pollId: ReturnType<typeof setInterval> | null = null;

async function poll() {
  // A background tab doesn't need prices: skip, and refresh the moment it is shown again.
  if (typeof document !== "undefined" && document.hidden) return;
  try {
    const res = await fetch("/api/home/market");
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as MarketRow[];
    if (subscribers.size === 0) return;
    const next = { ...state.quotes };
    for (const row of rows) {
      const base = next[row.symbol];
      if (!base || !Number.isFinite(row.price) || row.price <= 0) continue;
      next[row.symbol] = {
        ...base,
        last: row.price,
        changePct: row.prevClose > 0 ? ((row.price - row.prevClose) / row.prevClose) * 100 : base.changePct,
        closes: row.closes.length >= 10 ? row.closes.slice(-60) : base.closes,
        candles: row.candles && row.candles.length >= 10 ? row.candles.slice(-60) : base.candles,
        live: true,
        status: row.status ?? "delayed",
        asOf: row.asOf ?? null,
        source: row.source ?? null,
        dir: row.price >= base.last ? 1 : -1,
      };
    }
    state = { quotes: next, updatedAt: Date.now() };
    subscribers.forEach((cb) => cb());
  } catch {
    /* keep snapshot — page stays honest via the `live` flag */
  }
}

function onVisible() {
  if (!document.hidden) void poll();
}

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (subscribers.size === 1) {
    void poll();
    pollId = setInterval(poll, 15_000);
    document.addEventListener("visibilitychange", onVisible);
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0 && pollId) {
      clearInterval(pollId);
      pollId = null;
      document.removeEventListener("visibilitychange", onVisible);
    }
  };
}

export function useLiveMarket(): {
  quotes: Quotes;
  /** True once any real data arrived (live or delayed). */
  live: boolean;
  updatedAt: number | null;
  /** How many lanes are live / delayed / snapshot right now. */
  mix: Record<QuoteStatus, number>;
} {
  const { quotes, updatedAt } = useSyncExternalStore(subscribe, () => state, () => SERVER_STATE);
  const mix: Record<QuoteStatus, number> = { live: 0, delayed: 0, snapshot: 0 };
  for (const quote of Object.values(quotes)) mix[quote.status] += 1;
  return { quotes, live: Object.values(quotes).some((quote) => quote.live), updatedAt, mix };
}


export const fmtPrice = (value: number, decimals: number) =>
  value.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
