// /platform/market-data — "Market Data & Charts". The film is built around the
// page's own centrepiece, not the home's core: the chart itself as a glass
// wall of Gold's real hourly closes (see PriceWall). Core names (Market core,
// Verify core) appear only in the acts after the hero.
//
//   hero     the price wall, the spark on the newest price, the other markets behind
//   feed     four public feeds stream real, labelled quotes into eight lines
//   chart    (OS) ask for the range and trend: the AI draws them in gold, the
//            analysis lists what the closes show, the avatar says how
//   watch    (OS) the watchlist grows by asking; the heatmap and the market
//            overview show every lane at once; the biggest move is named
//   insight  one instrument, explained line by line with source and time
//
// Two cuts like the home: "desktop" (with OS screens) and "compact" (phones and
// tablets — cards instead of OS screens; the avatar speaks in the 3D scene).
import type { CapActDef, CapBeat, CapKind } from "../capability/factory";
import { createCapFilm } from "../capability/factory";

export type MarketAct = "hero" | "feed" | "chart" | "watch" | "insight";
export const MARKET_FILM_ID = "afvar-market-data";

const ACTS: Record<CapKind, CapActDef<MarketAct>[]> = {
  desktop: [
    { id: "hero", vh: 110, label: "Market data" },
    { id: "feed", vh: 240, label: "Sources" },
    { id: "chart", vh: 270, label: "Charts", os: true },
    { id: "watch", vh: 240, label: "Watchlists", os: true },
    { id: "insight", vh: 230, label: "Insight" },
  ],
  compact: [
    { id: "hero", vh: 110, label: "Market data" },
    { id: "feed", vh: 220, label: "Sources" },
    { id: "chart", vh: 240, label: "Charts" },
    { id: "watch", vh: 200, label: "Watchlists" },
    { id: "insight", vh: 210, label: "Insight" },
  ],
};

/* --------------------------------------------------------------- the feed */

/** Four public feeds, right of the core; each streams its lanes into the Market core. */
export const FEEDS = [
  { id: "spot", label: "Spot metals", keys: ["XAUUSD", "XAGUSD"], y: 1.62 },
  { id: "futures", label: "Futures", keys: ["WTI"], y: 0.54 },
  { id: "fx", label: "Forex", keys: ["EURUSD", "USDJPY", "GBPUSD", "NZDUSD"], y: -0.54 },
  { id: "crypto", label: "Crypto", keys: ["BTC-USD"], y: -1.62 },
] as const;
export const FEED_LAYOUT = { sourceX: 3.35, market: [1.72, 0.62, 0.2] as const, verify: [1.72, -0.62, 0.2] as const };
/** Feed act: the lane card's reading highlight walks the eight lanes. */
export const LANE_AT = [0.2, 0.27, 0.34, 0.41, 0.48, 0.55, 0.62, 0.69] as const;

/* -------------------------------------------------------------- the chart */

export const CHART = {
  spot: [0.09, 0.11, 0.27, 0.29] as const,
  ask: [0.12, 0.23] as const,
  high: [0.31, 0.38] as const,
  low: [0.39, 0.46] as const,
  trend: [0.47, 0.55] as const,
  panel: 0.56,
  rows: [0.6, 0.66, 0.72] as const,
  speak: [0.62, 0.84] as const,
  checked: 0.86,
};
export const CHART_ASK = "Mark the range and trend on Gold";
export const CHART_SPEECH = "Range and trend are drawn from the last sixty hourly closes.";

/* ---------------------------------------------------------- the watchlist */

export const WATCH = {
  /** The chart steps aside and the watchlist slides in. */
  swap: [0.01, 0.09] as const,
  spot: [0.09, 0.11, 0.2, 0.22] as const,
  ask: [0.11, 0.19] as const,
  added: [0.22, 0.25, 0.28] as const,
  heat: 0.33,
  overview: 0.43,
  mover: 0.53,
};
export const WATCH_START = ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY"] as const;
export const WATCH_ADDED = ["GBPUSD", "NZDUSD", "BTC-USD"] as const;
export const WATCH_ASK = "Add GBP/USD, NZD/USD and Bitcoin to my watchlist";

/* ------------------------------------------------------------ the insight */

export const INSIGHT_AT = [0.18, 0.3, 0.42] as const;
export const INSIGHT_CHECKED = 0.56;

/* --------------------------------------------------------------- films */

// Desktop framing keeps the core right of centre (copy on the left). Portrait
// framing keeps the scene in the upper third, above the caption panel.
const BEATS: CapBeat<MarketAct>[] = [
  { act: "hero", f: 0, pos: [0.2, 0.15, 8.2], look: [-1.45, 0.05, 0], pPos: [0, -0.4, 10.5], pLook: [0, -1.75, 0] },
  { act: "feed", f: 0.3, pos: [0.45, 0.3, 11.0], look: [-0.62, 0.0, 0], pPos: [1.05, -0.4, 10.6], pLook: [1.05, -1.6, 0] },
  { act: "feed", f: 0.85, pos: [0.4, 0.25, 10.8], look: [-0.62, 0.0, 0], pPos: [1.05, -0.4, 10.5], pLook: [1.05, -1.6, 0] },
  { act: "chart", f: 0.5, pos: [0.3, 0.1, 9.4], look: [-1.95, 0.1, 0], pPos: [0, 0.35, 7.6], pLook: [0, -1.1, 0] },
  { act: "watch", f: 0.5, pos: [0.3, 0.1, 9.4], look: [-1.95, 0.1, 0], pPos: [0, -0.6, 15.0], pLook: [0, -2.6, 0] },
  { act: "insight", f: 0.4, pos: [0.3, 0.15, 8.9], look: [-1.6, 0.1, 0], pPos: [0, -0.5, 10.4], pLook: [0, -1.85, 0] },
];

export const MARKET_DESKTOP = createCapFilm("desktop", ACTS.desktop, BEATS, (at) => [
  { at: at("hero", 0.6), cue: "latch" },
  { at: at("feed", 0.14), cue: "tick" },
  { at: at("chart", CHART.high[0]), cue: "ping" },
  { at: at("chart", CHART.checked), cue: "verdict" },
  { at: at("watch", WATCH.added[0]), cue: "ping" },
  { at: at("watch", WATCH.mover), cue: "tick" },
  { at: at("insight", INSIGHT_CHECKED), cue: "verdict" },
]);

export const MARKET_COMPACT = createCapFilm("compact", ACTS.compact, BEATS, (at) => [
  { at: at("hero", 0.6), cue: "latch" },
  { at: at("feed", 0.14), cue: "tick" },
  { at: at("chart", CHART.high[0]), cue: "ping" },
  { at: at("watch", WATCH.mover), cue: "tick" },
  { at: at("insight", INSIGHT_CHECKED), cue: "verdict" },
]);

/** Which act shows each feature (the feature cards jump there). */
export const FEATURE_ACT: Record<string, MarketAct> = {
  "Quotes & Charts": "chart",
  Watchlists: "watch",
  "Technical Analysis": "chart",
  "Market Overview & Heatmaps": "watch",
  "Instrument Insights": "insight",
  "Sources, Freshness & Availability": "feed",
};

/** Notes under the features: where the page's numbers come from and what they mean. */
export const MARKET_NOTES = [
  "Prices on this page come from public feeds. Gold, silver and Bitcoin are usually live; crude oil arrives about ten minutes late and forex a minute or two late. Each price carries its own label.",
  "The range, trend and analysis in the film are worked out from the closes shown on the chart. They describe what happened, not what will happen.",
  "Charts and insights are information, not financial advice.",
] as const;
