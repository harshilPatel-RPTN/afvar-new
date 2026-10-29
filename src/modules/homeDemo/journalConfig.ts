// /home-demo · Chapter 07 — JOURNAL.
// Every trade lands on a timeline as an arc from entry to exit (green win,
// red loss, height = size of the move). A playhead replays the session, each
// trade is tagged "plan followed" or "plan broken", and the pattern surfaces:
// the losses cluster where the plan broke. Discipline you can see.
//
// Stages (one master progress 0..1):
//   record   — trades arrive from the read-only broker connection
//   replay   — a playhead sweeps the session, trade by trade
//   annotate — each trade is tagged: plan followed / plan broken
//   pattern  — threads link the tags; the clusters become obvious
//   settle   — wide composition; journal copy takes over

export const STAGES = {
  record: [0, 0.22],
  replay: [0.22, 0.44],
  annotate: [0.44, 0.64],
  pattern: [0.64, 0.84],
  settle: [0.84, 1],
} as const;

export const SETTLED_P = 0.8;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* ------------------------------------------------------------------ trades */

export type TradeDef = { x0: number; x1: number; h: number; win: boolean; plan: boolean };

// Illustrative session. Plan-broken trades (1, 3, 7) are all losses; one
// planned trade still loses (5) — honest: following the plan isn't a guarantee.
export const TRADES: readonly TradeDef[] = [
  { x0: -6.2, x1: -5.2, h: 0.5, win: true, plan: true },
  { x0: -4.9, x1: -4.1, h: 0.35, win: false, plan: false },
  { x0: -3.8, x1: -2.6, h: 0.7, win: true, plan: true },
  { x0: -2.3, x1: -1.6, h: 0.4, win: false, plan: false },
  { x0: -1.2, x1: 0.0, h: 0.8, win: true, plan: true },
  { x0: 0.3, x1: 1.0, h: 0.3, win: false, plan: true },
  { x0: 1.4, x1: 2.5, h: 0.65, win: true, plan: true },
  { x0: 2.8, x1: 3.5, h: 0.45, win: false, plan: false },
  { x0: 3.9, x1: 5.3, h: 0.9, win: true, plan: true },
];

export const ARC_RADIUS = 0.013;
/** Trades arrive one by one through `record`. */
export const ARC_REVEAL = { start: 0.03, step: 0.019, dur: 0.06 };

/* --------------------------------------------------------------- playhead */

export const PLAYHEAD = {
  x: [-7, 6.2] as const,
  window: [0.23, 0.43] as const,
  height: 2.4,
  depth: 1.6,
};

/* -------------------------------------------------------------------- tags */

export const TAG_REVEAL = { start: 0.45, step: 0.016, dur: 0.05 };
export const TAG = { radius: 0.075, lift: 0.18 };

/* ---------------------------------------------------------------- pattern */

export const THREADS = {
  lift: 0.45,
  broken: [0.66, 0.76] as const,
  followed: [0.7, 0.8] as const,
  /** Non-pattern arcs dim slightly so the clusters read. */
  focus: [0.66, 0.74] as const,
};

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [-6.6, 0.8, 2.2], look: [-5.7, 0.3, 0] },
  { at: 0.22, pos: [-4.4, 1.3, 3.6], look: [-3.2, 0.4, 0] },
  { at: 0.44, pos: [-0.5, 1.6, 4.6], look: [0, 0.4, 0] },
  { at: 0.64, pos: [2.0, 1.4, 3.6], look: [1.2, 0.6, 0] },
  { at: 0.84, pos: [0, 5.0, 4.4], look: [0, 0.6, 0] },
  { at: 1.0, pos: [0.3, 3.0, 7.2], look: [0, 0.5, 0] },
] as const;

export const FOV = [42, 37] as const;
export const PARALLAX = 0.14;
export const GRID_REVEAL: readonly [number, number] = [0.04, 0.14];

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Every trade {y|¥}ou take — recorded from your broker, read-only.", window: [0.02, 0.06, 0.17, 0.21] },
  { text: "{R|₹}eplay any session, trade by trade.", window: [0.24, 0.28, 0.39, 0.43] },
  { text: "Did {y|¥}ou follow your plan? Your journal remembers.", window: [0.46, 0.5, 0.6, 0.64] },
  { text: "Patterns {s|$}urface — where the plan held, and where it broke.", window: [0.66, 0.7, 0.8, 0.84] },
];

export const DOM7 = {
  illustrative: [0.06, 0.11] as const,
  entryCard: [0.47, 0.51, 0.6, 0.64] as const,
  patternCard: [0.7, 0.74, 0.81, 0.85] as const,
  finale: [0.86, 0.93] as const,
};
