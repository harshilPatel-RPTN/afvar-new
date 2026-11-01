"use client";

import { motion, transform, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, useTransform, type MotionValue } from "framer-motion";
import { useEffect, useId, useRef, useState } from "react";
import { usePauseOffscreen } from "./bits";
import { playSfx } from "./sfx";

/* ── CRUDE POUR — a low-poly black steel 55-gal drum on the Commodities group.
 * Scroll-scrubbed against the group (["start end", "start 35%"]):
 *   0   → .30  the drum "walks" in on its chime from the right,
 *   .34 → .45  it tips over (-62°) about its bottom-left chime,
 *   .46 → .52  a thick glossy crude stream runs from the bung onto the label,
 *   .52 → .80  a black pool spreads along the header row (label re-rendered
 *              white on top), drips fall, the WTI price gets an oil drip,
 *   .80 → .88  the stream's tail drops; last drips fall from the bung.
 * Everything is a pure function of progress → reverse scroll rights the drum
 * and retracts the stream / pool. `pour` sfx once per downward crossing.
 * Reduced motion: drum upright, a small static pool, no sound.
 * Coordinates are px in the group's own box (0,0 = label top-left). */

const PX = 150; // drum pivot (bottom-left chime) x
const PY = 16; // drum floor y (header row, under the panel's top edge)
const DW = 56;
const DH = 84;
const TIP = -62;
const POUR = 0.46;
const STREAM = "M84,-30 C80,-23 74.5,-14 74,5";
const HIT = { x: 74, y: 5 };

const OIL = "#050607";

const OIL_CSS = [
  "@keyframes oil-flow{to{stroke-dashoffset:-14}}",
  ".oil-flow{stroke-dasharray:4 10;animation:oil-flow .5s linear infinite}",
  "@keyframes oil-shine{0%{transform:translateX(-60px)}55%,100%{transform:translateX(200px)}}",
  ".oil-shine{animation:oil-shine 4.2s cubic-bezier(.45,0,.3,1) infinite}",
  "@keyframes oil-glug{0%,100%{transform:scale(1,1)}50%{transform:scale(1.18,.8)}}",
  ".oil-glug{transform-box:fill-box;transform-origin:50% 100%;animation:oil-glug .7s ease-in-out infinite}",
  "@media (prefers-reduced-motion:reduce){.oil-flow,.oil-shine,.oil-glug{animation:none}}",
].join("");

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/** Map progress → value; `-1` is the reduced-motion "settled static" state. */
function useP(p: MotionValue<number>, fn: (v: number) => number, still: number) {
  return useTransform(p, (v) => (v < 0 ? still : fn(v)));
}

export function OilDrum({ label }: { label: string }) {
  const rootRef = usePauseOffscreen<HTMLDivElement>();
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "start 35%"] });
  const forced = useMotionValue(0);
  const p = useTransform<number, number>([scrollYProgress, forced], ([s, f]) => (f ? -1 : s));

  useEffect(() => {
    forced.set(reduce ? 1 : 0);
  }, [reduce, forced]);

  // Sound: once per downward crossing of the pour start; re-arm well before it.
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (v < 0.2) armed.current = true;
    if (prev === null || reduce || reducedNow()) return;
    if (armed.current && prev < POUR && v >= POUR) {
      armed.current = false;
      playSfx("pour");
    }
  });

  // WTI price drip: measured from layout offsets (transform-free) of the row.
  const [drip, setDrip] = useState<{ x: number; y: number } | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    const group = root?.parentElement;
    if (!root || !group || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const price = group.querySelector<HTMLElement>('[data-symbol="WTI"] .tabular-nums');
      const row = price?.closest("li");
      if (!price || !row || price.offsetParent !== row) return;
      setDrip({ x: row.offsetLeft + price.offsetLeft + price.offsetWidth - 14, y: row.offsetTop });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(group);
    return () => ro.disconnect();
  }, [rootRef]);

  // Drum
  const drumX = useP(p, (v) => transform(v, [0, 0.3], [230, 0], { ease: (t) => 1 - (1 - t) * (1 - t) }), 0);
  const drumR = useP(p, (v) => transform(v, [0, 0.06, 0.12, 0.18, 0.24, 0.3, 0.34, 0.45, 0.48, 0.52], [0, 5, -4, 4, -3, 1, 0, TIP - 4, TIP + 2, TIP]), 0);
  const drumO = useP(p, (v) => transform(v, [0, 0.05], [0, 1]), 1);
  // Stream: head draws in, tail falls away
  const head = useP(p, (v) => transform(v, [POUR, 0.52], [0, 1]), 0);
  const tail = useP(p, (v) => transform(v, [0.8, 0.88], [0, 1]), 0);
  const len = useTransform<number, number>([head, tail], ([h, t]) => Math.max(0, Math.min(h, 1 - t)));
  const streamO = useP(p, (v) => (v > POUR && v < 0.885 ? 1 : 0), 0);
  // Impact
  const splashS = useP(p, (v) => transform(v, [0.5, 0.54, 0.64], [0.2, 1.15, 0.7]), 0);
  const splashO = useP(p, (v) => transform(v, [0.5, 0.52, 0.6, 0.68], [0, 1, 1, 0]), 0);
  const moundO = useP(p, (v) => transform(v, [0.51, 0.53, 0.82, 0.9], [0, 1, 1, 0]), 0);
  // Pool + white label
  const poolSX = useP(p, (v) => transform(v, [0.51, 0.8], [0.06, 1], { ease: (t) => 1 - Math.pow(1 - t, 2.2) }), 0.36);
  const poolSY = useP(p, (v) => transform(v, [0.51, 0.6], [0.5, 1]), 1);
  const poolO = useP(p, (v) => transform(v, [0.505, 0.525], [0, 1]), 1);
  const copyO = useP(p, (v) => transform(v, [0.54, 0.66], [0, 1]), 1);
  // WTI drip
  const stemS = useP(p, (v) => transform(v, [0.6, 0.72], [0, 1]), 0);
  const dropY = useP(p, (v) => transform(v, [0.7, 0.84], [0, 30], { ease: (t) => t * t }), 0);
  const dripO = useP(p, (v) => transform(v, [0.6, 0.62, 0.84, 0.94], [0, 1, 1, 0]), 0);

  const sheen = `oilsheen${uid}`;
  const mask = `oilmask${uid}`;
  const poolFill = `oilpool${uid}`;
  const poolClip = `oilclip${uid}`;
  const shine = `oilshine${uid}`;

  return (
    <div ref={rootRef} aria-hidden="true" data-oil-drum="" className="pointer-events-none absolute inset-0">
      <style href="afvar-oil" precedence="default">
        {OIL_CSS}
      </style>

      {/* Pool — spreads from the impact point along the header row, under the label copy. */}
      <motion.svg
        className="absolute left-[-8px] top-[-6px] h-[30px] w-[180px] overflow-visible"
        viewBox="-8 -6 180 30"
        style={{ scaleX: poolSX, scaleY: poolSY, opacity: poolO, transformOrigin: "82px 55%" }}
      >
        <defs>
          <linearGradient id={poolFill} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c2226" />
            <stop offset=".35" stopColor="#07090a" />
            <stop offset="1" stopColor="#020303" />
          </linearGradient>
          <linearGradient id={sheen} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#2a3136" />
            <stop offset=".35" stopColor="#3a4a3f" />
            <stop offset=".6" stopColor="#4a5560" />
            <stop offset="1" stopColor="#3a4a3f" />
          </linearGradient>
          <linearGradient id={shine} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0" stopColor="#F5F7F7" stopOpacity="0" />
            <stop offset=".5" stopColor="#F5F7F7" stopOpacity=".22" />
            <stop offset="1" stopColor="#F5F7F7" stopOpacity="0" />
          </linearGradient>
          <clipPath id={poolClip}>
            <path d={POOL} />
          </clipPath>
        </defs>
        <path d={POOL} fill={`url(#${poolFill})`} />
        <path d="M120,14 C121,18 120.5,21 122,22.5 C123.5,21 123,18 124.5,14 Z" fill={OIL} />
        <path d="M30,16 C30.6,18.5 30,20 31.2,20.8 C32.4,20 31.8,18.5 32.6,16 Z" fill={OIL} />
        <path d={POOL_TOP} fill="none" stroke={`url(#${sheen})`} strokeWidth="1.1" strokeLinecap="round" />
        <g clipPath={`url(#${poolClip})`}>
          <rect className="oil-shine" x="-10" y="-6" width="34" height="30" fill={`url(#${shine})`} />
        </g>
        <ellipse cx="28" cy="4.2" rx="11" ry="1.1" fill="#F5F7F7" opacity=".28" />
        <ellipse cx="112" cy="4.6" rx="15" ry="1.2" fill="#F5F7F7" opacity=".22" />
        <ellipse cx="148" cy="6" rx="5" ry=".8" fill="#9fb3a6" opacity=".25" />
      </motion.svg>

      {/* The label, re-rendered white where the crude coats it. */}
      <motion.p className="absolute left-0 top-0 whitespace-nowrap px-2 text-[11px] font-semibold uppercase tracking-[.14em] text-(--afvar-text)" style={{ opacity: copyO }}>
        {label}
      </motion.p>

      {/* WTI price drip */}
      {drip && (
        <motion.svg className="absolute h-[48px] w-[12px] overflow-visible" style={{ left: drip.x - 6, top: drip.y - 1, opacity: dripO }} viewBox="-6 0 12 48">
          <motion.path d="M-3,0 L3,0 C2.4,5 1.8,11 1.6,15 C1.4,17.4 -1.4,17.4 -1.6,15 C-1.8,11 -2.4,5 -3,0 Z" fill={OIL} style={{ scaleY: stemS, originY: 0 }} />
          <motion.g style={{ y: dropY }}>
            <path d={DROP} transform="translate(0 17)" fill={OIL} stroke="#3a4a3f" strokeWidth=".5" />
            <circle cx="-.7" cy="17.6" r=".6" fill="#F5F7F7" opacity=".55" />
          </motion.g>
        </motion.svg>
      )}

      {/* Stage: drum + stream + splash (scaled down on phones about the impact point). */}
      <div className="absolute left-0 top-0 h-0 w-0 origin-[74px_5px] scale-[.8] max-sm:scale-[.7]">
        <motion.div
          className="absolute"
          style={{ left: PX, top: PY - DH, width: DW, height: DH, x: drumX, rotate: drumR, opacity: drumO, transformOrigin: "0% 100%" }}
        >
          <DrumArt uid={uid} />
        </motion.div>

        <svg className="absolute left-[-20px] top-[-110px] h-[140px] w-[220px] overflow-visible" viewBox="-20 -110 220 140">
          <defs>
            <mask id={mask} maskUnits="userSpaceOnUse" x="-20" y="-110" width="220" height="140">
              <motion.path d={STREAM} fill="none" stroke="#fff" strokeWidth="9.5" strokeLinecap="round" style={{ pathLength: len, pathOffset: tail }} />
            </mask>
          </defs>
          <motion.g style={{ opacity: streamO }}>
            <motion.path d={STREAM} fill="none" stroke="#2a3136" strokeOpacity=".55" strokeWidth="11.5" strokeLinecap="round" style={{ pathLength: len, pathOffset: tail }} />
            <motion.path d={STREAM} fill="none" stroke={OIL} strokeWidth="9.5" strokeLinecap="round" style={{ pathLength: len, pathOffset: tail }} />
            <g mask={`url(#${mask})`}>
              <path className="oil-flow" d="M81.4,-30 C77.4,-23 72,-14 71.5,5" fill="none" stroke={`url(#${sheen})`} strokeWidth="1.5" strokeLinecap="round" />
              <path d="M82.2,-30 C78.2,-23 72.8,-14 72.3,5" fill="none" stroke="#7f938a" strokeOpacity=".35" strokeWidth=".6" />
              <path d="M86.8,-30 C82.8,-23 77.4,-14 76.8,5" fill="none" stroke="#3a4a3f" strokeOpacity=".7" strokeWidth=".7" />
            </g>
          </motion.g>

          {/* impact: a glugging mound + a one-time crown splash */}
          <motion.g style={{ opacity: moundO }}>
            <ellipse className="oil-glug" cx={HIT.x} cy={HIT.y + 0.5} rx="6.5" ry="2.8" fill={OIL} stroke="#3a4a3f" strokeOpacity=".7" strokeWidth=".6" />
          </motion.g>
          <motion.g style={{ scale: splashS, opacity: splashO, originX: 0.5, originY: 1 }}>
            {SPLASH.map(([dx, dy, r], i) => (
              <g key={i}>
                <circle cx={HIT.x + dx} cy={HIT.y + dy} r={r} fill={OIL} stroke="#3a4a3f" strokeOpacity=".8" strokeWidth=".45" />
                <circle cx={HIT.x + dx - r * 0.3} cy={HIT.y + dy - r * 0.35} r={r * 0.3} fill="#F5F7F7" opacity=".5" />
              </g>
            ))}
          </motion.g>

          {DROPS.map((d, i) => (
            <Drop key={i} p={p} {...d} />
          ))}
        </svg>
      </div>
    </div>
  );
}

// Pool outline (group px): an irregular slick across the header row.
const POOL =
  "M-2,8 C-3,3 8,0.5 24,1 C44,-1 60,1.5 78,0 C100,-1 124,1 144,2.5 C158,3.5 166,6 164,9.5 C162,13 150,13.5 136,14 C120,15 104,13.5 88,15.5 C70,17.5 54,15 36,16.5 C18,18 0,16 -2,12 Z";
const POOL_TOP = "M-1.5,5.5 C2,2 10,1 24,1.4 C44,-0.6 60,1.9 78,0.4 C100,-0.6 124,1.4 144,2.9 C155,3.7 162,5.4 163.5,8";
const DROP = "M0,-3.4 C1.5,-1 2.3,.4 2.3,1.4 A2.3,2.3 0 1 1 -2.3,1.4 C-2.3,.4 -1.5,-1 0,-3.4 Z";
const SPLASH: readonly (readonly [number, number, number])[] = [
  [-7, -4, 1.5],
  [7.5, -4.5, 1.4],
  [-11, -1, 1.1],
  [11.5, -1.5, 1],
  [-3, -9, 1.2],
  [3.5, -8, 1],
];
const DROPS = [
  { x0: 76, y0: -22, x1: 72.5, a: 0.56, b: 0.63 },
  { x0: 79, y0: -25, x1: 77.5, a: 0.66, b: 0.73 },
  { x0: 84, y0: -29, x1: 79, a: 0.86, b: 0.92 },
  { x0: 84, y0: -29, x1: 80.5, a: 0.93, b: 0.985 },
] as const;

function Drop({ p, x0, y0, x1, a, b }: { p: MotionValue<number>; x0: number; y0: number; x1: number; a: number; b: number }) {
  const t = useTransform(p, (v) => (v < 0 ? 0 : transform(v, [a, b], [0, 1])));
  const x = useTransform(t, (k) => x0 + (x1 - x0) * k);
  const y = useTransform(t, (k) => y0 + (HIT.y - 1 - y0) * k * k);
  const o = useTransform(p, (v) => (v < 0 ? 0 : transform(v, [a, a + 0.008, b - 0.006, b], [0, 1, 1, 0])));
  return (
    <motion.g style={{ x, y, opacity: o }}>
      <path d={DROP} fill={OIL} stroke="#3a4a3f" strokeOpacity=".8" strokeWidth=".45" />
      <circle cx="-.7" cy=".6" r=".6" fill="#F5F7F7" opacity=".55" />
    </motion.g>
  );
}

/* ── Drum art: 56×84, faceted graphite steel cylinder, slightly from above. ── */
const COLS = [1, 6, 13, 21, 30, 39, 47, 52, 55] as const;
const COL_FILL = ["#101315", "#1b2024", "#2c3439", "#3b454b", "#2a3136", "#20262a", "#171b1e", "#0d1012"] as const;
const BANDS = [
  [6.5, 27],
  [30, 55],
  [58, 79.5],
] as const;
/** Ellipse sag of a horizontal ring at x (viewed slightly from above). */
const sag = (x: number) => 2.4 * (1 - ((x - 28) / 27) ** 2);
const ring = (y: number, x: number) => +(y + sag(x)).toFixed(2);

function band(y0: number, y1: number) {
  const top = COLS.map((x) => `${x},${ring(y0, x)}`).join(" ");
  const bot = [...COLS].reverse().map((x) => `${x},${ring(y1, x)}`).join(" ");
  return `${top} ${bot}`;
}

const LID = [
  ...COLS.map((x) => `${x},${(4.5 - sag(x) * 0.9).toFixed(2)}`),
  ...[...COLS].reverse().map((x) => `${x},${ring(4.5, x)}`),
].join(" ");

function DrumArt({ uid }: { uid: string }) {
  const spec = `oildrumspec${uid}`;
  return (
    <svg viewBox="0 0 56 84" className="block h-full w-full overflow-visible">
      <defs>
        <linearGradient id={spec} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#F5F7F7" stopOpacity="0" />
          <stop offset=".5" stopColor="#F5F7F7" stopOpacity=".16" />
          <stop offset="1" stopColor="#F5F7F7" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* body facets: columns × bands, each cell split into two triangles */}
      {BANDS.map(([y0, y1], bi) =>
        COL_FILL.map((fill, ci) => {
          const xa = COLS[ci];
          const xb = COLS[ci + 1];
          const a = `${xa},${ring(y0, xa)}`;
          const b = `${xb},${ring(y0, xb)}`;
          const c = `${xb},${ring(y1, xb)}`;
          const d = `${xa},${ring(y1, xa)}`;
          return (
            <g key={`${bi}-${ci}`}>
              <polygon points={`${a} ${b} ${c} ${d}`} fill={fill} />
              <polygon points={(ci + bi) % 2 ? `${a} ${b} ${d}` : `${a} ${b} ${c}`} fill={bi === 1 ? "#000" : "#F5F7F7"} opacity={bi === 1 ? 0.14 : 0.035} />
            </g>
          );
        }),
      )}
      {/* specular streak */}
      <rect x="15" y="7" width="12" height="74" fill={`url(#${spec})`} />
      {/* rolling hoops (raised ribs) */}
      {[27, 55].map((y) => (
        <g key={y}>
          <polygon points={band(y, y + 1.4)} fill="#56626a" />
          <polygon points={band(y + 1.4, y + 3)} fill="#0b0d0f" />
          <polyline points={COLS.map((x) => `${x},${ring(y, x)}`).join(" ")} fill="none" stroke="#a9b4ba" strokeWidth=".5" opacity=".55" />
        </g>
      ))}
      {/* hazard band + stencil */}
      <polygon points={band(45.5, 48.5)} fill="#FF3B3B" opacity=".88" />
      <polygon points={band(47.6, 48.5)} fill="#7a1414" opacity=".7" />
      <text x="28" y="41.5" textAnchor="middle" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="7" fontWeight="700" letterSpacing="1.1" fill="#A3AAAC" opacity=".62">
        CRUDE
      </text>
      {/* bottom chime */}
      <polygon points={band(79.5, 82.5)} fill="#262d32" />
      <polyline points={COLS.map((x) => `${x},${ring(79.6, x)}`).join(" ")} fill="none" stroke="#8a979d" strokeWidth=".5" opacity=".5" />
      {/* top: lid ellipse + rolled chime */}
      <polygon points={LID} fill="#1d2327" />
      <polygon points={band(4.2, 7)} fill="#3b454b" />
      <polyline points={COLS.map((x) => `${x},${ring(4.2, x)}`).join(" ")} fill="none" stroke="#c9d1d5" strokeWidth=".6" opacity=".6" />
      <polyline points={COLS.map((x) => `${x},${(4.5 - sag(x) * 0.9).toFixed(2)}`).join(" ")} fill="none" stroke="#6d7a80" strokeWidth=".5" opacity=".7" />
      {/* bung cap (large) + vent (small) on the lid */}
      <polygon points="8.2,3.4 9.6,2.2 12.4,2.2 13.8,3.4 12.4,4.6 9.6,4.6" fill="#6d7a80" />
      <polygon points="8.2,3.4 9.6,2.2 12.4,2.2 13.8,3.4" fill="#c9d1d5" />
      <polygon points="42.6,3 43.4,2.4 45,2.4 45.8,3 45,3.6 43.4,3.6" fill="#5f6a70" />
      {/* crude stain running from the bung down the front */}
      <path d="M10,4.8 C10.6,8 9.6,11 10.4,15 C11,18 10.2,20.5 11,22.4 C11.8,24 13,23.4 13,21.6 C12.6,18.5 13.4,14 12.6,10 C12.2,7.6 12.6,5.6 12.2,4.6 Z" fill={OIL} />
      <path d="M10.6,6 C11,9 10.4,12 11,15.5" fill="none" stroke="#3a4a3f" strokeWidth=".5" opacity=".9" />
      {/* rim light */}
      <polyline points={`1,${ring(5, 1)} 1,${ring(81, 1)}`} fill="none" stroke="#8a979d" strokeWidth=".8" opacity=".55" />
      <polyline points={`55,${ring(5, 55)} 55,${ring(81, 55)}`} fill="none" stroke="#00E676" strokeWidth=".7" opacity=".35" />
    </svg>
  );
}
