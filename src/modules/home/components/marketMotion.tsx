"use client";

// Market-themed scroll motion for the homepage: candle-word headings, scroll-scrubbed
// paragraphs, candle cards, scrubbed price-line seams, slot-reel digit rolls and the
// CSS for hover micro-motion. Transform / opacity / clip-path / stroke-dashoffset only.
//
// One shared, rAF-throttled window scroll listener (the "scroll bus") feeds every
// scrubbed element here and the scroll-candle meter — no per-element scroll listeners.
// Everything decorative carries no numbers; the only numbers that roll are real values
// already on the page, and a roll only ever settles on that exact value.
import { frame, motion, useInView, useMotionValue, useReducedMotion, useTransform, type MotionValue, type TargetAndTransition, type Variants } from "framer-motion";
import { Fragment, useEffect, useId, useRef, type ReactNode, type RefObject } from "react";
import { playSfx } from "./sfx";

const EASE = [0.16, 1, 0.3, 1] as const;
const UP = "#00E676";
const DOWN = "#FF3B3B";
const VIEW = { once: true, margin: "0px 0px -8% 0px" } as const;

function prefersReduced() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/* ───────────────────────────── scroll bus ───────────────────────────── */

type ScrollSub = (y: number, dt: number) => void;
const subs = new Set<ScrollSub>();
let scheduled = false;
let lastT = 0;

function flush() {
  scheduled = false;
  const now = performance.now();
  const dt = lastT ? now - lastT : 16;
  lastT = now;
  const y = window.scrollY;
  subs.forEach((fn) => fn(y, dt));
}
function onScroll() {
  if (scheduled) return;
  scheduled = true;
  // framer's read phase: rect reads batch before its render writes (no layout thrash).
  frame.read(flush);
}

/** Subscribe to the shared scroll bus. Fires once on the next frame too. */
export function subscribeScroll(fn: ScrollSub) {
  subs.add(fn);
  if (subs.size === 1) {
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
  }
  frame.read(() => fn(window.scrollY, 16));
  return () => {
    subs.delete(fn);
    if (subs.size === 0) {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    }
  };
}

/** Edge pairs `[targetFraction, viewportFraction]` — like useScroll's "start 85%". */
type Edge = readonly [number, number];

/** 0→1 progress of `ref` between two scroll edges, as a MotionValue (no re-renders).
 *  Reduced motion → pinned at 1 (final state). */
export function useScrollProgress(ref: RefObject<Element | null>, from: Edge, to: Edge): MotionValue<number> {
  const progress = useMotionValue(0);
  const [tA, vA] = from;
  const [tB, vB] = to;
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReduced()) {
      progress.set(1);
      return;
    }
    return subscribeScroll(() => {
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const s0 = r.top + tA * r.height - vA * vh;
      const s1 = r.top + tB * r.height - vB * vh;
      const span = s1 - s0 || 1;
      const p = Math.min(1, Math.max(0, -s0 / span));
      if (Math.abs(p - progress.get()) > 0.0005) progress.set(p);
    });
  }, [ref, progress, tA, vA, tB, vB]);
  return progress;
}

/** Quiet "tick" for settling numbers / closed candles — at most one per 600ms page-wide. */
let lastTick = 0;
export function softTick() {
  const now = typeof performance === "undefined" ? 0 : performance.now();
  if (now - lastTick < 600) return;
  lastTick = now;
  playSfx("tick");
}

/* ─────────────────────────── candle headings ─────────────────────────── */

/** Gap open: how far (px) a word opens away from its baseline before the gap fills. */
const GAP_PX = 10;

/** Heading words OPEN ON A PRICE GAP, then fill it — one coherent candle motion:
 *  each word's body grows from its base (scaleY .3 → 1, like a candle printing) while it
 *  sits gapped off the baseline — green words open 10px ABOVE (gap-up) and drop, red words
 *  open 10px BELOW (gap-down) and rise — then the gap fills and the word settles on the
 *  baseline. A 1px dashed connector in the word's colour spans the gap (old → new level)
 *  and fades as it closes. 0.04 stagger. Must sit inside a motion parent that switches
 *  `hidden` → `visible`. Real text stays HTML (connectors are aria-hidden).
 *  Reduced motion: zero-duration → the settled heading renders immediately, no connectors. */
export function CandleWords({ text, delay = 0, renderWord }: { text: string; delay?: number; renderWord?: (word: string) => ReactNode }) {
  const reduce = useReducedMotion();
  const words = text.split(/\s+/).filter(Boolean);
  return words.map((word, index) => {
    const at = delay + index * 0.04;
    const up = index % 2 === 0; // alternate: gap-up (green, from above) · gap-down (red, from below)
    const gap = up ? -GAP_PX : GAP_PX;
    return (
      <Fragment key={`${word}-${index}`}>
        {index > 0 && " "}
        <span className="relative inline-block" data-gap={up ? "up" : "down"}>
          <motion.span
            className="inline-block origin-bottom"
            variants={{
              hidden: { y: gap, scaleY: 0.3, opacity: 0 },
              visible: {
                y: [gap, gap, 0],
                scaleY: [0.3, 1, 1],
                opacity: [0, 1, 1],
                transition: reduce ? { duration: 0 } : { duration: 0.72, delay: at, ease: EASE, times: [0, 0.42, 1] },
              },
            }}
          >
            {renderWord ? renderWord(word) : word}
          </motion.span>
          <motion.span
            aria-hidden="true"
            data-gap-line=""
            className="pointer-events-none absolute -left-[3px] w-px"
            style={{
              height: GAP_PX,
              // spans the gap between the opening level and the baseline level (top edge of the word box)
              top: up ? -GAP_PX : 0,
              transformOrigin: up ? "50% 100%" : "50% 0%",
              backgroundImage: `repeating-linear-gradient(to bottom, ${up ? UP : DOWN} 0 2px, transparent 2px 4px)`,
            }}
            variants={{
              hidden: { scaleY: 1, opacity: 0 },
              visible: {
                scaleY: [1, 1, 0],
                opacity: [0, 1, 0],
                transition: reduce ? { duration: 0 } : { duration: 0.72, delay: at + 0.1, times: [0, 0.4, 1], ease: "easeOut" },
              },
            }}
          />
        </span>
      </Fragment>
    );
  });
}

/* ───────────────────────── scroll-scrubbed copy ───────────────────────── */

function ScrubWord({ progress, start, end, word, tick }: { progress: MotionValue<number>; start: number; end: number; word: string; tick: string | null }) {
  // Unlit words start at two-thirds strength, not fainter: --mk-dim copy on the near-black page
  // still clears 4.5:1 before it lights (0.5 was 3.4:1, 0.22 was 1.5:1).
  const opacity = useTransform(progress, [start, end], [0.66, 1]);
  const scaleX = useTransform(progress, [start, end], [0, 1]);
  return (
    <motion.span className="relative" style={{ opacity }}>
      {word}
      {tick && (
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-[2px] left-0 right-0 h-px origin-left opacity-70"
          style={{ scaleX, background: tick }}
        />
      )}
    </motion.span>
  );
}

/** Paragraph that lights word-by-word with scroll (["start 85%", "end 55%"]), reverses on
 *  scroll up; every ~6th longer word gets a tiny green/red underline tick as it lights. */
export function ScrubText({ text, className, as = "p" }: { text: string; className?: string; as?: "p" | "span" }) {
  const ref = useRef<HTMLParagraphElement & HTMLSpanElement>(null);
  const progress = useScrollProgress(ref, [0, 0.85], [1, 0.55]);
  const words = text.split(/\s+/).filter(Boolean);
  const n = words.length;
  let marks = 0;
  const content = words.map((word, index) => {
    const start = (index / n) * 0.82;
    const tick = index % 6 === 3 && word.replace(/\W/g, "").length > 3 ? (marks++ % 2 === 0 ? UP : DOWN) : null;
    return (
      <Fragment key={`${word}-${index}`}>
        {index > 0 && " "}
        <ScrubWord progress={progress} start={start} end={start + 0.18} word={word} tick={tick} />
      </Fragment>
    );
  });
  return as === "span" ? (
    <span ref={ref} className={className}>
      {content}
    </span>
  ) : (
    <p ref={ref} className={className}>
      {content}
    </p>
  );
}

/* ────────────────────────────── candle cards ────────────────────────────── */

/** Mini decorative 6-candle sparkline (no numbers) shown on card hover. */
function HoverCandles({ up }: { up: boolean }) {
  // Heights trend up (green) or down (red); one counter-move candle in neutral grey.
  const bars = up ? [4, 6, 5, 8, 10, 12] : [12, 10, 11, 7, 6, 4];
  const color = up ? UP : DOWN;
  return (
    <svg aria-hidden="true" viewBox="0 0 34 16" className="mkc-spark pointer-events-none absolute right-3 top-2.5 z-10 h-4 w-[34px]">
      {bars.map((h, i) => {
        const counter = i === 2;
        const x = 1 + i * 5.6;
        const top = 15 - h;
        return (
          <g key={i} style={{ transitionDelay: `${i * 0.035}s` }}>
            <line x1={x + 1.5} x2={x + 1.5} y1={Math.max(0.5, top - 2)} y2={15.5} stroke={counter ? "#6D7578" : color} strokeWidth={0.8} />
            <rect x={x} y={top} width={3} height={h} rx={0.5} fill={counter ? "#6D7578" : color} />
          </g>
        );
      })}
    </svg>
  );
}

/** Card entrance like a candle printing: the body grows up from the bottom (clip-path
 *  inset 100%→0, content fades), then a 1px green wick draws up from the top edge centre
 *  and fades. Hover: a decorative 6-candle spark animates in the top-right corner.
 *  Inside a variants parent by default; `standalone` triggers on its own view. */
export function CandleCard({
  children,
  index = 0,
  delay = 0,
  className = "",
  bodyClassName = "",
  as = "div",
  standalone = false,
  spark = true,
  amount,
  snakeTarget = false,
}: {
  children: ReactNode;
  index?: number;
  delay?: number;
  className?: string;
  bodyClassName?: string;
  as?: "div" | "li";
  standalone?: boolean;
  spark?: boolean;
  /** standalone only: fraction of the card that must be visible to trigger. */
  amount?: number;
  /** Marks this card as the landing point of its section's CandleSnake. */
  snakeTarget?: boolean;
}) {
  const reduce = useReducedMotion();
  const instant = { duration: 0 };
  const body: Variants = {
    hidden: { clipPath: "inset(100% 0% 0% 0%)", opacity: 0 },
    visible: {
      clipPath: "inset(0% 0% 0% 0%)",
      opacity: 1,
      transition: reduce ? instant : { clipPath: { duration: 0.6, delay, ease: EASE }, opacity: { duration: 0.3, delay, ease: EASE } },
      transitionEnd: { clipPath: "none" },
    },
  };
  const wick: Variants = {
    hidden: { scaleY: 0, opacity: 0 },
    visible: {
      scaleY: [0, 1, 1],
      opacity: [0, 1, 0],
      transition: reduce ? instant : { duration: 0.9, delay: delay + 0.42, times: [0, 0.4, 1], ease: "easeOut" },
    },
  };
  const trigger = standalone ? { initial: "hidden", whileInView: "visible", viewport: amount ? { once: true, amount } : VIEW } : {};
  const inner = (
    <>
      <motion.span
        aria-hidden="true"
        variants={wick}
        className="pointer-events-none absolute bottom-full left-1/2 z-10 h-6 w-px origin-bottom bg-[linear-gradient(0deg,#00E676,rgba(0,230,118,0))]"
      />
      <motion.div variants={body} className={`relative h-full ${bodyClassName}`}>
        {children}
        {spark && <HoverCandles up={index % 2 === 0} />}
      </motion.div>
    </>
  );
  const snake = snakeTarget ? { "data-snake-target": "" } : {};
  return as === "li" ? (
    <motion.li className={`mkc-card relative ${className}`} {...trigger} {...snake}>
      {inner}
    </motion.li>
  ) : (
    <motion.div className={`mkc-card relative ${className}`} {...trigger} {...snake}>
      {inner}
    </motion.div>
  );
}

/* ─────────────────────────── scrubbed price seam ─────────────────────────── */

type Pt = readonly [number, number];
// x in 0..1, y in px of a 64px band (0 = top). Overall up-trend (positive content).
const UP_LINE: Pt[] = [[0, 50], [0.08, 46], [0.16, 52], [0.26, 38], [0.34, 42], [0.46, 30], [0.55, 34], [0.66, 22], [0.74, 26], [0.86, 14], [1, 10]];
// Launch: sells off first (red), then recovers into the offers (green).
const DIP_LINE: Pt[] = [[0, 22], [0.1, 28], [0.2, 40], [0.3, 36], [0.4, 50], [0.5, 46], [0.6, 34], [0.7, 38], [0.82, 22], [0.92, 18], [1, 10]];
const UP_CANDLES = [0.2, 0.42, 0.63, 0.84];
const DIP_CANDLES = [0.18, 0.38, 0.64, 0.86];

function SeamCandle({ progress, x, y, color, tall }: { progress: MotionValue<number>; x: number; y: number; color: string; tall: number }) {
  const scaleY = useTransform(progress, [x - 0.01, x + 0.06], [0, 1]);
  const opacity = useTransform(progress, [x - 0.01, x + 0.03], [0, 1]);
  return (
    <motion.span
      aria-hidden="true"
      className="absolute -ml-[3.5px] w-[7px] origin-bottom"
      style={{ left: `${x * 100}%`, top: y - tall / 2 - 6, height: tall + 12, scaleY, opacity }}
    >
      <span className="absolute inset-y-0 left-[3px] w-px" style={{ background: color, opacity: 0.75 }} />
      <span className="absolute inset-x-0 rounded-[1px]" style={{ top: 6, bottom: 6, background: color }} />
    </motion.span>
  );
}

function yAt(points: Pt[], x: number) {
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i];
    const [x0, y0] = points[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0 || 1)) * (y1 - y0);
  }
  return points[points.length - 1][1];
}

/** Full-width section seam: a price line drawn by scroll (clip-path tied to scroll through
 *  the gap) with candles popping up as the line passes them. Green = positive next section;
 *  `toRed` (into Launch) = a red sell-off recovering to green. Decorative — no numbers. */
export function ScrubSeam({ toRed = false, className = "" }: { toRed?: boolean; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const gid = useId().replace(/:/g, "");
  const progress = useScrollProgress(ref, [0, 0.95], [1, 0.42]);
  const points = toRed ? DIP_LINE : UP_LINE;
  const xs = toRed ? DIP_CANDLES : UP_CANDLES;
  const clipPath = useTransform(progress, (p) => `inset(-6px ${((1 - p) * 100).toFixed(2)}% -6px 0)`);
  const tipX = useTransform(progress, (p) => `${(p * 100).toFixed(2)}%`);
  const tipY = useTransform(progress, points.map((p) => p[0]), points.map((p) => p[1] - 2));
  const tipOpacity = useTransform(progress, [0, 0.02, 0.98, 1], [0, 1, 1, 0.6]);
  const d = points.map(([x, y], i) => `${i ? "L" : "M"}${(x * 1000).toFixed(0)} ${y}`).join(" ");
  return (
    <div ref={ref} aria-hidden="true" className={`pointer-events-none relative mb-10 h-16 w-full ${className}`}>
      <span className="absolute inset-x-0 top-1/2 h-px bg-white/[.05]" />
      <motion.div className="absolute inset-0" style={{ clipPath }}>
        <svg viewBox="0 0 1000 64" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible">
          <defs>
            <linearGradient id={`seam-${gid}`} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="1000" y2="0">
              {toRed ? (
                <>
                  <stop offset="0" stopColor={DOWN} stopOpacity=".35" />
                  <stop offset=".5" stopColor={DOWN} />
                  <stop offset=".62" stopColor={UP} />
                  <stop offset="1" stopColor={UP} />
                </>
              ) : (
                <>
                  <stop offset="0" stopColor="#00A85A" stopOpacity=".25" />
                  <stop offset="1" stopColor={UP} />
                </>
              )}
            </linearGradient>
          </defs>
          <path d={d} fill="none" stroke={`url(#seam-${gid})`} strokeWidth={1.6} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
        </svg>
      </motion.div>
      {xs.map((x, i) => {
        const red = toRed ? x < 0.55 : i === 1;
        return <SeamCandle key={i} progress={progress} x={x} y={yAt(points, x)} color={red ? DOWN : UP} tall={red ? 12 : 16 + i * 3} />;
      })}
      {/* Tip dot rides a full-width track translated by p·100%; the clip keeps that track
          from ever widening the page. */}
      <span className="absolute -inset-x-1 inset-y-0 overflow-hidden">
        <motion.span className="absolute inset-y-0 left-1 right-1" style={{ x: tipX, opacity: tipOpacity }}>
          <motion.span className="absolute -left-[2px] top-0 h-1 w-1 rounded-full bg-[#00E676]" style={{ y: tipY }} />
        </motion.span>
      </span>
    </div>
  );
}

/* ───────────────────────────── digit rolls ───────────────────────────── */

// Module-level targets: identical objects across renders, so a re-render (live poll,
// clock tick) never restarts a finished roll.
const REAL_ROLL: TargetAndTransition = { opacity: [0, 0, 1] };
const REEL_START: TargetAndTransition = { opacity: 0, visibility: "hidden", y: "0%" };
const REEL_ROLL: TargetAndTransition = { opacity: [1, 1, 0], y: ["0%", "-900%", "-900%"], visibility: "visible", transitionEnd: { visibility: "hidden" } };

function Reel({ digit, run, delay, onDone }: { digit: number; run: boolean; delay: number; onDone?: () => void }) {
  // Ten cells ending on the true digit: (d+1 … d+9, d). Ends exactly on the real value.
  const cells = Array.from({ length: 10 }, (_, k) => (digit + k + 1) % 10);
  const timing = { duration: 0.75, delay, ease: EASE, times: [0, 0.92, 1] };
  return (
    <span className="relative inline-block tabular-nums">
      <motion.span
        className="inline-block"
        initial={false}
        animate={run ? REAL_ROLL : undefined}
        transition={timing}
      >
        {digit}
      </motion.span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.span
          className="absolute inset-x-0 top-0 block h-full"
          initial={REEL_START}
          animate={run ? REEL_ROLL : undefined}
          transition={timing}
          onAnimationComplete={onDone}
        >
          {cells.map((cell, k) => (
            <span key={k} className="block h-full text-center">
              {cell}
            </span>
          ))}
        </motion.span>
      </span>
    </span>
  );
}

/** A real number that rolls like a ticker reel once when it enters view and settles on its
 *  exact value (non-digits stay static). The true value is in the DOM before and after; the
 *  reel overlay is aria-hidden. Reduced motion → no roll. Soft tick on settle. */
export function RollNumber({ value, className }: { value: string; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, VIEW);
  const reduce = useReducedMotion();
  const run = inView && !reduce;
  const chars = [...value];
  const digitCount = chars.filter((c) => c >= "0" && c <= "9").length;
  let seen = 0;
  return (
    <span ref={ref} className={`${className ?? ""} tabular-nums`}>
      {chars.map((char, index) => {
        if (char < "0" || char > "9") return <Fragment key={index}>{char}</Fragment>;
        const order = seen++;
        // Settle left → right so the last digit lands last, like a slot machine.
        return <Reel key={index} digit={Number(char)} run={run} delay={order * 0.06} onDone={order === digitCount - 1 ? softTick : undefined} />;
      })}
    </span>
  );
}

/* ───────────────────────── misc. scroll helpers ───────────────────────── */

/** Speeds a CSS marquee (its first running animation) up with scroll velocity and eases
 *  it back to 1× — via the Web Animations playbackRate, so the loop stays compositor-driven. */
export function useMarqueeVelocity<T extends HTMLElement>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReduced() || typeof el.getAnimations !== "function") return;
    let lastY = window.scrollY;
    let rate = 1;
    let raf = 0;
    const apply = () => {
      const anim = el.getAnimations()[0];
      if (anim) anim.updatePlaybackRate(rate);
    };
    const decay = () => {
      rate = 1 + (rate - 1) * 0.9;
      if (rate < 1.02) rate = 1;
      apply();
      raf = rate > 1 ? requestAnimationFrame(decay) : 0;
    };
    const unsub = subscribeScroll((y, dt) => {
      const v = Math.abs(y - lastY) / Math.max(8, dt); // px per ms
      lastY = y;
      const box = el.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      const target = 1 + Math.min(6, v * 3.2);
      if (target > rate) rate = target;
      apply();
      if (!raf && rate > 1) raf = requestAnimationFrame(decay);
    });
    return () => {
      unsub();
      cancelAnimationFrame(raf);
    };
  }, []);
  return ref;
}

/** One-shot rise for static blocks (footer columns). */
export function RiseIn({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW}
      transition={reduce ? { duration: 0 } : { duration: 0.45, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/* ─────────────────────────────── CSS ─────────────────────────────── */

const CSS = [
  // Card hover: decorative candles grow in, staggered.
  ".mkc-spark{opacity:0;transition:opacity .2s cubic-bezier(.16,1,.3,1)}",
  ".mkc-spark g{transform:scaleY(0);transform-box:fill-box;transform-origin:50% 100%;transition:transform .24s cubic-bezier(.16,1,.3,1)}",
  "@media (hover:hover){.mkc-card:hover .mkc-spark{opacity:1}.mkc-card:hover .mkc-spark g{transform:scaleY(1)}}",
  // Icon tiles: glyph draws in on reveal (stroke-dashoffset), bobs up-then-down on hover.
  ".mkc-glyph path{stroke-dasharray:1 1;stroke-dashoffset:0}",
  ".mkc-tile[data-drawn] .mkc-glyph path{animation:mkc-draw .7s cubic-bezier(.16,1,.3,1) both}",
  "@media (hover:hover){.mkc-tile:hover svg,.mkc-card:hover .mkc-tile svg,a:hover>.mkc-tile svg{animation:mkc-bob .45s cubic-bezier(.16,1,.3,1)}}",
  "@media (hover:hover){.mkc-card:hover .mkc-tile[data-drawn] .mkc-glyph path{animation:mkc-redraw .6s cubic-bezier(.16,1,.3,1) both}}",
  "@keyframes mkc-redraw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}",
  "@keyframes mkc-draw{from{stroke-dashoffset:1}to{stroke-dashoffset:0}}",
  "@keyframes mkc-bob{0%{transform:translateY(0)}40%{transform:translateY(-2px)}100%{transform:translateY(0)}}",
  // Nav wordmark: one-time staggered letter rise.
  ".mkc-wm>span{display:inline-block;animation:mkc-letter .45s cubic-bezier(.16,1,.3,1) both}",
  ".mkc-wm>span:nth-child(2){animation-delay:.05s}.mkc-wm>span:nth-child(3){animation-delay:.1s}.mkc-wm>span:nth-child(4){animation-delay:.15s}.mkc-wm>span:nth-child(5){animation-delay:.2s}",
  "@keyframes mkc-letter{from{opacity:0;transform:translateY(60%) scaleY(.4)}to{opacity:1;transform:none}}",
  // Footer links: 2px green up-tick before the text on hover (absolute — no shift).
  ".mkc-flink{position:relative}",
  ".mkc-flink::before{content:'';position:absolute;left:-8px;top:50%;width:2px;height:9px;margin-top:-5px;background:#00E676;border-radius:1px;transform:scaleY(0);transform-origin:50% 100%;transition:transform .2s cubic-bezier(.16,1,.3,1)}",
  ".mkc-flink:hover::before,.mkc-flink:focus-visible::before{transform:scaleY(1)}",
  // Topic chips: tiny green/red tick on hover (alternating).
  ".mkc-chip{position:relative}",
  ".mkc-chip::after{content:'';position:absolute;right:9px;top:50%;width:2px;height:10px;margin-top:-5px;border-radius:1px;background:#00E676;transform:scaleY(0);transform-origin:50% 100%;transition:transform .2s cubic-bezier(.16,1,.3,1)}",
  ".mkc-chip:nth-child(even)::after{background:#FF3B3B;transform-origin:50% 0}",
  ".mkc-chip:hover::after,.mkc-chip:focus-visible::after{transform:scaleY(1)}",
  "@media (prefers-reduced-motion:reduce){.mkc-wm>span,.mkc-tile[data-drawn] .mkc-glyph path,.mkc-tile svg{animation:none!important}.mkc-spark g,.mkc-flink::before,.mkc-chip::after{transition:none}}",
].join("");

/** Hoisted stylesheet for the market micro-motion (rendered once by SiteShell). */
export function MarketMotionStyles() {
  return (
    <style href="afvar-mkt-motion" precedence="default">
      {CSS}
    </style>
  );
}
