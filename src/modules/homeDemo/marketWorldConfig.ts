// /home-demo · Chapter 02 — THE MARKET WORLD.
// Eight coverage lanes wake one by one, organise into three territories
// (commodities · forex · crypto), a freshness scan sweeps the field
// (provenance), and the camera settles on one connected market landscape.
//
// Stages (one master progress 0..1):
//   arrival     — darkness; the camera descends toward a dormant field
//   lanes       — eight price lanes draw and light in a directional wave
//   territories — the lanes organise into three named groups
//   provenance  — a scan pulse sweeps every lane: source · venue · delay · cache
//   settle      — wide, organised composition; product copy takes over
import * as THREE from "three";

export const STAGES = {
  arrival: [0, 0.2],
  lanes: [0.2, 0.45],
  territories: [0.45, 0.65],
  provenance: [0.65, 0.82],
  settle: [0.82, 1],
} as const;

export const SETTLED_P = 0.9;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* ------------------------------------------------------------------ lanes */

export type LaneGroup = {
  key: string;
  label: string;
  note: string;
  packedX: number;
  spreadX: number;
  width: number;
};

export const GROUPS: readonly LaneGroup[] = [
  { key: "commodities", label: "Commodities", note: "The lanes that move first on macro.", packedX: -2.7, spreadX: -4.6, width: 2.6 },
  { key: "forex", label: "Forex", note: "London · New York · Asia sessions.", packedX: 0, spreadX: 0, width: 3.4 },
  { key: "crypto", label: "Crypto", note: "Bitcoin first. 24/7.", packedX: 2.6, spreadX: 4.4, width: 1.6 },
];

export type LaneDef = {
  symbol: string;
  name: string;
  group: number; // index into GROUPS
  localX: number;
  up: boolean; // net direction of the illustrative walk (green/red)
  seed: number;
  flowSpeed: number; // crypto never sleeps — its ticks run faster
};

export const LANES: readonly LaneDef[] = [
  { symbol: "XAUUSD", name: "Gold", group: 0, localX: -0.8, up: true, seed: 11, flowSpeed: 1 },
  { symbol: "XAGUSD", name: "Silver", group: 0, localX: 0, up: true, seed: 23, flowSpeed: 1 },
  { symbol: "WTI", name: "Crude oil", group: 0, localX: 0.8, up: false, seed: 37, flowSpeed: 1 },
  { symbol: "EURUSD", name: "Euro / Dollar", group: 1, localX: -1.2, up: true, seed: 41, flowSpeed: 1 },
  { symbol: "USDJPY", name: "Dollar / Yen", group: 1, localX: -0.4, up: false, seed: 53, flowSpeed: 1 },
  { symbol: "GBPUSD", name: "Pound / Dollar", group: 1, localX: 0.4, up: true, seed: 67, flowSpeed: 1 },
  { symbol: "NZDUSD", name: "Kiwi / Dollar", group: 1, localX: 1.2, up: false, seed: 79, flowSpeed: 1 },
  { symbol: "BTC-USD", name: "Bitcoin", group: 2, localX: 0, up: true, seed: 97, flowSpeed: 1.8 },
];

const LANE_Z: readonly [number, number] = [-10, 14];
export const LANE_RADIUS = 0.013;
const LANE_CONTROL_POINTS = 18;

/** Lanes draw + light in a directional wave through the `lanes` stage. */
export const LANE_REVEAL = { start: 0.21, step: 0.027, dur: 0.07 };

/** Group origins slide packed → spread over this window (territories form). */
export const TERRITORY_SHIFT: readonly [number, number] = [0.47, 0.6];

/* ----------------------------------------------- deterministic price walks */

/** mulberry32 — tiny seeded PRNG so every build renders the same lanes. */
const mulberry32 = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/** Lane height band for real closes (min → max of the window). */
const REAL_Y: readonly [number, number] = [0.22, 1.5];

/**
 * Lane path along +z. With real closes from the AFVAR data layer, the shape IS
 * the price history (min–max normalised per lane). Without them, a seeded
 * illustrative walk keeps the scene complete.
 */
export function lanePoints(lane: LaneDef, closes?: readonly number[]): THREE.Vector3[] {
  if (closes && closes.length >= 4) {
    let lo = Infinity;
    let hi = -Infinity;
    for (const c of closes) {
      lo = Math.min(lo, c);
      hi = Math.max(hi, c);
    }
    const span = hi - lo || 1;
    return closes.map((c, i) => {
      const z = LANE_Z[0] + (i / (closes.length - 1)) * (LANE_Z[1] - LANE_Z[0]);
      return new THREE.Vector3(0, REAL_Y[0] + ((c - lo) / span) * (REAL_Y[1] - REAL_Y[0]), z);
    });
  }
  return illustrativeWalk(lane);
}


/** An illustrative price walk along +z: noisy steps, occasional sharp spikes
 *  (impulse + partial retrace), and a net drift in the lane's direction — so
 *  the lane reads as price action, not a smooth bezier. */
function illustrativeWalk(lane: LaneDef): THREE.Vector3[] {
  const rnd = mulberry32(lane.seed);
  const pts: THREE.Vector3[] = [];
  let y = 0.38 + rnd() * 0.25;
  let retrace = 0;
  const drift = lane.up ? 0.032 : -0.026;
  for (let i = 0; i < LANE_CONTROL_POINTS; i++) {
    const z = LANE_Z[0] + (i / (LANE_CONTROL_POINTS - 1)) * (LANE_Z[1] - LANE_Z[0]);
    let step = (rnd() - 0.5) * 0.34 + drift + retrace;
    retrace = 0;
    // Sharp move: strong impulse, mostly with the trend, partially given back.
    if (rnd() < 0.24) {
      const impulse = (rnd() < (lane.up ? 0.7 : 0.3) ? 1 : -1) * (0.38 + rnd() * 0.35);
      step += impulse;
      retrace = -impulse * (0.35 + rnd() * 0.25);
    }
    y = THREE.MathUtils.clamp(y + step, 0.18, 1.6);
    pts.push(new THREE.Vector3((rnd() - 0.5) * 0.2, y, z));
  }
  return pts;
}

/* ---------------------------------------------------- candles + area fill */

// Each lane carries a field of candles beneath it — the chart language that
// makes the lanes unmistakably markets — plus a faint area-fill wall to floor.
export const LANE_CANDLES = {
  perLane: 12,
  uStart: 0.05,
  uEnd: 0.95,
  width: 0.06,
  minHeight: 0.12,
  heightScale: 0.5,
  revealSpan: 0.06, // of lane draw fraction
};

export const RIBBON = {
  segments: 90,
  opacity: 0.07,
};

/* ------------------------------------------------------------- flow + scan */

// Raw ticks flowing along each lit lane.
export const FLOW = {
  perLane: 9,
  speed: 0.045, // path-u per second (× lane.flowSpeed)
  window: [0.24, 0.97] as const,
  size: 0.022,
};

// The provenance sweep: one bright scanline travels the whole field once.
export const SCAN = {
  window: [0.66, 0.79] as const,
  z: LANE_Z,
  width: 15,
  y: 0.9,
};

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [0, 8, -17], look: [0, 0, -3] },
  { at: 0.2, pos: [0.5, 3.4, -11.5], look: [0, 0.3, -3] },
  { at: 0.45, pos: [3.2, 2.2, -3.5], look: [-2.0, 0.25, 3.5] },
  { at: 0.65, pos: [7.5, 5.0, 1.5], look: [-0.5, 0, 3] },
  { at: 0.82, pos: [-4.0, 1.0, 4.0], look: [-5.4, 0.35, 9.5] },
  { at: 1.0, pos: [0.3, 5.8, -3.5], look: [0, 0.3, 8] },
] as const;

export const FOV = [44, 38] as const;
export const PARALLAX = 0.14;

export const GRID_REVEAL: readonly [number, number] = [0.07, 0.19];

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "One connected fi{e|€}ld of markets.", window: [0.02, 0.06, 0.15, 0.19] },
  { text: "Eight lanes, waking one b{y|¥} one.", window: [0.22, 0.26, 0.39, 0.43] },
  { text: "Commodities. For{e|€}x. Cr{y|¥}pto.", window: [0.47, 0.51, 0.6, 0.64] },
  { text: "Every number carries its {s|$}ource, venue, delay and cache age.", window: [0.655, 0.695, 0.78, 0.815] },
];

export const DOM2 = {
  illustrative: [0.08, 0.13] as const, // fades in
  headers: [0.47, 0.53] as const, // category headers + notes
  provCard: [0.665, 0.705, 0.78, 0.815] as const, // provenance anatomy card
  finale: [0.83, 0.9] as const,
};

/** Symbol chip i lights as its lane draws (and stays lit). */
export const chipRevealAt = (i: number): readonly [number, number] => {
  const s = LANE_REVEAL.start + i * LANE_REVEAL.step;
  return [s, s + 0.05];
};

/** Crude oil pours onto the "Commodities." caption (index into CAPTIONS). */
export const OIL = { caption: 2, at: [0.49, 0.6] as const };
