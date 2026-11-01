"use client";

// The stage every capability film plays on — the same rules as the home and
// the /platform overview: ONE sticky stage, ONE master scroll progress, the
// gold AI core behind everything. Cuts:
//
//   desktop (≥1024px)  3D acts with the caption on the left; OS acts with the
//                      caption on top and the AFVAR OS below
//   compact            phones and tablets: the same film without OS screens —
//                      cards in a bottom caption panel; the avatar speaks in 3D
//   stacked            reduced motion only: the same acts as plain sections
//
// The server renders the right track height for both cuts via CSS, so the page
// never jumps when the client decides which cut to play.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import { type ComponentType, type ReactNode, type RefObject } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { MONO, Poster, StoryRail, ramp, useAvatarWarmup, useFilmMode, useFilmPresence, useSceneReady, useStep, useStory } from "@/modules/afvarOs";
import type { Quotes } from "@/modules/homeDemo/kit";
import type { CapFilm } from "./factory";
import { CapOrder } from "./ui";

export interface CapSceneProps<A extends string> {
  film: CapFilm<A>;
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  portrait: boolean;
  lite: boolean;
  /** Compact cut: the avatar speaks in the 3D scene. */
  avatarHere: boolean;
  quotes: Quotes;
}

export interface CapStageProps<A extends string> {
  mv: MotionValue<number>;
  film: CapFilm<A>;
  quotes: Quotes;
  /** Desktop: the avatar stands in the OS corner right now. */
  avatarInOs: boolean;
  portrait: boolean;
}

export interface CapFilmDef<A extends string> {
  /** Section id, e.g. "afvar-market-data" (tests and QA scripts use it). */
  id: string;
  label: string;
  desktop: CapFilm<A>;
  compact: CapFilm<A>;
  Scene: ComponentType<CapSceneProps<A>>;
  Hero: ComponentType<{ compact?: boolean }>;
  /** Desktop overlays: 3D-act captions and the OS layer. */
  Desktop: ComponentType<CapStageProps<A>>;
  /** Phones and tablets: captions and cards in the bottom panel. */
  Compact: ComponentType<CapStageProps<A>>;
  /** Reduced motion: every act as a plain section. */
  Stacked: ComponentType<{ quotes: Quotes; scene: ReactNode; revealRef: RefObject<HTMLDivElement | null> }>;
  /** The act in which the avatar speaks (desktop: in the OS corner; phones: in 3D). */
  avatarAct?: A;
  /** The avatar is built by this point (act, fraction). */
  avatarBy?: readonly [A, number];
  /** Where the CSS stand-in core sits before WebGL starts. */
  posterLeft?: string;
}

export function CapFilmShell<A extends string>({ def }: { def: CapFilmDef<A> }) {
  const { mode, wide, portrait, lite, reduced } = useFilmMode();
  const film = wide === false ? def.compact : def.desktop;
  const { trackRef, progressRef, progress, active, mounted, webgl, revealRef } = useStory({ settledP: film.settledP, minWidth: 0 });
  const { quotes } = useLiveMarket();
  const sceneReady = useSceneReady();

  const avatarAct = def.avatarAct;
  const canAvatar = webgl === true && !reduced && sceneReady && avatarAct !== undefined;
  const by = def.avatarBy ?? (avatarAct ? ([avatarAct, 0] as const) : null);
  useAvatarWarmup(canAvatar, progress, by ? film.at(by[0], by[1]) : 2);
  const inAvatarAct = useStep(progress, avatarAct ? [film.at(avatarAct, 0), film.at(avatarAct, 1)] : [2, 3]) === 0;
  const avatarInOs = mode === "desktop" && webgl === true && inAvatarAct;

  // While an OS screen covers the stage, the 3D scene rests.
  const D = def.desktop;
  const coverStep = useStep(progress, D.os.length ? coverMarks(D) : [2]);
  const restingUnderOs = mode === "desktop" && coverStep >= 0 && coverStep % 2 === 0;

  // Floating extras step aside: the launcher hides while the film's avatar is on screen (phones: the whole film).
  useFilmPresence(active, mode, mode === "compact" ? active : inAvatarAct && mode === "desktop");

  const scene = (still: boolean, run: boolean) =>
    webgl !== false && mounted && sceneReady ? (
      <def.Scene film={film} progress={progressRef} active={run} still={still} portrait={portrait} lite={lite} avatarHere={mode === "compact" && avatarAct !== undefined} quotes={quotes} />
    ) : null;

  const trackCss = `#${def.id}{height:${def.compact.story.totalVh}vh}@media (min-width:1024px){#${def.id}{height:${def.desktop.story.totalVh}vh}}#${def.id}[data-mode="stacked"]{height:auto}`;

  return (
    <MotionConfig reducedMotion="user">
      <CapOrder.Provider value={film.story.order}>
        <style>{trackCss}</style>
        <section
          ref={trackRef}
          id={def.id}
          data-mode={mode}
          data-acts={mode === "boot" ? undefined : JSON.stringify(film.story.range)}
          aria-label={def.label}
          className="relative bg-transparent text-[#F2F5F2]"
        >
          {mode === "stacked" ? (
            <def.Stacked quotes={quotes} scene={scene(true, active)} revealRef={revealRef} />
          ) : (
            <div className="sticky top-0 h-svh overflow-hidden">
              <div className="absolute inset-0">
                <Poster left={def.posterLeft ?? "64%"} />
                {mode !== "boot" ? <div className="absolute inset-0">{scene(false, active && !restingUnderOs)}</div> : null}
              </div>
              {mode === "boot" ? (
                <BootStage Hero={def.Hero} />
              ) : mode === "desktop" ? (
                <DesktopStage def={def} mv={progress} trackRef={trackRef} film={film} quotes={quotes} avatarInOs={avatarInOs} />
              ) : (
                <CompactStage def={def} mv={progress} trackRef={trackRef} film={film} quotes={quotes} portrait={portrait} />
              )}
            </div>
          )}
        </section>
      </CapOrder.Provider>
    </MotionConfig>
  );
}

/** Progress marks where the OS starts / stops covering the stage: even steps are covered. */
function coverMarks<A extends string>(film: CapFilm<A>): number[] {
  const marks: number[] = [];
  const acts = film.story.order;
  acts.forEach((id, i) => {
    if (!film.os.includes(id)) return;
    const prevOs = i > 0 && film.os.includes(acts[i - 1]);
    const nextOs = i < acts.length - 1 && film.os.includes(acts[i + 1]);
    if (!prevOs) marks.push(film.at(id, 0.07));
    if (!nextOs) marks.push(film.at(id, 0.94));
  });
  return marks;
}

/* ============================================================== boot (SSR) */

function BootStage({ Hero }: { Hero: ComponentType<{ compact?: boolean }> }) {
  return (
    <div className="absolute inset-x-5 bottom-6 sm:inset-x-8 lg:inset-x-auto lg:bottom-auto lg:left-16 lg:top-1/2 lg:w-[min(36rem,44vw)] lg:-translate-y-[44%]">
      <div className="lg:hidden">
        <Hero compact />
      </div>
      <div className="hidden lg:block">
        <Hero />
      </div>
    </div>
  );
}

/* ============================================================ desktop stage */

function DesktopStage<A extends string>({ def, mv, trackRef, film, quotes, avatarInOs }: { def: CapFilmDef<A>; mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; film: CapFilm<A>; quotes: Quotes; avatarInOs: boolean }) {
  const scrim = useTransform(mv, (p) => 0.8 * (1 - film.osIn(p)));
  const first = film.story.order[0];
  const label = useTransform(mv, (p) => ramp(p, film.at(first, 0.3), film.at(first, 0.7)) * (1 - film.osIn(p)));
  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-[rgba(4,4,4,0.6)] from-20% via-[rgba(4,4,4,0.35)] via-55% to-transparent" style={{ opacity: scrim }} />
      <def.Desktop mv={mv} film={film} quotes={quotes} avatarInOs={avatarInOs} portrait={false} />
      <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * (1 - film.osIn(p))} />
      <motion.p className={`${MONO} absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[#7E8F85]`} style={{ opacity: label }}>
        Illustrative 3D · prices real where labelled
      </motion.p>
    </div>
  );
}

/* ============================================================ compact stage */

function CompactStage<A extends string>({ def, mv, trackRef, film, quotes, portrait }: { def: CapFilmDef<A>; mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; film: CapFilm<A>; quotes: Quotes; portrait: boolean }) {
  const hint = useTransform(mv, (p) => 1 - ramp(p, 0.002, 0.012));
  return (
    <div className="pointer-events-none absolute inset-0">
      <div
        aria-hidden="true"
        className={
          portrait
            ? "absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-[rgba(4,4,4,0.85)] from-35% via-[rgba(4,4,4,0.55)] via-65% to-transparent"
            : "absolute inset-y-0 left-0 w-[58%] bg-gradient-to-r from-[rgba(4,4,4,0.7)] from-30% via-[rgba(4,4,4,0.45)] via-65% to-transparent"
        }
      />
      <def.Compact mv={mv} film={film} quotes={quotes} avatarInOs={false} portrait={portrait} />
      <div className="[&_nav]:right-1.5 [&_nav_span:first-child]:hidden">
        <StoryRail mv={mv} story={film.story} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * 0.8} />
      </div>
      {/* Phones (portrait, tall enough): between the scene and the caption panel. */}
      <motion.div className="absolute left-1/2 top-[49%] flex -translate-x-1/2 flex-col items-center gap-2 [@media(max-height:700px)]:hidden [@media(orientation:landscape)]:hidden" style={{ opacity: hint }}>
        <p className={`${MONO} text-[#8A9295]`}>Scroll to see it work</p>
        <div className="h-8 w-px bg-gradient-to-b from-[#A8DEC2] to-transparent" />
      </motion.div>
    </div>
  );
}

/** Slot classes for compact overlays (bottom panel in portrait, left column in landscape). */
export function compactSlot(portrait: boolean) {
  return portrait
    ? "absolute inset-x-0 bottom-0 px-5 pb-[calc(3.6rem+env(safe-area-inset-bottom))] sm:px-8"
    : "absolute left-6 top-[112px] w-[min(26rem,48vw)] origin-top-left [@media(max-height:520px)]:scale-[0.66]";
}

/** Desktop 3D-act caption column (same place as the overview and the home). */
export const LEFT = "absolute left-10 top-[calc(50%+44px)] -translate-y-1/2 xl:left-16";
