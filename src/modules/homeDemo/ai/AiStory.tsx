"use client";

// The AFVAR home film: ONE sticky stage, ONE master scroll progress, ONE AI.
//
//   desktop   full film with its windowed desktop and avatar
//   compact   portrait/landscape framing with a readable caption panel; the
//             root homepage also presents the OS as a handheld workspace
//   stacked   in-flow sections for reduced motion and cramped root home screens
//
// The server renders the right track height for both cuts via CSS, so the page
// never jumps when the client decides which cut to play.
import { MotionConfig, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import { Component, useEffect, useLayoutEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode, type RefObject } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { MONO, StoryAct, StoryRail, getAvatarRig, ramp, scheduleAvatarBuild, useAfvarReducedMotion, useStep, useStory, window4, type Window4 } from "@/modules/afvarOs";
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
import { COMPACT_FILM, DESKTOP_FILM, HOME_MOBILE_FILM, PANEL_CAMERA, centredPortraitStage, coreOpeningScale, filmCamera, type ActId, type Film } from "./aiConfig";

import { CorePoster } from "./CorePoster";
import { MobileStory } from "./MobileStory";

const AiCoreScene = dynamic(() => import("./AiCoreScene"), { ssr: false });

// The shader is progressive enhancement. Keep its correctly framed poster if
// the optional renderer chunk or GPU fails, without replacing the whole page.
class CoreSceneBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() { return this.state.failed ? null : this.props.children; }
}

import "./responsive-story.css";

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

const homeDesktop = "(min-width:1100px) and (min-height:650px)";
// The film (WebGL core + scroll animation) runs on every screen 640 px wide and
// up — touch tablets and landscape phones included. Narrower phones never fetch
// or run the WebGL film: the poster plays a CSS-only stand-in.
const filmScreen = "(min-width:640px)";
// Below 640 px, cramped screens read the story as stacked sections instead.
const crampedScreen = "(max-width:639px) and (max-height:600px), (max-width:540px) and (max-height:720px), (max-width:360px) and (max-height:800px)";
const HOME_TRACK_CSS = `.afvar-responsive-home #afvar-ai{height:${HOME_MOBILE_FILM.story.totalVh}svh}
@media ${homeDesktop}{.afvar-responsive-home #afvar-ai{height:${DESKTOP_FILM.story.totalVh}vh}}
@media ${crampedScreen}{.afvar-responsive-home #afvar-ai{height:auto}}
.afvar-responsive-home #afvar-ai[data-mode="stacked"]{height:auto}`;

export function AiStory({ responsiveHome = false }: { responsiveHome?: boolean } = {}) {
  const reduced = useAfvarReducedMotion();
  const wide = useMedia(responsiveHome ? homeDesktop : "(min-width: 1024px)");
  const cramped = useMedia(crampedScreen);
  const portraitMq = useMedia("(orientation: portrait)");
  const coarse = useMedia("(pointer: coarse)");
  const filmMq = useMedia(filmScreen);
  // Root homepage on phones (< 640 px): a dedicated canvas-free layout.
  const phoneMq = useMedia("(max-width:639px)");
  const film = wide === false ? (responsiveHome ? HOME_MOBILE_FILM : COMPACT_FILM) : DESKTOP_FILM;
  const { trackRef, progressRef, progress, active, mounted, webgl, revealRef } = useStory({ settledP: film.settledP, minWidth: 0 });
  const { quotes } = useLiveMarket();
  const priceTexts = useMemo(() => LANE_KEYS.map(([k, sym]) => quoteLine(quotes[k], sym)), [quotes]);

  const mode: "boot" | "desktop" | "compact" | "stacked" | "mobile" = wide === null ? "boot" : responsiveHome && phoneMq === true ? "mobile" : reduced || (responsiveHome && cramped) ? "stacked" : wide ? "desktop" : "compact";
  const portrait = mode === "compact" && portraitMq === true;
  const lite = mode === "compact" || coarse === true;
  // Undecided (boot) counts as no-GL: nothing heavy starts before the device is known.
  const noGl = responsiveHome && filmMq !== true;
  const actStarts = useMemo(() => noGl ? film.story.order.map(id => film.at(id, 0)) : [], [noGl, film]);
  const actStep = useStep(progress, actStarts);
  const coreAct = noGl ? film.story.order[Math.max(0, actStep)] : undefined;

  // The 3D stage starts after first paint and the site's intro splash, in idle time —
  // the headline and poster paint first, the WebGL work never competes with them.
  const sceneReady = useSceneReady();
  // The 292k-triangle avatar (≈0.1 s on a fast laptop, ≈0.5 s on a mid phone) is built once,
  // in idle time shortly after the 3D stage starts — while the hero is still on screen.
  const canAvatar = webgl === true && !noGl && (responsiveHome ? mode !== "stacked" && mode !== "boot" : !reduced) && sceneReady;
  useEffect(() => {
    if (!canAvatar) return;
    let cancel = () => {};
    const id = window.setTimeout(() => (cancel = scheduleAvatarBuild(1500)), 2000);
    return () => {
      window.clearTimeout(id);
      cancel();
    };
  }, [canAvatar]);
  // Guarantee: if it is still not built when the film reaches the act before "Meet AFVAR", build now.
  const nearAvatar = useStep(progress, [film.at("always", 0)]) >= 0;
  useEffect(() => {
    if (canAvatar && nearAvatar) getAvatarRig();
  }, [canAvatar, nearAvatar]);

  // The OS owns the avatar (its own overlay) while it is on screen; the 3D stage rests behind it.
  const hasOs = film.has("os");
  const workspaceWindow = hasOs ? win(film, "os", mode === "compact" ? [0, .055, .95, 1] : [.03, .065, .955, .99]) : null;
  const coreOpacity = useTransform(progress, p => workspaceWindow ? 1 - window4(p, workspaceWindow) : 1);
  const osStep = useStep(progress, hasOs ? [film.at("os", 0.07), film.at("os", 0.95)] : [2, 3]);
  const overlayStep = useStep(progress, hasOs ? [film.at("os", 0.07), film.at("os", 0.975)] : [2, 3]);
  const osCovered = (mode === "desktop" || (responsiveHome && mode === "compact")) && osStep === 0;
  const avatarInOs = mode === "desktop" && overlayStep === 0 && webgl === true && !noGl;

  // The site's floating avatar launcher steps aside while the film's avatar is on screen.
  const avatarActStep = useStep(progress, [film.at("avatar", 0), hasOs ? film.at("os", 1) : film.at("avatar", 1)]);
  useEffect(() => {
    // On phones the launcher would sit on the captions: it waits until the film is over.
    const hide = mode === "compact" ? active : mode === "desktop" && avatarActStep === 0;
    window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: hide ? "hide" : "show" } }));
  }, [avatarActStep, mode, active]);
  useEffect(() => () => void window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { launcher: "show" } })), []);
  useEffect(() => {
    setFilmOnScreen(active && mode !== "stacked" && mode !== "boot" && mode !== "mobile");
    return () => setFilmOnScreen(false);
  }, [active, mode]);

  const openingScale = responsiveHome ? (mode === "desktop" ? 1.41 : 1.12) : 1;
  // Portrait home: the full-height canvas (and its poster) is centred on the art
  // row, matching the centred camera path, so the contain-fit zooms about the
  // middle of the visible art. Overrides the row's "a third down" offset.
  const stageHost = centredPortraitStage(film, portrait) ? { top: "calc(50% - 50svh)" } : undefined;
  const poster = (still: boolean) => {
    const compactPanel = responsiveHome && still && !wide;
    const p = still ? film.settledP : 0;
    return <CorePoster ready={mode !== "boot"} keys={compactPanel ? PANEL_CAMERA : filmCamera(film, portrait)}
      progress={p} scale={coreOpeningScale(film, p, openingScale)} fov={portrait ? 50 : 38}
      belowHeader={responsiveHome && mode === "desktop"} compact={portrait || compactPanel}
      lite={noGl && mode !== "boot"} act={still ? undefined : coreAct} hostStyle={still ? undefined : stageHost} />;
  };
  const scene = (still: boolean, run: boolean) =>
    webgl !== false && !noGl && mounted && sceneReady ? (
      <CoreSceneBoundary><AiCoreScene openingScale={openingScale} belowHeader={responsiveHome && mode === "desktop"} compactBloom={responsiveHome} film={film} progress={progressRef} active={run} still={still} portrait={portrait} lite={lite || (responsiveHome && !wide)} compactPanel={responsiveHome && still && !wide} avatarHere={!avatarInOs && !(responsiveHome && still && !wide)} priceTexts={priceTexts} /></CoreSceneBoundary>
    ) : null;

  return (
    <MotionConfig reducedMotion="user">
      <FilmUi.Provider value={film}>
        <style>{responsiveHome ? HOME_TRACK_CSS : TRACK_CSS}</style>
        <section ref={trackRef} id="afvar-ai" data-mode={mode} data-acts={mode === "boot" ? undefined : JSON.stringify(film.story.range)} aria-label="AFVAR AI — the trading operating system that never stops thinking" className="relative text-[#F2F5F2]">
          {mode === "mobile" ? (
            <MobileStory film={film} quotes={quotes} revealRef={revealRef} />
          ) : mode === "stacked" ? (
            <Stacked revealRef={revealRef} poster={poster(true)} scene={scene(true, active)} quotes={quotes} film={film} compactHome={responsiveHome && !wide} />
          ) : (
            <div className="home-story-stage sticky top-0 h-svh overflow-hidden">
              <motion.div className="home-story-scene absolute inset-0" style={{ opacity: coreOpacity }}>
                {poster(false)}
                {mode !== "boot" ? <div className="home-core-live absolute inset-0" style={stageHost}>{scene(false, active && !osCovered)}</div> : null}
              </motion.div>
              {mode === "boot" ? <BootStage /> : mode === "desktop" ? <DesktopStage centeredHome={responsiveHome} mv={progress} trackRef={trackRef} quotes={quotes} film={film} avatarInOs={avatarInOs} /> : <CompactStage mv={progress} trackRef={trackRef} quotes={quotes} film={film} portrait={portrait} />}
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
    <div className="home-hero-boot absolute inset-x-5 bottom-6 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%]">
      <div className="lg:hidden">
        <HeroCopy compact twin />
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

function DesktopStage({ mv, trackRef, quotes, film, avatarInOs, centeredHome }: { centeredHome: boolean; mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; avatarInOs: boolean }) {
  const C = film.story.copy;
  const streamAt = useMemo(() => [film.at("stream", 0), film.at("stream", 1)] as const, [film]);
  const osIn = (p: number) => ramp(p, film.at("os", 0.0), film.at("os", 0.05)) * (1 - ramp(p, film.at("os", 0.95), film.at("os", 1)));

  return (
    <div className="home-story-content pointer-events-none absolute inset-0">

      <StoryAct mv={mv} at={C.hero} name="hero" className={`${LEFT} w-[min(36rem,44vw)]`}>
        <HeroCopy />
        {centeredHome && <ScrollHint mv={mv} />}
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
        <div className="mt-6 max-w-[22rem]">
          <SessionCard />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={avatarCopyWin(film)} name="avatar" className={`${LEFT} w-[min(33rem,40vw)]`}>
        <AvatarCopy mv={mv} />
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
      {!centeredHome && <ScrollHint mv={mv} />}
    </div>
  );
}

/* ============================================================ compact stage */

function CompactStage({ mv, trackRef, quotes, film, portrait }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes; film: Film; portrait: boolean }) {
  const chaptersRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const chapters = chaptersRef.current;
    const stage = chapters?.closest<HTMLElement>(".afvar-responsive-home .home-story-stage");
    if (!portrait || !chapters || !stage) return;
    const captions = Array.from(chapters.querySelectorAll<HTMLElement>(".home-story-caption"));
    const measure = () => {
      // Inert is applied in a passive effect. Measure the rendered opacity
      // before first paint so inactive captions cannot shift the initial art.
      const visible = captions.filter(caption => Number(caption.style.opacity) >= .05);
      if (visible.length) {
        const height = Math.max(...visible.map(caption => caption.offsetHeight));
        stage.style.setProperty("--home-copy-height", `${height}px`);
      }
    };
    measure();
    // Animate later chapter changes, never the boot layout's auto-sized row.
    // Let the measured first composition paint before enabling that transition.
    let motionFrame = requestAnimationFrame(() => {
      motionFrame = requestAnimationFrame(() => { stage.dataset.copyFramed = "true"; });
    });
    const contentSize = new ResizeObserver(measure);
    for (const caption of captions) contentSize.observe(caption);
    // StoryAct makes inactive captions inert. Measure again on chapter changes,
    // including both captions while they crossfade; keep the last size between acts.
    const activeChapter = new MutationObserver(measure);
    activeChapter.observe(chapters, { subtree:true, attributes:true, attributeFilter:["inert"] });
    return () => {
      contentSize.disconnect();
      activeChapter.disconnect();
      cancelAnimationFrame(motionFrame);
      delete stage.dataset.copyFramed;
      stage.style.removeProperty("--home-copy-height");
    };
  }, [portrait]);
  const C = film.story.copy;
  const streamAt = useMemo(() => [film.at("stream", 0), film.at("stream", 1)] as const, [film]);
  const osWin = film.has("os") ? win(film, "os", [0, .055, .95, 1]) : null;
  const beatThresholds = useMemo(() => film.has("os") ? OS_BEATS.slice(1).map((_, i) => film.at("os", (i + 1) / OS_BEATS.length)) : [], [film]);
  const osBeat = useStep(mv, beatThresholds) + 1;
  // The root homepage lays these captions into its shared artwork/copy composition.
  const slot = portrait
    ? "absolute inset-x-0 bottom-0 px-5 pb-[calc(3.6rem+env(safe-area-inset-bottom))] sm:px-8"
    : "absolute left-6 top-[112px] w-[min(26rem,48vw)] origin-top-left [@media(max-height:520px)]:scale-[0.66]";
  return (
    <div ref={chaptersRef} className="home-compact-chapters pointer-events-none absolute inset-0">

      <StoryAct mv={mv} at={C.hero} name="hero" className={`home-story-caption ${slot}`} rise={18}>
        <HeroCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.cores} name="cores" className={`home-story-caption ${slot}`} rise={18}>
        <CoresCopy compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.stream} name="stream" className={`home-story-caption ${slot}`} rise={18}>
        <StreamCopy compact />
        <div className="mt-3">
          <ReadingLog quotes={quotes} mv={mv} at={streamAt} rows={5} />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.think} name="think" className={`home-story-caption ${slot}`} rise={18}>
        <ThinkCard mv={mv} compact />
      </StoryAct>
      <StoryAct mv={mv} at={C.always} name="always" className={`home-story-caption ${slot}`} rise={18}>
        <AlwaysCopy compact />
        <div className="mt-3">
          <SessionCard compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={avatarCopyWin(film)} name="avatar" className={`home-story-caption ${slot}`} rise={18}>
        <AvatarCopy compact mv={mv} />
      </StoryAct>
      <StoryAct mv={mv} at={dialogueWin(film)} name="avatar" className={`home-story-caption ${slot}`} rise={18}>
        <Dialogue mv={mv} compact />
      </StoryAct>
      {osWin && <>
        <StoryAct mv={mv} at={osWin} name="os-preview" className="home-os-visual-layer" rise={0}><div className="home-os-visual"><WorkspaceIllustration beat={osBeat} /></div></StoryAct>
        <StoryAct mv={mv} at={osWin} name="os" className={`home-story-caption ${slot}`} rise={18}>
          <CompactOsBeat index={osBeat} />
        </StoryAct>
      </>}
      <StoryAct mv={mv} at={C.trust} name="trust" className={`home-story-caption ${slot}`} rise={18}>
        <TrustCopy compact />
        <div className="mt-3">
          <PermissionsCard compact />
        </div>
      </StoryAct>
      <StoryAct mv={mv} at={C.finale} name="finale" className={`home-story-caption ${slot}`} rise={18}>
        <FinaleCopy compact />
      </StoryAct>

      <div className="home-story-rail [&_nav]:right-1.5 [&_nav_span:first-child]:hidden">
        <StoryRail mv={mv} story={film.story} trackRef={trackRef} segmented={film.has("os")} visible={(p) => film.has("os") ? 1 : ramp(p, 0.01, 0.03) * 0.8} />
      </div>
      <ScrollHint mv={mv} compact />
    </div>
  );
}

/* The desktop keeps its window choreography. In the mobile chapter the same
   six beats use one legible workstation pane rather than a miniature desktop. */
function CompactOsBeat({ index }: { index: number }) {
  const beat = OS_BEATS[index];
  return (
    <div className="home-os-pane">
      <p className="home-os-kicker">AFVAR OS <span>Workspace preview</span></p>
      <p className="home-os-step">{String(index + 1).padStart(2, "0")} / 06 · {beat.id}</p>
      <h2>{beat.title}</h2>
      <p>{beat.body}</p>
      <div className="home-os-steps" aria-hidden="true">{OS_BEATS.map((item, i) => <i key={item.id} data-active={i === index} />)}</div>
    </div>
  );
}

function WorkspaceIllustration({ beat }: { beat:number }) {
  return <div className="home-os-workspace" aria-hidden="true">
    <div className="home-os-toolbar"><b>AFVAR OS</b><span>Workspace illustration</span></div>
    <div className="home-os-windows">
      <div className="home-os-chart">
        <span>Charts</span>
        <svg viewBox="0 0 230 80" preserveAspectRatio="none">
          <path d="M0 18h230M0 40h230M0 62h230" stroke="#2c3337" fill="none"/>
          <path d="M0 67l13 -11 14 5 12 -16 14 9 18 -23 12 8 11 -5 18 10 18 -16 11 2 22 -19 18 9 15 -8 24 -10" stroke="#A8DEC2" strokeWidth="2" fill="none"/>
        </svg>
      </div>
      {beat === 5 ? <div className="home-os-handset"><small>AFVAR · PHONE</small><strong>Risk Guardian</strong><span>80% of today’s loss limit.</span></div>
        : <div className="home-os-tools"><span data-on={beat === 1 || beat === 3}>Research</span><span data-on={beat === 2}>Alerts</span><span data-on={beat === 4}>Journal</span></div>}
    </div>
  </div>;
}

function CompactOsList() {
  return <><WorkspaceIllustration beat={5} /><ol className="home-os-list">{OS_BEATS.map((beat, i) => (
    <li key={beat.id}><span className="home-os-step">{String(i + 1).padStart(2, "0")} · {beat.id}</span>
      <h3>{beat.title}</h3><p>{beat.body}</p>
    </li>
  ))}</ol></>;
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
    <motion.div className={`home-story-hint absolute left-1/2 flex -translate-x-1/2 flex-col items-center gap-2 ${compact ? "top-[42%]" : "bottom-8"}`} style={{ opacity: o }}>
      <p className={`${MONO} text-[#8A9295]`}>Scroll to meet the AI</p>
      <div className="h-8 w-px bg-gradient-to-b from-[#A8DEC2] to-transparent" />
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

function Stacked({ revealRef, poster, scene, quotes, film, compactHome }: { poster: ReactNode; compactHome:boolean; revealRef: RefObject<HTMLDivElement | null>; scene: ReactNode; quotes: Quotes; film: Film }) {
  const block = "home-story-chapter border-t border-[rgba(255,255,255,0.06)] px-5 py-16 sm:px-8 lg:px-16";
  const thinkDone = useMotionValue(film.at("think", 0.9));
  const talkDone = useMotionValue(film.at("avatar", 0.97));
  return (
    <div>
      <div className="home-story-intro px-5 pb-12 pt-36 sm:px-8 lg:px-16">
        <div className="max-w-2xl">
          <HeroCopy compact={compactHome} />
        </div>
        <div ref={revealRef} className="home-story-intro-art relative mt-10 h-[52svh] min-h-[320px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]">
          {poster}
          {scene ? <div className="home-core-live absolute inset-0">{scene}</div> : null}
          <p className={`home-story-art-label ${MONO} absolute bottom-3 right-4 text-[10px] text-[#5E6669]`}>Illustrative · not market data</p>
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
          <p className={`${MONO} text-[#A8DEC2]`}>The OS</p>
          {compactHome ? <CompactOsList /> : [
            { beat: OS_BEATS[2], u: 0.33 },
            { beat: OS_BEATS[3], u: 0.555 },
            { beat: OS_BEATS[5], u: 0.93 },
          ].map(({ beat, u }) => (
            <div key={beat.id} className="mt-8 max-w-5xl">
              <h3 className="text-2xl font-semibold tracking-tight">{beat.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-[#B7C5BC]">{beat.body}</p>
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
