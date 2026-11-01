// MARKET TERRAIN — single source of truth for the hero film
// (docs/utils/AFVAR-Market-Terrain-Green-Red-Black-README.md §2, §5, §6).
// One normalised value `u` (0..1) drives everything: the automatic entry
// (u 0 → INTRO_END, six beats, ~4.8s) and the scroll chapters
// (u INTRO_END → 1). The homepage hero renders this timeline live
// (MarketTerrainScene.tsx via HeroLive, `lite` mode).
// No magic numbers elsewhere.

/** Automatic entry beats (README §5), on the same u axis as the chapters. */
export const INTRO = {
  /** Beat 1 — the signal: green trace, red counter-trace, a candle edge in low light. */
  signal: [0, 0.025],
  /** Beat 2 — the first candlestick rises from the dark plane. */
  firstCandle: [0.025, 0.055],
  /** Beat 3 — the terrain emerges: near groups, then mid, then far. */
  terrain: [0.055, 0.1],
  /** Beat 4 — travel through the market between tall foreground candles. */
  travel: [0.1, 0.14],
  /** Beat 5 — signals connect; the scanning light sweeps the terrain. */
  connect: [0.14, 0.17],
  /** Beat 6 — pull back to the wide hero composition (poster frame). */
  establish: [0.17, 0.2],
} as const;

/** Where the auto entry ends and scroll takes over (also the poster frame). */
export const INTRO_END = 0.2;
/** Target duration of the automatic entry (README §5: ~5s). */
export const INTRO_SECONDS = 4.8;

/** Scroll chapters (README §6) on u ∈ [INTRO_END, 1]. */
export const STAGES = {
  /** Chapters A+B — first signal held, landscape layers read near → far. */
  landscape: [0.2, 0.36],
  /** Chapter C — low fly-through past the largest structures. */
  flyThrough: [0.36, 0.56],
  /** Chapter D — paths connect clusters; the scanner selects areas. */
  connect: [0.56, 0.72],
  /** Chapter E — wide reveal of the complete terrain. */
  reveal: [0.72, 0.88],
  /** Chapter F — settle and release into the page. */
  release: [0.88, 1],
} as const;

/* ------------------------------------------------------------- terrain */

/** Deterministic seed — every capture of a given u is identical. */
export const SEED = 20261027;

/**
 * Lanes run along x and recede in z. Near lanes are short and chunky
 * (foreground parallax), far lanes are taller ridges that fade into black.
 * Candles start at x0 and step by `pitch`; terrain occupies the right and
 * lower centre of the desktop frame (camera sits off its left edge).
 */
export const TERRAIN = {
  lanes: 9,
  candlesPerLane: 44,
  laneZ0: 2.4,
  laneGap: 3.2,
  x0: -6.5,
  pitch: 0.62,
  /** Body width per lane: chunky foreground, finer ridges behind. */
  width: (lane: number) => 0.46 - lane * 0.018,
  /** Height amplitude per lane: low foreground, rising ridges behind (silhouettes, not poles). */
  amp: (lane: number) => [1.3, 1.9, 2.6, 2.0, 3.3, 2.7, 4.0, 3.4, 4.6][lane] ?? 3,
  /** Cluster gaps: candle i is left empty when this returns true (deliberate groups). */
  gap: (lane: number, i: number) => (i + lane * 5) % 12 >= 10,
  /** Gentle rolling base so the floor reads as terrain, not a box. */
  baseY: (x: number, z: number) => 0.18 * Math.sin(x * 0.21 + z * 0.13) + 0.12 * Math.cos(z * 0.31),
};

/** The hero candle of Beat 2: lane 0, candle index. */
export const HERO_CANDLE = { lane: 0, index: 2 };

/** Reveal waves (README §5 Beats 2–3): near → mid → far, never bouncy. */
export const REVEAL = {
  hero: [0.03, 0.055] as const,
  /** Lane `l` starts at start + l*laneStep; candles within a lane stagger by x. */
  start: 0.055,
  laneStep: 0.0042,
  xStep: 0.0011,
  dur: 0.022,
};

/* ------------------------------------------------------------- paths */

/**
 * Price paths ride over candle tops of chosen lanes. `lane` + `from..to`
 * candle indices; `lift` above the tops. Draw windows on u.
 */
export const PATHS = {
  green: { lane: 2, from: 1, to: 27, lift: 0.45, draw: [0.004, 0.13] as const },
  red: { lane: 5, from: 4, to: 26, lift: 0.4, draw: [0.012, 0.16] as const },
  /** Chapter D connections between clusters (lane, index) → (lane, index). */
  links: [
    { a: [2, 9], b: [5, 14], color: "green" as const, draw: [0.14, 0.17] as const },
    { a: [5, 18], b: [7, 22], color: "red" as const, draw: [0.15, 0.18] as const },
    { a: [5, 14], b: [8, 6], color: "green" as const, draw: [0.58, 0.66] as const },
    { a: [7, 22], b: [3, 25], color: "red" as const, draw: [0.62, 0.7] as const },
  ],
};

/** Scanning light: x position sweep windows (one focal action at a time). */
export const SCAN = {
  sweeps: [
    { at: [0.14, 0.18] as const, x: [-6, 20] as const },
    { at: [0.58, 0.72] as const, x: [-7, 21] as const },
  ],
  /** Half-width of the brightened band (world units). */
  band: 1.4,
};

/* ------------------------------------------------------------- camera */

type Key = { at: number; pos: [number, number, number]; look: [number, number, number] };

/** Desktop 16:9 — terrain right/lower centre, left kept dark for the copy. */
export const CAMERA_KEYS: Key[] = [
  { at: 0.0, pos: [-4.55, 0.3, 3.55], look: [-5.26, 0.3, 2.4] },
  { at: 0.025, pos: [-4.25, 0.55, 4.25], look: [-5.4, 0.8, 2.2] },
  { at: 0.055, pos: [-3.9, 1.0, 5.5], look: [-3.0, 0.9, 0] },
  { at: 0.1, pos: [-3.2, 0.95, 0.8], look: [5, 1.1, -0.4] },
  { at: 0.14, pos: [2.2, 1.35, 0.8], look: [10, 1.5, -3] },
  { at: 0.17, pos: [-4.5, 3.6, 7.0], look: [2.5, 1.0, -6] },
  { at: 0.2, pos: [-12.5, 4.4, 9.5], look: [-0.5, 0.8, -7] },
  { at: 0.36, pos: [-11.5, 3.0, 6.0], look: [-2.5, 1.0, -8] },
  { at: 0.46, pos: [-4.5, 1.5, 0.8], look: [6, 1.4, -2.2] },
  { at: 0.56, pos: [3.0, 1.9, -2.4], look: [11, 1.6, -7.5] },
  { at: 0.72, pos: [-8.5, 5.5, 3.5], look: [-1.5, 1.0, -10] },
  { at: 0.88, pos: [-18.0, 10.0, 12.5], look: [-3.5, 0.4, -10] },
  { at: 1.0, pos: [-18.8, 10.6, 13.4], look: [-3.5, 0.2, -10] },
];

/** Mobile portrait — terrain centred and large; its own path, not a crop. */
export const CAMERA_KEYS_MOBILE: Key[] = [
  { at: 0.0, pos: [-4.6, 0.45, 4.4], look: [-5.26, 0.35, 2.4] },
  { at: 0.055, pos: [-3.8, 1.7, 6.6], look: [-3.0, 0.2, 0] },
  { at: 0.14, pos: [0.2, 2.6, 1.6], look: [5, -0.6, -6] },
  { at: 0.2, pos: [-1.0, 7.0, 10.0], look: [4.0, -1.8, -5] },
  { at: 0.56, pos: [1.0, 5.0, 5.0], look: [5.5, -1.2, -9] },
  { at: 0.88, pos: [-2.0, 13.0, 13.5], look: [4.5, -2.5, -8] },
  { at: 1.0, pos: [-2.1, 13.5, 14.0], look: [4.5, -2.6, -8] },
];

/* ------------------------------------------------------- live (lite) quality */

/**
 * Live homepage render tiers (MarketTerrainScene `lite`). Start at tier 0; if
 * consecutive rendered frames average slower than `slowFrame` seconds over
 * `samples` frames, step down one tier (never back up — no oscillation).
 * `dpr` is the device-pixel-ratio cap, `msaa` the composer's multisampling.
 */
export const LITE_QUALITY = {
  desktop: [
    { dpr: 1.25, msaa: 2 },
    { dpr: 1.25, msaa: 0 },
    { dpr: 1, msaa: 0 },
  ],
  mobile: [
    { dpr: 1.5, msaa: 0 },
    { dpr: 1.25, msaa: 0 },
    { dpr: 1, msaa: 0 },
  ],
  /** ~40 fps: below this the scrub feels sticky. */
  slowFrame: 1 / 40,
  samples: 30,
  /** A gap longer than this between rendered frames = a new burst, not a slow frame. */
  burstGap: 0.1,
  /** Ground mesh subdivisions (the rolling base is a long, smooth wave). */
  groundSegments: 96,
} as const;

/* ------------------------------------------------------------- DOM */

/**
 * DOM windows on u (shared with Hero). README §6 Chapter E: at most ONE
 * small, honest market callout, late. Dock labels optional and late.
 */
export const DOM = {
  callout1: [0.74, 0.78, 0.86, 0.9] as const,
  /** Unused (never visible) — kept for API stability; README: no callout clutter. */
  callout2: [2, 2, 2, 2] as const,
  dock: [0.8, 0.86] as const,
  workspace: [2, 2] as const,
  release: [0.88, 1] as const,
};

/* ------------------------------------------------------------- palette */

/** README §3 market palette — scene only; UI uses the same values via tokens. */
export const COLORS = {
  black: "#040404",
  deep: "#06110C",
  green: "#00E676",
  greenDeep: "#00A85A",
  red: "#FF3B3B",
  redSoft: "#FF6464",
  graphite: "#14181b",
  graphiteLight: "#22282c",
  steel: "#8c969c",
};

/* ------------------------------------------------------------- helpers */

export const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
/** 0→1 inside [a,b]. */
export const ramp = (p: number, a: number, b: number) => clamp01((p - a) / (b - a));
/** In/out window from a 4-tuple [inStart, inEnd, outStart, outEnd]. */
export const window4 = (p: number, [a, b, c, d]: readonly [number, number, number, number]) => ramp(p, a, b) * (1 - ramp(p, c, d));
export const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
export const easeInOut = (x: number) => (x < 0.5 ? 2 * x * x : 1 - Math.pow(-2 * x + 2, 2) / 2);
/** Chapter F: the whole scene settles darker for the hand-off to charcoal. */
export const releaseDim = (p: number) => 1 - 0.6 * easeInOut(ramp(p, STAGES.release[0], STAGES.release[1]));

/** Deterministic PRNG (mulberry32). */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
