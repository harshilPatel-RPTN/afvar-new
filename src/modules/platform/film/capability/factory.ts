// The capability-page film: one short scroll film per capability page (about a
// third of the home film), built from the same story engine, camera system and
// sound cues as the home and the /platform overview. A page declares its acts,
// which of them are OS acts on desktop, its camera beats and its cues; this
// factory turns that into the numbers the stage, the scene and the copy read.
//
//   const film = createCapFilm("desktop", ACTS.desktop, BEATS, (at) => [...cues]);
//   film.at("chart", 0.4)   master progress at 40% of the chart act
//   film.osIn(p)            0→1→0 OS layer over the stage (desktop OS acts)
//   film.osCovers(p)        the OS fully covers the stage (the 3D scene rests)
import { defineStory, easeInOut, ramp, window4, type CameraKey, type SceneCue, type Story } from "@/modules/afvarOs";
import type { Cue } from "@/modules/homeDemo/kit";

export type CapKind = "desktop" | "compact";
type V3 = readonly [number, number, number];

export interface CapActDef<A extends string> {
  id: A;
  /** Scroll length in viewport heights. */
  vh: number;
  /** Chapter rail name. */
  label: string;
  /** Desktop: the act plays inside the AFVAR OS screen (caption on top, screen below). */
  os?: boolean;
}

/** A camera beat: where it is in the film, landscape framing, portrait framing. */
export interface CapBeat<A extends string> {
  act: A;
  f: number;
  pos: V3;
  look: V3;
  pPos: V3;
  pLook: V3;
}

export interface CapFilm<A extends string> {
  kind: CapKind;
  story: Story<A>;
  at: (id: A, f: number) => number;
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  sound: SceneCue<Cue>[];
  /** 0→1→0 presence of an act with a soft edge (act fractions). */
  weight: (p: number, id: A, soft?: number) => number;
  /** The acts that play inside the OS screen in this cut (none on compact). */
  os: readonly A[];
  /** OS layer opacity at p (consecutive OS acts share one layer). */
  osIn: (p: number) => number;
  /** True while the OS screen fully covers the 3D stage. */
  osCovers: (p: number) => boolean;
  /** Composed frame for reduced motion. */
  settledP: number;
}

export function createCapFilm<A extends string>(kind: CapKind, acts: readonly CapActDef<A>[], beats: readonly CapBeat<A>[], cues: (at: (id: A, f: number) => number) => SceneCue<Cue>[]): CapFilm<A> {
  const story = defineStory(acts);
  const at = (id: A, f: number) => story.at(id, f);

  const keep = beats.filter((b) => story.order.includes(b.act));
  const camera: CameraKey[] = keep.map((b) => ({ at: at(b.act, b.f), pos: b.pos, look: b.look }));
  const cameraPortrait: CameraKey[] = keep.map((b) => ({ at: at(b.act, b.f), pos: b.pPos, look: b.pLook }));
  const last = keep[keep.length - 1];
  camera.push({ at: 1, pos: [last.pos[0], last.pos[1], last.pos[2] + 0.1], look: last.look });
  cameraPortrait.push({ at: 1, pos: [last.pPos[0], last.pPos[1], last.pPos[2] + 0.1], look: last.pLook });

  const weight = (p: number, id: A, soft = 0.12) => {
    const [a, b] = story.range[id];
    const s = (b - a) * soft;
    return easeInOut(ramp(p, a - s * 0.5, a + s) * (1 - ramp(p, b - s, b + s * 0.5)));
  };

  // OS spans: runs of consecutive OS acts share one screen (desktop only).
  const os = kind === "desktop" ? acts.filter((a) => a.os).map((a) => a.id) : [];
  const spans: [A, A][] = [];
  acts.forEach((a, i) => {
    if (kind !== "desktop" || !a.os) return;
    if (i > 0 && acts[i - 1].os) spans[spans.length - 1][1] = a.id;
    else spans.push([a.id, a.id]);
  });
  const osIn = (p: number) => spans.reduce((m, [first, lastId]) => Math.max(m, window4(p, [at(first, 0), at(first, 0.06), at(lastId, 0.95), at(lastId, 1)])), 0);
  const osCovers = (p: number) => spans.some(([first, lastId]) => p > at(first, 0.07) && p < at(lastId, 0.94));

  return { kind, story, at, camera, cameraPortrait, sound: cues(at), weight, os, osIn, osCovers, settledP: 0.012 };
}
