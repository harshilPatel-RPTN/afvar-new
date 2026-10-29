import { describe, expect, it } from "vitest";
import { AT_A_GLANCE, CAPABILITIES, getCapability, isCapabilitySlug } from "../content";
import { REGISTER_URL, ROUTES, capabilityPath } from "../routes";

// Section names and order as written on the board (W2.1–W2.6 / handoff WA 2).
const BOARD_SECTIONS: Record<string, string[]> = {
  charts: ["Quotes & Charts", "Watchlists", "Technical Analysis", "Market Overview & Heatmaps", "Instrument Insights", "Sources, Freshness & Availability"],
  research: ["Economic Calendar", "News & Sentiment", "Market Briefs", "Explain Market Moves", "Event Analysis", "Deep Research", "Supporting Sources"],
  alerts: ["Rules & Confirmation", "Price & Condition Alerts", "Screeners", "Scheduled Scans", "Strategy Testing", "Costs & Assumptions", "Results & Review"],
  "trade-review": ["Read-Only Account Connections", "Portfolio & Exposure", "Risk Guardian", "Personal Limits", "Trading Journal", "Performance & Discipline"],
  community: ["Channels & Discussions", "Shared Charts & Analysis", "Verified Records", "Member Profiles", "Trade Explorer", "Broker Comparison", "AI Discussion Summaries", "Participation Rules"],
};

describe("platform content", () => {
  it("has the five capability pages in navbar order", () => {
    expect(CAPABILITIES.map((c) => c.slug)).toEqual(["charts", "research", "alerts", "trade-review", "community"]);
    expect(CAPABILITIES.map((c) => c.ref)).toEqual(["W2.2", "W2.3", "W2.4", "W2.5", "W2.6"]);
  });

  it.each(Object.entries(BOARD_SECTIONS))("%s lists every board section in order", (slug, sections) => {
    expect(getCapability(slug)?.features.map((f) => f.title)).toEqual(sections);
  });

  it("covers all ten Platform Overview topics", () => {
    expect(AT_A_GLANCE).toHaveLength(10);
  });

  it("does not claim any feature is available before it is confirmed", () => {
    for (const c of CAPABILITIES) for (const f of c.features) expect(f.availability).toBe("in-development");
  });

  it("resolves every link through the route registry", () => {
    for (const c of CAPABILITIES) {
      // Capability pages live under /platform; the URL segment follows the board's page
      // names (e.g. charts → /platform/market-data), set once in the registry.
      expect(capabilityPath(c.slug)).toBe(ROUTES[c.slug].path);
      expect(capabilityPath(c.slug)).toMatch(/^\/platform\/[a-z-]+$/);
      for (const r of c.related) expect(ROUTES[r.route]?.path).toMatch(/^\//);
    }
  });

  it("sends registration to the existing app Welcome", () => {
    expect(REGISTER_URL).toBe("https://app.afvar.com/");
  });

  it("rejects unknown slugs", () => {
    expect(isCapabilitySlug("charts")).toBe(true);
    expect(isCapabilitySlug("orders")).toBe(false);
    expect(getCapability("orders")).toBeUndefined();
  });
});
