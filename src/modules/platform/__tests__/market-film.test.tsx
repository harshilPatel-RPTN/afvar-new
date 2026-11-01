// Layer 1 — static checks for the Market Data film and its page: timing
// invariants for both cuts, the OS layer, what the AI says about a chart (from
// the closes only), and "no sentence appears twice on the page".
import { describe, expect, it, vi } from "vitest";
import type { HomeQuote } from "@/modules/home/kit";
import { getCapability } from "../content";
import type { CapFilm } from "../film/capability/factory";
import { asOfText, biggestMover, lastMovePct, rangeOf, signedPct, swingLine, trendOf } from "../film/market/analysis";
import { CHART, FEATURE_ACT, INSIGHT_AT, INSIGHT_CHECKED, LANE_AT, MARKET_COMPACT, MARKET_DESKTOP, WATCH, type MarketAct } from "../film/market/marketFilm";
import { DESK_KEYS } from "../film/market/MarketOs";
import { marketPageActs } from "./market-copy.fixture";
import { sentences } from "./overview-copy.fixture";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/platform/market-data" }));

const increasing = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]);
const strictly = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);

describe.each([
  ["desktop", MARKET_DESKTOP],
  ["compact", MARKET_COMPACT],
] as [string, CapFilm<MarketAct>][])("%s film", (_name, film) => {
  it("acts tile the whole progress without gaps", () => {
    const r = film.story.order.map((id) => film.story.range[id]);
    expect(r[0][0]).toBe(0);
    expect(r[r.length - 1][1]).toBeCloseTo(1);
    r.forEach((x, i) => i > 0 && expect(x[0]).toBeCloseTo(r[i - 1][1]));
  });

  it("copy of consecutive acts never overlaps on screen", () => {
    const o = film.story.order;
    for (let i = 1; i < o.length; i++) expect(film.story.copy[o[i]][0]).toBeGreaterThanOrEqual(film.story.copy[o[i - 1]][3]);
  });

  it("camera keys are strictly increasing, within 0..1, same length portrait/landscape", () => {
    const at = film.camera.map((k) => k.at);
    expect(strictly(at)).toBe(true);
    expect(at[at.length - 1]).toBe(1);
    expect(film.cameraPortrait.length).toBe(film.camera.length);
  });

  it("sound cues are inside the film and in order", () => {
    const at = film.sound.map((c) => c.at);
    expect(increasing(at)).toBe(true);
    for (const a of at) expect(a > 0 && a < 1).toBe(true);
  });

  it("is about a third of the home film's length", () => {
    expect(film.story.totalVh).toBeGreaterThan(850);
    expect(film.story.totalVh).toBeLessThan(1200);
  });
});

describe("the OS layer", () => {
  const D = MARKET_DESKTOP;
  it("covers the chart and watch acts on desktop as one screen, and nothing else", () => {
    expect(D.os).toEqual(["chart", "watch"]);
    expect(D.osIn(D.at("chart", 0.5))).toBe(1);
    expect(D.osIn(D.at("watch", 0.0))).toBe(1); // no flash between the two OS acts
    expect(D.osIn(D.at("watch", 0.5))).toBe(1);
    expect(D.osIn(D.at("feed", 0.5))).toBe(0);
    expect(D.osIn(D.at("insight", 0.5))).toBe(0);
    expect(D.osCovers(D.at("chart", 0.5))).toBe(true);
    expect(D.osCovers(D.at("insight", 0.3))).toBe(false);
  });
  it("is never up on phones", () => {
    expect(MARKET_COMPACT.os).toEqual([]);
    expect(MARKET_COMPACT.osIn(MARKET_COMPACT.at("chart", 0.5))).toBe(0);
  });
});

describe("beats", () => {
  it("chart, watch, lanes and insight beats are in time order inside their acts", () => {
    expect(strictly([CHART.ask[0], CHART.ask[1], CHART.high[0], CHART.high[1], CHART.low[1], CHART.trend[1], CHART.panel, ...CHART.rows, CHART.checked])).toBe(true);
    expect(CHART.speak[0]).toBeGreaterThan(CHART.panel);
    expect(CHART.speak[1]).toBeLessThan(CHART.checked);
    expect(strictly([WATCH.ask[1], ...WATCH.added, WATCH.heat, WATCH.overview, WATCH.mover])).toBe(true);
    expect(strictly(LANE_AT)).toBe(true);
    expect(strictly([...INSIGHT_AT, INSIGHT_CHECKED])).toBe(true);
  });
  it("OS windows move in time order across the chart → watch hand-off", () => {
    for (const keys of Object.values(DESK_KEYS)) expect(increasing(keys.map((k) => k.at))).toBe(true);
  });
  it("every feature card jumps to an act of the film", () => {
    const features = getCapability("charts")!.features.map((f) => f.title);
    expect(Object.keys(FEATURE_ACT).sort()).toEqual([...features].sort());
    for (const act of Object.values(FEATURE_ACT)) expect(MARKET_DESKTOP.story.order).toContain(act);
  });
});

/* ---------------------------------------------------- what the AI says */

describe("chart analysis comes from the closes only", () => {
  const falling = [110, 112, 109, 111, 108, 107, 109, 105, 104, 106, 103, 101];
  const rising = [100, 99, 101, 103, 102, 104, 106, 105, 108, 110, 109, 112];
  it("range high and low are the extreme closes", () => {
    const r = rangeOf(falling);
    expect(r.high).toBe(112);
    expect(r.low).toBe(101);
    expect(r.hiAt).toBe(1);
    expect(r.widthPct).toBeCloseTo((11 / 101) * 100);
  });
  it("trend compares the first and last thirds", () => {
    expect(trendOf(falling).trend).toBe("falling");
    expect(trendOf(rising).trend).toBe("rising");
    expect(trendOf([100, 100.05, 99.98, 100.02, 100, 100.01]).trend).toBe("sideways");
  });
  it("the trend line joins lower highs when falling and higher lows when rising", () => {
    const f = swingLine(falling)!;
    expect(f.kind).toBe("lower highs");
    expect(f.v1).toBeLessThan(f.v0);
    const r = swingLine(rising)!;
    expect(r.kind).toBe("higher lows");
    expect(r.v1).toBeGreaterThan(r.v0);
    expect(swingLine([100, 100.05, 99.98, 100.02, 100, 100.01])).toBeNull();
  });
  it("labels, moves and the biggest mover", () => {
    expect(lastMovePct([100, 100, 100, 100, 100, 100, 110], 5)).toBeCloseTo(10);
    expect(signedPct(-2.9)).toBe("−2.90%");
    expect(signedPct(1.234, 1)).toBe("+1.2%");
    expect(asOfText(null)).toBe("stored");
    expect(asOfText(Date.UTC(2026, 10, 1, 6, 5))).toBe("06:05 UTC");
    const q = (changePct: number) => ({ changePct }) as HomeQuote;
    expect(biggestMover({ A: q(1), B: q(-3), C: q(2) }, ["A", "B", "C"])!.key).toBe("B");
  });
});

describe("no sentence appears twice on /platform/market-data", () => {
  it.each([
    ["desktop", MARKET_DESKTOP],
    ["compact", MARKET_COMPACT],
  ] as [string, CapFilm<MarketAct>][])("%s", (_n, film) => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [act, el] of Object.entries(marketPageActs(film))) {
      for (const s of new Set(sentences(el))) {
        const prev = seen.get(s);
        if (prev && prev !== act) dupes.push(`"${s}" in ${prev} and ${act}`);
        seen.set(s, act);
      }
    }
    expect(seen.size).toBeGreaterThan(12); // the check really read the copy
    expect(dupes).toEqual([]);
  });
});
