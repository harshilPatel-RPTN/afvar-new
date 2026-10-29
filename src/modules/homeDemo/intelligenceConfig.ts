// /home-demo · Chapter 03 — INTELLIGENCE.
// A plain question enters a reasoning lattice. Paths open and explore, the
// system weighs them — supporting paths brighten, contradicting paths dim —
// the survivors converge into one output core, and the verdict crystallises:
// BULLISH, BEARISH or WAIT. Then the honest beat: every verdict is graded
// publicly, including every WAIT. "Code computes, the AI explains."
//
// Stages (one master progress 0..1):
//   question — a query point pulses alone in the dark
//   explore  — reasoning paths draw through the lattice
//   weigh    — signals agree and disagree; both count
//   verdict  — paths converge; the output core forms; the card appears
//   graded   — the verdict is stamped into the public track record; settle

export const STAGES = {
  question: [0, 0.18],
  explore: [0.18, 0.44],
  weigh: [0.44, 0.62],
  verdict: [0.62, 0.82],
  graded: [0.82, 1],
} as const;

export const SETTLED_P = 0.74;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = -0.45;

/* ---------------------------------------------------------------- lattice */

// Node 0 is the question; node 9 is the output core; 1–8 are reasoning steps
// in three layers.
export const NODES: [number, number, number][] = [
  [-6, 1.1, 0], // 0 input — the question
  [-3.6, 1.7, -0.7], // 1
  [-3.6, 0.9, 0.6], // 2
  [-3.6, 0.35, -0.3], // 3
  [-1.2, 1.9, 0.4], // 4
  [-1.2, 1.15, -0.8], // 5
  [-1.2, 0.5, 0.5], // 6
  [1.2, 1.6, -0.4], // 7
  [1.2, 0.75, 0.4], // 8
  [4.2, 1.1, 0], // 9 output — the verdict
];

export const INPUT = NODES[0];
export const OUTPUT = NODES[9];

/** Reasoning paths. `up: true` supports the verdict and reaches the output;
 *  `up: false` contradicts and dies at its last node (dimming in the weigh). */
export const PATHS: { via: number[]; up: boolean }[] = [
  { via: [0, 1, 4, 7, 9], up: true },
  { via: [0, 2, 6, 8, 9], up: true },
  { via: [0, 3, 5], up: false },
  { via: [0, 1, 5, 8, 9], up: true },
  { via: [0, 2, 4, 7], up: false },
  { via: [0, 3, 6, 8, 9], up: true },
  { via: [0, 1, 6], up: false },
];

export const PATH_RADIUS = 0.011;
/** Paths draw in a stagger through `explore`; supporting paths hold their last
 *  22% of length back until CONVERGE (the final reach into the core). */
export const PATH_REVEAL = { start: 0.2, step: 0.024, dur: 0.1, holdBack: 0.22 };
export const WEIGH: readonly [number, number] = [0.45, 0.6];
export const CONVERGE: readonly [number, number] = [0.62, 0.76];

/** Node spheres pulse awake as the first paths pass through them. */
export const NODE_PULSE = { start: 0.23, step: 0.018, dur: 0.05 };

/* -------------------------------------------------------------------- core */

export const CORE3 = {
  shellRadius: 0.17,
  innerRadius: 0.095,
  glowRamp: [0.62, 0.8] as const,
  pulses: [
    { at: 0.85, width: 0.03, amp: 1.0 }, // the "graded publicly" stamp
    { at: 0.9, width: 0.025, amp: 0.5 },
  ],
};

export function coreIntensity3(p: number): number {
  const t = Math.min(1, Math.max(0, (p - CORE3.glowRamp[0]) / (CORE3.glowRamp[1] - CORE3.glowRamp[0])));
  let v = 0.2 + (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2) * 1.15;
  for (const pulse of CORE3.pulses) {
    const d = (p - pulse.at) / pulse.width;
    v += pulse.amp * Math.exp(-d * d);
  }
  return v;
}

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [-6.9, 1.35, 2.1], look: [-6, 1.05, 0] },
  { at: 0.18, pos: [-5.3, 1.7, 3.5], look: [-4.3, 1.2, 0] },
  { at: 0.44, pos: [-1.6, 2.0, 4.8], look: [-1.3, 1.1, 0] },
  { at: 0.62, pos: [1.1, 2.3, 5.3], look: [0.4, 1.1, 0] },
  { at: 0.82, pos: [3.3, 1.5, 2.7], look: [4.2, 1.1, 0] },
  { at: 1.0, pos: [0.4, 2.6, 6.5], look: [-0.4, 1.0, 0] },
] as const;

export const FOV = [42, 36] as const;
export const PARALLAX = 0.15;
export const GRID_REVEAL: readonly [number, number] = [0.2, 0.34];

/* ------------------------------------------------------------ DOM windows */

/** The typed question (stage 1). */
export const QUESTION = {
  text: "What's moving gold?",
  langs: "English · हिन्दी",
  window: [0.025, 0.065, 0.15, 0.19] as const,
};

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "The AI explores {e|€}very path — code computes each step.", window: [0.21, 0.25, 0.4, 0.44] },
  { text: "{S|$}ignals agree. Signals disagree. {B|₿}oth count.", window: [0.46, 0.5, 0.58, 0.62] },
];

/** Calc tags that surface while the system weighs (illustrative anatomy). */
export const CALCS: { label: string; window: readonly [number, number, number, number] }[] = [
  { label: "[calc] EMA-50 slope", window: [0.47, 0.51, 0.6, 0.64] },
  { label: "[calc] DXY reaction", window: [0.5, 0.54, 0.6, 0.64] },
  { label: "[calc] ATR range", window: [0.53, 0.57, 0.6, 0.64] },
];

export const DOM3 = {
  illustrative: [0.08, 0.13] as const,
  verdict: [0.64, 0.68, 0.8, 0.84] as const,
  finale: [0.85, 0.92] as const,
};

// Sound map (opt-in): the verdict card lands — same chime for every verdict.
export const SOUND = [{ at: 0.665, cue: "verdict" }] as const;

/** The bull & bear at the verdict (all on the chapter's progress), using the
 *  home page's faceted-metal artwork:
 *  walk in → wind-up (head down, paws the ground, bellow) → snort + charge →
 *  horns hit the verdict word → recoil; then the bear rises, roars and rakes. */
export const BULL = {
  draw: [0.665, 0.7] as const, // walks in from the left
  windup: [0.7, 0.725] as const,
  charge: [0.725, 0.745] as const,
  recoil: [0.745, 0.775] as const,
  bear: [0.755, 0.785] as const,
  /** the bear's paw rakes down over the card */
  swipe: 0.792,
  /** px the bull lunges so its horn tips land on the verdict word */
  reach: 46,
};

/** Real-animal voices, fired from the same value that drives the beasts. */
export const BULL_SOUND = [
  { at: 0.692, cue: "bellow" },
  { at: 0.71, cue: "snort" },
  { at: 0.745, cue: "impact" },
  { at: 0.772, cue: "growl" },
  { at: 0.792, cue: "swipe" },
] as const;
