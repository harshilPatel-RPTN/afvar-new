// /home-demo · Chapter 10 — THE DESK. The climax.
// Every chapter was one window on the same desk. Eight app panels hang
// scattered in the dark, fly in and assemble into one workspace, the AI core
// connects to every window, the desk faces you — and then the whole world
// collapses back into a single tick of light: where the story began.
//
// Stages (one master progress 0..1):
//   scatter  — eight panels hang scattered in depth, dim
//   assemble — they fly in, one by one, into one workspace
//   connect  — the AI core appears and beams to every window
//   desk     — frontal, complete, calm
//   collapse — everything contracts into the first tick; the wordmark appears
import * as THREE from "three";

export const STAGES = {
  scatter: [0, 0.2],
  assemble: [0.2, 0.46],
  connect: [0.46, 0.64],
  desk: [0.64, 0.82],
  collapse: [0.82, 1],
} as const;

export const SETTLED_P = 0.75;
export const PROGRESS_DAMP = 4.5;

/* ------------------------------------------------------------------ panels */

export type PanelDef = {
  key: string;
  label: string;
  /** [cx, cy, w, h] in the assembled workspace (z = 0 plane, facing +z). */
  rect: readonly [number, number, number, number];
  accent: "up" | "down";
  kind: "chart" | "bars";
};

export const PANELS: readonly PanelDef[] = [
  { key: "charts", label: "Charts", rect: [-0.9, 1.55, 3.4, 1.9], accent: "up", kind: "chart" },
  { key: "news", label: "News", rect: [1.75, 2.15, 1.7, 0.7], accent: "up", kind: "bars" },
  { key: "calendar", label: "Calendar", rect: [1.75, 1.35, 1.7, 0.8], accent: "up", kind: "bars" },
  { key: "alerts", label: "Alerts", rect: [-2.2, 0.25, 0.8, 0.6], accent: "up", kind: "bars" },
  { key: "risk", label: "Risk", rect: [-1.333, 0.25, 0.8, 0.6], accent: "down", kind: "bars" },
  { key: "journal", label: "Journal", rect: [-0.467, 0.25, 0.8, 0.6], accent: "up", kind: "bars" },
  { key: "community", label: "Community", rect: [0.4, 0.25, 0.8, 0.6], accent: "up", kind: "bars" },
  { key: "ai", label: "AI Analyst", rect: [1.75, 0.4, 1.7, 0.9], accent: "up", kind: "bars" },
];

export const PANEL_DEPTH = 0.04;

/** Deterministic scattered start pose for panel i. */
export function scatterPose(i: number): { pos: THREE.Vector3; rot: THREE.Euler } {
  const [cx, cy] = PANELS[i].rect;
  return {
    pos: new THREE.Vector3(cx * 1.7 + (((i * 37) % 7) - 3) * 0.5, cy + (((i * 53) % 5) - 2) * 0.6, -5 - (i % 4) * 1.6),
    rot: new THREE.Euler((((i * 13) % 7) - 3) * 0.12, (((i * 29) % 7) - 3) * 0.25, (((i * 41) % 7) - 3) * 0.1),
  };
}

/** Panels fly in one by one through `assemble`. DOM dock chips use the same. */
const ASSEMBLE = { start: 0.21, step: 0.026, dur: 0.09 };
export const assembleAt = (i: number): readonly [number, number] => {
  const s = ASSEMBLE.start + i * ASSEMBLE.step;
  return [s, s + ASSEMBLE.dur];
};

/* ------------------------------------------------------------------ AI core */

export const CORE10 = {
  pos: new THREE.Vector3(0, 1.22, 1.1),
  appear: [0.45, 0.51] as const,
  shellRadius: 0.17,
  innerRadius: 0.095,
};

/** Beams core → each panel, staggered through `connect`. */
export const BEAMS10 = { start: 0.48, step: 0.014, dur: 0.06, radius: 0.006 };

/** Everything contracts into the core, which becomes the first tick again. */
export const COLLAPSE: readonly [number, number] = [0.83, 0.93];

/* ----------------------------------------------------------------- camera */

export const CAMERA_KEYS = [
  { at: 0.0, pos: [0.5, 1.6, 9], look: [0, 1.2, -6] },
  { at: 0.2, pos: [1.5, 1.8, 7.5], look: [0, 1.2, -2] },
  { at: 0.46, pos: [3.2, 2.2, 5.4], look: [0, 1.2, 0] },
  { at: 0.64, pos: [0, 1.4, 5.4], look: [0, 1.22, 0] },
  { at: 0.82, pos: [0, 1.3, 6.2], look: [0, 1.22, 0] },
  { at: 1.0, pos: [0, 1.25, 7.4], look: [0, 1.22, 0] },
] as const;

export const FOV = [42, 36] as const;
export const PARALLAX = 0.12;

/* ------------------------------------------------------------ DOM windows */

export const CAPTIONS: { text: string; window: readonly [number, number, number, number] }[] = [
  { text: "{E|€}very chapter you just saw…", window: [0.02, 0.06, 0.16, 0.2] },
  { text: "…is one window on the same de{s|$}k.", window: [0.23, 0.27, 0.41, 0.45] },
  { text: "One AI operates the whole work{s|$}pace.", window: [0.48, 0.52, 0.6, 0.64] },
  { text: "Text, voice or {y|¥}our own hands — manual controls always work.", window: [0.66, 0.7, 0.78, 0.82] },
];

export const DOM10 = {
  dock: [0.2, 0.25, 0.8, 0.84] as const,
  finale: [0.88, 0.95] as const,
};

// Sound map (opt-in): the desk collapses into one tick — the sonic logo.
export const SOUND = [{ at: 0.9, cue: "logo" }] as const;
