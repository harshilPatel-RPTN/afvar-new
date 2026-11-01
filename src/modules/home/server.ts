// Server-side market snapshot for the public home pages (used by
// /api/home/market). Each lane carries its own source, status and as-of time,
// because the free sources differ in freshness:
//
//   XAUUSD, XAGUSD  Gold-API.com spot price (free, no key, updates ~20 s) → "live".
//                   Sparkline + % change come from Yahoo futures (GC=F / SI=F)
//                   hourly closes, basis-adjusted onto the spot price, so the
//                   line ends at the spot price and the % change keeps one basis.
//   BTC-USD         Binance public REST (free, no key, real time) → "live".
//   WTI, FX pairs   Yahoo Finance public chart endpoint → "delayed" (futures are
//                   ~10 min behind; FX ~1–2 min) with the exchange time as as-of.
//
// Any live source that fails falls back to Yahoo for that lane and is labelled
// "delayed". The Yahoo endpoint is unofficial and the free tiers are for
// non-commercial/demo use — production needs a licensed, display-approved feed.

export type HomeMarketStatus = "live" | "delayed";

/** One hourly candle (epoch ms of the candle's start, open/high/low/close). */
export interface Candle {
  t: number;
  o: number;
  h: number;
  l: number;
  c: number;
}

export interface HomeMarketRow {
  symbol: string;
  price: number;
  prevClose: number;
  closes: number[];
  /** Real hourly candles (≤ 60) from the same source as `closes`; empty when the source gave none. */
  candles: Candle[];
  status: HomeMarketStatus;
  /** Epoch ms of the price itself (provider time, not fetch time). */
  asOf: number;
  source: string;
}

const YAHOO_MAP: Record<string, string> = {
  XAUUSD: "GC=F",
  XAGUSD: "SI=F",
  WTI: "CL=F",
  EURUSD: "EURUSD=X",
  USDJPY: "JPY=X",
  GBPUSD: "GBPUSD=X",
  NZDUSD: "NZDUSD=X",
  "BTC-USD": "BTC-USD",
};

const LIVE_TTL = 10_000;
const YAHOO_TTL = 60_000;
const TIMEOUT = 8000;
const HEADERS = { "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" };

interface YahooRow {
  price: number;
  prevClose: number;
  closes: number[];
  candles: Candle[];
  asOf: number;
}

interface YahooChart {
  chart: {
    result?: Array<{
      meta: { regularMarketPrice: number; regularMarketTime?: number; chartPreviousClose?: number; previousClose?: number };
      timestamp?: number[];
      indicators: { quote: Array<{ open?: (number | null)[]; high?: (number | null)[]; low?: (number | null)[]; close: (number | null)[] }> };
    }>;
  };
}

let yahooCache: { at: number; data: Map<string, YahooRow> } | null = null;
let liveCache: { at: number; data: Map<string, HomeMarketRow> } | null = null;

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: HEADERS, cache: "no-store", signal: AbortSignal.timeout(TIMEOUT) });
  if (!res.ok) throw new Error(`${new URL(url).host} ${res.status}`);
  return (await res.json()) as T;
}

async function fetchYahoo(): Promise<Map<string, YahooRow>> {
  if (yahooCache && Date.now() - yahooCache.at < YAHOO_TTL) return yahooCache.data;
  const rows = await Promise.allSettled(
    Object.entries(YAHOO_MAP).map(async ([symbol, yahoo]): Promise<[string, YahooRow]> => {
      const json = await getJson<YahooChart>(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yahoo)}?interval=60m&range=5d`);
      const result = json.chart.result?.[0];
      if (!result) throw new Error(`yahoo ${yahoo} empty`);
      const closes = (result.indicators.quote[0]?.close ?? []).filter((v): v is number => typeof v === "number" && Number.isFinite(v));
      const price = result.meta.regularMarketPrice;
      const q = result.indicators.quote[0];
      const ts = result.timestamp ?? [];
      const candles: Candle[] = [];
      ts.forEach((t, i) => {
        const o = q?.open?.[i], h = q?.high?.[i], l = q?.low?.[i], c = q?.close?.[i];
        if ([o, h, l, c].every((v) => typeof v === "number" && Number.isFinite(v))) candles.push({ t: t * 1000, o: o!, h: h!, l: l!, c: c! });
      });
      return [
        symbol,
        {
          price,
          prevClose: result.meta.chartPreviousClose ?? result.meta.previousClose ?? closes[0] ?? price,
          closes: closes.slice(-60),
          candles: candles.slice(-60),
          asOf: (result.meta.regularMarketTime ?? Date.now() / 1000) * 1000,
        },
      ];
    }),
  );
  const data = new Map(rows.filter((r): r is PromiseFulfilledResult<[string, YahooRow]> => r.status === "fulfilled").map((r) => r.value));
  if (data.size) yahooCache = { at: Date.now(), data };
  return data;
}

/** Gold-API.com spot price for XAU / XAG. */
async function fetchSpotMetal(code: "XAU" | "XAG"): Promise<{ price: number; asOf: number }> {
  const json = await getJson<{ price: number; updatedAt: string }>(`https://api.gold-api.com/price/${code}`);
  const asOf = Date.parse(json.updatedAt);
  if (!Number.isFinite(json.price) || json.price <= 0 || !Number.isFinite(asOf)) throw new Error(`gold-api ${code} invalid`);
  return { price: json.price, asOf };
}

/** Binance BTCUSDT: last price, 24h open as the change basis, 60 hourly closes. */
async function fetchBitcoin(): Promise<HomeMarketRow> {
  const [ticker, klines] = await Promise.all([
    getJson<{ lastPrice: string; openPrice: string; closeTime: number }>("https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT"),
    getJson<unknown[][]>("https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=60"),
  ]);
  const price = Number(ticker.lastPrice);
  const prevClose = Number(ticker.openPrice);
  const closes = klines.map((k) => Number(k[4])).filter((v) => Number.isFinite(v) && v > 0);
  const candles: Candle[] = klines
    .map((k) => ({ t: Number(k[0]), o: Number(k[1]), h: Number(k[2]), l: Number(k[3]), c: Number(k[4]) }))
    .filter((k) => [k.t, k.o, k.h, k.l, k.c].every((v) => Number.isFinite(v) && v > 0));
  if (!(price > 0) || !(prevClose > 0)) throw new Error("binance invalid");
  return { symbol: "BTC-USD", price, prevClose, closes, candles, status: "live", asOf: ticker.closeTime, source: "Binance" };
}

async function fetchLive(yahoo: Map<string, YahooRow>): Promise<Map<string, HomeMarketRow>> {
  if (liveCache && Date.now() - liveCache.at < LIVE_TTL) return liveCache.data;
  const metals = await Promise.allSettled(
    (["XAUUSD", "XAGUSD"] as const).map(async (symbol): Promise<HomeMarketRow> => {
      const spot = await fetchSpotMetal(symbol === "XAUUSD" ? "XAU" : "XAG");
      const futures = yahoo.get(symbol);
      // Basis-adjust futures history onto the spot level (same % moves, line ends at spot).
      const ratio = futures && futures.price > 0 ? spot.price / futures.price : 1;
      return {
        symbol,
        price: spot.price,
        prevClose: futures ? futures.prevClose * ratio : spot.price,
        closes: futures ? [...futures.closes.map((c) => c * ratio), spot.price] : [],
        // Same basis adjustment for the candles: every OHLC value scaled by one ratio (same % moves).
        candles: futures ? futures.candles.map((k) => ({ t: k.t, o: k.o * ratio, h: k.h * ratio, l: k.l * ratio, c: k.c * ratio })) : [],
        status: "live",
        asOf: spot.asOf,
        source: "Gold-API.com (spot)",
      };
    }),
  );
  const btc = await Promise.allSettled([fetchBitcoin()]);
  const data = new Map(
    [...metals, ...btc].filter((r): r is PromiseFulfilledResult<HomeMarketRow> => r.status === "fulfilled").map((r) => [r.value.symbol, r.value]),
  );
  liveCache = { at: Date.now(), data };
  return data;
}

export async function fetchHomeMarket(): Promise<HomeMarketRow[]> {
  const yahoo = await fetchYahoo();
  const live = await fetchLive(yahoo);
  const rows: HomeMarketRow[] = [];
  for (const symbol of Object.keys(YAHOO_MAP)) {
    const liveRow = live.get(symbol);
    if (liveRow) {
      rows.push(liveRow);
      continue;
    }
    const y = yahoo.get(symbol);
    if (y) rows.push({ symbol, ...y, status: "delayed", source: "Yahoo Finance (delayed)" });
  }
  if (rows.length === 0) throw new Error("home market: all sources failed");
  return rows;
}
