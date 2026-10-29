// /home-demo · Chapter 09 — WHY AFVAR.
// After eight dense scenes, a deliberate moment of quiet: one line receding
// into the dark, three markers, three words — FOLLOW. UNDERSTAND. REVIEW. —
// then the three reasons and the evidence promise. Minimal motion on purpose.
//
// Stages (one master progress 0..1):
//   follow     — the line draws; marker 1 lights; "Follow."
//   understand — marker 2 lights; "Understand."
//   review     — marker 3 lights; "Review."
//   reasons    — the scene dims; the three reasons and the evidence line hold

export const STAGES = {
  follow: [0, 0.26],
  understand: [0.26, 0.5],
  review: [0.5, 0.72],
  reasons: [0.72, 1],
} as const;

export const SETTLED_P = 0.95;
export const PROGRESS_DAMP = 4;
export const FLOOR_Y = 0;

export const LINE = {
  from: [-9, 0.8, -3] as const,
  to: [9, 0.8, 1] as const,
  draw: [0.02, 0.2] as const,
  radius: 0.01,
};

/** Markers along the line (curve u) and when each lights. */
export const MARKERS = [
  { u: 0.36, light: [0.06, 0.14] as const },
  { u: 0.5, light: [0.3, 0.38] as const },
  { u: 0.64, light: [0.54, 0.62] as const },
];

/** The scene recedes so the reasons can be read. */
export const DIM: readonly [number, number] = [0.72, 0.8];

export const CAMERA_KEYS = [
  { at: 0.0, pos: [-4.6, 1.3, 3.6], look: [-2.6, 0.8, -0.6] },
  { at: 0.26, pos: [-2.2, 1.4, 4.0], look: [-0.4, 0.8, -0.2] },
  { at: 0.5, pos: [0.2, 1.5, 4.3], look: [1.6, 0.8, 0.2] },
  { at: 0.72, pos: [1.8, 1.8, 5.2], look: [1.2, 0.8, 0.1] },
  { at: 1.0, pos: [2.2, 2.1, 6.2], look: [1.0, 0.8, 0] },
] as const;

export const FOV = [40, 36] as const;
export const PARALLAX = 0.1;
export const GRID_REVEAL: readonly [number, number] = [0.04, 0.16];

/* ------------------------------------------------------------ DOM windows */

export const WORDS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Follow.", window: [0.05, 0.1, 0.2, 0.25] },
  { text: "Understand.", window: [0.29, 0.34, 0.44, 0.49] },
  { text: "Review.", window: [0.53, 0.58, 0.66, 0.71] },
];

export const DOM9 = {
  reasons: [0.74, 0.82] as const,
};

export const REASONS = [
  {
    title: "One AI operating system",
    body: "Charts, research, alerts, risk and community run as connected apps in a single desk — your layout follows your account to any screen.",
  },
  {
    title: "Clear market context",
    body: "Every price, verdict and headline carries its source, venue, delay and cache age. The AI never invents a number — code computes, it explains.",
  },
  {
    title: "From question to insight",
    body: "Ask in English or हिन्दी. Spoken questions get spoken answers; every analysis is graded publicly in the Track Record.",
  },
] as const;

export const EVIDENCE = "Every quote shows its source, venue, delay and cache age. Every analysis is graded publicly — including every WAIT.";
