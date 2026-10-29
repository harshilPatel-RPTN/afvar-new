"use client";

// Kinetic type for /home-demo — text that behaves like a market.
//
//   <WickText>  headings and captions in the "/" text motion (CandleWords +
//               currency letters). The heading's accessible name is always the
//               plain text; `{s|$}` marks from older copy are read as plain.
//   <TickRoll>  a number that steps up to its value like a price feed.
//   <RollChip>  a symbol chip whose real % change rolls in as it lights.
//
// Scroll-driven when given (mv, at) — so scrolling back reverses it — or
// played once on entering the viewport. Reduced motion shows the end state.
import {
  animate,
  motion,
  motionValue,
  useInView,
  useMotionValue,
  useMotionValueEvent,
  useTransform,
  type MotionValue,
} from "framer-motion";
import { useMotionReduced } from "./motionPref";
import { useEffect, useRef, useState, type RefObject } from "react";
import { CandleWords, CurrencyLetters, useCurrencyScramble } from "@/modules/home/kit";
import { playCue, type Cue } from "./audio";
import { clamp01, easeOut, ramp } from "./timeline";
import { MONO } from "./ui";

type Window = readonly [number, number];

/** 0→1 progress: a scroll window of `mv`, or a one-shot play on entering view. */
export function useRevealProgress(ref: RefObject<Element | null>, mv: MotionValue<number> | undefined, at: Window | undefined, seconds: number) {
  const own = useMotionValue(0);
  const inView = useInView(ref, { once: true, amount: 0.3 });
  const reduce = useMotionReduced();
  const driven = Boolean(mv && at);
  const scrolled = useTransform(mv ?? own, (p) => (at ? ramp(p, at[0], at[1]) : p));
  useEffect(() => {
    if (driven) return;
    if (reduce) {
      own.set(1);
      return;
    }
    if (!inView) return;
    const controls = animate(own, 1, { duration: seconds, ease: "linear" });
    return () => controls.stop();
  }, [driven, reduce, inView, own, seconds]);
  return driven ? scrolled : own;
}

/* ------------------------------------------------------------- WickText */

/** Strips the demo's `{s|$}` marks back to the real letters. */
const plainText = (text: string) => text.replace(/\{(.)\|(.)\}/gu, "$1");

type Tag = "h1" | "h2" | "h3" | "p" | "span";
const MOTION_TAG = { h1: motion.h1, h2: motion.h2, h3: motion.h3, p: motion.p, span: motion.span } as const;

/** Headings and captions in the "/" text motion: each word opens on a price
 *  gap (green from above / red from below, alternating) and settles, while a
 *  few letters slot through $ € ¥ £ ₹ and land back on the real letter.
 *  Given (mv, at) it plays when the scroll window opens and resets when you
 *  scroll back above it (pinned chapters); otherwise once on entering view. */
export function WickText({
  text,
  as = "h2",
  className,
  mv,
  at,
}: {
  text: string;
  as?: Tag;
  className?: string;
  mv?: MotionValue<number>;
  at?: Window;
  /** Kept for call sites; the "/" motion alternates tones per word. */
  tone?: "up" | "down";
  by?: "word" | "char";
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const plain = plainText(text);
  const shown = useShown(ref, mv, at);
  useCurrencyScramble(ref, shown, { tick: true });

  const M = MOTION_TAG[as];
  return (
    <M ref={ref} className={className} aria-label={plain} initial="hidden" animate={shown ? "visible" : "hidden"}>
      <CandleWords text={plain} delay={0.08} renderWord={(word) => <CurrencyLetters text={word} />} />
    </M>
  );
}

const FALLBACK = motionValue(0);

/** When "/"-style motion should play: as soon as a pinned chapter's scroll
 *  window [at] opens (resetting when you scroll back above it), or — without
 *  a window — once the element enters the viewport. */
export function useShown(ref: RefObject<Element | null>, mv?: MotionValue<number>, at?: Window) {
  const inView = useInView(ref, { once: true, margin: "0px 0px -8% 0px" });
  const opensAt = at ? at[0] + (at[1] - at[0]) * 0.15 : 0;
  const [open, setOpen] = useState(() => Boolean(mv && at && mv.get() >= opensAt));
  useMotionValueEvent(mv ?? FALLBACK, "change", (p) => {
    if (!at) return;
    if (!open && p >= opensAt) setOpen(true);
    else if (open && p < at[0] - 0.01) setOpen(false);
  });
  return mv && at ? open : inView;
}

export function TickRoll({
  value,
  decimals = 0,
  prefix = "",
  suffix = "",
  mv,
  at,
  className,
}: {
  value: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  mv?: MotionValue<number>;
  at?: Window;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const progress = useRevealProgress(ref, mv, at, 0.6);
  // Stepped like a feed: 12 ticks to the value, never a smooth tween.
  const text = useTransform(progress, (p) => `${prefix}${(value * easeOut(Math.floor(clamp01(p) * 12) / 12)).toFixed(decimals)}${suffix}`);
  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      <motion.span aria-hidden="true">{text}</motion.span>
      <span className="sr-only">
        {prefix}
        {value.toFixed(decimals)}
        {suffix}
      </span>
    </span>
  );
}

/* --------------------------------------------------------------- RollChip */

/** "XAUUSD ▼1.26%": dims until its lane draws, then the real % rolls in. */
export function RollChip({ mv, at, symbol, pct }: { mv: MotionValue<number>; at: Window; symbol: string; pct: number }) {
  const k = useTransform(mv, (p) => ramp(p, at[0], at[1]));
  const opacity = useTransform(k, (v) => 0.25 + 0.75 * v);
  const arrowScale = useTransform(k, (v) => clamp01((v - 0.5) / 0.3));
  const value = useTransform(k, (v) => `${(Math.abs(pct) * easeOut(Math.floor(v * 12) / 12)).toFixed(2)}%`);
  const up = pct >= 0;
  return (
    <motion.span className={`${MONO} inline-flex items-baseline gap-1 text-[#F5F7F7] tabular-nums`} style={{ opacity }}>
      <span>{symbol}</span>
      <motion.span className={up ? "text-[#00E676]" : "text-[#FF3B3B]"} style={{ scale: arrowScale, display: "inline-block" }} aria-hidden="true">
        {up ? "▲" : "▼"}
      </motion.span>
      <motion.span aria-hidden="true">{value}</motion.span>
      <span className="sr-only">
        {up ? "up" : "down"} {Math.abs(pct).toFixed(2)}%
      </span>
    </motion.span>
  );
}

/* -------------------------------------------------------------- DOM cues */

/** Sound cues for DOM-driven moments: fires each cue once when `mv` crosses
 *  it going forward (the same value that drives the visuals), re-arming only
 *  after scrolling back well below it. */
export function useScrollCues(mv: MotionValue<number>, cues: readonly { at: number; cue: Cue }[]) {
  const prev = useRef<number | null>(null);
  const armed = useRef(cues.map(() => true));
  useMotionValueEvent(mv, "change", (p) => {
    const before = prev.current;
    prev.current = p;
    if (before === null) return;
    cues.forEach((c, i) => {
      if (armed.current[i] && before < c.at && p >= c.at) {
        armed.current[i] = false;
        playCue(c.cue);
      } else if (!armed.current[i] && p < c.at - 0.06) {
        armed.current[i] = true;
      }
    });
  });
}
