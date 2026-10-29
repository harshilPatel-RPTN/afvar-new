// AFVAR home — "The trading OS that never stops thinking".
// One continuous scroll film with one protagonist, the AFVAR AI core:
//
//   hero     the core is awake; headline + CTA in the first screen
//   cores    the core opens into seven specialist cores
//   stream   five data sources stream into the cores — you can read every packet
//   think    the cores reason together and one verified answer comes out
//   always   the cores ride the 24-hour market ring
//   ask      it listens (English / हिन्दी) and answers
//   os       the camera dives into the core and the AFVAR OS boots: apps,
//            resize, snap, tabs, AI commands, saved layouts, spaces, focus, widgets
//   trust    every request passes the policy gate; trades are refused
//   finale   everything folds back into the core; register
//
// Scene, overlays, OS film, rail and sound all read these numbers.
import { defineStory, easeInOut, ramp, type CameraKey, type SceneCue } from "@/modules/afvarOs";
import type { Cue } from "../audio";

export const STORY = defineStory([
  { id: "hero", vh: 110, label: "AFVAR AI" },
  { id: "cores", vh: 200, label: "Multicore" },
  { id: "stream", vh: 320, label: "Every tick" },
  { id: "think", vh: 300, label: "How it thinks" },
  { id: "always", vh: 220, label: "Always on" },
  { id: "ask", vh: 220, label: "Ask" },
  { id: "os", vh: 1250, label: "The OS" },
  { id: "trust", vh: 260, label: "Trust" },
  { id: "finale", vh: 160, label: "Join" },
] as const);
export type ActId = (typeof STORY.order)[number];

/** Mobile / reduced motion render this composed frame (the hero). */
export const SETTLED_P = 0.012;

/** 0→1→0 presence of an act with a soft edge (in act fractions). */
export function actWeight(p: number, id: ActId, soft = 0.12): number {
  const [a, b] = STORY.range[id];
  const s = (b - a) * soft;
  return easeInOut(ramp(p, a - s * 0.5, a + s) * (1 - ramp(p, b - s, b + s * 0.5)));
}

/* -------------------------------------------------------------- the cores */

export const SATELLITES = [
  { id: "market", label: "Market core", line: "Reads price, structure and volume on every chart." },
  { id: "macro", label: "Macro core", line: "Tracks rates, inflation and the economic calendar." },
  { id: "news", label: "News core", line: "Reads headlines the moment they land." },
  { id: "risk", label: "Risk core", line: "Watches your exposure and your daily limits." },
  { id: "memory", label: "Memory core", line: "Remembers your plans, notes and past trades." },
  { id: "voice", label: "Voice core", line: "Listens and speaks, in English and हिन्दी." },
  { id: "verify", label: "Verify core", line: "Checks every answer against its sources first." },
] as const;

export const ORBIT = { radius: 2.15, tight: 1.5, tilt: 0.38, speed: 0.12, size: 0.17 };
export const RING = { radius: 2.25, tube: 0.012 };

export type Layout = "inside" | "orbit" | "tight" | "ring" | "column";

/** The pipeline layout (stream + think): data cores in a column between the sources and the AI. */
export const COLUMN = { x: 1.9, gap: 1.0, sourceX: 4.6 };
/** y of the column slot for core i (data cores 0..4), voice/verify sit above/below the AI. */
export const columnPos = (i: number): readonly [number, number, number] =>
  i < 5 ? [COLUMN.x, (2 - i) * COLUMN.gap, 0] : i === 6 ? [0.1, 1.55, 0.5] : [0.1, -1.55, 0.5];

const S = STORY.at;

/** Where the cores are over the story. */
export const PLAN: { a: number; b: number; from: Layout; to: Layout }[] = [
  { a: 0, b: S("cores", 0.1), from: "inside", to: "inside" },
  { a: S("cores", 0.1), b: S("cores", 0.4), from: "inside", to: "orbit" },
  { a: S("cores", 0.4), b: S("stream", 0.05), from: "orbit", to: "orbit" },
  { a: S("stream", 0.05), b: S("stream", 0.2), from: "orbit", to: "column" },
  { a: S("stream", 0.2), b: S("always", 0.02), from: "column", to: "column" },
  { a: S("always", 0.02), b: S("always", 0.25), from: "column", to: "ring" },
  { a: S("always", 0.25), b: S("ask", 0.0), from: "ring", to: "ring" },
  { a: S("ask", 0.0), b: S("ask", 0.2), from: "ring", to: "tight" },
  { a: S("ask", 0.2), b: S("os", 0.0), from: "tight", to: "tight" },
  { a: S("os", 0.0), b: S("os", 0.04), from: "tight", to: "inside" },
  { a: S("os", 0.04), b: S("trust", 0.0), from: "inside", to: "inside" },
  { a: S("trust", 0.0), b: S("trust", 0.18), from: "inside", to: "tight" },
  { a: S("trust", 0.18), b: S("finale", 0.1), from: "tight", to: "tight" },
  { a: S("finale", 0.1), b: S("finale", 0.6), from: "tight", to: "inside" },
  { a: S("finale", 0.6), b: 1.01, from: "inside", to: "inside" },
];

/* ---------------------------------------------------------- data sources */

export type SourceKind = "price" | "macro" | "news" | "account" | "journal";

/** Each source feeds one core — so you can see where every packet goes. */
export const SOURCES: { id: SourceKind; label: string; core: number; pos: readonly [number, number, number]; samples: readonly string[] }[] = [
  { id: "price", label: "Price feed · 8 markets", core: 0, pos: [4.6, 2, 0], samples: [] /* real quotes, filled at runtime */ },
  { id: "macro", label: "Economic calendar", core: 1, pos: [4.6, 1, 0], samples: ["US payrolls · 12:30 UTC", "ECB decision · Thu", "US CPI · next week"] },
  { id: "news", label: "Newswire", core: 2, pos: [4.6, 0, 0], samples: ["Fed speaker at 18:00 UTC", "OPEC+ output headlines", "China PMI released"] },
  { id: "account", label: "Your account · read-only", core: 3, pos: [4.6, -1, 0], samples: ["Open risk · 2 positions", "Daily limit used · 40%", "Margin · healthy"] },
  { id: "journal", label: "Your journal", core: 4, pos: [4.6, -2, 0], samples: ["Plan · wait for London close", "Note · no entries pre-NFP", "Last trade · +1.2R"] },
];
export const CHIPS_PER_SOURCE = 3;

/* ------------------------------------------------------------- thinking */

/** Core-by-core reasoning in the think act (act fractions). The 3D core of the same index lights up in sync. */
export const THINK = [
  { core: 0, at: 0.16, text: "Gold is holding last week's high at 4,031." },
  { core: 2, at: 0.26, text: "US payrolls land in 3 hours." },
  { core: 1, at: 0.36, text: "Payroll days usually move gold more than other days." },
  { core: 3, at: 0.46, text: "You're at 40% of today's loss limit." },
  { core: 4, at: 0.56, text: "You lost the last two times you entered before payrolls." },
  { core: 6, at: 0.66, text: "3 sources agree · numbers re-checked." },
] as const;
export const THINK_OUT = 0.78;

/* ------------------------------------------------------------- the gate */

export const GATE = { x: 2.4, radius: 1.05, tilt: 0.55 };

/* --------------------------------------------------------------- camera */

export const CAMERA_KEYS: CameraKey[] = [
  { at: 0, pos: [0.2, 0.15, 7.4], look: [-1.35, 0, 0] },
  { at: S("cores", 0.55), pos: [1.4, 1.25, 8.2], look: [-1.7, 0, 0] },
  { at: S("stream", 0.25), pos: [0.7, 0.35, 11.2], look: [0.3, 0.05, 0] },
  { at: S("stream", 0.85), pos: [0.45, 0.2, 11.0], look: [0.3, 0, 0] },
  { at: S("think", 0.45), pos: [0.35, 0.15, 9.8], look: [0.35, 0, 0] },
  { at: S("always", 0.5), pos: [-0.2, 0.0, 12.0], look: [-2.45, 0, 0] },
  { at: S("ask", 0.5), pos: [0.4, 0.25, 7.8], look: [-1.7, 0, 0] },
  { at: S("os", 0.0), pos: [0.25, 0.1, 4.6], look: [-0.4, 0, 0] },
  { at: S("os", 0.045), pos: [0.0, 0.0, 1.55], look: [0, 0, 0] },
  { at: S("os", 0.955), pos: [0.02, 0.0, 1.6], look: [0, 0, 0] },
  { at: S("trust", 0.35), pos: [0.1, 0.8, 8.6], look: [-0.9, 0, 0] },
  { at: S("finale", 0.7), pos: [0.2, 0.15, 7.6], look: [-1.35, 0, 0] },
  { at: 1, pos: [0.2, 0.15, 7.7], look: [-1.35, 0, 0] },
];

/* ---------------------------------------------------------------- sound */

export const SOUND: SceneCue<Cue>[] = [
  { at: S("cores", 0.12), cue: "latch" },
  { at: S("stream", 0.12), cue: "tick" },
  { at: S("think", THINK_OUT), cue: "verdict" },
  { at: S("always", 0.1), cue: "whoosh" },
  { at: S("ask", 0.25), cue: "ping" },
  { at: S("os", 0.02), cue: "whoosh" },
  { at: S("trust", 0.45), cue: "alert" },
  { at: S("finale", 0.45), cue: "logo" },
];
