// Shared by the platform copy tests: the /platform overview's words, act by
// act, and the sentence splitter used for "no sentence twice" checks.
import { motionValue } from "framer-motion";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { AreaList, AreasCopy, FreshnessCard, HeroCopy, OsCaption, OverviewUi, STOP_TEXT, StationCard, StopCard, TrustCopy, VerifyCopy, WAYS_TEXT, WORK_TEXT, WaysCard, WorkspaceList } from "../film/OverviewCopy";
import type { OverviewFilm } from "../film/overviewFilm";
import { AtAGlanceGrid } from "../components/overview/AtAGlanceGrid";

export function sentences(el: ReactElement): string[] {
  const html = renderToStaticMarkup(el);
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

export function overviewActs(film: OverviewFilm): Record<string, ReactElement> {
  const mv = motionValue(1);
  const compact = film.kind === "compact";
  const wrap = (el: ReactElement) => <OverviewUi.Provider value={film}>{el}</OverviewUi.Provider>;
  return {
    hero: wrap(<HeroCopy compact={compact} />),
    ways: wrap(
      <>
        <OsCaption {...WAYS_TEXT} />
        {compact ? <WaysCard mv={mv} /> : null}
      </>,
    ),
    stop: wrap(
      <>
        <OsCaption {...STOP_TEXT} />
        <StopCard mv={mv} compact={compact} />
      </>,
    ),
    verify: wrap(
      <>
        <VerifyCopy compact={compact} />
        <StationCard mv={mv} compact={compact} />
      </>,
    ),
    workspace: wrap(
      <>
        <OsCaption {...WORK_TEXT} />
        <WorkspaceList mv={mv} compact={compact} />
      </>,
    ),
    trust: wrap(
      <>
        <TrustCopy compact={compact} />
        <FreshnessCard mv={mv} compact={compact} />
      </>,
    ),
    areas: wrap(
      <>
        <AreasCopy compact={compact} />
        <AreaList mv={mv} compact={compact} />
      </>,
    ),
    glance: <AtAGlanceGrid />,
  };
}

