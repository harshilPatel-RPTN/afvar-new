"use client";

import { animate, motion, useInView, useMotionValue, useReducedMotion, useTransform, type AnimationPlaybackControls, type MotionValue } from "framer-motion";
import { useEffect, useId, useRef, type ReactNode } from "react";
import { LiveChip } from "./bits";
import { playSfx } from "./sfx";
import type { HomeQuote } from "./useLiveMarket";

/* ── BREADTH TUG-OF-WAR — a low-poly bear (left, red rim) and bull (right,
 * green rim) pull a rope across the Markets section. The knot sits at a
 * position computed from REAL breadth of the 8 coverage lanes:
 *   up = lanes with changePct > 0, down = lanes with changePct < 0,
 *   knot x = 50% + (up − down) / 8 × 40%   (of the rope span).
 * More lanes up → the knot is pulled right, toward the bull. It is a count of
 * today's moves, never a forecast. On scroll-in both characters strain and
 * the knot slides from centre to the true value (zero-bounce spring, so it
 * never overshoots). A poll that changes breadth moves the knot again, the
 * winning side leans and `tick` plays. Reduced motion: static at the true
 * position. Transform/opacity only. */

const LANES = 8;
const UP = "#00E676";
const DOWN = "#FF3B3B";

export function breadthOf(quotes: Record<string, HomeQuote>) {
  let up = 0;
  let down = 0;
  for (const quote of Object.values(quotes)) {
    if (quote.changePct > 0) up += 1;
    else if (quote.changePct < 0) down += 1;
  }
  return { up, down };
}

/** Knot position in % of the rope span. */
export const knotPercent = (up: number, down: number) => 50 + ((up - down) / LANES) * 40;

/** Resting lean (skew degrees) per side: the side that is ahead leans back harder. */
function restLean(up: number, down: number): [bear: number, bull: number] {
  if (up > down) return [3, 8];
  if (down > up) return [8, 3];
  return [5, 5];
}

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function TugOfWar({ quotes }: { quotes: Record<string, HomeQuote> }) {
  const rootRef = useRef<HTMLDivElement>(null);
  // Not once: every time the tug comes on screen it plays again from the centre.
  const inView = useInView(rootRef, { amount: 0.6 });
  const reduce = useReducedMotion();
  const { up, down } = breadthOf(quotes);
  const target = knotPercent(up, down);
  const live = Object.values(quotes).some((quote) => quote.live);
  const tie = up === down;
  const tipId = useId();

  const knot = useMotionValue(50);
  const knotX = useTransform(knot, (v) => `${v}%`);
  // Displacement from centre, tinted in the leader's colour (bull side green, bear side red).
  const greenScale = useTransform(knot, (v) => Math.max(0, (v - 50) / 50));
  const redScale = useTransform(knot, (v) => Math.max(0, (50 - v) / 50));
  const taut = useMotionValue(0);
  const slack = useTransform(taut, (v) => 1 - v);
  const bearSkew = useMotionValue(0);
  const bullSkew = useMotionValue(0);
  const bearX = useMotionValue(0);
  const bullX = useMotionValue(0);

  const started = useRef(false);
  const lastTarget = useRef(target);
  const runs = useRef<AnimationPlaybackControls[]>([]);

  useEffect(
    () => () => {
      runs.current.forEach((run) => run.stop());
    },
    [],
  );

  useEffect(() => {
    const root = rootRef.current;
    const [bearRest, bullRest] = restLean(up, down);
    const push = (run: AnimationPlaybackControls) => runs.current.push(run);
    const setPhase = (phase: string) => root?.setAttribute("data-phase", phase);

    if (reduce || reducedNow()) {
      runs.current.forEach((run) => run.stop());
      knot.set(target);
      taut.set(1);
      bearSkew.set(bearRest);
      bullSkew.set(bullRest);
      started.current = true;
      lastTarget.current = target;
      setPhase("settled");
      return;
    }
    if (!inView) {
      // Off screen: reset to a slack rope with the knot at the centre, so the
      // next time it scrolls into view the pull plays again from the middle.
      runs.current.forEach((run) => run.stop());
      runs.current = [];
      knot.set(50);
      taut.set(0);
      bearSkew.set(0);
      bullSkew.set(0);
      bearX.set(0);
      bullX.set(0);
      started.current = false;
      setPhase("idle");
      return;
    }

    if (!started.current) {
      // Scroll-in: the rope snaps taut, both sides strain, and the knot travels slowly
      // from the centre to the true value — the leader's colour filling in behind it.
      started.current = true;
      lastTarget.current = target;
      setPhase("straining");
      push(animate(taut, 1, { duration: 0.35, delay: 0.05, ease: "easeOut" }));
      const strain = { duration: 2.6, ease: "easeInOut" as const };
      for (const [skew, rest] of [
        [bearSkew, bearRest],
        [bullSkew, bullRest],
      ] as const) {
        push(animate(skew, [0, rest + 3, rest + 1, rest + 4, rest + 1.5, rest + 3, rest], strain));
      }
      for (const x of [bearX, bullX]) push(animate(x, [0, -3, -1, -4, -1.5, -3, 0], strain));
      knot.set(50);
      const slide = animate(knot, target, { duration: 2.4, delay: 0.15, ease: [0.25, 0.1, 0.25, 1] });
      push(slide);
      void slide.then(() => setPhase("settled"));
      return;
    }

    if (target === lastTarget.current) return;
    // A poll changed breadth: knot moves, the side it moved toward leans back, tick.
    const towardBull = target > lastTarget.current;
    lastTarget.current = target;
    runs.current.forEach((run) => run.stop());
    runs.current = [];
    setPhase("moving");
    const slide = animate(knot, target, { type: "spring", bounce: 0, duration: 1.1 });
    push(slide);
    void slide.then(() => setPhase("settled"));
    const [winner, winRest, loser, loseRest, winX] = towardBull ? [bullSkew, bullRest, bearSkew, bearRest, bullX] : [bearSkew, bearRest, bullSkew, bullRest, bearX];
    push(animate(winner, [winner.get(), winRest + 5, winRest], { duration: 0.7, ease: "easeOut" }));
    push(animate(winX, [0, -4, 0], { duration: 0.7, ease: "easeOut" }));
    push(animate(loser, loseRest, { duration: 0.5 }));
    playSfx("tick");
  }, [inView, reduce, target, up, down, knot, taut, bearSkew, bullSkew, bearX, bullX]);

  const leader = up > down ? "up" : down > up ? "down" : "tie";
  const knotColor = leader === "up" ? UP : leader === "down" ? DOWN : "#A3AAAC";

  return (
    <div ref={rootRef} data-tug data-up={up} data-down={down} data-target={target.toFixed(2)} className="relative mt-10">
      <div
        role="img"
        aria-label={`Breadth across the 8 coverage lanes: ${up} up, ${down} down${tie ? ", balanced" : ""}. Not a forecast.`}
        className="relative h-[47px] [--tw:64px] sm:h-[110px] sm:[--tw:150px]"
      >
        {/* ground */}
        <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-px bg-[linear-gradient(90deg,transparent,rgba(255,255,255,.12)_12%,rgba(255,255,255,.12)_88%,transparent)]" />

        {/* rope: a slack sag cross-fades into the taut braid; the stretch between centre and knot is tinted in the leader's colour */}
        <div aria-hidden="true" className="absolute" style={{ left: "calc(var(--tw) * .8)", right: "calc(var(--tw) * .8)", top: "54.5%" }}>
          <motion.svg viewBox="0 0 100 10" preserveAspectRatio="none" className="absolute inset-x-0 top-[-1px] h-[12px] w-full overflow-visible sm:h-[20px]" style={{ opacity: slack }}>
            <path d="M0 1 Q50 18 100 1" fill="none" stroke="#6D7578" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
          </motion.svg>
          <motion.div className="absolute inset-x-0 top-[-1.5px] h-[3px] rounded-full bg-[repeating-linear-gradient(115deg,#8A9297_0_3px,#4A5257_3px_6px)]" style={{ opacity: taut }} />
        </div>

        {/* knot track (the visible rope between the two characters) */}
        <div aria-hidden="true" data-knot-track className="absolute" style={{ left: "var(--tw)", right: "var(--tw)", top: "54.5%" }}>
          <motion.div className="absolute inset-x-0 top-[-1.5px] h-[3px]" style={{ opacity: taut }}>
            <motion.span className="absolute inset-y-0 left-0 right-1/2 origin-right bg-[#FF3B3B]/75" style={{ scaleX: redScale }} />
            <motion.span className="absolute inset-y-0 left-1/2 right-0 origin-left bg-[#00E676]/75" style={{ scaleX: greenScale }} />
          </motion.div>
          <span className="absolute left-1/2 top-[-9px] h-[18px] w-px bg-white/25 sm:top-[-12px] sm:h-[24px]" />
          <motion.div className="absolute inset-x-0 top-0 h-0" style={{ x: knotX }}>
            <span data-knot className="absolute left-0 top-0 block h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 sm:h-[20px] sm:w-[20px]">
              <KnotArt color={knotColor} />
            </span>
          </motion.div>
        </div>

        {/* bear — left, facing right */}
        <div aria-hidden="true" className="absolute bottom-0 left-0 w-(--tw)">
          <Lean skew={bearSkew} x={bearX}>
            <BearPull />
          </Lean>
        </div>
        {/* bull — right, mirrored to face left */}
        <div aria-hidden="true" className="absolute bottom-0 right-0 w-(--tw) -scale-x-100">
          <Lean skew={bullSkew} x={bullX}>
            <BullPull />
          </Lean>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1.5 text-center">
        <span className="group relative inline-flex cursor-help items-center gap-1.5 rounded-md text-[12px] text-(--mk-dim) outline-none focus-visible:ring-2 focus-visible:ring-white/50 sm:text-[12.5px]" tabIndex={0} aria-describedby={tipId}>
          <span data-breadth-label>
            {live ? "Today's breadth" : "Breadth (stored snapshot)"} · <span className="font-mono font-semibold tabular-nums text-[#00E676]">{up}</span> up · <span className="font-mono font-semibold tabular-nums text-[#FF6464]">{down}</span> down
            {tie && " · balanced"}
          </span>
          <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-(--mk-faint)" aria-hidden="true">
            <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.3" />
            <path d="M8 7.2v4M8 4.6v.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          <span
            id={tipId}
            role="tooltip"
            className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 w-[230px] -translate-x-1/2 rounded-lg border border-white/[.11] bg-[#171B1D] px-3 py-2 text-[11.5px] leading-snug text-(--mk-text) opacity-0 shadow-[0_8px_24px_-8px_rgba(0,0,0,.8)] transition-opacity duration-150 group-hover:opacity-100 group-focus-visible:opacity-100"
          >
            Count of today&apos;s moves across the 8 coverage lanes — not a forecast.
          </span>
        </span>
        <LiveChip live={live} />
      </div>
    </div>
  );
}

function Lean({ skew, x, children }: { skew: MotionValue<number>; x: MotionValue<number>; children: ReactNode }) {
  return (
    <motion.div style={{ skewX: skew, x, transformOrigin: "50% 100%" }}>
      {children}
    </motion.div>
  );
}

function KnotArt({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 20 20" className="block h-full w-full overflow-visible">
      <polygon points="6,1 14,1 19,6 19,14 14,19 6,19 1,14 1,6" fill="#1d2327" />
      <polygon points="6,1 14,1 10,10" fill="#3b454b" />
      <polygon points="14,1 19,6 10,10" fill="#2c3439" />
      <polygon points="1,6 6,1 10,10" fill="#30383d" />
      <polygon points="1,14 10,10 6,19" fill="#14181b" />
      <polygon points="10,10 19,14 14,19" fill="#171b1e" />
      <polygon points="6,1 14,1 19,6 19,14 14,19 6,19 1,14 1,6" fill="none" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="10" cy="10" r="2.2" fill={color} />
    </svg>
  );
}

/** Low-poly bear on its hind legs, leaning back, paws on the rope (faces right). Rope line at y=60. */
function BearPull() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 150 110" className="block h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`tg${uid}`}>
          <stop offset="0" stopColor={DOWN} stopOpacity=".9" />
          <stop offset="1" stopColor={DOWN} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="52" cy="108.5" rx="40" ry="2" fill="#000" opacity=".5" />
      {/* far leg + far arm */}
      <polygon points="30,76 46,80 34,104 22,104" fill="#14181b" />
      <polygon points="18,103 38,103 39,109 16,109" fill="#0b0d0f" />
      <polygon points="64,46 78,48 120,64 112,70" fill="#14181b" />
      <polygon points="116,60 132,62 132,70 117,70" fill="#171b1e" />
      {/* near leg braced forward */}
      <polygon points="44,78 64,80 82,102 64,106" fill="#1d2327" />
      <polygon points="62,103 84,100 86,108 60,109" fill="#0b0d0f" />
      {/* body */}
      <polygon points="18,62 12,66 18,70" fill="#1d2327" />
      <polygon points="26,36 58,24 54,52" fill="#2c3439" />
      <polygon points="58,24 82,38 54,52" fill="#242b2f" />
      <polygon points="26,36 54,52 18,62" fill="#1f2529" />
      <polygon points="18,62 54,52 76,84 34,86" fill="#171b1e" />
      <polygon points="54,52 82,38 80,74 76,84" fill="#1a1f23" />
      {/* near arm → paw on the rope */}
      <polygon points="66,36 84,40 120,56 112,66" fill="#2c3439" />
      <polygon points="112,66 120,56 136,55 138,65" fill="#1d2327" />
      <polygon points="132,51 146,54 148,65 135,68" fill="#252c30" />
      <polygon points="146,55 151,55 147,58" fill="#c9d1d5" />
      <polygon points="147,59 152,60 147,62" fill="#c9d1d5" />
      <polygon points="147,63 151,65 146,65" fill="#9aa5ab" />
      {/* head */}
      <polygon points="60,12 63,3 71,4 71,13" fill="#2a3136" />
      <polygon points="63,11 65,6 69,7 69,12" fill="#101315" />
      <polygon points="58,16 80,9 76,25" fill="#353e43" />
      <polygon points="80,9 99,22 76,25" fill="#30383d" />
      <polygon points="58,16 76,25 60,30" fill="#262d32" />
      <polygon points="60,30 76,25 99,22 95,35 74,38" fill="#1d2327" />
      <polygon points="95,23 108,27 106,34 95,35" fill="#252c30" />
      <polygon points="105,26 109,28 107,31" fill="#040506" />
      <polygon points="98,33 105,33 101,36" fill="#121518" />
      <polygon points="76,16 92,19 91,21 77,19" fill="#4a545a" />
      <circle cx="85" cy="21" r="7" fill={`url(#tg${uid})`} opacity=".5" />
      <polygon points="80,19 90,21 88,23 80,21" fill={DOWN} />
      {/* rim light */}
      <polyline points="18,62 26,36 58,24 82,38" fill="none" stroke={DOWN} strokeWidth="1.6" strokeLinejoin="round" opacity=".85" />
      <polyline points="58,16 63,3 71,4 80,9 99,22 108,27" fill="none" stroke={DOWN} strokeWidth="1.3" strokeLinejoin="round" opacity=".8" />
      <polyline points="84,40 120,56 136,55 146,54" fill="none" stroke={DOWN} strokeWidth="1.1" strokeLinejoin="round" opacity=".6" />
    </svg>
  );
}

/** Low-poly bull, braced, head down, rope tied to its nose ring (faces right; mirrored in place). Rope line at y=60. */
function BullPull() {
  const uid = useId().replace(/:/g, "");
  return (
    <svg viewBox="0 0 150 110" className="block h-auto w-full overflow-visible">
      <defs>
        <radialGradient id={`tb${uid}`}>
          <stop offset="0" stopColor={UP} stopOpacity=".9" />
          <stop offset="1" stopColor={UP} stopOpacity="0" />
        </radialGradient>
      </defs>
      <ellipse cx="66" cy="108.5" rx="56" ry="2" fill="#000" opacity=".5" />
      {/* far legs */}
      <polygon points="34,60 48,64 40,104 30,104" fill="#14181b" />
      <polygon points="28,102 42,102 43,109 26,109" fill="#0b0d0f" />
      <polygon points="82,64 96,66 104,104 94,104" fill="#14181b" />
      <polygon points="92,102 106,101 108,109 90,109" fill="#0b0d0f" />
      {/* tail */}
      <polyline points="14,48 6,58 4,70" fill="none" stroke="#2c3439" strokeWidth="2" strokeLinecap="round" />
      <polygon points="1,69 7,69 4,77" fill="#1b2024" />
      {/* near legs, braced */}
      <polygon points="18,50 46,56 36,84 18,80" fill="#1b2024" />
      <polygon points="18,80 36,84 22,104 12,104" fill="#171b1e" />
      <polygon points="9,102 25,102 26,109 7,109" fill="#0b0d0f" />
      <polygon points="88,60 106,64 120,100 108,103" fill="#1d2327" />
      <polygon points="105,101 121,98 124,107 105,109" fill="#0b0d0f" />
      {/* body with the shoulder hump */}
      <polygon points="14,48 40,30 54,52" fill="#262d32" />
      <polygon points="40,30 74,22 70,50 54,52" fill="#2c3439" />
      <polygon points="74,22 100,28 114,44 70,50" fill="#262d32" />
      <polygon points="14,48 54,52 28,74" fill="#1b2024" />
      <polygon points="54,52 70,50 72,78 28,74" fill="#171b1e" />
      <polygon points="70,50 114,44 108,72 72,78" fill="#1d2327" />
      {/* far horn, neck, head */}
      <polygon points="126,41 130,28 138,19 145,16 140,26 134,42" fill="#5f6a70" />
      <polygon points="100,28 124,38 122,62 108,72" fill="#20262a" />
      <polygon points="120,38 140,46 132,56" fill="#38424a" />
      <polygon points="132,56 140,46 150,58" fill="#283035" />
      <polygon points="126,66 120,38 132,56" fill="#2b3338" />
      <polygon points="126,66 132,56 150,58 144,70" fill="#1d2327" />
      <polygon points="144,56 152,58 152,64 146,70" fill="#30383d" />
      <ellipse cx="148.5" cy="62" rx="1.5" ry="1" fill="#040506" />
      {/* near horn */}
      <polygon points="117,43 109,33 108,21 113,11 121,5 118,17 119,28 127,39" fill="#9aa5ab" />
      <polygon points="109,33 108,21 113,11 121,5 116,19 115,31" fill="#c9d1d5" />
      <polygon points="117,43 127,39 125,44" fill="#5d676d" />
      {/* brow + eye */}
      <polygon points="128,46 142,50 141,52 128,49" fill="#4a545a" />
      <circle cx="135" cy="52" r="7" fill={`url(#tb${uid})`} opacity=".5" />
      <polygon points="130,50 140,53 138,55 130,52" fill={UP} />
      {/* nose ring the rope is tied to */}
      <circle cx="150" cy="61" r="3" fill="none" stroke="#A3AAAC" strokeWidth="1.3" />
      {/* rim light */}
      <polyline points="14,48 40,30 74,22 100,28 120,38 140,46 150,58" fill="none" stroke={UP} strokeWidth="1.6" strokeLinejoin="round" opacity=".85" />
      <polyline points="106,64 120,100" fill="none" stroke={UP} strokeWidth="1" opacity=".35" />
    </svg>
  );
}
