import type { CapabilitySlug, RouteKey } from "./types";

/**
 * Route registry for every destination the Platform pages link to (WP-WA01:
 * "no duplicate destination definitions"). Paths outside /platform are the
 * proposed W1–W8 routes; change them here once the owning pages ship.
 */
export const ROUTES: Record<RouteKey, { path: string; ref: string }> = {
  platform: { path: "/platform", ref: "W2.1" },
  // URLs follow the board's page names (W2.2 Market Data & Charts, W2.5 Risk & Trade
  // Review) and the site nav; the old /platform/charts and /trade-review redirect here.
  charts: { path: "/platform/market-data", ref: "W2.2" },
  research: { path: "/platform/research", ref: "W2.3" },
  alerts: { path: "/platform/alerts", ref: "W2.4" },
  "trade-review": { path: "/platform/risk-review", ref: "W2.5" },
  community: { path: "/platform/community", ref: "W2.6" },
  markets: { path: "/market", ref: "W3.1" },
  instrument: { path: "/market", ref: "W3.5" },
  briefs: { path: "/market/briefs", ref: "W3.7" },
  pricing: { path: "/pricing", ref: "W4" },
  "getting-started": { path: "/resources/getting-started", ref: "W5.2" },
  guides: { path: "/resources/guides", ref: "W5.3" },
  evidence: { path: "/resources/sources-evidence", ref: "W5.4" },
  help: { path: "/resources/help", ref: "W5.6" },
};

export function pathOf(key: RouteKey): string {
  return ROUTES[key].path;
}

export function capabilityPath(slug: CapabilitySlug): string {
  return ROUTES[slug].path;
}

/**
 * Every Register Now goes to the existing Step 2 nebula Welcome (1.3.2.1.3,
 * W9.2). There is no website registration form.
 */
export const REGISTER_URL = "https://app.afvar.com/";
