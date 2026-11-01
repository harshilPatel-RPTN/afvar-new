import type { CapabilitySlug } from "../../types";

/**
 * Demo command resolver for the "Try AFVAR" desktop. It mirrors the board's
 * local-first rule (D.1.4.2): supported phrases resolve on the device with no
 * AI model; an ambiguous instrument asks one question; negation never acts;
 * anything else is reported as unsupported. Sample instruments only — the
 * real catalogue and grammar are DEC 05 / D.1.4.2.1 work.
 */

export type Action = "open" | "close" | "minimize" | "maximize" | "arrange";
export type Timeframe = "1H" | "4H" | "1D" | "1W";
export type Instrument = "Gold" | "Silver" | "Oil" | "Dollar Index" | "EUR/USD" | "US 10-year yield";

export interface Intent {
  status: "resolved" | "clarify" | "unsupported" | "refused" | "negated" | "empty";
  action?: Action;
  app?: CapabilitySlug;
  instrument?: Instrument;
  timeframe?: Timeframe;
  /** Clarification choices; each is a complete follow-up command. */
  options?: { label: string; command: string }[];
}

const has = (text: string, words: string[]) => words.some((w) => text.includes(w));

const OPEN = ["open", "show", "launch", "start", "kholo", "khol", "dikhao", "dikha", "खोलो", "दिखाओ"];
const CLOSE = ["close", "band karo", "band kar", "बंद"];
const MIN = ["minimize", "minimise", "hide", "chhupao", "छुपाओ"];
const MAX = ["maximize", "maximise", "full screen", "fullscreen", "bada karo", "बड़ा"];
const ARRANGE = ["arrange", "tile", "organise", "organize", "sajao", "सजाओ"];
const NEGATE = ["don't", "dont", "do not", "never", "mat ", " mat", "nahi", "नहीं", "मत"];
const ORDER = ["buy", "sell", "place order", "place an order", "place a trade", "open a trade", "close a trade", "close my trade", "kharido", "becho", "खरीदो", "बेचो"];
/** "trade" used as an order verb ("trade gold", "I want to trade EUR/USD") — not the noun in "trade journal". */
function tradeVerb(text: string): boolean {
  if (/ trades? (journal|review|history|record)/.test(text)) return false;
  return /^ trade /.test(text) || / (to|let's|lets|please|now) trade /.test(text);
}

const APPS: [CapabilitySlug, string[]][] = [
  ["charts", ["chart", "charts", "watchlist", "quote", "चार्ट"]],
  ["research", ["research", "news", "calendar", "event", "events", "brief", "खबर", "न्यूज़", "कैलेंडर"]],
  ["alerts", ["alert", "alerts", "screener", "scan", "strategy", "backtest", "अलर्ट"]],
  ["trade-review", ["journal", "risk", "portfolio", "exposure", "review", "जर्नल", "पोर्टफोलियो"]],
  ["community", ["community", "chat", "channel", "discussion", "कम्युनिटी"]],
];

const INSTRUMENTS: [Instrument, string[]][] = [
  ["Gold", ["gold", "sona", "सोना"]],
  ["Silver", ["silver", "chandi", "चांदी"]],
  ["Oil", ["oil", "crude", "tel", "तेल"]],
  ["Dollar Index", ["dollar index", "dxy"]],
  ["EUR/USD", ["eur/usd", "eurusd", "euro"]],
  ["US 10-year yield", ["ten-year yield", "10-year yield", "10 year yield", "ten year yield"]],
];

const TIMEFRAMES: Timeframe[] = ["1H", "4H", "1D", "1W"];

export function resolve(raw: string): Intent {
  const text = ` ${raw.toLowerCase().replace(/[.,!?]/g, " ").replace(/\s+/g, " ").trim()} `;
  if (!text.trim()) return { status: "empty" };
  if (has(text, ORDER) || tradeVerb(text)) return { status: "refused" };
  if (has(text, NEGATE)) return { status: "negated" };

  const action: Action | undefined = has(text, ARRANGE)
    ? "arrange"
    : has(text, CLOSE)
      ? "close"
      : has(text, MIN)
        ? "minimize"
        : has(text, MAX)
          ? "maximize"
          : has(text, OPEN)
            ? "open"
            : undefined;

  const instrument = INSTRUMENTS.find(([, words]) => has(text, words))?.[0];
  const ambiguousDollar = !instrument && has(text, ["dollar", "usd", "डॉलर"]);
  const ambiguousTenYear = !instrument && has(text, ["10-year", "ten-year", "10 year", "ten year"]);
  let app = APPS.find(([, words]) => has(text, words))?.[0];
  if (!app && (instrument || ambiguousDollar || ambiguousTenYear)) app = "charts";
  const timeframe = TIMEFRAMES.find((t) => text.includes(` ${t.toLowerCase()} `));

  if (action === "arrange") return { status: "resolved", action };
  if (!app) return { status: "unsupported" };

  // Board D.1.4.2.2: "US dollar" may be an index or a pair; "ten-year" may be a yield or a bond price.
  if (ambiguousDollar) {
    return {
      status: "clarify",
      app,
      options: [
        { label: "Dollar Index", command: `open dollar index chart${timeframe ? ` ${timeframe}` : ""}` },
        { label: "A currency pair (EUR/USD)", command: `open eur/usd chart${timeframe ? ` ${timeframe}` : ""}` },
      ],
    };
  }
  if (ambiguousTenYear) {
    return {
      status: "clarify",
      app,
      options: [{ label: "US 10-year yield", command: "open 10-year yield chart" }],
    };
  }
  return { status: "resolved", action: action ?? "open", app, instrument: app === "charts" ? instrument ?? "Gold" : undefined, timeframe };
}

/** Suggestions shown before the visitor types; also the autoplay script. */
export const EXAMPLES = ["Open my Gold chart 1D", "Show this week's economic events", "Open the trade journal", "Open the dollar chart", "Arrange my windows"];
