// Layer 1 — static checks for the home film: timing invariants for both cuts,
// OS choreography keyframes, and "no sentence appears in two acts".
import { motionValue } from "framer-motion";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { COMPACT_FILM, DESKTOP_FILM, HOME_MOBILE_FILM, type Film } from "../ai/aiConfig";
import { AlwaysCopy, AvatarCopy, CoresCopy, Dialogue, FilmUi, FinaleCopy, HeroCopy, PermissionsCard, SessionCard, StreamCopy, ThinkCard, ThinkCopy, TrustCopy } from "../ai/cards";
import { OS_BEATS, OS_G, OS_KEYS, POINTER, STEP_FORWARD } from "../ai/OsFilm";

const increasing = (xs: number[]) => xs.every((x, i) => i === 0 || x >= xs[i - 1]);

describe.each([
  ["desktop", DESKTOP_FILM],
  ["compact", COMPACT_FILM],
  ["responsive homepage", HOME_MOBILE_FILM],
] as [string, Film][])("%s film", (_name, film) => {
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
    expect(at.every((a, i) => i === 0 || a > at[i - 1])).toBe(true);
    expect(at[0]).toBe(0);
    expect(at[at.length - 1]).toBe(1);
    expect(film.cameraPortrait.length).toBe(film.camera.length);
  });

  it("the core layout plan is contiguous", () => {
    film.plan.forEach((seg, i) => {
      expect(seg.b).toBeGreaterThan(seg.a);
      if (i > 0) expect(seg.a).toBeCloseTo(film.plan[i - 1].b);
      if (i > 0) expect(seg.from).toBe(film.plan[i - 1].to);
    });
  });

  it("sound cues are inside the film and in order", () => {
    const at = film.sound.map((c) => c.at);
    expect(increasing(at)).toBe(true);
    at.forEach((a) => {
      expect(a).toBeGreaterThan(0);
      expect(a).toBeLessThan(1);
    });
  });
});

describe("cuts", () => {
  it("the responsive homepage fits every desktop chapter into a shorter mobile track", () => {
    expect(HOME_MOBILE_FILM.story.order).toEqual(DESKTOP_FILM.story.order);
    expect(HOME_MOBILE_FILM.story.totalVh).toBeLessThan(COMPACT_FILM.story.totalVh);
  });
  it("the original compact cut omits the OS and retains its avatar", () => {
    expect(DESKTOP_FILM.has("os")).toBe(true);
    expect(COMPACT_FILM.has("os")).toBe(false);
    expect(DESKTOP_FILM.has("avatar") && COMPACT_FILM.has("avatar")).toBe(true);
  });
});

describe("OS choreography", () => {
  it("every window's keyframes are in time order", () => {
    for (const keys of Object.values(OS_KEYS)) expect(increasing(keys.map((k) => k.at))).toBe(true);
  });
  it("pointer and avatar gesture keys are in time order", () => {
    expect(increasing(POINTER.map((k) => k.at))).toBe(true);
    expect(increasing(OS_G.map((g) => g[0]))).toBe(true);
  });
  it("beat captions never overlap", () => {
    for (let i = 1; i < OS_BEATS.length; i++) expect(OS_BEATS[i].at[0]).toBeGreaterThanOrEqual(OS_BEATS[i - 1].at[3]);
  });
  it("step-forward windows are well formed", () => {
    for (const s of STEP_FORWARD) expect(increasing([...s.at])).toBe(true);
  });
});

/* ------------------------------------------------------ no repeated copy */

function sentences(el: ReactElement, film: Film): string[] {
  const html = renderToStaticMarkup(<FilmUi.Provider value={film}>{el}</FilmUi.Provider>);
  const text = html
    .replace(/<[^>]+>/g, " ")
    .replace(/&#x27;|&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ");
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 28);
}

describe("no sentence appears in two acts", () => {
  it.each([
    ["desktop", DESKTOP_FILM],
    ["compact", COMPACT_FILM],
  ] as [string, Film][])("%s", (_n, film) => {
    const mv = motionValue(1);
    const compact = film.kind === "compact";
    const acts: Record<string, ReactElement> = {
      hero: <HeroCopy compact={compact} />,
      cores: <CoresCopy compact={compact} />,
      stream: <StreamCopy compact={compact} />,
      think: (
        <>
          <ThinkCopy />
          <ThinkCard mv={mv} compact={compact} />
        </>
      ),
      always: (
        <>
          <AlwaysCopy compact={compact} />
          <SessionCard compact={compact} />
        </>
      ),
      avatar: (
        <>
          <AvatarCopy compact={compact} />
          <Dialogue mv={mv} compact={compact} />
        </>
      ),
      trust: (
        <>
          <TrustCopy compact={compact} />
          <PermissionsCard compact={compact} />
        </>
      ),
      finale: <FinaleCopy compact={compact} />,
    };
    const seen = new Map<string, string>();
    const dupes: string[] = [];
    for (const [act, el] of Object.entries(acts)) {
      for (const s of new Set(sentences(el, film))) {
        const prev = seen.get(s);
        if (prev && prev !== act) dupes.push(`"${s}" in ${prev} and ${act}`);
        seen.set(s, act);
      }
    }
    for (const b of OS_BEATS) {
      const s = `${b.title} ${b.body}`;
      for (const [k, act] of seen) if (s.includes(k)) dupes.push(`"${k}" in ${act} and OS beat ${b.id}`);
    }
    expect(seen.size).toBeGreaterThan(15); // the check really read the copy
    expect(dupes).toEqual([]);
  });
});
