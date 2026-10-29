// /home-demo · Chapter 05 — ALERTS & STRATEGY.
// A plain-words sentence becomes an armed condition circuit: AFVAR repeats it
// back, gates rise over the price line, a scanner checks every closed candle,
// and the alert fires only when the line actually breaks the threshold —
// cause and effect, driven by scroll.
//
// Stages (one master progress 0..1):
//   sentence — "Alert me if gold closes above the weekly high and RSI > 70"
//   confirm  — AFVAR repeats it back; condition gates rise; threshold appears
//   armed    — gates lock; a scanner walks the line, candle close by close
//   trigger  — the line breaks the threshold; both gates true; the alert fires
//   settle   — wide composition; alerts copy takes over
import * as THREE from "three";

export const STAGES = {
  sentence: [0, 0.18],
  confirm: [0.18, 0.42],
  armed: [0.42, 0.62],
  trigger: [0.62, 0.84],
  settle: [0.84, 1],
} as const;

export const SETTLED_P = 0.74;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* -------------------------------------------------------------- price line */

// Stays under the threshold until late, then breaks above — the trigger.
export const LINE_POINTS: [number, number, number][] = [
  [-7, 0.55, 0],
  [-5.6, 0.8, -0.15],
  [-4.2, 0.6, 0.15],
  [-2.8, 0.95, -0.1],
  [-1.4, 0.75, 0.12],
  [0, 1.0, -0.12],
  [1.4, 0.85, 0.1],
  [2.4, 1.02, -0.08],
  [3.4, 1.3, 0.05],
  [4.6, 1.5, -0.1],
  [6, 1.42, 0.08],
  [7, 1.55, 0],
];

export const makeLineCurve = () =>
  new THREE.CatmullRomCurve3(
    LINE_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );

export const LINE_RADIUS = 0.014;
/** Draws to the hold point through `confirm`, then completes through `trigger`
 *  — so the threshold break happens live, under the user's scroll. */
export const LINE_DRAW = { phase1: [0.04, 0.28] as const, hold: 0.68, phase2: [0.62, 0.78] as const };

/** The armed threshold ("weekly high"). The line crosses it near x ≈ 3. */
export const THRESHOLD = {
  y: 1.12,
  x: [-1.5, 7] as const,
  reveal: [0.3, 0.4] as const,
  crossing: new THREE.Vector3(3.0, 1.12, 0),
  flash: { at: 0.675, width: 0.025 },
};

/* ------------------------------------------------------------------- gates */

// Two condition gates the price must pass: close > weekly high · RSI > 70.
export const GATES = [
  { x: 0.2, w: 1.3, h: 1.75, rise: [0.22, 0.3] as const },
  { x: 1.6, w: 1.3, h: 1.75, rise: [0.27, 0.35] as const },
];
export const GATE_LOCK: readonly [number, number] = [0.44, 0.52];

/** The code scanner that walks the line, closed candle by closed candle. */
export const SCANNER = {
  xRange: [-4, 2.2] as const,
  window: [0.44, 0.62] as const,
  radius: 0.2,
};

/** The alert beacon that fires after the break. */
export const BEACON = {
  x: 4.8,
  height: 2.0,
  rise: [0.68, 0.76] as const,
  pulse: [0.7, 0.86] as const,
  signal: [0.68, 0.78] as const, // node travels crossing → beacon tip
};

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [-7.5, 0.9, 2.4], look: [-6, 0.6, 0] },
  { at: 0.2, pos: [-3.8, 1.3, 4.4], look: [-2.5, 0.9, 0] },
  { at: 0.44, pos: [0.2, 1.5, 4.6], look: [0.9, 1.05, 0] },
  { at: 0.62, pos: [2.0, 1.6, 3.6], look: [3.0, 1.12, 0] },
  { at: 0.84, pos: [4.4, 1.9, 3.4], look: [4.8, 1.3, 0] },
  { at: 1.0, pos: [0.6, 2.6, 6.8], look: [0.5, 1.0, 0] },
] as const;

export const FOV = [43, 37] as const;
export const PARALLAX = 0.14;
export const GRID_REVEAL: readonly [number, number] = [0.06, 0.18];

/* ------------------------------------------------------------ DOM windows */

export const SENTENCE = {
  text: "Alert me if gold closes above the weekly high and RSI is above 70.",
  window: [0.025, 0.065, 0.15, 0.19] as const,
};

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Armed — and checked by code on closed candle{s|$}.", window: [0.44, 0.48, 0.58, 0.62] },
  { text: "It fires only when {e|€}very condition is true.", window: [0.63, 0.67, 0.76, 0.8] },
];

export const DOM5 = {
  illustrative: [0.08, 0.13] as const,
  confirmCard: [0.2, 0.24, 0.38, 0.42] as const, // AFVAR repeats it back
  alertCard: [0.7, 0.74, 0.82, 0.86] as const, // the fired alert
  finale: [0.86, 0.93] as const,
};

// Sound map (opt-in): the threshold breaks and the alert fires.
export const SOUND = [{ at: 0.7, cue: "alert" }] as const;

// On-scene labels so every 3D part says what it is (windows: in, in, out, out).
export const LABELS = {
  threshold: { pos: [-0.9, 1.32, 0] as const, show: [0.3, 0.36, 1, 1.1] as const, text: "Weekly high" },
  gate1Wait: { pos: [0.2, 1.98, 0] as const, show: [0.26, 0.32, 0.69, 0.71] as const, text: "1 · Close > weekly high" },
  gate2Wait: { pos: [1.6, 1.98, 0] as const, show: [0.3, 0.36, 0.69, 0.71] as const, text: "2 · RSI > 70" },
  gate1True: { pos: [0.2, 1.98, 0] as const, show: [0.7, 0.72, 1, 1.1] as const, text: "✓ Close > weekly high" },
  gate2True: { pos: [1.6, 1.98, 0] as const, show: [0.7, 0.72, 1, 1.1] as const, text: "✓ RSI > 70" },
  scanner: { pos: [-1.6, 1.6, 0] as const, show: [0.44, 0.48, 0.6, 0.63] as const, text: "Checking every closed candle" },
  breakout: { pos: [3.0, 1.62, 0] as const, show: [0.66, 0.68, 0.78, 0.82] as const, text: "Price breaks the weekly high" },
  beacon: { pos: [3.95, 1.85, 0] as const, show: [0.7, 0.73, 1, 1.1] as const, text: "Alert fired" },
};

/** The four steps of an alert, shown as a tracker (progress windows). */
export const STEPS = [
  { label: "You say it", at: [0, 0.2] as const },
  { label: "AFVAR confirms", at: [0.2, 0.42] as const },
  { label: "Armed & watching", at: [0.42, 0.66] as const },
  { label: "Alert fires", at: [0.66, 1.01] as const },
];
