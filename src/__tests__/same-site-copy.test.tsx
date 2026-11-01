// Cross-page check for the AI OS pages: they share one look, never one text.
// No sentence of the home film may appear on /platform. (Relative imports on
// purpose: this test reads two modules' internals side by side.)
import { motionValue } from "framer-motion";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { AlwaysCopy, AvatarCopy, CoresCopy, Dialogue, FilmUi, FinaleCopy, HeroCopy, PermissionsCard, SessionCard, StreamCopy, ThinkCard, ThinkCopy, TrustCopy } from "../modules/homeDemo/ai/cards";
import { OS_BEATS } from "../modules/homeDemo/ai/OsFilm";
import { COMPACT_FILM, DESKTOP_FILM, type Film } from "../modules/homeDemo/ai/aiConfig";
import { OVERVIEW_COMPACT, OVERVIEW_DESKTOP } from "../modules/platform/film/overviewFilm";
import { overviewActs, sentences } from "../modules/platform/__tests__/overview-copy.fixture";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn() }), usePathname: () => "/" }));

function homeSentences(film: Film): Set<string> {
  const mv = motionValue(1);
  const compact = film.kind === "compact";
  const acts: ReactElement[] = [
    <HeroCopy key="h" compact={compact} />,
    <CoresCopy key="c" compact={compact} />,
    <StreamCopy key="s" compact={compact} />,
    <ThinkCopy key="t" />,
    <ThinkCard key="tc" mv={mv} compact={compact} />,
    <AlwaysCopy key="a" compact={compact} />,
    <SessionCard key="sc" compact={compact} />,
    <AvatarCopy key="av" compact={compact} />,
    <Dialogue key="d" mv={mv} compact={compact} />,
    <TrustCopy key="tr" compact={compact} />,
    <PermissionsCard key="p" compact={compact} />,
    <FinaleCopy key="f" compact={compact} />,
  ];
  const out = new Set<string>();
  for (const el of acts) for (const s of sentences(<FilmUi.Provider value={film}>{el}</FilmUi.Provider>)) out.add(s);
  for (const b of OS_BEATS) for (const s of `${b.title} ${b.body}`.split(/(?<=[.!?])\s+/)) if (s.length > 28) out.add(s.trim());
  return out;
}

describe("the platform overview never repeats the home film's words", () => {
  it.each([
    ["desktop", DESKTOP_FILM, OVERVIEW_DESKTOP],
    ["compact", COMPACT_FILM, OVERVIEW_COMPACT],
  ] as const)("%s", (_n, home, platform) => {
    const fromHome = homeSentences(home as Film);
    expect(fromHome.size).toBeGreaterThan(15);
    const copied: string[] = [];
    for (const [act, el] of Object.entries(overviewActs(platform))) for (const s of sentences(el)) if (fromHome.has(s)) copied.push(`"${s}" (platform ${act})`);
    expect(copied).toEqual([]);
  });
});
