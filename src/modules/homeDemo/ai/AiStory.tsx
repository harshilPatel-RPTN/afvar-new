"use client";

// The AFVAR home film: ONE sticky stage, ONE master scroll progress, ONE AI.
// The WebGL core stays on screen from the first frame to the last (dimmed only
// while the camera is inside it and the OS is on screen); act copy, live cards
// and the OS film fade over it from the same numbers (aiConfig).
//
// Mobile / reduced motion: the same acts stacked as sections, the OS shown as
// three composed desktop states.
import { MotionConfig, motion, useMotionValue, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import { useMemo, type ReactNode, type RefObject } from "react";
import { useLiveMarket } from "@/modules/home/kit";
import { MONO, StoryAct, StoryRail, ramp, useStep, useStory } from "@/modules/afvarOs";
import {
  AlwaysCopy,
  AnswerCard,
  AskCopy,
  CoresCopy,
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
import { SETTLED_P, STORY } from "./aiConfig";

const AiCoreScene = dynamic(() => import("./AiCoreScene"), { ssr: false });

const STREAM_AT = [STORY.at("stream", 0), STORY.at("stream", 1)] as const;
const OS_COVER = [STORY.at("os", 0.07), STORY.at("os", 0.95)] as const;

export function AiStory() {
  const { trackRef, progressRef, progress, cinematic, active, mounted, webgl, reduced, revealRef } = useStory({ settledP: SETTLED_P });
  const { quotes } = useLiveMarket();
  const priceTexts = useMemo(() => LANE_KEYS.map(([k, sym]) => quoteLine(quotes[k], sym)), [quotes]);
  // While the OS fully covers the stage, the WebGL loop rests.
  const osCovered = useStep(progress, OS_COVER) === 0;

  const scene = (still: boolean, run: boolean) =>
    webgl !== false && mounted ? <AiCoreScene progress={progressRef} active={run} still={still} priceTexts={priceTexts} /> : null;

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={trackRef}
        id="afvar-ai"
        aria-label="AFVAR AI — the trading operating system that never stops thinking"
        className="relative bg-[#050607] text-[#F5F7F7]"
        style={cinematic ? { height: `${STORY.totalVh}vh` } : undefined}
      >
        {cinematic ? (
          <div className="sticky top-0 h-svh overflow-hidden">
            <div className="absolute inset-0">
              <Poster />
              <div className="absolute inset-0">{scene(false, active && !osCovered)}</div>
            </div>
            <Stage mv={progress} trackRef={trackRef} quotes={quotes} />
          </div>
        ) : (
          <Stacked revealRef={revealRef} scene={scene(reduced, active)} quotes={quotes} />
        )}
      </section>
    </MotionConfig>
  );
}

/* ============================================================ cinematic stage */

const LEFT = "absolute left-10 top-1/2 -translate-y-1/2 xl:left-16";
const BOTTOM_RIGHT = "absolute bottom-10 right-[7.5rem]";

function Stage({ mv, trackRef, quotes }: { mv: MotionValue<number>; trackRef: RefObject<HTMLElement | null>; quotes: Quotes }) {
  const C = STORY.copy;
  const hint = useTransform(mv, (p) => 1 - ramp(p, 0.002, 0.012));
  const osIn = (p: number) => ramp(p, STORY.at("os", 0.0), STORY.at("os", 0.05)) * (1 - ramp(p, STORY.at("os", 0.95), STORY.at("os", 1)));
  const label = useTransform(mv, (p) => ramp(p, STORY.at("cores", 0), STORY.at("cores", 0.2)) * (1 - ramp(p, STORY.at("finale", 0.3), STORY.at("finale", 0.6))) * (1 - osIn(p)));
  const scrim = useTransform(mv, (p) => 0.8 * (1 - osIn(p)));

  return (
    <div className="pointer-events-none absolute inset-0">
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[50%] bg-gradient-to-r from-[#050607] from-25% via-[rgba(5,6,7,0.7)] via-60% to-transparent" style={{ opacity: scrim }} />

      <StoryAct mv={mv} at={C.hero} className={`${LEFT} w-[min(36rem,44vw)]`}>
        <HeroCopy />
      </StoryAct>

      <StoryAct mv={mv} at={C.cores} className={`${LEFT} w-[min(34rem,42vw)]`}>
        <CoresCopy />
      </StoryAct>

      <StoryAct mv={mv} at={C.stream} className="absolute left-10 top-[128px] w-[min(31rem,38vw)] xl:left-16">
        <StreamCopy />
        <div className="mt-6">
          <ReadingLog quotes={quotes} mv={mv} at={STREAM_AT} />
        </div>
      </StoryAct>

      <StoryAct mv={mv} at={C.think} className="absolute left-10 top-[124px] w-[min(31rem,38vw)] xl:left-16">
        <ThinkCopy />
        <div className="mt-5">
          <ThinkCard mv={mv} />
        </div>
      </StoryAct>

      <StoryAct mv={mv} at={C.always} className={`${LEFT} w-[min(32rem,40vw)]`}>
        <AlwaysCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.always} className={`${BOTTOM_RIGHT} w-[22rem]`}>
        <SessionCard />
      </StoryAct>

      <StoryAct mv={mv} at={C.ask} className={`${LEFT} w-[min(32rem,38vw)]`}>
        <AskCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.ask} className={`absolute bottom-8 right-[7.5rem] w-[min(30rem,36vw)]`}>
        <AnswerCard />
      </StoryAct>

      <OsFilm mv={mv} quotes={quotes} />

      <StoryAct mv={mv} at={C.trust} className={`${LEFT} w-[min(32rem,38vw)]`}>
        <TrustCopy />
      </StoryAct>
      <StoryAct mv={mv} at={C.trust} className={`${BOTTOM_RIGHT} w-[22rem]`}>
        <PermissionsCard />
      </StoryAct>

      <StoryAct mv={mv} at={C.finale} className={`${LEFT} w-[min(34rem,42vw)]`}>
        <FinaleCopy />
      </StoryAct>

      <StoryRail mv={mv} story={STORY} trackRef={trackRef} visible={(p) => ramp(p, 0.01, 0.03) * (1 - osIn(p))} />

      <motion.p className={`${MONO} absolute bottom-3 left-1/2 -translate-x-1/2 text-[10px] text-[#5E6669]`} style={{ opacity: label }}>
        Illustrative 3D · not market data
      </motion.p>

      <motion.div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2" style={{ opacity: hint }}>
        <p className={`${MONO} text-[#6D7578]`}>Scroll to meet the AI</p>
        <div className="h-8 w-px bg-gradient-to-b from-[#E9B44C] to-transparent" />
      </motion.div>
    </div>
  );
}

/* ================================================== stacked (mobile / reduced) */

function OsSnapshot({ u, quotes }: { u: number; quotes: Quotes }) {
  const mv = useMotionValue(STORY.at("os", u));
  return (
    <div className="aspect-[1200/660] w-full">
      <OsDesktop mv={mv} quotes={quotes} className="h-full w-full" />
    </div>
  );
}

function Stacked({ revealRef, scene, quotes }: { revealRef: RefObject<HTMLDivElement | null>; scene: ReactNode; quotes: Quotes }) {
  const block = "border-t border-[rgba(255,255,255,0.06)] px-5 py-16 sm:px-8";
  const thinkDone = useMotionValue(STORY.at("think", 0.9));
  return (
    <div>
      <div className="px-5 pb-12 pt-36 sm:px-8">
        <HeroCopy />
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
        <AskCopy />
        <div className="mt-8 max-w-lg">
          <AnswerCard />
        </div>
      </div>
      <div className={block}>
        <p className={`${MONO} text-[#E9B44C]`}>06 · The OS</p>
        {[
          { beat: OS_BEATS[2], u: 0.33 },
          { beat: OS_BEATS[3], u: 0.555 },
          { beat: OS_BEATS[5], u: 0.93 },
        ].map(({ beat, u }) => (
          <div key={beat.id} className="mt-8">
            <h3 className="text-2xl font-semibold tracking-tight">{beat.title}</h3>
            <p className="mt-2 text-[15px] leading-relaxed text-[#A3AAAC]">{beat.body}</p>
            <div className="mt-5">
              <OsSnapshot u={u} quotes={quotes} />
            </div>
          </div>
        ))}
      </div>
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
      <div className="absolute left-[62%] top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,180,76,0.28),transparent_68%)]" />
      <div className="absolute left-[62%] top-1/2 h-[13vmin] w-[13vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_35%,#FFD98A,#E9B44C_40%,#7A4E10_85%)] shadow-[0_0_80px_20px_rgba(233,180,76,0.35)]" />
    </div>
  );
}
