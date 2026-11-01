// /platform — "The OS, opened up". The home film's protagonist (the gold AI
// core) opens the platform: the five capability areas appear as apps around
// it, then the film shows how the OS is used — two ways to act, stop vs
// cancel, every request's path to a verified result, the workspace that
// remembers you, the labels that keep it honest — and ends at the five areas.
//
//   hero       the core with the five capability apps around it
//   ways       (OS screen) the same action by hand and by asking
//   stop       (OS screen + avatar) stop speaking vs cancel the task
//   verify     a request travels the six stations around the core
//   workspace  (OS screen) layouts, notes, read-only connections, languages
//   trust      freshness labels and the promises
//   areas      the five areas, each lit with the cores that lead it
//
// Two cuts like the home: "desktop" (with OS screens) and "compact" (phones and
// tablets — cards instead of OS screens, the avatar speaks in the 3D scene).
import { defineStory, easeInOut, ramp, type CameraKey, type SceneCue, type Story, type AiCoreId } from "@/modules/afvarOs";
import type { Cue } from "@/modules/homeDemo/kit";
import type { CapabilitySlug } from "../types";

export type OverviewKind = "desktop" | "compact";
export type OverviewAct = "hero" | "ways" | "stop" | "verify" | "workspace" | "trust" | "areas";

const ACTS: Record<OverviewKind, { id: OverviewAct; vh: number; label: string }[]> = {
  desktop: [
    { id: "hero", vh: 110, label: "Platform" },
    { id: "ways", vh: 240, label: "Two ways" },
    { id: "stop", vh: 230, label: "Stop or cancel" },
    { id: "verify", vh: 300, label: "To verified" },
    { id: "workspace", vh: 280, label: "Workspace" },
    { id: "trust", vh: 200, label: "Trust" },
    { id: "areas", vh: 300, label: "Five areas" },
  ],
  compact: [
    { id: "hero", vh: 110, label: "Platform" },
    { id: "ways", vh: 200, label: "Two ways" },
    { id: "stop", vh: 240, label: "Stop or cancel" },
    { id: "verify", vh: 280, label: "To verified" },
    { id: "workspace", vh: 200, label: "Workspace" },
    { id: "trust", vh: 180, label: "Trust" },
    { id: "areas", vh: 280, label: "Five areas" },
  ],
};

/* ------------------------------------------------------- capability apps */

/** The five capability areas as apps around the core, in navbar order. */
export const APPS: { slug: CapabilitySlug; name: string; glyph: "chart" | "research" | "alerts" | "risk" | "community"; lead: AiCoreId[] }[] = [
  { slug: "charts", name: "Market data", glyph: "chart", lead: ["market", "verify"] },
  { slug: "research", name: "Research", glyph: "research", lead: ["news", "macro", "verify"] },
  { slug: "alerts", name: "Alerts", glyph: "alerts", lead: ["market", "memory"] },
  { slug: "trade-review", name: "Risk review", glyph: "risk", lead: ["risk", "memory"] },
  { slug: "community", name: "Community", glyph: "community", lead: ["voice", "verify", "memory"] },
];

/** Tile ring around the core (scene units). */
export const TILES = { radius: 2.45, size: 0.56, depth: 0.1 };

/** Areas act: which app is in focus at act fraction f (5 equal beats after the intro). */
export const AREA_BEATS = [0.16, 0.32, 0.48, 0.64, 0.8] as const;
export function areaFocus(f: number): number {
  let k = -1;
  AREA_BEATS.forEach((b, i) => {
    if (f >= b) k = i;
  });
  return k;
}

/* ------------------------------------------------------ request → verified */

/** The six stations of a request (product board D.1.3, verbatim). */
export const STATIONS = [
  { label: "Request", detail: ["Trader input from UI", "Cancel / clarify / confirm"] },
  { label: "Backend", detail: ["Validate session", "Assemble allowed context"] },
  { label: "Resolve request", detail: ["Local commands first", "Model only if needed"] },
  { label: "Policy gate", detail: ["Validate and authorize", "Confirm when required"] },
  { label: "Action runner", detail: ["Call owning service", "Or permitted shell tool"] },
  { label: "Verify", detail: ["Check actual outcome", "Persist operation result"] },
] as const;
export const RETURN_LABEL = "Verified result, clarification or error";

/** Stations sit on a ring around the core, clockwise from upper-left; the left side carries the return. */
export const LOOP = { radius: 2.3, from: (150 / 180) * Math.PI, step: (-60 / 180) * Math.PI };
export const stationAngle = (i: number) => LOOP.from + LOOP.step * i;
/** Verify act fractions: the pulse reaches station i at STATION_AT[i]; the return arc runs after the last. */
export const STATION_AT = [0.12, 0.24, 0.36, 0.5, 0.62, 0.74] as const;
export const RETURN_AT = [0.8, 0.9] as const;
export function stationStep(f: number): number {
  let k = -1;
  STATION_AT.forEach((a, i) => {
    if (f >= a) k = i;
  });
  return k;
}

/* ----------------------------------------------------------- stop / cancel */

/** Stop act fractions, shared by the OS screen, the compact card and the 3D avatar. */
export const STOP = {
  /** First run: all three charts open; speech is stopped half way. */
  run1: [
    [0.1, 0.18],
    [0.18, 0.3],
    [0.3, 0.4],
  ] as const,
  stopPress: 0.24,
  done1: 0.42,
  reset: [0.46, 0.5] as const,
  /** Second run: the first chart opens, then the task is cancelled. */
  run2Gold: [0.5, 0.57] as const,
  run2Dollar: 0.57,
  cancelPress: 0.66,
};
export const STOP_ITEMS = ["Gold chart", "Dollar chart", "Ten-year yield"] as const;
export const STOP_STATE = { pending: "Not started", active: "Checking outcome", done: "Opened and verified", cancelled: "Cancelled" } as const;
export type StopRow = keyof typeof STOP_STATE;
/** Row states and the task status at stop-act fraction f. */
export function stopRows(f: number): { rows: StopRow[]; status: "Running" | "Complete" | "Cancelled"; speaking: boolean; caption: string | null } {
  if (f < STOP.reset[0]) {
    const rows = STOP.run1.map(([a, b]) => (f >= b ? "done" : f >= a ? "active" : "pending")) as StopRow[];
    const speaking = f >= STOP.run1[0][0] && f < STOP.stopPress;
    const stopped = f >= STOP.stopPress;
    return { rows, status: f >= STOP.done1 ? "Complete" : "Running", speaking, caption: stopped ? CAPTION_STOPPED : null };
  }
  if (f < STOP.run2Gold[0]) return { rows: ["pending", "pending", "pending"], status: "Running", speaking: false, caption: null };
  const cancelled = f >= STOP.cancelPress;
  const gold: StopRow = f >= STOP.run2Gold[1] ? "done" : "active";
  const dollar: StopRow = cancelled ? "cancelled" : f >= STOP.run2Dollar ? "active" : "pending";
  return { rows: [gold, dollar, cancelled ? "cancelled" : "pending"], status: cancelled ? "Cancelled" : "Running", speaking: !cancelled, caption: cancelled ? CAPTION_CANCELLED : null };
}
export const CAPTION_STOPPED = "Playback stopped. The task keeps running.";
export const CAPTION_CANCELLED = "Stopping remaining work. Opened chart stays open.";
export const STOP_LINES = ["Opening your three charts now, Gold first.", "Opening them again. Gold is ready."] as const;

/* --------------------------------------------------------------- trust */

export const FRESHNESS = [
  { id: "live", label: "Live", source: "Source time shown · updating" },
  { id: "delayed", label: "Delayed", source: "Delayed by the provider · delay shown" },
  { id: "stale", label: "Stale", source: "Source time shown · not updating" },
  { id: "sample", label: "Sample", source: "Sample data · not live" },
] as const;
export const FRESH_AT = [0.18, 0.38, 0.56, 0.74] as const;

/* --------------------------------------------------------------- films */

type V3 = readonly [number, number, number];
type Beat = { act: OverviewAct; f: number; pos: V3; look: V3; pPos: V3; pLook: V3 };

// Desktop framing keeps the core right of centre (copy on the left); while an
// OS screen is up, the core sits right behind it. Portrait framing keeps the
// core in the upper third, above the caption panel.
const BEATS: Beat[] = [
  { act: "hero", f: 0, pos: [0.2, 0.15, 8.2], look: [-1.45, 0.05, 0], pPos: [0.42, -0.55, 13.3], pLook: [0.42, -2.2, 0] },
  { act: "ways", f: 0.3, pos: [0.3, 0.1, 9.4], look: [-1.95, 0.1, 0], pPos: [0, -0.5, 10.2], pLook: [0, -1.85, 0] },
  { act: "stop", f: 0.6, pos: [0.3, 0.1, 9.4], look: [-1.95, 0.1, 0], pPos: [0, 0.3, 7.0], pLook: [0, -0.85, 0] },
  { act: "verify", f: 0.35, pos: [0.4, 0.15, 10.4], look: [-1.55, 0.35, 0], pPos: [0, -1.0, 19], pLook: [0, -2.95, 0] },
  { act: "workspace", f: 0.5, pos: [0.3, 0.1, 9.4], look: [-1.95, 0.1, 0], pPos: [0, -0.5, 10.2], pLook: [0, -1.85, 0] },
  { act: "trust", f: 0.5, pos: [0.3, 0.1, 8.8], look: [-1.95, 0.1, 0], pPos: [0, -0.5, 10.2], pLook: [0, -1.85, 0] },
  { act: "areas", f: 0.4, pos: [0.45, 0.25, 10.8], look: [-1.6, 0.35, 0], pPos: [0, -1.0, 18.5], pLook: [0, -3.5, 0] },
];

export interface OverviewFilm {
  kind: OverviewKind;
  story: Story<OverviewAct>;
  at: (id: OverviewAct, f: number) => number;
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  sound: SceneCue<Cue>[];
  /** 0→1→0 presence of an act with a soft edge (act fractions). */
  weight: (p: number, id: OverviewAct, soft?: number) => number;
  /** Composed frame for reduced motion. */
  settledP: number;
}

export function createOverviewFilm(kind: OverviewKind): OverviewFilm {
  const story = defineStory(ACTS[kind]);
  const at = (id: OverviewAct, f: number) => story.at(id, f);
  const camera: CameraKey[] = BEATS.map((b) => ({ at: at(b.act, b.f), pos: b.pos, look: b.look }));
  const cameraPortrait: CameraKey[] = BEATS.map((b) => ({ at: at(b.act, b.f), pos: b.pPos, look: b.pLook }));
  const last = BEATS[BEATS.length - 1];
  camera.push({ at: 1, pos: [last.pos[0], last.pos[1], last.pos[2] + 0.1], look: last.look });
  cameraPortrait.push({ at: 1, pos: [last.pPos[0], last.pPos[1], last.pPos[2] + 0.1], look: last.pLook });

  const sound: SceneCue<Cue>[] = [
    { at: at("hero", 0.6), cue: "latch" },
    { at: at("ways", 0.1), cue: "whoosh" },
    { at: at("ways", 0.72), cue: "ping" },
    { at: at("stop", 0.66), cue: "toggle" },
    ...STATION_AT.map((a) => ({ at: at("verify", a), cue: "tick" as Cue })),
    { at: at("verify", STATION_AT[5] + 0.02), cue: "verdict" },
    { at: at("workspace", 0.24), cue: "ping" },
    { at: at("trust", 0.1), cue: "latch" },
    { at: at("areas", 0.1), cue: "whoosh" },
  ];

  const weight = (p: number, id: OverviewAct, soft = 0.12) => {
    const [a, b] = story.range[id];
    const s = (b - a) * soft;
    return easeInOut(ramp(p, a - s * 0.5, a + s) * (1 - ramp(p, b - s, b + s * 0.5)));
  };

  return { kind, story, at, camera, cameraPortrait, sound, weight, settledP: 0.012 };
}

export const OVERVIEW_DESKTOP = createOverviewFilm("desktop");
export const OVERVIEW_COMPACT = createOverviewFilm("compact");
