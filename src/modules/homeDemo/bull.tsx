"use client";

// Chapter 03's verdict card with the angry bull. Everything is a pure function
// of one progress value `p` (scroll, spring-smoothed), so scrolling back plays
// it in reverse:
//   walk     the faceted-metal bull (home page artwork) walks in, hoof dust
//   wind-up  head drops, paws the ground, BELLOWS; then SNORTS steam, eye flares
//   charge   the bull lunges and its horns hit the BULLISH word
//   impact   the word jolts, the card shakes, a crack of light bursts
//   recoil   the bull pulls back and breathes
//   bear     the faceted bear rises behind the card, ROARS, rakes red claws
// Sounds come from the same value (useScrollCues) so they land on the beat.
import { motion, useMotionValueEvent, useTransform, type MotionValue } from "framer-motion";
import { useRef, useState } from "react";
import { BearArt, BeastStyles, BullArt } from "./beastArt";
import { BULL, BULL_SOUND } from "./intelligenceConfig";
import { useRevealProgress, useScrollCues } from "./kinetic";
import { useMotionReduced } from "./motionPref";
import { easeInOut, easeOut, ramp } from "./timeline";
import { HAIR, MONO } from "./ui";

const INK = "#F5F7F7";
const UP = "#00E676";

/** Ease-in for the lunge: slow start, violent finish. */
const easeIn = (x: number) => x * x * x;

/** Decaying shake after the impact, in px. */
const shake = (p: number, amp: number) => {
  const l = ramp(p, BULL.charge[1], BULL.charge[1] + 0.03);
  return l <= 0 || l >= 1 ? 0 : Math.sin(l * 34) * amp * (1 - l);
};

type Layout = "side" | "top";

export function BullVerdictCard({ p, layout = "side" }: { p: MotionValue<number>; layout?: Layout }) {
  useScrollCues(p, BULL_SOUND);

  // Impact on the card and the word.
  const cardX = useTransform(p, (v) => shake(v, 5));
  const wordX = useTransform(p, (v) => shake(v, 10));
  const wordScale = useTransform(p, (v) => 1 + 0.12 * Math.exp(-Math.pow((v - BULL.charge[1]) / 0.008, 2)));
  const flash = useTransform(p, (v) => Math.exp(-Math.pow((v - BULL.charge[1]) / 0.01, 2)));
  const borderColor = useTransform(flash, (f) => `rgba(0,230,118,${0.1 + f * 0.9})`);
  const burst = useTransform(p, (v) => ramp(v, BULL.charge[1], BULL.charge[1] + 0.02));
  const burstScale = useTransform(burst, (b) => 0.4 + b * 1.2);
  const burstOpacity = useTransform(burst, (b) => (b <= 0 ? 0 : 1 - b));

  return (
    <motion.div className="relative" style={{ x: cardX }}>
      <BeastStyles />
      <Bear p={p} />
      <motion.div className="relative z-10 overflow-hidden rounded-2xl border bg-(--afvar-panel) p-6" style={{ borderColor }}>
        {/* "/" card accent: a green line across the top edge */}
        <span aria-hidden="true" className="absolute inset-x-0 top-0 h-[2px] bg-[#00E676]" />
        <div className="flex items-baseline justify-between">
          <p className={`${MONO} text-[#00E676]`}>Verdict</p>
          <p className={`${MONO} text-[#6D7578]`}>Illustrative</p>
        </div>
        <p className={`${MONO} mt-3 text-[#A3AAAC]`}>XAUUSD · 1H</p>
        <div className="relative mt-1">
          <motion.p className="inline-block origin-left text-3xl font-semibold tracking-tight text-[#00E676]" style={{ x: wordX, scale: wordScale }}>
            BULLISH
          </motion.p>
          {/* crack of light where the horns land */}
          <motion.svg
            aria-hidden="true"
            viewBox="-30 -30 60 60"
            className="pointer-events-none absolute -left-7 top-1/2 h-16 w-16 -translate-y-1/2"
            style={{ scale: burstScale, opacity: burstOpacity }}
          >
            {[0, 40, 85, 130, 180, 225, 270, 315].map((deg, i) => (
              <line
                key={deg}
                x1={Math.cos((deg * Math.PI) / 180) * 6}
                y1={Math.sin((deg * Math.PI) / 180) * 6}
                x2={Math.cos((deg * Math.PI) / 180) * (i % 2 ? 18 : 27)}
                y2={Math.sin((deg * Math.PI) / 180) * (i % 2 ? 18 : 27)}
                stroke={i % 3 ? INK : UP}
                strokeWidth={2}
                strokeLinecap="round"
              />
            ))}
          </motion.svg>
        </div>
        <dl className="mt-4 space-y-2">
          {["Watch zone", "Invalidation", "Objective"].map((f) => (
            <div key={f} className="flex items-baseline justify-between gap-4">
              <dt className="text-sm text-[#A3AAAC]">{f}</dt>
              <dd className={`${MONO} text-[#6D7578]`}>—</dd>
            </div>
          ))}
        </dl>
        <p className={`${MONO} mt-5 border-t ${HAIR} pt-4 text-[#6D7578]`}>Bullish · Bearish · Wait — WAIT is a real answer</p>
      </motion.div>
      <Bull p={p} layout={layout} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------- bull */

/** The home page's faceted-metal bull, driven by the verdict timeline.
 *  Side: stands left of the card, horn tips level with the verdict word.
 *  Top (phones): stands on the card's top edge and lunges along it. */
function Bull({ p, layout }: { p: MotionValue<number>; layout: Layout }) {
  const reach = layout === "side" ? BULL.reach : 34;
  const walkOf = (v: number) => easeOut(ramp(v, BULL.draw[0], BULL.draw[1]));
  const windupOf = (v: number) => easeInOut(ramp(v, BULL.windup[0], BULL.windup[1]));
  const chargeOf = (v: number) => easeIn(ramp(v, BULL.charge[0], BULL.charge[1]));
  const recoilOf = (v: number) => easeOut(ramp(v, BULL.recoil[0], BULL.recoil[1]));

  // Walks in from off to the left, lunges, pulls back to a menacing stand.
  const x = useTransform(p, (v) => -220 * (1 - walkOf(v)) + reach * chargeOf(v) - reach * 0.7 * recoilOf(v));
  const y = useTransform(p, (v) => (walkOf(v) < 1 ? Math.abs(Math.sin(walkOf(v) * Math.PI * 4)) * -5 : 0));
  const opacity = useTransform(p, (v) => (v < BULL.draw[0] - 0.002 ? 0 : 1));
  // Head: level while walking, drops for the wind-up, hooks up through the hit.
  const head = useTransform(p, (v) => 17 * windupOf(v) - 26 * chargeOf(v) + 14 * recoilOf(v));
  // Front leg: gait while walking, then paws the ground twice in the wind-up.
  const leg = useTransform(p, (v) => {
    const w = walkOf(v);
    if (w < 1) return Math.sin(w * Math.PI * 4) * 18;
    const k = ramp(v, BULL.windup[0], BULL.windup[1]);
    return k > 0 && k < 1 ? Math.sin(k * Math.PI * 2) * 26 : 0;
  });
  const dust = useTransform(p, (v) => {
    const w = walkOf(v);
    const k = ramp(v, BULL.windup[0], BULL.windup[1]);
    return w < 1 ? 0.6 * Math.abs(Math.sin(w * Math.PI * 4)) : k > 0 && k < 1 ? Math.sin(k * Math.PI) : 0;
  });

  // Steam + eye flare: one burst per snort, re-armed on scrolling back.
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  const snortAt = BULL.windup[0] + 0.01;
  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (prev === null) return;
    if (armed.current && prev < snortAt && v >= snortAt) {
      armed.current = false;
      setBurst((b) => b + 1);
    } else if (!armed.current && v < snortAt - 0.04) {
      armed.current = true;
    }
  });
  const reduced = useMotionReduced();

  return (
    <motion.div
      aria-hidden="true"
      className={`pointer-events-none absolute z-20 ${layout === "side" ? "right-full top-[30px] -mr-3 w-[290px]" : "bottom-full left-0 -mb-4 w-[210px]"}`}
      style={{ x, y, opacity }}
    >
      <BullArt head={head} leg={leg} dust={dust} burst={burst} idle={!reduced} />
    </motion.div>
  );
}

/* ------------------------------------------------------------------- bear */

const CLAWS = [0, 1, 2] as const;

/** The faceted bear rises behind the card, roars, and rakes its paw down —
 *  red claw streaks score the card. */
function Bear({ p }: { p: MotionValue<number> }) {
  const riseOf = (v: number) => easeOut(ramp(v, BULL.bear[0], BULL.bear[1]));
  const swipeOf = (v: number) => easeIn(ramp(v, BULL.swipe - 0.006, BULL.swipe + 0.008));
  const y = useTransform(p, (v) => `${(1 - riseOf(v)) * 100}%`);
  const head = useTransform(p, (v) => -8 + 11 * riseOf(v) + 9 * swipeOf(v));
  const paw = useTransform(p, (v) => -30 * ramp(v, BULL.bear[1] - 0.01, BULL.swipe - 0.006) + 92 * swipeOf(v));

  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  useMotionValueEvent(p, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (prev === null) return;
    if (armed.current && prev < BULL.swipe && v >= BULL.swipe) {
      armed.current = false;
      setBurst((b) => b + 1);
    } else if (!armed.current && v < BULL.swipe - 0.04) {
      armed.current = true;
    }
  });
  const reduced = useMotionReduced();

  return (
    <>
      {/* rises from behind the card's top edge */}
      <div aria-hidden="true" className="pointer-events-none absolute bottom-[calc(100%-18px)] right-0 z-0 h-[150px] w-[150px] overflow-clip">
        <motion.div className="absolute bottom-0 right-0 w-[150px]" style={{ y }}>
          <div style={{ transform: "scaleX(-1)" }}>
            <BearArt head={head} paw={paw} burst={burst} idle={!reduced} />
          </div>
        </motion.div>
      </div>
      {/* claw streaks across the card */}
      <div aria-hidden="true" className="pointer-events-none absolute right-6 top-2 z-30 h-24 w-[130px]">
        {burst > 0 &&
          CLAWS.map((i) => (
            <span
              key={`${burst}-${i}`}
              className="bx-claw"
              style={{ left: 70 + i * 16, top: i * 3, ["--r" as string]: "121deg", ["--w" as string]: `${84 - i * 6}px`, ["--d" as string]: `${i * 0.045}s` }}
            />
          ))}
      </div>
    </>
  );
}

/** Phones / non-cinematic: the same bull sequence plays once when the card
 *  scrolls into view (end pose straight away under reduced motion). */
export function BullVerdictInView() {
  const ref = useRef<HTMLDivElement>(null);
  const k = useRevealProgress(ref, undefined, undefined, 2.8);
  const p = useTransform(k, (v) => BULL.draw[0] - 0.005 + v * (0.795 - BULL.draw[0] + 0.005));
  return (
    <div ref={ref} className="mt-44 max-w-sm">
      <BullVerdictCard p={p} layout="top" />
    </div>
  );
}
