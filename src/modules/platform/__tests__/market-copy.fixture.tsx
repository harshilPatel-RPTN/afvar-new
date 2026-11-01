// Shared by the Market Data copy tests: the page's words, act by act and
// section by section, rendered with a fixed set of sample quotes.
import { motionValue } from "framer-motion";
import type { ReactElement } from "react";
import type { HomeQuote } from "@/modules/home/kit";
import { getCapability } from "../content";
import type { CapFilm } from "../film/capability/factory";
import { FeatureJumpGrid, NotesAndRelated, OtherAreas, OutcomeLine } from "../film/capability/sections";
import { ActHead, CapOrder, OsCaption } from "../film/capability/ui";
import { CHART_TEXT, ChartCard, FEED_TEXT, HeatCard, HeroCopy, INSIGHT_TEXT, InsightCard, LaneCard, MarketUi, WATCH_TEXT } from "../film/market/MarketCopy";
import { FEATURE_ACT, MARKET_FILM_ID, MARKET_NOTES, type MarketAct } from "../film/market/marketFilm";

export const QUOTES = Object.fromEntries(
  ["XAUUSD", "XAGUSD", "WTI", "EURUSD", "USDJPY", "GBPUSD", "NZDUSD", "BTC-USD"].map((k, i) => [
    k,
    { name: k, last: 100 + i, changePct: i % 2 ? -1.1 * i : 0.7 * i, decimals: 2, closes: [110, 112, 109, 111, 108, 107, 109, 105, 104, 106, 103, 101], candles: [], live: true, status: i % 3 ? "delayed" : "live", asOf: Date.UTC(2026, 10, 1, 6, 5), source: "Test feed", dir: 1 } satisfies HomeQuote,
  ]),
);

/** Every act of the film plus the sections under it, as rendered words. */
export function marketPageActs(film: CapFilm<MarketAct>): Record<string, ReactElement> {
  const mv = motionValue(1);
  const compact = film.kind === "compact";
  const wrap = (el: ReactElement) => (
    <CapOrder.Provider value={film.story.order}>
      <MarketUi.Provider value={film}>{el}</MarketUi.Provider>
    </CapOrder.Provider>
  );
  const c = getCapability("charts")!;
  return {
    hero: wrap(<HeroCopy compact={compact} />),
    feed: wrap(
      <>
        <ActHead text={FEED_TEXT} compact={compact} />
        <LaneCard mv={mv} quotes={QUOTES} compact={compact} />
      </>,
    ),
    chart: wrap(
      <>
        <OsCaption text={CHART_TEXT} />
        {compact ? <ChartCard mv={mv} quotes={QUOTES} /> : null}
      </>,
    ),
    watch: wrap(
      <>
        <OsCaption text={WATCH_TEXT} />
        {compact ? <HeatCard mv={mv} quotes={QUOTES} /> : null}
      </>,
    ),
    insight: wrap(
      <>
        <ActHead text={INSIGHT_TEXT} compact={compact} />
        <InsightCard mv={mv} quotes={QUOTES} compact={compact} />
      </>,
    ),
    features: <FeatureJumpGrid capability={c} filmId={MARKET_FILM_ID} actOf={FEATURE_ACT} />,
    outcome: <OutcomeLine capability={c} />,
    notes: <NotesAndRelated capability={c} notes={MARKET_NOTES} />,
    areas: <OtherAreas current="charts" />,
  };
}

