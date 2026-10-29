// /home-demo · Chapter 06 — RISK GUARDIAN.
// The account is a core with live positions orbiting it. Plain words raise a
// guardian perimeter around it. Exposure builds toward the limit, the
// perimeter flashes a warning — and crucially, NOTHING acts: no position is
// closed, no order exists. A shield that watches, never a hand that grabs.
//
// Stages (one master progress 0..1):
//   account  — the account core, connected read-only; positions orbit
//   limits   — "Warn me at 2% daily loss" raises the guardian perimeter
//   pressure — one position turns against you; exposure spreads outward
//   warning  — exposure reaches the perimeter; it warns — and only warns
//   settle   — the field calms; risk copy takes over

export const STAGES = {
  account: [0, 0.2],
  limits: [0.2, 0.42],
  pressure: [0.42, 0.66],
  warning: [0.66, 0.86],
  settle: [0.86, 1],
} as const;

export const SETTLED_P = 0.72;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* -------------------------------------------------------------------- core */

export const CORE6 = {
  pos: [0, 0.95, 0] as const,
  shellRadius: 0.2,
  innerRadius: 0.11,
};

/** Open positions orbiting the account. Index `rogueIndex` turns against you. */
export const POSITIONS = {
  count: 4,
  orbitRadius: 1.0,
  orbitY: 0.95,
  speed: 0.16, // rad/s — slow, deliberate
  size: 0.12,
  rogueIndex: 2,
  rogueWindow: [0.44, 0.6] as const, // turns red and grows
};

/* --------------------------------------------------------------- perimeter */

export const PERIMETER = {
  radius: 2.3,
  wallHeight: 0.55,
  rise: [0.22, 0.34] as const,
  outerRadius: 3.1, // the second limit (drawdown), fainter
  outerRise: [0.28, 0.38] as const,
};

/** The exposure disc spreads from the core toward the perimeter. */
export const EXPOSURE = {
  from: 0.5,
  to: 2.3,
  window: [0.44, 0.68] as const,
  /** Color blends green → red as it approaches the limit. */
  maxOpacity: 0.14,
};

/** The warning: perimeter pulses red; ripples spread; nothing acts. */
export const WARNING = {
  window: [0.68, 0.84] as const,
  ripples: 2,
  calm: [0.86, 0.94] as const, // exposure recedes, perimeter returns to green
};

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [1.6, 1.2, 2.6], look: [0, 0.95, 0] },
  { at: 0.2, pos: [2.8, 2.0, 4.0], look: [0, 0.8, 0] },
  { at: 0.42, pos: [3.6, 3.2, 4.6], look: [0, 0.5, 0] },
  { at: 0.66, pos: [2.6, 1.1, 3.2], look: [1.6, 0.5, 1.0] },
  { at: 0.86, pos: [3.4, 2.6, 4.8], look: [0, 0.6, 0] },
  { at: 1.0, pos: [0.4, 3.4, 6.4], look: [0, 0.7, 0] },
] as const;

export const FOV = [42, 37] as const;
export const PARALLAX = 0.14;
export const GRID_REVEAL: readonly [number, number] = [0.05, 0.16];

/* ------------------------------------------------------------ DOM windows */

export const SENTENCE6 = {
  text: "Warn me at 2% daily loss.",
  window: [0.21, 0.25, 0.38, 0.42] as const,
};

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Connected {r|₹}ead-only. It can see — never touch.", window: [0.02, 0.06, 0.16, 0.2] },
  { text: "Exposure builds. The Guardian watches {e|€}very tick.", window: [0.44, 0.48, 0.6, 0.64] },
];

export const DOM6 = {
  illustrative: [0.08, 0.13] as const,
  warningCard: [0.69, 0.73, 0.82, 0.86] as const,
  finale: [0.87, 0.94] as const,
};
