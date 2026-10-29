"use client";

// Trading-themed connective tissue for /home-demo.
//
//   <CandleSweep>  between sections: a chain of candles carrying currency
//                  coins slithers across the screen like a snake — a wave
//                  runs head to tail, the tail tapers, a glowing head leads,
//                  stars twinkle along its back — with a whoosh.
//   <SnakeBorder>  a chain of tiny candles slithers around a card's border and
//                  ends wrapped all the way round it, head glowing.
//   <OilPour>      a WTI drum fills to the brim and overflows, then tips over
//                  and black crude pours onto the text, coats the letters,
//                  drips down and pools, with a glug.
//   <OilSeam>      the spill runs on along the next section's top border.
//
// All pure functions of scroll (or a one-shot in-view play), so they reverse
// cleanly; reduced motion hides the sweep and shows end states.
import { motion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useMotionReduced } from "./motionPref";
import { useLayoutEffect, useMemo, useRef, useState } from "react";
import type { Cue } from "./audio";
import { WickText, useRevealProgress, useScrollCues } from "./kinetic";
import { clamp01, easeInOut, easeOut, ramp } from "./timeline";

const UP = "#00E676";
const DOWN = "#FF3B3B";
const COINS = ["$", "€", "¥", "£", "₹", "₿"];

/** Round to 0.01: the server prints full floats and the client prints 4
 *  decimals, so unrounded first-frame transforms fail hydration. */
const r2 = (v: number) => Math.round(v * 100) / 100;

/** mulberry32 — the same chain on every load. */
const seeded = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* ------------------------------------------------------------ CandleSweep */

const SWEEP = { candles: 30, gap: 60, width: 1800, height: 230, coinEvery: 4 };
/** The slither: amplitude (px), wavelength (rad per candle), travel (rad per scroll). */
const WAVE = { amp: 36, k: 0.42, speed: 18 };
const SWEEP_CSS =
  "@keyframes afv-twinkle{0%,100%{opacity:0;transform:scale(.2) rotate(0deg)}50%{opacity:1;transform:scale(1) rotate(45deg)}}" +
  ".afv-twinkle{transform-box:fill-box;transform-origin:center;animation:afv-twinkle 1.6s ease-in-out infinite}";
const WHOOSH: readonly { at: number; cue: Cue }[] = [{ at: 0.3, cue: "whoosh" }];

/** A short deterministic OHLC walk, a coin riding every few candles. */
function buildChain(seed: number) {
  const rnd = seeded(seed * 7919 + 13);
  let level = 0.5;
  return Array.from({ length: SWEEP.candles }, (_, i) => {
    const open = level;
    level = Math.min(0.9, Math.max(0.1, level + (rnd() - 0.48) * 0.28));
    const close = level;
    const hi = Math.max(open, close) + rnd() * 0.08;
    const lo = Math.min(open, close) - rnd() * 0.08;
    return { i, open, close, hi, lo, up: close >= open, coin: i % SWEEP.coinEvery === 2 ? COINS[(i + seed) % COINS.length] : null };
  });
}

/** Zero-height marker placed between two sections. As the next section rides
 *  up into view (marker: bottom of viewport → top), the chain crosses the screen. */
export function CandleSweep({ dir, seed }: { dir: "ltr" | "rtl"; seed: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMotionReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "start start"] });
  useScrollCues(scrollYProgress, WHOOSH);

  const candles = useMemo(() => buildChain(seed), [seed]);

  // Travels from fully off one side to fully off the other.
  const x = useTransform(scrollYProgress, (p) => {
    const t = easeInOut(p);
    return dir === "ltr" ? `${-100 + t * 200}vw` : `${100 - t * 200}vw`;
  });
  const opacity = useTransform(scrollYProgress, (p) => Math.sin(Math.PI * clamp01(p)) * 0.95);
  const bob = useTransform(scrollYProgress, (p) => p * 40);

  const y = (v: number) => 50 + (1 - v) * 120;
  const n = candles.length;
  const head = dir === "ltr" ? n - 1 : 0;
  // The tail tapers; a crest travels from the head back to the tail as the page scrolls.
  const taper = (i: number) => 0.35 + 0.65 * (dir === "ltr" ? i / (n - 1) : 1 - i / (n - 1));
  const wave = (i: number, p: number) => Math.sin(i * WAVE.k + (dir === "ltr" ? 1 : -1) * p * WAVE.speed) * WAVE.amp * taper(i);
  const chain = useTransform(scrollYProgress, (p) =>
    candles.map((c) => `${30 + c.i * SWEEP.gap},${y((c.open + c.close) / 2) + wave(c.i, p)}`).join(" "),
  );
  const headX = 30 + head * SWEEP.gap + (dir === "ltr" ? 34 : -34);
  const headY = useTransform(scrollYProgress, (p) => r2(y((candles[head].open + candles[head].close) / 2) + wave(head, p)));

  if (reduce) return <div ref={ref} aria-hidden="true" className="h-0" />;

  return (
    <div ref={ref} aria-hidden="true" className="relative h-0">
      <style>{SWEEP_CSS}</style>
      <motion.div className="pointer-events-none fixed left-0 top-1/2 z-30 -translate-y-1/2" style={{ x, opacity }}>
        <svg viewBox={`0 0 ${SWEEP.width} ${SWEEP.height}`} width={SWEEP.width} height={SWEEP.height} className="max-w-none overflow-visible">
          <defs>
            <radialGradient id={`afv-head-${seed}`}>
              <stop offset="0" stopColor="#F5F7F7" />
              <stop offset=".35" stopColor={UP} />
              <stop offset="1" stopColor={UP} stopOpacity="0" />
            </radialGradient>
          </defs>
          {/* the spine linking candle to candle, bending with the body */}
          <motion.polyline points={chain} fill="none" stroke="rgba(245,245,247,0.25)" strokeWidth={1.5} strokeDasharray="2 5" />
          {candles.map((c) => (
            <SweepCandle key={c.i} c={c} y={y} progress={scrollYProgress} wave={wave} scale={taper(c.i)} bob={bob} />
          ))}
          {/* the glowing head */}
          <motion.g style={{ y: headY }}>
            <circle cx={headX} cy={0} r={16} fill={`url(#afv-head-${seed})`} opacity={0.55} />
            <circle cx={headX} cy={0} r={6} fill={UP} />
            <circle cx={headX + (dir === "ltr" ? 2.5 : -2.5)} cy={-2} r={1.4} fill="#05130C" />
            <polygon className="afv-twinkle" points={`${headX},-14 ${headX + 2},-10 ${headX + 6},-8 ${headX + 2},-6 ${headX},-2 ${headX - 2},-6 ${headX - 6},-8 ${headX - 2},-10`} fill="#F5F7F7" />
          </motion.g>
        </svg>
      </motion.div>
    </div>
  );
}

type Candle = ReturnType<typeof buildChain>[number];

/** One body segment: rides the wave, shrinks toward the tail, and every third
 *  one carries a twinkling star above its wick. */
function SweepCandle({
  c,
  y,
  progress,
  wave,
  scale,
  bob,
}: {
  c: Candle;
  y: (v: number) => number;
  progress: MotionValue<number>;
  wave: (i: number, p: number) => number;
  scale: number;
  bob: MotionValue<number>;
}) {
  const dy = useTransform(progress, (p) => r2(wave(c.i, p)));
  const cx = 30 + c.i * SWEEP.gap;
  const color = c.up ? UP : DOWN;
  const top = y(Math.max(c.open, c.close));
  const bottom = y(Math.min(c.open, c.close));
  const w = 18 * scale;
  const sy = y(c.hi) - 12;
  return (
    <motion.g style={{ y: dy }}>
      <line x1={cx} x2={cx} y1={y(c.hi)} y2={y(c.lo)} stroke={color} strokeWidth={2 * scale} />
      <rect x={cx - w / 2} y={top} width={w} height={Math.max(4, bottom - top)} fill={color} rx={1.5} />
      {c.i % 3 === 1 ? (
        <polygon
          className="afv-twinkle"
          style={{ animationDelay: `${(c.i * 0.23) % 1.6}s` }}
          points={`${cx},${sy - 7} ${cx + 1.6},${sy - 1.6} ${cx + 7},${sy} ${cx + 1.6},${sy + 1.6} ${cx},${sy + 7} ${cx - 1.6},${sy + 1.6} ${cx - 7},${sy} ${cx - 1.6},${sy - 1.6}`}
          fill={c.up ? "#B9F5DB" : "#FFC2BD"}
        />
      ) : null}
      {c.coin ? <Coin cx={cx} cy={y(c.hi) - 26} glyph={c.coin} bob={bob} phase={c.i} /> : null}
    </motion.g>
  );
}

function Coin({ cx, cy, glyph, bob, phase }: { cx: number; cy: number; glyph: string; bob: MotionValue<number>; phase: number }) {
  const dy = useTransform(bob, (b) => r2(-Math.abs(Math.sin(b + phase)) * 14));
  const sx = useTransform(bob, (b) => r2(Math.abs(Math.cos(b * 0.7 + phase)) * 0.7 + 0.3));
  return (
    <motion.g style={{ y: dy }}>
      <motion.g style={{ scaleX: sx, originX: `${cx}px`, originY: `${cy}px` }}>
        <circle cx={cx} cy={cy} r={15} fill="#111416" stroke="#E8C547" strokeWidth={2.5} />
        <circle cx={cx} cy={cy} r={11} fill="none" stroke="rgba(232,197,71,0.4)" strokeWidth={1} />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize={17} fontWeight={700} fill="#E8C547" fontFamily="system-ui, sans-serif">
          {glyph}
        </text>
      </motion.g>
    </motion.g>
  );
}

/* ------------------------------------------------------------ SnakeBorder */

/** Point along a w×h rectangle's border at distance s from the top-left
 *  corner, going clockwise; angle is the direction of travel. */
function perimeterPoint(s: number, w: number, h: number) {
  const P = 2 * (w + h);
  let d = ((s % P) + P) % P;
  if (d < w) return { x: d, y: 0, angle: 0 };
  d -= w;
  if (d < h) return { x: w, y: d, angle: 90 };
  d -= h;
  if (d < w) return { x: w - d, y: h, angle: 180 };
  d -= w;
  return { x: 0, y: h - d, angle: 270 };
}

/** Wraps a card: a candle-chain snake slithers round its border and ends
 *  coiled all the way round. Scroll-driven (mv, at) or plays once in view. */
export function SnakeBorder({
  mv,
  at,
  tone = "up",
  count = 22,
  className,
  children,
}: {
  mv?: MotionValue<number>;
  at?: readonly [number, number];
  tone?: "up" | "down";
  count?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 0, h: 0 });
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const measure = () => setSize({ w: el.offsetWidth, h: el.offsetHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const progress = useRevealProgress(ref, mv, at, 1.8);
  // Candle build: a wick appears first, then the body opens out of it.
  const body = useTransform(progress, (p) => easeOut(ramp(p, 0.08, 0.38)));
  const clipPath = useTransform(body, (b) => `inset(${(1 - b) * 50}% 0 ${(1 - b) * 50}% 0)`);
  const wickScale = useTransform(progress, (p) => ramp(p, 0, 0.12));
  const wickOpacity = useTransform(body, (b) => (b >= 1 ? 0 : 1 - b * 0.7));
  const wickColor = tone === "down" ? DOWN : UP;

  return (
    <div ref={ref} className={`relative ${className ?? ""}`}>
      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 left-1/2 z-10 w-[2px] -translate-x-1/2"
        style={{ scaleY: wickScale, opacity: wickOpacity, background: wickColor }}
      />
      <motion.div className="flex h-full w-full flex-col" style={{ clipPath }}>
        {children}
      </motion.div>
      {size.w > 0
        ? Array.from({ length: count }, (_, i) => (
            <SnakeSegment key={i} i={i} n={count} progress={progress} w={size.w} h={size.h} tone={tone} />
          ))
        : null}
    </div>
  );
}

function SnakeSegment({ i, n, progress, w, h, tone }: { i: number; n: number; progress: MotionValue<number>; w: number; h: number; tone: "up" | "down" }) {
  const P = 2 * (w + h);
  // Head at p·P, tail at p·P/n: the snake grows as it travels; at p=1 the
  // segments sit evenly all the way round — wrapped.
  const s = useTransform(progress, (p) => easeOut(p) * P * (1 - i / n));
  const x = useTransform(s, (v) => perimeterPoint(v, w, h).x);
  const y = useTransform(s, (v) => perimeterPoint(v, w, h).y);
  const rotate = useTransform(s, (v) => perimeterPoint(v, w, h).angle);
  const opacity = useTransform(progress, (p) => (p <= 0.001 ? 0 : 1));
  const head = i === 0;
  const color = tone === "down" ? (i % 3 === 1 ? UP : DOWN) : i % 3 === 1 ? DOWN : UP;
  const hgt = head ? 12 : 6 + ((i * 7) % 5) * 2;
  return (
    <motion.span
      aria-hidden="true"
      className="pointer-events-none absolute left-0 top-0 z-20"
      style={{ x, y, rotate, opacity, translateX: "-50%", translateY: "-50%" }}
    >
      {head ? (
        <span className="block h-3 w-3 rotate-45 rounded-[2px] shadow-[0_0_10px_rgba(0,230,118,0.9)]" style={{ background: tone === "down" ? DOWN : UP }} />
      ) : (
        <span className="relative flex flex-col items-center">
          <span className="block w-px" style={{ height: 3, background: color }} />
          <span className="block w-[5px] rounded-[1px]" style={{ height: hgt, background: color }} />
          <span className="block w-px" style={{ height: 3, background: color }} />
        </span>
      )}
    </motion.span>
  );
}

/* ---------------------------------------------------------------- OilPour */

const OIL = "#140e07";
const SHEEN = "#7a6440";
/** The glug lands as the stream leaves the drum (on the pour's own 0..1). */
const GLUG: readonly { at: number; cue: Cue }[] = [{ at: 0.27, cue: "glug" }];

/** A WTI drum drops in and fills (the level climbs its sight glass until crude
 *  spills over the rim), then tips over above a line of text and pours onto it.
 *  `at` is the progress window for the whole pour. Place inside the text's
 *  positioned container; the svg sits over its first ~260px. */
export function OilPour({
  mv,
  at,
  place = "-bottom-[34px] left-[26px]",
}: {
  mv: MotionValue<number>;
  at: readonly [number, number];
  /** Where the 260×300 svg sits; the oil coat lands 236px down it. */
  place?: string;
}) {
  const local = useTransform(mv, (p) => ramp(p, at[0], at[1]));
  useScrollCues(local, GLUG);

  const drumIn = useTransform(local, (l) => easeOut(ramp(l, 0, 0.1)));
  const drumY = useTransform(drumIn, (d) => (1 - d) * -60);
  // the fill: level 0 → brim, then crude crests the rim and runs down the side
  const level = useTransform(local, (l) => easeInOut(ramp(l, 0.06, 0.17)));
  const levelY = useTransform(level, (v) => 100 - v * 72);
  const levelH = useTransform(level, (v) => v * 72);
  const brim = useTransform(local, (l) => easeOut(ramp(l, 0.15, 0.2)));
  const spill = useTransform(local, (l) => easeOut(ramp(l, 0.17, 0.24)));
  const tilt = useTransform(local, (l) => easeInOut(ramp(l, 0.2, 0.34)) * 105);
  const stream = useTransform(local, (l) => easeOut(ramp(l, 0.3, 0.44)));
  const streamOut = useTransform(local, (l) => 1 - ramp(l, 0.82, 1));
  const coat = useTransform(local, (l) => easeOut(ramp(l, 0.38, 0.55)));
  const puddle = useTransform(local, (l) => easeOut(ramp(l, 0.55, 0.95)));

  const drips = [
    { x: 64, len: 26, start: 0.44 },
    { x: 92, len: 44, start: 0.48 },
    { x: 118, len: 34, start: 0.42 },
    { x: 142, len: 52, start: 0.46 },
    { x: 168, len: 30, start: 0.5 },
    { x: 190, len: 40, start: 0.54 },
  ];

  return (
    <svg aria-hidden="true" viewBox="0 0 260 300" className={`pointer-events-none absolute z-10 h-[300px] w-[260px] overflow-visible ${place}`}>
      {/* drum drops in, then tips over */}
      <motion.g style={{ y: drumY, opacity: drumIn }}>
        <motion.g style={{ rotate: tilt, originX: "65px", originY: "65px" }}>
          <rect x={30} y={22} width={70} height={86} rx={6} fill="#1b1d22" stroke="#4a505a" strokeWidth={2} />
          <ellipse cx={65} cy={22} rx={35} ry={8} fill="#26292f" stroke="#5a616c" strokeWidth={2} />
          <ellipse cx={65} cy={22} rx={20} ry={4} fill={OIL} />
          <path d="M30 48 H100 M30 82 H100" stroke="#4a505a" strokeWidth={2} />
          <rect x={36} y={56} width={58} height={20} fill="#111416" stroke={UP} strokeWidth={1} />
          <text x={65} y={71} textAnchor="middle" fontSize={13} fontWeight={700} fill={UP} fontFamily="ui-monospace, monospace" letterSpacing={2}>
            WTI
          </text>
          <path d="M38 28 V102" stroke="rgba(255,255,255,0.12)" strokeWidth={4} strokeLinecap="round" />
          {/* sight glass: the crude level climbing inside */}
          <rect x={86} y={28} width={8} height={72} fill="#111416" stroke="#4a505a" strokeWidth={1} />
          <motion.rect x={87} width={6} y={levelY} height={levelH} fill="#3a2a12" />
          <motion.rect x={87} width={6} height={1.5} y={levelY} fill={SHEEN} style={{ opacity: level }} />
          {/* full to the brim: the top swells with crude, then it overflows */}
          <motion.ellipse cx={65} cy={22} rx={34} ry={7.5} fill={OIL} stroke={SHEEN} strokeWidth={0.6} style={{ opacity: brim }} />
          <motion.path d="M31 22 C29 34 31 44 30 56" fill="none" stroke={OIL} strokeWidth={5} strokeLinecap="round" style={{ pathLength: spill }} />
          <motion.path d="M99 22 C101 30 99 38 100 46" fill="none" stroke={OIL} strokeWidth={4} strokeLinecap="round" style={{ pathLength: spill }} />
        </motion.g>
      </motion.g>

      {/* the pour */}
      <motion.path d="M106 80 C118 92 126 140 128 232" fill="none" stroke={OIL} strokeWidth={11} strokeLinecap="round" style={{ pathLength: stream, opacity: streamOut }} />
      <motion.path d="M104 82 C114 94 121 140 124 230" fill="none" stroke={SHEEN} strokeWidth={1.5} strokeLinecap="round" style={{ pathLength: stream, opacity: streamOut }} />

      {/* crude coating the tops of the letters, spreading from the landing point */}
      <motion.path
        d="M52 236 C70 226 96 230 128 228 C160 226 186 230 204 236 C186 242 160 240 128 241 C96 242 70 244 52 236 Z"
        fill={OIL}
        stroke={SHEEN}
        strokeWidth={0.8}
        style={{ scaleX: coat, originX: "128px", originY: "234px" }}
      />

      {/* drips running down through the letters */}
      {drips.map((d) => (
        <Drip key={d.x} local={local} x={d.x} len={d.len} start={d.start} />
      ))}

      {/* the pool below */}
      <motion.ellipse cx={128} cy={292} rx={78} ry={7} fill={OIL} stroke={SHEEN} strokeWidth={0.8} style={{ scaleX: puddle, scaleY: puddle, originX: "128px", originY: "292px" }} />
    </svg>
  );
}

/** Between Ch02 and Ch03: the crude that overflowed runs along the next
 *  section's top border, left to right, and hangs in drips off it. */
export function OilSeam() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useMotionReduced();
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.95", "start 0.35"] });
  useScrollCues(scrollYProgress, SEAM_GLUG);
  const run = useTransform(scrollYProgress, (p) => easeOut(clamp01(p / 0.7)));
  const fade = useTransform(scrollYProgress, (p) => Math.min(1, p * 6));
  if (reduce) return <div ref={ref} aria-hidden="true" className="h-0" />;
  return (
    <div ref={ref} aria-hidden="true" className="pointer-events-none relative z-20 h-0">
      <motion.svg viewBox="0 0 1000 60" preserveAspectRatio="none" className="absolute inset-x-0 top-0 h-[60px] w-full" style={{ opacity: fade }}>
        {/* sheen rim under the crude, so black-on-black still reads */}
        <motion.path
          d="M0 3 C120 6 240 1 380 4 C520 7 660 2 800 5 C880 6 940 3 1000 4"
          fill="none"
          stroke={SHEEN}
          strokeWidth={10}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: run }}
        />
        <motion.path
          d="M0 3 C120 6 240 1 380 4 C520 7 660 2 800 5 C880 6 940 3 1000 4"
          fill="none"
          stroke={OIL}
          strokeWidth={7}
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: run }}
        />
        <motion.path
          d="M0 1.5 C120 4 240 -0.5 380 2.5 C520 5 660 0.5 800 3.5 C880 4.5 940 1.5 1000 2.5"
          fill="none"
          stroke={SHEEN}
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
          style={{ pathLength: run }}
        />
        {SEAM_DRIPS.map((d) => (
          <SeamDrip key={d.x} run={run} {...d} />
        ))}
      </motion.svg>
    </div>
  );
}

const SEAM_GLUG: readonly { at: number; cue: Cue }[] = [{ at: 0.1, cue: "glug" }];
const SEAM_DRIPS = [
  { x: 90, len: 22 },
  { x: 230, len: 38 },
  { x: 410, len: 18 },
  { x: 560, len: 44 },
  { x: 720, len: 26 },
  { x: 880, len: 34 },
];

function SeamDrip({ run, x, len }: { run: MotionValue<number>; x: number; len: number }) {
  // each drip starts once the oil front has passed it
  const k = useTransform(run, (r) => easeOut(clamp01((r - x / 1000) / 0.25)));
  const y2 = useTransform(k, (v) => 4 + v * len);
  return (
    <>
      <motion.line x1={x} x2={x} y1={4} stroke={SHEEN} strokeWidth={6.5} strokeLinecap="round" vectorEffect="non-scaling-stroke" y2={y2} />
      <motion.line x1={x} x2={x} y1={4} stroke={OIL} strokeWidth={4} strokeLinecap="round" vectorEffect="non-scaling-stroke" y2={y2} />
    </>
  );
}

function Drip({ local, x, len, start }: { local: MotionValue<number>; x: number; len: number; start: number }) {
  const k = useTransform(local, (l) => easeOut(ramp(l, start, start + 0.3)));
  return (
    <motion.g style={{ scaleY: k, originX: `${x}px`, originY: "236px" }}>
      <path d={`M${x - 4} 236 L${x - 3} ${236 + len} A4 4 0 0 0 ${x + 3} ${236 + len} L${x + 4} 236 Z`} fill={OIL} stroke={SHEEN} strokeWidth={0.7} />
    </motion.g>
  );
}

/** Phones / non-cinematic: a caption line that gets the oil pour once it
 *  scrolls into view. Leaves room above the text for the drum. */
export function OilCaptionInView({ text }: { text: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const k = useRevealProgress(ref, undefined, undefined, 3.2);
  return (
    <div ref={ref} className="relative mt-6 pb-10 pt-[230px]">
      <WickText as="p" className="text-3xl font-medium leading-snug tracking-tight text-[#F5F7F7]" text={text} />
      <OilPour mv={k} at={[0, 1]} place="top-[2px] left-[4px]" />
    </div>
  );
}
