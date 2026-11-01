"use client";

// The Market Data film on the shared capability stage: which overlay goes on
// which act, in each cut. Words and cards: MarketCopy; OS acts: MarketOs;
// WebGL: MarketScene; timing: marketFilm.
import { useMotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import type { ReactNode, RefObject } from "react";
import { MONO, Poster, StoryAct } from "@/modules/afvarOs";
import type { Quotes } from "@/modules/homeDemo/kit";
import { CapFilmShell, LEFT, compactSlot, type CapFilmDef, type CapStageProps } from "../capability/FilmShell";
import { ActHead, CapOrder, CompactHead, OsCaption } from "../capability/ui";
import { CHART_TEXT, ChartCard, FEED_TEXT, HeatCard, HeroCopy, INSIGHT_TEXT, InsightCard, LaneCard, MarketUi, WATCH_TEXT } from "./MarketCopy";
import { MarketOs, MarketScreen } from "./MarketOs";
import { MARKET_COMPACT, MARKET_DESKTOP, MARKET_FILM_ID, type MarketAct } from "./marketFilm";

const MarketScene = dynamic(() => import("./MarketScene"), { ssr: false });

/* ---------------------------------------------------------------- desktop */

function Desktop({ mv, film, quotes, avatarInOs }: CapStageProps<MarketAct>) {
  const C = film.story.copy;
  return (
    <MarketUi.Provider value={film}>
      <StoryAct mv={mv} at={C.hero} name="hero" className={`${LEFT} w-[min(36rem,44vw)]`}>
        <HeroCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.feed} name="feed" className={`${LEFT} w-[min(31rem,38vw)]`}>
        <ActHead text={FEED_TEXT} />
        <div className="mt-6 max-w-[27rem] [@media(max-height:820px)]:mt-4">
          <LaneCard mv={mv} quotes={quotes} />
        </div>
      </StoryAct>
      <MarketOs mv={mv} quotes={quotes} avatarHere={avatarInOs} />
      <StoryAct mv={mv} at={C.insight} name="insight" className={`${LEFT} w-[min(33rem,40vw)]`}>
        <ActHead text={INSIGHT_TEXT} />
        <div className="mt-6 [@media(max-height:820px)]:mt-4">
          <InsightCard mv={mv} quotes={quotes} />
        </div>
      </StoryAct>
    </MarketUi.Provider>
  );
}

/* --------------------------------------------------------- phones, tablets */

function Compact({ mv, film, quotes, portrait }: CapStageProps<MarketAct>) {
  const C = film.story.copy;
  const slot = compactSlot(portrait);
  return (
    <MarketUi.Provider value={film}>
      <StoryAct mv={mv} at={C.hero} name="hero" className={slot} rise={18}>
        <HeroCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.feed} name="feed" className={slot} rise={18}>
        <CompactHead text={FEED_TEXT} />
        <div className="mt-3">
          <LaneCard mv={mv} quotes={quotes} compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.chart} name="chart" className={slot} rise={18}>
        <CompactHead text={CHART_TEXT} />
        <div className="mt-3">
          <ChartCard mv={mv} quotes={quotes} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.watch} name="watch" className={slot} rise={18}>
        <CompactHead text={WATCH_TEXT} />
        <div className="mt-3">
          <HeatCard mv={mv} quotes={quotes} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.insight} name="insight" className={slot} rise={18}>
        <CompactHead text={INSIGHT_TEXT} />
        <div className="mt-3">
          <InsightCard mv={mv} quotes={quotes} compact />
        </div>
      </StoryAct>
    </MarketUi.Provider>
  );
}

/* ================================================== stacked (reduced motion) */

const block = "scroll-mt-24 border-t border-[rgba(255,255,255,0.06)] px-5 py-16 sm:px-8 lg:px-16";

function Snapshot({ p, quotes }: { p: number; quotes: Quotes }) {
  const mv = useMotionValue(p);
  return (
    <div className="aspect-[1200/660] w-full">
      <MarketScreen mv={mv} quotes={quotes} className="h-full w-full" />
    </div>
  );
}

function Stacked({ quotes, scene, revealRef }: { quotes: Quotes; scene: ReactNode; revealRef: RefObject<HTMLDivElement | null> }) {
  const D = MARKET_DESKTOP;
  const K = MARKET_COMPACT;
  const feedDone = useMotionValue(D.at("feed", 0.95));
  const chartDone = useMotionValue(K.at("chart", 0.9));
  const watchDone = useMotionValue(K.at("watch", 0.9));
  const insightDone = useMotionValue(D.at("insight", 0.9));
  const id = (a: MarketAct) => `${MARKET_FILM_ID}-${a}`;
  return (
    <CapOrder.Provider value={D.story.order}>
      <div className="px-5 pb-12 pt-36 sm:px-8 lg:px-16">
        <div className="max-w-2xl">
          <HeroCopy />
        </div>
        <div ref={revealRef} className="relative mt-10 h-[52svh] min-h-[320px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <Poster />
          {scene ? <div className="absolute inset-0">{scene}</div> : null}
          <p className={`${MONO} absolute bottom-3 right-4 text-[10px] text-[#5E6669]`}>Illustrative · prices real where labelled</p>
        </div>
      </div>
      <MarketUi.Provider value={D}>
        <div id={id("feed")} className={block}>
          <ActHead text={FEED_TEXT} />
          <div className="mt-8 max-w-md">
            <LaneCard mv={feedDone} quotes={quotes} />
          </div>
        </div>
      </MarketUi.Provider>
      <div id={id("chart")} className={block}>
        <OsCaption text={CHART_TEXT} />
        <div className="mt-8 max-w-5xl max-lg:hidden">
          <Snapshot p={D.at("chart", 0.9)} quotes={quotes} />
        </div>
        <MarketUi.Provider value={K}>
          <div className="mt-6 max-w-md lg:hidden">
            <ChartCard mv={chartDone} quotes={quotes} />
          </div>
        </MarketUi.Provider>
      </div>
      <div id={id("watch")} className={block}>
        <OsCaption text={WATCH_TEXT} />
        <div className="mt-8 max-w-5xl max-lg:hidden">
          <Snapshot p={D.at("watch", 0.9)} quotes={quotes} />
        </div>
        <MarketUi.Provider value={K}>
          <div className="mt-6 max-w-md lg:hidden">
            <HeatCard mv={watchDone} quotes={quotes} />
          </div>
        </MarketUi.Provider>
      </div>
      <MarketUi.Provider value={D}>
        <div id={id("insight")} className={block}>
          <ActHead text={INSIGHT_TEXT} />
          <div className="mt-8 max-w-xl">
            <InsightCard mv={insightDone} quotes={quotes} />
          </div>
        </div>
      </MarketUi.Provider>
    </CapOrder.Provider>
  );
}

/* ------------------------------------------------------------------ film */

const DEF: CapFilmDef<MarketAct> = {
  id: MARKET_FILM_ID,
  label: "Market Data & Charts — quotes, charts and watchlists, every price with its source",
  desktop: MARKET_DESKTOP,
  compact: MARKET_COMPACT,
  Scene: MarketScene,
  Hero: HeroCopy,
  Desktop,
  Compact,
  Stacked,
  avatarAct: "chart",
  avatarBy: ["feed", 0.4],
};

export function MarketFilm() {
  return <CapFilmShell def={DEF} />;
}
