"use client";

// The AFVAR home film: ONE sticky stage, ONE master scroll progress, ONE AI.
//
//   desktop (≥1024px)  the full cut, with the AFVAR OS and the avatar living in it
//   compact            phones and tablets: the same continuous film without the OS —
//                      the avatar is the experience; portrait-framed camera and a
//                      caption panel at the bottom (landscape: caption on the left)
//   stacked            only for reduced motion: the same acts as plain sections
//
// The server renders the right track height for both cuts via CSS, so the page
// never jumps when the client decides which cut to play.
import { MotionConfig, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { MONO, StoryAct, StoryRail, ramp, scheduleAvatarBuild, useAfvarReducedMotion, useStep, useStory, type Window4 } from "@/modules/afvarOs";
import {
  AlwaysCopy,
  AvatarCopy,
  CoresCopy,
  Dialogue,
  FilmUi,
  FinaleCopy,
  HeroCopy,
  LANE_KEYS,
  PermissionsCard,
  ReadingLog,
  SessionCard,
  StreamCopy,
  ThinkCard,
  ThinkCopy,
  TrustCopy,
  quoteLine,
  type Quotes,
} from "./cards";
import { OS_BEATS, OsDesktop, OsFilm } from "./OsFilm";
import { setFilmOnScreen } from "../filmPresence";
import { COMPACT_FILM, DESKTOP_FILM, type ActId, type Film } from "./aiConfig";

const AiCoreScene = dynamic(() => import("./AiCoreScene"), { ssr: false });

/* ------------------------------------------------------------ media hooks */

/** True once the site's intro splash is gone (or 6 s passed) and the browser is idle. */
function useSceneReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    let idle = 0;
    const started = performance.now();
    const go = () => setReady(true);
    const poll = window.setInterval(() => {
      if (document.querySelector("[data-afvar-splash]") && performance.now() - started < 6000) return;
      window.clearInterval(poll);
      idle = w.requestIdleCallback ? w.requestIdleCallback(go, { timeout: 1200 }) : window.setTimeout(go, 200);
    }, 200);
    return () => {
      window.clearInterval(poll);
      if (w.cancelIdleCallback) w.cancelIdleCallback(idle);
      else window.clearTimeout(idle);
    };
  }, []);
  return ready;
}

function useMedia(query: string): boolean | null {
  return useSyncExternalStore(
    (cb) => {
      const mq = window.matchMedia(query);
      mq.addEventListener("change", cb);
      return () => mq.removeEventListener("change", cb);
    },
    () => window.matchMedia(query).matches,
    () => null,
  );
}

const TRACK_CSS = `#afvar-ai{height:${COMPACT_FILM.story.totalVh}vh}@media (min-width:1024px){#afvar-ai{height:${DESKTOP_FILM.story.totalVh}vh}}#afvar-ai[data-mode="stacked"]{height:auto}`;

/** Split the avatar act: words first, then the conversation. */
const avatarCopyWin = (film: Film): Window4 => win(film, "avatar", [0.03, 0.1, 0.4, 0.46]);
const dialogueWin = (film: Film): Window4 => win(film, "avatar", [0.46, 0.5, 0.95, 0.99]);
function win(film: Film, id: ActId, w: Window4): Window4 {
  return [film.at(id, w[0]), film.at(id, w[1]), film.at(id, w[2]), film.at(id, w[3])];
}

/* ===================================================================== story */

export function AiStory() {
  const reduced = useAfvarReducedMotion();
  const wide = useMedia("(min-width: 1024px)");
  const portraitMq = useMedia("(orientation: portrait)");
  const coarse = useMedia("(pointer: coarse)");
  const film = wide === false ? COMPACT_FILM : DESKTOP_FILM;
  const { trackRef, progressRef, progress, active, mounted, webgl, revealRef } = useStory({ settledP: film.settledP, minWidth: 0 });
  const { quotes } = useLiveMarket();
  const priceTexts = useMemo(() => LANE_KEYS.map(([k, sym]) => quoteLine(quotes[k], sym)), [quotes]);

  const mode: "boot" | "desktop" | "compact" | "stacked" = wide === null ? "boot" : reduced ? "stacked" : wide ? "desktop" : "compact";
  const portrait = mode === "compact" && portraitMq === true;
  const lite = mode === "compact" || coarse === true;

  // The 3D stage starts after first paint and the site's intro splash, in idle time —
  // the headline and poster paint first, the WebGL work never competes with them.
  const sceneReady = useSceneReady();
  // The 292k-triangle avatar is built once the visitor starts scrolling (never during page
  // load), in idle time — many screens before the avatar act needs it.
  const scrolled = useStep(progress, [0.004]) >= 0;
  useEffect(() => (webgl && !reduced && sceneReady && scrolled ? scheduleAvatarBuild(1500) : undefined), [webgl, reduced, sceneReady, scrolled]);

  // The OS owns the avatar (its own overlay) while it is on screen; the 3D stage rests behind it.
  const hasOs = film.has("os");
  const osStep = useStep(progress, hasOs ? [film.at("os", 0.07), film.at("os", 0.95)] : [2, 3]);
  const overlayStep = useStep(progress, hasOs ? [film.at("os", 0.07), film.at("os", 0.975)] : [2, 3]);
  const osCovered = mode === "desktop" && osStep === 0;
  const avatarInOs = mode === "desktop" && overlayStep === 0 && webgl === true;

  // The site's floating avatar launcher steps aside while the film's avatar is on screen.
  const avatarActStep = useStep(progress, [film.at("avatar", 0), hasOs ? film.at("os", 1) : film.at("avatar", 1)]);
  useEffect(() => {
    // On phones the launcher would sit on the captions: it waits until the film is over.
    const hide = mode === "compact" ? active : mode === "desktop" && avatarActStep === 0;
    window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: hide ? "hide" : "show" } }));
  }, [avatarActStep, mode, active]);
  useEffect(() => () => void window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: "show" } })), []);
  useEffect(() => {
    setFilmOnScreen(active && mode !== "stacked" && mode !== "boot");
    return () => setFilmOnScreen(false);
  }, [active, mode]);

  const scene = (still: boolean, run: boolean) =>
    webgl !== false && mounted && sceneReady ? (
      <AiCoreScene film={film} progress={progressRef} active={run} still={still} portrait={portrait} lite={lite} avatarHere={!avatarInOs} priceTexts={priceTexts} />
    ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <FilmUi.Provider value={film}>
        <style>{TRACK_CSS}</style>
        <section ref={trackRef} id="afvar-ai" data-mode={mode} data-acts={mode === "boot" ? undefined : JSON.stringify(film.story.range)} aria-label="AFVAR AI — the trading operating system that never stops thinking" className="relative bg-[#050607] text-[#F5F7F7]">
          {mode === "stacked" ? (
            <Stacked revealRef={revealRef} scene={scene(true, active)} quotes={quotes} film={film} />
          ) : (
            <div className="sticky top-0 h-svh overflow-hidden">
              <div className="absolute inset-0">
                <Poster />
                {mode !== "boot" ? <div className="absolute inset-0">{scene(false, active && !osCovered)}</div> : null}
              </div>
              {mode === "boot" ? <BootStage /> : mode === "desktop" ? <DesktopStage mv={progress} trackRef={trackRef} quotes={quotes} film={film} avatarInOs={avatarInOs} /> : <CompactStage mv={progress} trackRef={trackRef} quotes={quotes} film={film} portrait={portrait} />}
            </div>
          )}
        </section>
      </FilmUi.Provider>
    </MotionConfig>
  );
}

/* ============================================================== boot (SSR) */

/** First paint before the client picks a cut: the hero, positioned for both. */
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

const LEFT = "absolute left-10 top-1/2 -translate-y-1/2 xl:left-16";
const BOTTOM_RIGHT = "absolute bottom-10 right-[7.5rem]";

function DesktopStage({ mv, trackRef, quotes, film, avatarInOs }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; avatarInOs: boolean }) {
  const C = film.story.copy;
  const streamAt = useMemo(() => [film.at("stream", 0), film.at("stream", 1)] as const, [film]);
  const osIn = (p: number) => ramp(p, film.at("os", 0.0), film.at("os", 0.05)) * (1 - ramp(p, film.at("os", 0.95), film.at("os", 1)));
  const scrim = useTransform(mv, (p) => 0.8 * (1 - osIn(p)));

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-[#050607] from-25% via-[rgba(5,6,7,0.7)] via-60% to-transparent" style={{ opacity: scrim }} />

      <StoryAct mv={mv} at={C.hero} name="hero" className={`${LEFT} w-[min(36rem,44vw)]`}>
        <HeroCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.cores} name="cores" className={`${LEFT} w-[min(34rem,42vw)]`}>
        <CoresCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.stream} name="stream" className="absolute left-10 top-[128px] w-[min(31rem,38vw)] xl:left-16">
        <StreamCopy />
        <div className="mt-6">
          <ReadingLog quotes={quotes} mv={mv} at={streamAt} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.think} name="think" className="absolute left-10 top-[118px] w-[min(31rem,38vw)] xl:left-16">
        <ThinkCopy />
        <div className="mt-5">
          <ThinkCard mv={mv} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.always} name="always" className={`${LEFT} w-[min(32rem,40vw)]`}>
        <AlwaysCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.always} name="always" className={`${BOTTOM_RIGHT} w-[22rem]`}>
        <SessionCard />
      </StoryAct>
      <StoryAct mv={mv} at={avatarCopyWin(film)} name="avatar" className={`${LEFT} w-[min(33rem,40vw)]`}>
        <AvatarCopy />
      </StoryAct>
      <StoryAct mv={mv} at={dialogueWin(film)} name="avatar" className={`${LEFT} w-[min(31rem,38vw)]`}>
        <Dialogue mv={mv} />
      </StoryAct>

      <OsFilm mv={mv} quotes={quotes} avatarHere={avatarInOs} />

      <StoryAct mv={mv} at={C.trust} name="trust" className={`${LEFT} w-[min(32rem,38vw)]`}>
        <TrustCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} name="trust" className={`${BOTTOM_RIGHT} w-[22rem]`}>
        <PermissionsCard />
      </StoryAct>
      <StoryAct mv={mv} at={C.finale} name="finale" className={`${LEFT} w-[min(34rem,42vw)]`}>
        <FinaleCopy />
      </StoryAct>

      <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * (1 - osIn(p))} />
      <Illustrative mv={mv} film={film} hide={osIn} />
      <ScrollHint mv={mv} />
    </div>
  );
}

/* ============================================================ compact stage */

function CompactStage({ mv, trackRef, quotes, film, portrait }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; portrait: boolean }) {
  const C = film.story.copy;
  const streamAt = useMemo(() => [film.at("stream", 0), film.at("stream", 1)] as const, [film]);
  // Portrait: caption panel at the bottom; landscape: caption column on the left.
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
      <StoryAct mv={mv} at={C.cores} name="cores" className={slot} rise={18}>
        <CoresCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.stream} name="stream" className={slot} rise={18}>
        <StreamCopy compact />
        <div className="mt-3">
          <ReadingLog quotes={quotes} mv={mv} at={streamAt} rows={5} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.think} name="think" className={slot} rise={18}>
        <ThinkCard mv={mv} compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.always} name="always" className={slot} rise={18}>
        <AlwaysCopy compact />
        <div className="mt-3">
          <SessionCard compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={avatarCopyWin(film)} name="avatar" className={slot} rise={18}>
        <AvatarCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={dialogueWin(film)} name="avatar" className={slot} rise={18}>
        <Dialogue mv={mv} compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} name="trust" className={slot} rise={18}>
        <TrustCopy compact />
        <div className="mt-3">
          <PermissionsCard compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.finale} name="finale" className={slot} rise={18}>
        <FinaleCopy compact />
      </StoryAct>

      <div className="[&_nav]:right-1.5 [&_nav_span:first-child]:hidden">
        <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * 0.8} />
      </div>
      <ScrollHint mv={mv} compact />
    </div>
  );
}

/* ---------------------------------------------------------------- shared */

function Illustrative({ mv, film, hide }: { mv: MotionValue<number>; film: Film; hide: (p: number) => number }) {
  const o = useTransform(mv, (p) => ramp(p, film.at("cores", 0), film.at("cores", 0.2)) * (1 - ramp(p, film.at("finale", 0.3), film.at("finale", 0.6))) * (1 - hide(p)));
  return (
    <motion.p className={`${MONO} absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[#5E6669]`} style={{ opacity: o }}>
      Illustrative 3D · not market data
    </motion.p>
  );
}

function ScrollHint({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const o = useTransform(mv, (p) => 1 - ramp(p, 0.002, 0.012));
  return (
    <motion.div className={`absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 ${compact ? "top-[42%]" : "bottom-8"}`} style={{ opacity: o }}>
      <p className={`${MONO} text-[#6D7578]`}>Scroll to meet the AI</p>
      <div className="h-8 w-px bg-gradient-to-b from-[#E9B44C] to-transparent" />
    </motion.div>
  );
}

/* ================================================== stacked (reduced motion) */

function OsSnapshot({ u, quotes }: { u: number; quotes: Quotes }) {
  const mv = useMotionValue(DESKTOP_FILM.at("os", u));
  return (
    <div className="aspect-[1200/660] w-full">
      <OsDesktop mv={mv} quotes={quotes} className="h-full w-full" />
    </div>
  );
}

function Stacked({ revealRef, scene, quotes, film }: { revealRef: RefObject<HTMLDivElement | null>; scene: ReactNode; quotes: Quotes; film: Film }) {
  const block = "border-t border-[rgba(255,255,255,0.06)] px-5 py-16 sm:px-8 lg:px-16";
  const thinkDone = useMotionValue(film.at("think", 0.9));
  const talkDone = useMotionValue(film.at("avatar", 0.97));
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
        <CoresCopy />
      </div>
      <div className={block}>
        <StreamCopy />
        <div className="mt-8 max-w-lg">
          <ReadingLog quotes={quotes} />
        </div>
      </div>
      <div className={block}>
        <ThinkCopy />
        <div className="mt-8 max-w-lg">
          <ThinkCard mv={thinkDone} />
        </div>
      </div>
      <div className={block}>
        <AlwaysCopy />
        <div className="mt-8 max-w-sm">
          <SessionCard />
        </div>
      </div>
      <div className={block}>
        <AvatarCopy />
        <div className="mt-8 max-w-lg">
          <Dialogue mv={talkDone} />
        </div>
      </div>
      {film.has("os") ? (
        <div className={block}>
          <p className={`${MONO} text-[#E9B44C]`}>The OS</p>
          {[
            { beat: OS_BEATS[2], u: 0.33 },
            { beat: OS_BEATS[3], u: 0.555 },
            { beat: OS_BEATS[5], u: 0.93 },
          ].map(({ beat, u }) => (
            <div key={beat.id} className="mt-8 max-w-5xl">
              <h3 className="text-2xl font-semibold tracking-tight">{beat.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#A3AAAC]">{beat.body}</p>
              <div className="mt-5">
                <OsSnapshot u={u} quotes={quotes} />
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <div className={block}>
        <TrustCopy />
        <div className="mt-8 max-w-sm">
          <PermissionsCard />
        </div>
      </div>
      <div className={block}>
        <FinaleCopy />
      </div>
    </div>
  );
}

/** CSS stand-in for the core while WebGL loads, or when it is unavailable. */
function Poster() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#050607]">
      <div className="absolute left-1/2 top-[30%] h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,180,76,0.28),transparent_68%)] lg:left-[62%] lg:top-1/2" />
      <div className="absolute left-1/2 top-[30%] h-[13vmin] w-[13vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_35%,#FFD98A,#E9B44C_40%,#7A4E10_85%)] shadow-[0_0_80px_20px_rgba(233,180,76,0.35)] lg:left-[62%] lg:top-1/2" />
    </div>
  );
}
