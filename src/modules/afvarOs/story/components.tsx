"use client";

// DOM building blocks for scroll stories: an overlay that fades over a window
// of the master progress, the chapter rail, and small hooks that turn the
// progress into discrete steps, typed text or keyframed styles.
import { motion, useMotionValueEvent, useTransform, type MotionStyle, type MotionValue } from "framer-motion";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { MONO } from "../theme";
import { prefersReducedMotion } from "./useStory";
import { ramp, sampleKeys, window4, type Keyframe, type Story, type Window4 } from "./timeline";

/* ------------------------------------------------------------------ hooks */

/** Index of the last threshold that p has passed (−1 before the first). Re-renders only on change. */
export function useStep(mv: MotionValue<number>, thresholds: readonly number[]): number {
  const calc = (p: number) => {
    let i = -1;
    for (let k = 0; k < thresholds.length; k++) if (p >= thresholds[k]) i = k;
    return i;
  };
  const [step, setStep] = useState(() => calc(mv.get()));
  useMotionValueEvent(mv, "change", (p) => {
    const next = calc(p);
    setStep((s) => (s === next ? s : next));
  });
  return step;
}

/** Writes `text` into a span progressively over [a, b] of the progress. */
export function useTypedText(mv: MotionValue<number>, text: string, [a, b]: readonly [number, number]) {
  const ref = useRef<HTMLSpanElement>(null);
  const write = (p: number) => {
    if (ref.current) ref.current.textContent = text.slice(0, Math.round(text.length * ramp(p, a, b)));
  };
  useEffect(() => write(mv.get()));
  useMotionValueEvent(mv, "change", write);
  return ref;
}

/** Sets `inert` on hidden overlays so hidden links never take focus. */
export function useInertWhileHidden(opacity: MotionValue<number>) {
  const ref = useRef<HTMLDivElement>(null);
  const apply = (o: number) => {
    const el = ref.current;
    if (!el) return;
    if (o < 0.05) el.setAttribute("inert", "");
    else el.removeAttribute("inert");
  };
  useEffect(() => apply(opacity.get()));
  useMotionValueEvent(opacity, "change", apply);
  return ref;
}

type BoxKey = "x" | "y" | "w" | "h" | "o" | "s";
export type BoxKeyframe = Keyframe<BoxKey>;

/** Keyframed box (left, top, width, height, opacity, scale) as motion styles. */
export function useBoxKeys(mv: MotionValue<number>, keys: readonly BoxKeyframe[]): MotionStyle {
  const scratch = useRef({} as Omit<BoxKeyframe, "at">);
  const sample = (p: number) => sampleKeys(keys, p, scratch.current);
  const left = useTransform(mv, (p) => sample(p).x);
  const top = useTransform(mv, (p) => sample(p).y);
  const width = useTransform(mv, (p) => sample(p).w);
  const height = useTransform(mv, (p) => sample(p).h);
  const opacity = useTransform(mv, (p) => sample(p).o);
  const scale = useTransform(mv, (p) => sample(p).s);
  return { left, top, width, height, opacity, scale };
}

/* ---------------------------------------------------------------- overlay */

/** An overlay that fades and rises over a progress window; inert while hidden. */
export function StoryAct({
  mv,
  at,
  className,
  rise = 28,
  name,
  children,
}: {
  mv: MotionValue<number>;
  at: Window4;
  className?: string;
  rise?: number;
  /** Act id, exposed as data-act for tests and analytics. */
  name?: string;
  children: ReactNode;
}) {
  const opacity = useTransform(mv, (p) => window4(p, at));
  const y = useTransform(mv, (p) => (p < at[2] ? (1 - ramp(p, at[0], at[1])) * rise : -ramp(p, at[2], at[3]) * rise * 0.6));
  const ref = useInertWhileHidden(opacity);
  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }} data-act={name}>
      <div className="pointer-events-auto">{children}</div>
    </motion.div>
  );
}

/* ------------------------------------------------------------------- rail */

/** Right-edge chapter index: shows where you are and jumps to any act. */
export function StoryRail<Id extends string>({
  mv,
  story,
  trackRef,
  visible,
  segmented = false,
}: {
  mv: MotionValue<number>;
  story: Story<Id>;
  trackRef: RefObject<HTMLElement | null>;
  /** Rail opacity as a function of progress (default: hidden on the first act). */
  visible?: (p: number) => number;
  segmented?: boolean;
}) {
  const [current, setCurrent] = useState<Id>(story.order[0]);
  useMotionValueEvent(mv, "change", (p) => {
    const next = story.actAt(p);
    setCurrent((c) => (c === next ? c : next));
  });
  const opacity = useTransform(mv, visible ?? ((p) => ramp(p, story.range[story.order[0]][1] * 0.4, story.range[story.order[0]][1])));

  const go = (id: Id) => {
    const el = trackRef.current;
    if (!el) return;
    const span = el.offsetHeight - window.innerHeight;
    const target = id === story.order[0] ? 0 : (story.copy[id][1] + Math.min(story.copy[id][2], story.range[id][1])) / 2;
    const top = el.getBoundingClientRect().top + window.scrollY + span * target;
    window.scrollTo({ top, behavior: prefersReducedMotion() ? "auto" : "smooth" });
  };

  return (
    <motion.nav aria-label="Story chapters" className={`pointer-events-auto absolute right-5 top-1/2 z-30 -translate-y-1/2 ${segmented ? "afvar-glass-track rounded-full" : ""}`} style={{ opacity }}>
      <ol className="flex flex-col items-end gap-3">
        {story.order.map((id, i) => {
          const on = id === current;
          return (
            <li key={id}>
              <button
                type="button"
                data-glass-hit-area={segmented ? undefined : ""}
                data-selected={segmented ? on : undefined}
                onClick={() => go(id)}
                aria-current={on ? "step" : undefined}
                aria-label={`Go to ${story.labels[id]}`}
                className={`group flex items-center gap-3 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#A8DEC2] ${segmented ? "afvar-glass-tab rounded-full" : ""}`}
              >
                <span
                  className={`${MONO} text-[10px] transition-opacity ${on ? "text-[#A8DEC2] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100 min-[1440px]:opacity-100" : "text-[#8A9295] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}
                >
                  {String(i + 1).padStart(2, "0")} {story.labels[id]}
                </span>
                <span className={`block h-px transition-all ${on ? "w-8 bg-[#A8DEC2]" : "w-4 bg-[#4A5256] group-hover:bg-[#B7C5BC]"}`} />
              </button>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}

/** Thin progress bar (0..1 over a window), e.g. for sub-beats. */
export function ProgressBar({ mv, from, to, className = "" }: { mv: MotionValue<number>; from: number; to: number; className?: string }) {
  const scaleX = useTransform(mv, (p) => Math.max(0.001, ramp(p, from, to)));
  return (
    <div className={`h-px bg-[rgba(255,255,255,0.12)] ${className}`}>
      <motion.div className="h-px origin-left bg-[#A8DEC2]" style={{ scaleX }} />
    </div>
  );
}
