// AFVAR home — "The trading OS that never stops thinking".
// One continuous scroll story with ONE protagonist: the AFVAR AI core. It is on
// screen from the first frame to the last and transforms with the scroll:
//
//   hero     the core is awake; headline + CTA in the first screen
//   cores    the core opens into its seven specialist cores
//   stream   eight market lanes stream into the cores, every tick
//   always   the cores take their places on a 24-hour market ring
//   ask      the core listens and answers (voice rings + a verdict card)
//   os       the cores unfold into the windows and dock of an operating system
//   trust    every request passes the policy gate; a trade is refused
//   finale   everything folds back into the core; launch-queue CTA
//
// Every act boundary, camera key, layout and sound cue lives here: the scene
// and the DOM read the same numbers, so WebGL and copy never drift apart.
// (Same contract as the chapter configs: one master progress 0..1.)
import { clamp01, easeInOut, ramp } from "../timeline";

export { clamp01, easeInOut, easeOut, ramp, window4 } from "../timeline";

/* -------------------------------------------------------------------- acts */

export type ActId = "hero" | "cores" | "stream" | "always" | "ask" | "os" | "trust" | "finale";

/** [start, end] of each act in master progress. */
export const ACTS: Record<ActId, readonly [number, number]> = {
  hero: [0, 0.07],
  cores: [0.07, 0.21],
  stream: [0.21, 0.35],
  always: [0.35, 0.49],
  ask: [0.49, 0.62],
  os: [0.62, 0.79],
  trust: [0.79, 0.92],
  finale: [0.92, 1],
};

/** Copy window per act: [in start, in end, out start, out end]. The hero is
 *  fully visible at p = 0 so the headline and CTA sit in the first screen. */
export const COPY: Record<ActId, readonly [number, number, number, number]> = {
  hero: [-1, -0.5, 0.045, 0.075],
  cores: [0.095, 0.125, 0.185, 0.21],
  stream: [0.235, 0.265, 0.325, 0.35],
  always: [0.375, 0.405, 0.465, 0.49],
  ask: [0.51, 0.54, 0.6, 0.625],
  os: [0.645, 0.675, 0.765, 0.79],
  trust: [0.81, 0.84, 0.9, 0.925],
  finale: [0.935, 0.965, 2, 3],
};

/** Total scroll length of the story on desktop (vh). */
export const TRACK_VH = 1150;

/** Mobile / reduced motion render this one composed frame (the hero). */
export const SETTLED_P = 0.02;

/* ------------------------------------------------------------------ palette */

// Gold is the AI. Green and red only ever mean market up / down.
export const COLORS = {
  bg: "#050607",
  gold: "#E9B44C",
  goldHot: "#FFD98A",
  goldDeep: "#7A4E10",
  ink: "#F5F7F7",
  dim: "#A3AAAC",
  up: "#00E676",
  down: "#FF4D4D",
  metal: "#2A2F35",
} as const;

/* -------------------------------------------------------------------- core */

export const CORE = {
  radius: 0.62,
  shell: 0.82,
  /** "Thinking" heartbeat (Hz) and its depth. */
  beatHz: 1.15,
  beatDepth: 0.18,
};

/** Core glow over the story: awake → working hard while streaming → calm. */
export function coreGlow(p: number): number {
  return 0.9 + 0.5 * ramp(p, 0.21, 0.27) * (1 - ramp(p, 0.33, 0.4)) + 0.35 * ramp(p, 0.93, 0.99);
}

/* ------------------------------------------------------- the seven cores */

export const SATELLITES = [
  { id: "market", label: "Market core" },
  { id: "macro", label: "Macro core" },
  { id: "news", label: "News core" },
  { id: "risk", label: "Risk core" },
  { id: "memory", label: "Memory core" },
  { id: "voice", label: "Voice core" },
  { id: "verify", label: "Verify core" },
] as const;

export const ORBIT = { radius: 2.15, tilt: 0.38, speed: 0.12, size: 0.17 };

/** The 24-hour ring the cores take their places on (XY plane, facing camera). */
export const RING = { radius: 2.25, tube: 0.012, y: 0 };

/** OS windows the first six cores unfold into, and the dock below them. */
export const WINDOWS: { x: number; y: number; w: number; h: number; label: string }[] = [
  { x: -1.4, y: 1.3, w: 2.4, h: 1.5, label: "Charts" },
  { x: 1.35, y: 1.55, w: 2.1, h: 1.1, label: "Research" },
  { x: 4.4, y: 0.0, w: 2.0, h: 1.2, label: "Alerts" },
  { x: 1.9, y: -1.3, w: 2.0, h: 1.1, label: "Risk Guardian" },
  { x: -1.6, y: -1.0, w: 2.0, h: 1.15, label: "Journal" },
  { x: 4.5, y: -1.6, w: 1.8, h: 0.95, label: "Community" },
];
export const OS_Z = -1.2;
export const DOCK = { x: 1.0, y: -2.75, gap: 0.62, size: 0.42 };

/** The policy gate (trust act): a ring right of the core, facing the core. */
export const GATE = { x: 2.4, radius: 1.05, tilt: 0.55 };

/* ------------------------------------------------------------- 8 lanes */

export const LANES = [
  { sym: "XAU/USD", key: "XAUUSD", name: "Gold", up: true },
  { sym: "XAG/USD", key: "XAGUSD", name: "Silver", up: false },
  { sym: "WTI", key: "WTI", name: "Crude oil", up: true },
  { sym: "EUR/USD", key: "EURUSD", name: "Euro", up: false },
  { sym: "USD/JPY", key: "USDJPY", name: "Yen", up: true },
  { sym: "GBP/USD", key: "GBPUSD", name: "Pound", up: false },
  { sym: "NZD/USD", key: "NZDUSD", name: "Kiwi", up: true },
  { sym: "BTC", key: "BTC-USD", name: "Bitcoin", up: true },
] as const;
export const LANE_RADIUS = 8.5;
export const STREAM_PARTICLES = 14; // per lane

/* --------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [0.2, 0.15, 7.4], look: [-1.35, 0, 0] },
  { at: 0.14, pos: [1.4, 1.25, 8.2], look: [-1.7, 0, 0] },
  { at: 0.28, pos: [0.6, 0.9, 10.2], look: [-2.2, 0.4, 0] },
  { at: 0.4, pos: [0.0, 0.1, 12.4], look: [-2.5, 0, 0] },
  { at: 0.47, pos: [-0.2, 0.0, 12.0], look: [-2.45, 0, 0] },
  { at: 0.555, pos: [0.4, 0.25, 7.8], look: [-1.7, 0, 0] },
  { at: 0.71, pos: [-0.8, 0.35, 12.2], look: [-1.0, 0.1, -0.6] },
  { at: 0.86, pos: [0.1, 0.8, 8.6], look: [-0.9, 0, 0] },
  { at: 1.0, pos: [0.2, 0.15, 7.6], look: [-1.35, 0, 0] },
] as const;
export const FOV = [38, 38] as const;
export const PARALLAX = 0.12;
export const PROGRESS_DAMP = 4.2;

/* ---------------------------------------------------------------- sound */

// Opt-in only (the sound switch). Each cue lands on a visual beat.
export const SOUND = [
  { at: 0.105, cue: "latch" }, // the core opens into its cores
  { at: 0.24, cue: "tick" }, // the first market tick arrives
  { at: 0.38, cue: "whoosh" }, // cores sweep onto the 24-hour ring
  { at: 0.545, cue: "verdict" }, // the answer is verified
  { at: 0.665, cue: "latch" }, // the OS assembles
  { at: 0.845, cue: "alert" }, // a trade request is refused at the gate
  { at: 0.955, cue: "logo" }, // everything folds back into the core
] as const;

/* --------------------------------------------------------- act weights */

/** 0→1→0 presence of an act, eased, with a soft overlap into neighbours. */
export function actWeight(p: number, act: ActId, soft = 0.035): number {
  const [a, b] = ACTS[act];
  return easeInOut(clamp01(ramp(p, a - soft, a + soft) * (1 - ramp(p, b - soft, b + soft))));
}
