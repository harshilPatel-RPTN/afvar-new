import type { MessageKey } from "@/platform/i18n";

/**
 * Markets coverage for the public website (W3). Nothing here is confirmed:
 * instruments, feeds and venues wait on owner decision DEC 05, so every entry
 * is `planned` and carries no price. Never add a sample number to make a page
 * look live — the Price slot renders "unavailable" until a real feed exists.
 */

export type CategoryId = "commodities" | "forex" | "crypto";
export type CoverageStatus = "available" | "planned";

/**
 * The Provenance Envelope every market number must carry (handoff E.19).
 * `stale` is never a label: staleness is computed from `cacheAgeS` separately.
 */
export type DelayLabel = "live" | `delayed-${number}-min` | "derived" | "indicative" | "snapshot" | "sample";

export interface Provenance {
  source: string;
  venue: string;
  currency: string;
  tsUtc: string;
  delayLabel: DelayLabel;
  closed: boolean | null;
  cacheAgeS: number;
}

/** A price is an exact decimal string with its envelope — never a bare float. */
export interface Quote {
  last: string;
  provenance: Provenance;
}

export interface Instrument {
  slug: string;
  /** Display only; the canonical id `<class>:<base>-<quote>:<venue>` needs a confirmed venue. */
  displaySymbol: string;
  nameKey: MessageKey;
  category: CategoryId;
  coverage: CoverageStatus;
  /** Set only for coverage notes the owner has flagged, e.g. the oil benchmark. */
  noteKey?: MessageKey;
  quote: Quote | null;
}

/** Category-specific sections from W3.2–W3.4; each shows "no source yet" until one is approved. */
export interface CategorySection {
  titleKey: MessageKey;
  bodyKey: MessageKey;
}

export interface Category {
  id: CategoryId;
  titleKey: MessageKey;
  blurbKey: MessageKey;
  /** Photo used in headers and cards for this market. */
  image: string;
  sections: CategorySection[];
}

export const CATEGORIES: Category[] = [
  {
    id: "commodities",
    titleKey: "mk.cat.commodities",
    blurbKey: "mk.cat.commodities.blurb",
    image: "/market/commodities.jpg",
    sections: [{ titleKey: "mk.section.analysis", bodyKey: "mk.section.analysis.body" }],
  },
  {
    id: "forex",
    titleKey: "mk.cat.forex",
    blurbKey: "mk.cat.forex.blurb",
    image: "/market/forex.jpg",
    sections: [
      { titleKey: "mk.section.sessions", bodyKey: "mk.section.sessions.body" },
      { titleKey: "mk.section.events", bodyKey: "mk.section.events.body" },
      { titleKey: "mk.section.analysis", bodyKey: "mk.section.analysis.body" },
    ],
  },
  {
    id: "crypto",
    titleKey: "mk.cat.crypto",
    blurbKey: "mk.cat.crypto.blurb",
    image: "/market/crypto.jpg",
    sections: [
      { titleKey: "mk.section.trust", bodyKey: "mk.section.trust.body" },
      { titleKey: "mk.section.reserves", bodyKey: "mk.section.reserves.body" },
      { titleKey: "mk.section.withdrawals", bodyKey: "mk.section.withdrawals.body" },
      { titleKey: "mk.section.analysis", bodyKey: "mk.section.analysis.body" },
    ],
  },
];

/** Coverage matches the live feed: 8 lanes are streamed (see platform marketMap); AUD/USD and ETH are not yet. */
export const INSTRUMENTS: Instrument[] = [
  { slug: "gold", displaySymbol: "XAU/USD", nameKey: "mk.inst.gold", category: "commodities", coverage: "available", quote: null },
  { slug: "silver", displaySymbol: "XAG/USD", nameKey: "mk.inst.silver", category: "commodities", coverage: "available", quote: null },
  { slug: "oil", displaySymbol: "OIL", nameKey: "mk.inst.oil", category: "commodities", coverage: "available", noteKey: "mk.inst.oil.note", quote: null },
  { slug: "eurusd", displaySymbol: "EUR/USD", nameKey: "mk.inst.eurusd", category: "forex", coverage: "available", quote: null },
  { slug: "usdjpy", displaySymbol: "USD/JPY", nameKey: "mk.inst.usdjpy", category: "forex", coverage: "available", quote: null },
  { slug: "gbpusd", displaySymbol: "GBP/USD", nameKey: "mk.inst.gbpusd", category: "forex", coverage: "available", quote: null },
  { slug: "audusd", displaySymbol: "AUD/USD", nameKey: "mk.inst.audusd", category: "forex", coverage: "planned", quote: null },
  { slug: "nzdusd", displaySymbol: "NZD/USD", nameKey: "mk.inst.nzdusd", category: "forex", coverage: "available", quote: null },
  { slug: "btc", displaySymbol: "BTC", nameKey: "mk.inst.btc", category: "crypto", coverage: "available", quote: null },
  { slug: "eth", displaySymbol: "ETH", nameKey: "mk.inst.eth", category: "crypto", coverage: "planned", quote: null },
];

/** Published Market Briefs (W3.7). Empty until a real edition with content and provenance exists. */
export interface BriefSummary {
  edition: string;
  titleKey: MessageKey;
  category: CategoryId;
  publishedUtc: string;
  /** W3.6 body: overview paragraph and key events (message keys, so every edition is translated). */
  overviewKey?: MessageKey;
  eventKeys?: MessageKey[];
  /** Instrument slugs within `category` (W3.6.4 → W3.5). */
  instruments?: string[];
  /** W3.6.5: named sources and the last update time. */
  sources?: { name: string; url?: string }[];
  updatedUtc?: string;
}
export const BRIEFS: BriefSummary[] = [];

export function findBrief(edition: string): BriefSummary | undefined {
  return BRIEFS.find((brief) => brief.edition === edition);
}

export function findCategory(id: string): Category | undefined {
  return CATEGORIES.find((category) => category.id === id);
}

export function instrumentsIn(category: CategoryId): Instrument[] {
  return INSTRUMENTS.filter((instrument) => instrument.category === category);
}

export function findInstrument(category: string, slug: string): Instrument | undefined {
  return INSTRUMENTS.find((instrument) => instrument.category === category && instrument.slug === slug);
}

/** Where every "Join Waitlist" / "Register Now" goes: the existing nebula Welcome in the app (W9.2). */
export const REGISTER_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://app.afvar.com/";
