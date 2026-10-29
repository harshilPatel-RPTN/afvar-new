// /home-demo · Chapter 04 — CONTEXT.
// A price line draws with visible spikes. Event pillars rise from the floor
// at the moments that caused them (CPI · FOMC · NFP · EIA), threads connect
// each event to the move it drove, the next event counts down, and the
// chapter settles on "markets never move in isolation".
//
// Stages (one master progress 0..1):
//   move      — a price line with unexplained spikes draws alone
//   events    — calendar pillars rise at the spikes, one by one
//   threads   — each event connects to the move it drove (sentiment-coloured)
//   countdown — the next event pulses: consensus vs previous, past reaction
//   settle    — wide, organised composition; context copy takes over
import * as THREE from "three";

export const STAGES = {
  move: [0, 0.22],
  events: [0.22, 0.46],
  threads: [0.46, 0.66],
  countdown: [0.66, 0.84],
  settle: [0.84, 1],
} as const;

export const SETTLED_P = 0.7;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* -------------------------------------------------------------- price line */

export const LINE_POINTS: [number, number, number][] = [
  [-7, 0.5, 0],
  [-5, 0.7, -0.2],
  [-3, 1.25, 0.2], // CPI spike
  [-1.6, 0.8, -0.2],
  [-0.5, 1.45, 0.1], // FOMC spike
  [0.8, 1.0, -0.2],
  [2, 1.3, 0.2], // NFP spike
  [3.2, 0.9, 0],
  [4.2, 1.35, -0.2], // EIA spike
  [5.5, 1.1, 0.1],
  [7, 1.2, 0],
];

export const makeLineCurve = () =>
  new THREE.CatmullRomCurve3(
    LINE_POINTS.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    false,
    "centripetal",
  );

export const LINE_DRAW: readonly [number, number] = [0.04, 0.3];
export const LINE_RADIUS = 0.014;

/* ------------------------------------------------------------------ events */

export type EventDef = {
  key: string;
  name: string;
  x: number;
  /** The exact move this event drove (a LINE_POINTS spike). */
  spike: [number, number, number];
  /** Sentiment of the reaction — green up, red down. */
  up: boolean;
  reveal: readonly [number, number]; // pillar rises
  thread: readonly [number, number]; // connection draws
};

export const EVENTS: readonly EventDef[] = [
  { key: "CPI", name: "US inflation", x: -3, spike: [-3, 1.25, 0.2], up: false, reveal: [0.24, 0.31], thread: [0.48, 0.56] },
  { key: "FOMC", name: "Rate decision", x: -0.5, spike: [-0.5, 1.45, 0.1], up: true, reveal: [0.285, 0.355], thread: [0.51, 0.59] },
  { key: "NFP", name: "US jobs", x: 2, spike: [2, 1.3, 0.2], up: true, reveal: [0.33, 0.4], thread: [0.54, 0.62] },
  { key: "EIA", name: "Oil inventories", x: 4.2, spike: [4.2, 1.35, -0.2], up: false, reveal: [0.375, 0.445], thread: [0.57, 0.65] },
];

export const PILLAR = { height: 2.1, radius: 0.015, ringRadius: 0.22, threadRadius: 0.008 };

/** The next event (FOMC) pulses through the countdown stage. */
export const FOCUS = { index: 1, window: [0.67, 0.82] as const };

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [-7.7, 0.95, 2.7], look: [-6.3, 0.6, 0] },
  { at: 0.22, pos: [-4.9, 1.5, 4.3], look: [-3.3, 0.95, 0] },
  { at: 0.46, pos: [-0.9, 1.9, 5.3], look: [-0.5, 1.0, 0] },
  { at: 0.66, pos: [1.0, 1.6, 3.1], look: [-0.5, 1.35, 0.1] },
  { at: 0.84, pos: [1.7, 2.3, 5.9], look: [0.5, 1.0, 0] },
  { at: 1.0, pos: [0.2, 2.9, 7.3], look: [0.3, 0.9, 0] },
] as const;

export const FOV = [43, 37] as const;
export const PARALLAX = 0.14;
export const GRID_REVEAL: readonly [number, number] = [0.06, 0.18];

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "A price move is only part of the {s|$}tory.", window: [0.02, 0.06, 0.16, 0.2] },
  { text: "The calendar and the news attach to the {l|£}anes they move.", window: [0.24, 0.28, 0.42, 0.46] },
  { text: "{E|€}very headline tagged — instrument, relevance, sentiment.", window: [0.48, 0.52, 0.61, 0.65] },
];

export const DOM4 = {
  illustrative: [0.08, 0.13] as const,
  card: [0.68, 0.72, 0.8, 0.84] as const, // next-event anatomy
  finale: [0.85, 0.92] as const,
};
