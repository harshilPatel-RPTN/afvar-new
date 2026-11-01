"use client";

// The /platform film: ONE sticky stage, ONE master scroll progress, the same
// AI as the home film. Cuts, like the home:
//
//   desktop (≥1024px)  3D acts with the caption on the left; OS acts with the
//                      caption on top and the AFVAR OS below (the avatar lives
//                      in its corner)
//   compact            phones and tablets: the same film without OS screens —
//                      cards in a bottom caption panel; the avatar speaks in 3D
//   stacked            reduced motion only: the same acts as plain sections
//
// The server renders the right track height for both cuts via CSS, so the page
// never jumps when the client decides which cut to play.
import { MotionConfig, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import { type ReactNode, type RefObject } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { MONO, Poster, StoryAct, StoryRail, ramp, useAvatarWarmup, useFilmMode, useFilmPresence, useSceneReady, useStep, useStory } from "@/modules/afvarOs";
import type { Quotes } from "@/modules/homeDemo/kit";
import { AreaList, AreasCopy, CompactHead, FreshnessCard, HeroCopy, OsCaption, OverviewUi, STOP_TEXT, StationCard, StopCard, TrustCopy, VerifyCopy, WAYS_TEXT, WORK_TEXT, WaysCard, WorkspaceList } from "./OverviewCopy";
import { OverviewOs, OverviewScreen, osIn } from "./OverviewOs";
import { OVERVIEW_COMPACT, OVERVIEW_DESKTOP, type OverviewFilm as Film } from "./overviewFilm";

const PlatformScene = dynamic(() => import("./PlatformScene"), { ssr: false });

const TRACK_CSS = `#afvar-platform{height:${OVERVIEW_COMPACT.story.totalVh}vh}@media (min-width:1024px){#afvar-platform{height:${OVERVIEW_DESKTOP.story.totalVh}vh}}#afvar-platform[data-mode="stacked"]{height:auto}`;

export function OverviewFilm() {
  const { mode, wide, portrait, lite, reduced } = useFilmMode();
  const film = wide === false ? OVERVIEW_COMPACT : OVERVIEW_DESKTOP;
  const { trackRef, progressRef, progress, active, mounted, webgl, revealRef } = useStory({ settledP: film.settledP, minWidth: 0 });
  const { quotes } = useLiveMarket();
  const sceneReady = useSceneReady();

  // The avatar speaks in the stop act: built in idle time, guaranteed before the act.
  const canAvatar = webgl === true && !reduced && sceneReady;
  useAvatarWarmup(canAvatar, progress, film.at("ways", 0.4));
  const inStop = useStep(progress, [film.at("stop", 0), film.at("stop", 1)]) === 0;
  const avatarInOs = mode === "desktop" && webgl === true && inStop;

  // While an OS screen covers the stage, the 3D scene rests.
  const D = OVERVIEW_DESKTOP;
  const cover = useStep(progress, [D.at("ways", 0.07), D.at("stop", 0.94), D.at("workspace", 0.07), D.at("workspace", 0.94)]);
  const covered = mode === "desktop" && (cover === 0 || cover === 2);

  // Floating extras step aside: the launcher hides while the film's avatar is on screen (phones: the whole film).
  useFilmPresence(active, mode, mode === "compact" ? active : inStop && mode === "desktop");

  const scene = (still: boolean, run: boolean) =>
    webgl !== false && mounted && sceneReady ? (
      <PlatformScene film={film} progress={progressRef} active={run} still={still} portrait={portrait} lite={lite} avatarHere={mode === "compact"} quotes={quotes} />
    ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <OverviewUi.Provider value={film}>
        <style>{TRACK_CSS}</style>
        <section
          ref={trackRef}
          id="afvar-platform"
          data-mode={mode}
          data-acts={mode === "boot" ? undefined : JSON.stringify(film.story.range)}
          aria-label="AFVAR Platform — one AI operating system, one connected workspace"
          className="relative bg-[#050607] text-[#F5F7F7]"
        >
          {mode === "stacked" ? (
            <Stacked revealRef={revealRef} scene={scene(true, active)} quotes={quotes} film={film} />
          ) : (
            <div className="sticky top-0 h-svh overflow-hidden">
              <div className="absolute inset-0">
                <Poster left="64%" />
                {mode !== "boot" ? <div className="absolute inset-0">{scene(false, active && !covered)}</div> : null}
              </div>
              {mode === "boot" ? (
                <BootStage />
              ) : mode === "desktop" ? (
                <DesktopStage mv={progress} trackRef={trackRef} quotes={quotes} film={film} avatarInOs={avatarInOs} />
              ) : (
                <CompactStage mv={progress} trackRef={trackRef} quotes={quotes} film={film} portrait={portrait} />
              )}
            </div>
          )}
        </section>
      </OverviewUi.Provider>
    </MotionConfig>
  );
}

/* ============================================================== boot (SSR) */

function BootStage() {
  return (
    <div className="absolute inset-x-5 bottom-6 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%]">
      <div className="lg:hidden">
        <HeroCopy compact />
      </div>
      <div className="hidden lg:block">
        <HeroCopy />
      </div>
    </div>
  );
}

/* ============================================================ desktop stage */

const LEFT = "absolute left-10 top-[calc(50%+44px)] -translate-y-1/2 xl:left-16";
const BOTTOM_RIGHT = "absolute bottom-10 right-[7.5rem]";

function DesktopStage({ mv, trackRef, quotes, film, avatarInOs }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; avatarInOs: boolean }) {
  const C = film.story.copy;
  const scrim = useTransform(mv, (p) => 0.8 * (1 - osIn(p)));
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-[#050607] from-25% via-[rgba(5,6,7,0.7)] via-60% to-transparent" style={{ opacity: scrim }} />

      <StoryAct mv={mv} at={C.hero} name="hero" className={`${LEFT} w-[min(36rem,44vw)]`}>
        <HeroCopy />
      </StoryAct>

      <OverviewOs mv={mv} quotes={quotes} avatarHere={avatarInOs} />

      <StoryAct mv={mv} at={C.verify} name="verify" className={`${LEFT} w-[min(31rem,38vw)]`}>
        <VerifyCopy />
        <div className="mt-6 max-w-[24rem] [@media(max-height:820px)]:mt-4">
          <StationCard mv={mv} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} name="trust" className={`${LEFT} w-[min(36rem,42vw)]`}>
        <TrustCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} name="trust" className={`${BOTTOM_RIGHT} w-[22rem] [@media(max-height:820px)]:w-[19rem]`}>
        <FreshnessCard mv={mv} closes={quotes.XAUUSD?.closes} />
      </StoryAct>
      <StoryAct mv={mv} at={C.areas} name="areas" className={`${LEFT} w-[min(34rem,40vw)]`}>
        <AreasCopy />
        <div className="mt-6 [@media(max-height:820px)]:mt-4">
          <AreaList mv={mv} />
        </div>
      </StoryAct>

      <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * (1 - osIn(p))} />
      <Illustrative mv={mv} film={film} />
      <ScrollHint mv={mv} />
    </div>
  );
}

/* ============================================================ compact stage */

function CompactStage({ mv, trackRef, quotes, film, portrait }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; portrait: boolean }) {
  const C = film.story.copy;
  const slot = portrait
    ? "absolute inset-x-0 bottom-0 px-5 pb-[calc(3.6rem+env(safe-area-inset-bottom))] sm:px-8"
    : "absolute left-6 top-[112px] w-[min(26rem,48vw)] origin-top-left [@media(max-height:520px)]:scale-[0.66]";
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        className={
          portrait
            ? "absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[#050607] from-45% via-[rgba(5,6,7,0.82)] via-70% to-transparent"
            : "absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[#050607] from-40% via-[rgba(5,6,7,0.75)] via-70% to-transparent"
        }
      />
      <StoryAct mv={mv} at={C.hero} name="hero" className={slot} rise={18}>
        <HeroCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.ways} name="ways" className={slot} rise={18}>
        <CompactHead {...WAYS_TEXT} />
        <div className="mt-3">
          <WaysCard mv={mv} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.stop} name="stop" className={slot} rise={18}>
        <CompactHead {...STOP_TEXT} />
        <div className="mt-3">
          <StopCard mv={mv} compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.verify} name="verify" className={slot} rise={18}>
        <VerifyCopy compact />
        <div className="mt-3">
          <StationCard mv={mv} compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.workspace} name="workspace" className={slot} rise={18}>
        <CompactHead {...WORK_TEXT} />
        <div className="mt-3">
          <WorkspaceList mv={mv} compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} name="trust" className={slot} rise={18}>
        <TrustCopy compact />
        <div className="mt-3">
          <FreshnessCard mv={mv} closes={quotes.XAUUSD?.closes} compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.areas} name="areas" className={slot} rise={18}>
        <AreasCopy compact />
        <div className="mt-3">
          <AreaList mv={mv} compact />
        </div>
      </StoryAct>

      <div className="[&_nav]:right-1.5 [&_nav_span:first-child]:hidden">
        <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * 0.8} />
      </div>
      <ScrollHint mv={mv} compact />
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

function Illustrative({ mv, film }: { mv: MotionValue<number>; film: Film }) {
  const o = useTransform(mv, (p) => ramp(p, film.at("hero", 0.3), film.at("hero", 0.7)) * (1 - osIn(p)));
  return (
    <motion.p className={`${MONO} absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[#5E6669]`} style={{ opacity: o }}>
      Illustrative 3D · not market data
    </motion.p>
  );
}

function ScrollHint({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const o = useTransform(mv, (p) => 1 - ramp(p, 0.002, 0.012));
  return (
    // Phones (portrait): between the scene and the caption panel. On desktop the five app
    // tiles circle the core near the bottom edge, so the page goes without a hint there.
    <motion.div className={`absolute left-1/2 top-[49%] flex -translate-x-1/2 flex-col items-center gap-2 [@media(orientation:landscape)]:hidden ${compact ? "" : "hidden"}`} style={{ opacity: o }}>
      <p className={`${MONO} text-[#8A9295]`}>Scroll through the OS</p>
      <div className="h-8 w-px bg-gradient-to-b from-[#E9B44C] to-transparent" />
    </motion.div>
  );
}

/* ================================================== stacked (reduced motion) */

function Snapshot({ p, quotes }: { p: number; quotes: Quotes }) {
  const mv = useMotionValue(p);
  return (
    <div className="aspect-[1200/660] w-full">
      <OverviewScreen mv={mv} quotes={quotes} className="h-full w-full" />
    </div>
  );
}

function Stacked({ revealRef, scene, quotes, film }: { revealRef: RefObject<HTMLDivElement | null>; scene: ReactNode; quotes: Quotes; film: Film }) {
  const block = "border-t border-[rgba(255,255,255,0.06)] px-5 py-16 sm:px-8 lg:px-16";
  const at = (id: Parameters<Film["at"]>[0], f: number) => film.at(id, f);
  const verifyDone = useMotionValue(at("verify", 0.75));
  const stopDone = useMotionValue(at("stop", 0.8));
  const waysDone = useMotionValue(at("ways", 0.9));
  const workDone = useMotionValue(at("workspace", 0.6));
  const trustNow = useMotionValue(at("trust", 0.2));
  const areasNone = useMotionValue(at("areas", 0.05));
  const D = OVERVIEW_DESKTOP;
  return (
    <div>
      <div className="px-5 pb-12 pt-36 sm:px-8 lg:px-16">
        <div className="max-w-2xl">
          <HeroCopy />
        </div>
        <div ref={revealRef} className="relative mt-10 h-[52svh] min-h-[320px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <Poster />
          {scene ? <div className="absolute inset-0">{scene}</div> : null}
          <p className={`${MONO} absolute bottom-3 right-4 text-[10px] text-[#5E6669]`}>Illustrative · not market data</p>
        </div>
      </div>
      <div className={block}>
        <OsCaption {...WAYS_TEXT} />
        <div className="mt-8 max-w-5xl max-lg:hidden">
          <Snapshot p={D.at("ways", 0.9)} quotes={quotes} />
        </div>
        <div className="mt-6 max-w-md lg:hidden">
          <WaysCard mv={waysDone} />
        </div>
      </div>
      <div className={block}>
        <OsCaption {...STOP_TEXT} />
        <div className="mt-8 max-w-md">
          <StopCard mv={stopDone} />
        </div>
      </div>
      <div className={block}>
        <VerifyCopy />
        <div className="mt-8 max-w-sm">
          <StationCard mv={verifyDone} />
        </div>
      </div>
      <div className={block}>
        <OsCaption {...WORK_TEXT} />
        <div className="mt-8 max-w-5xl max-lg:hidden">
          <Snapshot p={D.at("workspace", 0.6)} quotes={quotes} />
        </div>
        <div className="mt-6 max-w-md lg:hidden">
          <WorkspaceList mv={workDone} />
        </div>
      </div>
      <div className={block}>
        <TrustCopy />
        <div className="mt-8 max-w-sm">
          <FreshnessCard mv={trustNow} closes={quotes.XAUUSD?.closes} />
        </div>
      </div>
      <div className={block}>
        <AreasCopy />
        <div className="mt-8 max-w-xl">
          <AreaList mv={areasNone} />
        </div>
      </div>
    </div>
  );
}

