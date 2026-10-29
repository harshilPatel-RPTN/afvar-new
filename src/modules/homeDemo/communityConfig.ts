// /home-demo · Chapter 08 — COMMUNITY.
// Fixed official rooms rise inside a boundary; stray, unofficial noise outside
// it fades away. Traders arrive and gather. A chart is shared room to room —
// the real object, not a screenshot — and records are verified, so results
// can't be invented. No scam channels, by design.
//
// Room set follows the built /communities page (Gold · Silver · Oil · Crypto).
//
// Stages (one master progress 0..1):
//   rooms    — official rooms rise; the boundary forms; strays dissolve
//   members  — traders stream in and gather around each room
//   share    — a chart travels room to room along a drawn link
//   verified — verified records light up with halos
//   settle   — wide composition; community copy takes over

export const STAGES = {
  rooms: [0, 0.2],
  members: [0.2, 0.44],
  share: [0.44, 0.64],
  verified: [0.64, 0.84],
  settle: [0.84, 1],
} as const;

export const SETTLED_P = 0.82;
export const PROGRESS_DAMP = 4.5;
export const FLOOR_Y = 0;

/* ------------------------------------------------------------------- rooms */

export const ROOMS = [
  { key: "gold", label: "Gold", angle: Math.PI * 0.25 },
  { key: "silver", label: "Silver", angle: Math.PI * 0.75 },
  { key: "oil", label: "Oil", angle: Math.PI * 1.25 },
  { key: "crypto", label: "Crypto", angle: Math.PI * 1.75 },
] as const;

export const ROOM = {
  ringRadius: 2.6,
  plateRadius: 0.9,
  postHeight: 0.7,
  rise: { start: 0.03, step: 0.03, dur: 0.07 },
};

export const roomCenter = (i: number): [number, number, number] => [
  Math.cos(ROOMS[i].angle) * ROOM.ringRadius,
  FLOOR_Y,
  Math.sin(ROOMS[i].angle) * ROOM.ringRadius,
];

/** Room i rises over this window (DOM chips use the same). */
export const roomRiseAt = (i: number): readonly [number, number] => {
  const s = ROOM.rise.start + i * ROOM.rise.step;
  return [s, s + ROOM.rise.dur];
};

/* ---------------------------------------------------------- boundary + strays */

export const BOUNDARY = { radius: 4.1, rise: [0.08, 0.18] as const };
export const STRAYS = { count: 12, rMin: 4.7, rMax: 5.8, fade: [0.1, 0.2] as const };

/* ----------------------------------------------------------------- members */

export const MEMBERS = {
  perRoom: 7,
  orbit: 0.48,
  y: 0.28,
  size: 0.045,
  from: 6.5, // arrival radius
  arrive: { start: 0.21, step: 0.0065, dur: 0.07 },
  speed: 0.22,
};

/* ------------------------------------------------------------ shared chart */

export const SHARE = {
  window: [0.45, 0.62] as const,
  rooms: [0, 1, 2] as const, // gold → silver → oil
  hop: 1.1, // arc height between rooms
  y: 0.75,
};

/* ---------------------------------------------------------------- verified */

export const VERIFIED = {
  every: 3, // every third member carries a verified record
  window: [0.66, 0.78] as const,
  haloRadius: 0.1,
};

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [3.9, 1.3, 3.9], look: [1.84, 0.3, 1.84] },
  { at: 0.2, pos: [5.2, 3.2, 5.2], look: [0, 0.3, 0] },
  { at: 0.44, pos: [0, 5.6, 6.2], look: [0, 0, 0] },
  { at: 0.64, pos: [-3.6, 2.4, 4.4], look: [-0.6, 0.5, 0.6] },
  { at: 0.84, pos: [3.8, 2.0, 4.2], look: [0, 0.4, 0] },
  { at: 1.0, pos: [0.4, 6.5, 7.5], look: [0, 0, 0] },
] as const;

export const FOV = [42, 37] as const;
export const PARALLAX = 0.14;
export const GRID_REVEAL: readonly [number, number] = [0.04, 0.14];

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "Official rooms only. No {s|$}cam channels, by design.", window: [0.02, 0.06, 0.16, 0.2] },
  { text: "Traders gather around the markets the{y|¥} follow.", window: [0.23, 0.27, 0.39, 0.43] },
  { text: "Charts are {s|$}hared — not screenshotted.", window: [0.46, 0.5, 0.59, 0.63] },
  { text: "{R|₹}ecords are verified. Results can't be invented.", window: [0.66, 0.7, 0.8, 0.84] },
];

export const DOM8 = {
  illustrative: [0.06, 0.11] as const,
  recordCard: [0.68, 0.72, 0.81, 0.85] as const,
  finale: [0.86, 0.93] as const,
};
