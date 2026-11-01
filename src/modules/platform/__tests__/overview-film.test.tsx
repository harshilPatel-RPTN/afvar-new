// Layer 1 — static checks for the /platform film: timing invariants for both
// cuts, the OS choreography, the stop / cancel rules, and "no sentence appears
// twice on the page".
import { describe, expect, it, vi } from "vitest";
import {
  AREA_BEATS,
  CAPTION_CANCELLED,
  CAPTION_STOPPED,
  FRESH_AT,
  OVERVIEW_COMPACT,
  OVERVIEW_DESKTOP,
  RETURN_AT,
  STATION_AT,
  STOP,
  stopRows,
  type OverviewFilm,
} from "../film/overviewFilm";
import { overviewActs, sentences } from "./overview-copy.fixture";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/platform" }));

const increasing = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]);
const strictly = (xs: readonly number[]) => xs.every((x, i) => i === 0 || x > xs[i - 1]);

describe.each([
  ["desktop", OVERVIEW_DESKTOP],
  ["compact", OVERVIEW_COMPACT],
] as [string, OverviewFilm][])("%s film", (_name, film) => {
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
});

describe("beats", () => {
  it("stations, return, areas and freshness states are in time order inside their acts", () => {
    expect(strictly(STATION_AT)).toBe(true);
    expect(RETURN_AT[0]).toBeGreaterThan(STATION_AT[STATION_AT.length - 1]);
    expect(strictly(AREA_BEATS)).toBe(true);
    expect(strictly(FRESH_AT)).toBe(true);
    for (const x of [...STATION_AT, ...RETURN_AT, ...AREA_BEATS, ...FRESH_AT]) expect(x > 0 && x < 1).toBe(true);
  });

  it("stop speaking never cancels the task; cancel keeps finished work", () => {
    const afterStop = stopRows(STOP.stopPress + 0.01);
    expect(afterStop.speaking).toBe(false);
    expect(afterStop.status).toBe("Running");
    expect(afterStop.caption).toBe(CAPTION_STOPPED);
    expect(stopRows(STOP.done1).status).toBe("Complete");
    expect(stopRows(STOP.done1).rows).toEqual(["done", "done", "done"]);
    const afterCancel = stopRows(STOP.cancelPress + 0.01);
    expect(afterCancel.status).toBe("Cancelled");
    expect(afterCancel.rows).toEqual(["done", "cancelled", "cancelled"]);
    expect(afterCancel.caption).toBe(CAPTION_CANCELLED);
  });

});

/* ------------------------------------------------------ no repeated copy */

describe("no sentence appears twice on /platform", () => {
  it.each([
    ["desktop", OVERVIEW_DESKTOP],
    ["compact", OVERVIEW_COMPACT],
  ] as [string, OverviewFilm][])("%s", (_n, film) => {
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [act, el] of Object.entries(overviewActs(film))) {
      for (const s of new Set(sentences(el))) {
        const prev = seen.get(s);
        if (prev && prev !== act) dupes.push(`"${s}" in ${prev} and ${act}`);
        seen.set(s, act);
      }
    }
    expect(seen.size).toBeGreaterThan(15); // the check really read the copy
    expect(dupes).toEqual([]);
  });
});
