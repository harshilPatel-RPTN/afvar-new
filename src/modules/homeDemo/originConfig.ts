// /home-demo · Chapter 01 — ORIGIN ("The First Tick").
// RPTN-style master config: every stage boundary, camera key, reveal window and
// scene constant lives here. The scene and the DOM overlays both read this file,
// so WebGL and copy stay in sync and nothing is a scattered magic number.
//
// Story (one master progress 0..1):
//   tick      — a single price tick exists, alone in the dark
//   stream    — the tick moves; raw data flows as a drawn price path
//   structure — candles crystallise under the path; the grid floor wakes
//   mind      — a machined instrument assembles around the newest tick;
//               structure flows into it (candle → core beams)
//   settle    — the composition organises; product copy takes over
import * as THREE from "three";
import { easeInOut, ramp } from "./timeline";

export { clamp01, easeInOut, easeOut, ramp, window4 } from "./timeline";

/* ------------------------------------------------------------------ stages */

export const STAGES = {
  tick: [0, 0.18],
  stream: [0.18, 0.42],
  structure: [0.42, 0.6],
  mind: [0.6, 0.8],
  settle: [0.8, 1],
} as const;

/** Mobile / reduced motion render one composed frame at this progress. */
export const SETTLED_P = 0.93;

/* ----------------------------------------------------------------- palette */

// Trader semantics: green = up / primary action, red = down, black foundation.
export const COLORS = {
  bg: "#080A0B",
  up: "#00E676",
  upBright: "#69F0AE",
  down: "#FF3B3B",
  metal: "#272b33",
  metalBright: "#39404b",
  gridCell: new THREE.Color("#0f1713"),
  gridSection: new THREE.Color("#19291f"),
} as const;

/* ------------------------------------------------------------- price path */

export const FLOOR_Y = -1.3;

/** The journey of the tick: a believable price trajectory through space. */
const PATH_POINTS: [number, number, number][] = [
  [0, 0, 0],
  [1.5, 0.42, -0.25],
  [2.9, 0.08, 0.3],
  [4.3, 0.75, -0.3],
  [5.7, 0.5, 0.25],
  [7.1, 1.1, -0.15],
  [8.5, 1.5, 0.1],
];

/** Where the instrument assembles: the newest tick, the end of the path. */
export const CORE_POS = new THREE.Vector3(...PATH_POINTS[PATH_POINTS.length - 1]);

export const makePathCurve = () =>
  new THREE.CatmullRomCurve3(
    PATH_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );

/** The path draws over this window; the head tick rides its end. */
export const PATH_DRAW: readonly [number, number] = [0.16, 0.62];
export const PATH_RADIUS = 0.014;

/* ------------------------------------------------------------ stream dots */

// Raw ticks flowing along the already-drawn path, behind the head.
export const STREAM = {
  count: 16,
  window: [0.22, 0.88] as const,
  speed: 0.045, // path-u per second
  size: 0.02,
};

/* --------------------------------------------------------------- candles */

// Candles crystallise exactly under the path as the head passes their station.
export const CANDLE = {
  count: 12,
  uStart: 0.1,
  uEnd: 0.92,
  revealSpan: 0.045, // progress-width of one candle's rise
  width: 0.09,
  heightScale: 0.52,
  minHeight: 0.26,
};

/* ------------------------------------------------------------- instrument */

// Three machined arcs fly in from the dark and settle into a gimbal around
// the newest tick — the moment raw structure gets an intelligence around it.
export const ARCS = [
  { radius: 0.95, tube: 0.034, arc: 4.7, rot: [0, 0, 0.3] as const, from: [-1.6, 1.3, -1.1] as const, spin: 2.2, window: [0.58, 0.7] as const },
  { radius: 0.72, tube: 0.028, arc: 5.2, rot: [Math.PI / 2, 0.35, 0] as const, from: [1.8, -0.9, 1.3] as const, spin: -1.8, window: [0.62, 0.74] as const },
  { radius: 0.5, tube: 0.023, arc: 5.7, rot: [0.4, Math.PI / 2, 0] as const, from: [-0.8, -1.5, 1.6] as const, spin: 1.5, window: [0.66, 0.78] as const },
];

export const CORE = {
  shellRadius: 0.17,
  innerRadius: 0.095,
  glowRamp: [0.56, 0.8] as const, // base intensity rises over this window
  pulses: [
    { at: 0.845, width: 0.03, amp: 1.0 },
    { at: 0.9, width: 0.028, amp: 0.55 },
  ],
};

export function coreIntensity(p: number): number {
  let v = 0.25 + easeInOut(ramp(p, CORE.glowRamp[0], CORE.glowRamp[1])) * 1.1;
  for (const pulse of CORE.pulses) {
    const d = (p - pulse.at) / pulse.width;
    v += pulse.amp * Math.exp(-d * d);
  }
  return v;
}

/** Candle-tip → core beams: structure flowing into understanding (stage 4). */
export const BEAMS = {
  fromCandles: [4, 7, 10], // candle indices
  draw: [0.66, 0.78] as const,
  radius: 0.007,
};

/* ----------------------------------------------------------------- camera */

// Continuous spline through these keys; `at` maps progress → curve parameter.
// The camera travels WITH the tick — macro start, tracking shot, approach,
// settled frontal composition with the journey receding behind.
export const CAMERA_KEYS = [
  { at: 0.0, pos: [0.55, 0.2, 1.7], look: [0, 0.03, 0] },
  { at: 0.18, pos: [1.25, 0.65, 3.2], look: [0.9, 0.18, 0] },
  { at: 0.42, pos: [3.7, 1.05, 4.9], look: [3.3, 0.4, 0] },
  { at: 0.6, pos: [6.3, 1.55, 5.6], look: [5.7, 0.72, 0] },
  { at: 0.8, pos: [8.95, 1.95, 3.9], look: [8.5, 1.5, 0.1] },
  { at: 1.0, pos: [11.3, 2.05, 5.0], look: [7.7, 1.15, 0] },
] as const;

export const FOV = [42, 36] as const; // slow dolly tighten across the chapter
/** How hard the pointer bends the look target (desktop only, damped). */
export const PARALLAX = 0.16;
/** Smoothing lambda for the master progress (the "video feel"). */
export const PROGRESS_DAMP = 4.5;

/* -------------------------------------------------------------- grid floor */

export const GRID_REVEAL: readonly [number, number] = [0.36, 0.52];

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Every market {s|$}tarts with a single tick.", window: [0.015, 0.05, 0.14, 0.18] },
  { text: "Eight lan{e|€}s. Three sessions. Millions of ticks.", window: [0.21, 0.25, 0.37, 0.41] },
  { text: "Code turns the stream into structu{r|₹}e.", window: [0.43, 0.47, 0.56, 0.6] },
  { text: "The AI turns structure into under{s|$}tanding.", window: [0.62, 0.66, 0.75, 0.79] },
];

export const DOM = {
  scrollHint: [0.02, 0.07] as const, // fades OUT over this window
  illustrative: [0.17, 0.22] as const, // fades in
  finale: [0.81, 0.89] as const, // headline block reveals
};

// Sound map (opt-in): the first tick lands, then the instrument locks.
export const SOUND = [
  { at: 0.02, cue: "tick" },
  { at: 0.775, cue: "latch" },
] as const;
