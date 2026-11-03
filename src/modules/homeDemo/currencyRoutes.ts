// Connections between currency centres; each hub carries its own ISO currency.
// Rates come only from the home feed (useLiveMarket), never invented.
export type CurrencyHub = {
  city: string;
  country: string;
  code: string;
  /** Currency sign shown on the travelling coin. */
  symbol: string;
  lat: number;
  lon: number;
};

export type CurrencyRoute = {
  id: string;
  from: CurrencyHub;
  to: CurrencyHub;
};

export const CURRENCY_HUBS: readonly CurrencyHub[] = [
  { city: "New York", country: "United States", code: "USD", symbol: "$", lat: 40.7128, lon: -74.0060 },
  { city: "London", country: "United Kingdom", code: "GBP", symbol: "£", lat: 51.5074, lon: -0.1278 },
  { city: "Frankfurt", country: "Germany", code: "EUR", symbol: "€", lat: 50.1109, lon: 8.6821 },
  { city: "Mumbai", country: "India", code: "INR", symbol: "₹", lat: 19.0760, lon: 72.8777 },
  { city: "Singapore", country: "Singapore", code: "SGD", symbol: "S$", lat: 1.3521, lon: 103.8198 },
  { city: "Tokyo", country: "Japan", code: "JPY", symbol: "¥", lat: 35.6762, lon: 139.6503 },
  { city: "Sydney", country: "Australia", code: "AUD", symbol: "A$", lat: -33.8688, lon: 151.2093 },
];

export const CURRENCY_ROUTES: readonly CurrencyRoute[] = CURRENCY_HUBS.map((from, index) => {
  const to = CURRENCY_HUBS[(index + 1) % CURRENCY_HUBS.length];
  return { id: `${from.code}-${to.code}`, from, to };
});

/** Quote fields the route rate needs (structurally a HomeQuote from useLiveMarket). */
type RateQuote = { last: number; status: "live" | "delayed" | "snapshot"; asOf: number | null; source: string | null };

/** USD value of one unit of `code`, from the FX lanes the home feed carries. */
const USD_LEGS: Record<string, { symbol: string; invert: boolean }> = {
  EUR: { symbol: "EURUSD", invert: false },
  GBP: { symbol: "GBPUSD", invert: false },
  NZD: { symbol: "NZDUSD", invert: false },
  JPY: { symbol: "USDJPY", invert: true },
};

export type RouteRate = {
  /** Units of `to` currency per one unit of `from` currency. */
  value: number;
  decimals: number;
  status: RateQuote["status"];
  asOf: number | null;
  source: string | null;
};

const RANK = { live: 0, delayed: 1, snapshot: 2 } as const;

/** The route's rate (from → to), direct or via the USD cross. Null when the
 *  feed carries no lane for either currency — no number is ever invented. */
export function routeRate(route: CurrencyRoute, quotes: Record<string, RateQuote | undefined>): RouteRate | null {
  const legs = [route.from.code, route.to.code].map(code => {
    if (code === "USD") return { usd: 1, quote: null };
    const leg = USD_LEGS[code], quote = leg && quotes[leg.symbol];
    if (!quote || !(quote.last > 0)) return null;
    return { usd: leg.invert ? 1 / quote.last : quote.last, quote };
  });
  const [from, to] = legs;
  if (!from || !to) return null;
  const used = [from.quote, to.quote].filter((q): q is RateQuote => q !== null);
  const status = used.reduce<RateQuote["status"]>((worst, q) => RANK[q.status] > RANK[worst] ? q.status : worst, "live");
  const times = used.map(q => q.asOf);
  const sources = [...new Set(used.map(q => q.source).filter(Boolean))];
  const value = from.usd / to.usd;
  return {
    value,
    decimals: value >= 20 ? 2 : 4,
    status,
    asOf: times.some(t => t === null) ? null : Math.min(...(times as number[])),
    source: sources.length ? sources.join(" + ") : null,
  };
}

/** "SGD → JPY", plus the rate when the feed has one. */
export const routePairLabel = (route: CurrencyRoute, rate: RouteRate | null) =>
  `${route.from.code} → ${route.to.code}${rate ? ` ${rate.value.toFixed(rate.decimals)}` : ""}`;
