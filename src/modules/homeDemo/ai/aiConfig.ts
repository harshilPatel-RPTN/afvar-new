// AFVAR home — "The trading OS that never stops thinking".
// One continuous scroll film with one protagonist, the AFVAR AI:
//
//   hero     the core is awake; headline + CTA in the first screen
//   cores    the core opens into seven specialist cores
//   stream   five sources stream labelled packets into the core that reads them
//   think    the cores reason in turn; one verified answer comes out
//   always   the cores ride the 24-hour market ring
//   avatar   the core gains a body: the AFVAR avatar assembles around it,
//            waves, listens (English / हिन्दी), thinks and answers
//   os       (desktop) the camera dives into the avatar's chest screen and the
//            AFVAR OS boots, with the avatar living in its corner
//   trust    every request passes the policy gate; trades are refused
//   finale   the core and the avatar close the film; register
//
// Two cuts of the same film: "desktop" (with the OS) and "compact" for phones
// and tablets (no OS — the avatar is the experience there). Each has a
// landscape and a portrait camera path. Scene, overlays, OS film, rail and
// sound all read these numbers.
import { defineStory, easeInOut, ramp, type CameraKey, type SceneCue, type Story } from "@/modules/afvarOs";
import type { Cue } from "../audio";

export const PANEL_CAMERA: CameraKey[] = [0, 1].map(at => ({ at, pos: [.2, .14, 3.8], look: [.35, -.55, 0] }));

export function coreOpeningScale(film: Film, progress: number, openingScale: number) {
  // Desktop: the core settles by the end of the (short) hero, so the shrink is
  // already happening while the headline leaves and the cores act takes over.
  const end = film.kind === "desktop" ? film.at("hero", 1) : film.at("cores", .3);
  return 1 + (openingScale - 1) * (1 - easeInOut(ramp(progress, 0, end)));
}

export type FilmKind = "desktop" | "compact";
export type ActId = "hero" | "cores" | "stream" | "think" | "always" | "avatar" | "os" | "trust" | "finale";

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
export const columnPos = (i: number, squeeze = 1, lift = 0): readonly [number, number, number] =>
  i < 5 ? [COLUMN.x, (2 - i) * COLUMN.gap * squeeze + lift, 0] : i === 6 ? [0.1, 1.55 * squeeze + lift, 0.5] : [0.1, -1.55 * squeeze + lift, 0.5];

/* ---------------------------------------------------------- data sources */

export type SourceKind = "price" | "macro" | "news" | "account" | "journal";

/** Each source feeds one core — so you can see where every packet goes. */
export const SOURCES: { id: SourceKind; label: string; core: number; pos: readonly [number, number, number]; samples: readonly string[] }[] = [
  { id: "price", label: "Price feed · 8 markets", core: 0, pos: [COLUMN.sourceX, 2, 0], samples: [] /* real quotes, filled at runtime */ },
  { id: "macro", label: "Economic calendar", core: 1, pos: [COLUMN.sourceX, 1, 0], samples: ["US payrolls · 12:30 UTC", "ECB decision · Thu", "US CPI · next week"] },
  { id: "news", label: "Newswire", core: 2, pos: [COLUMN.sourceX, 0, 0], samples: ["Fed speaker at 18:00 UTC", "OPEC+ output headlines", "China PMI released"] },
  { id: "account", label: "Your account · read-only", core: 3, pos: [COLUMN.sourceX, -1, 0], samples: ["Open risk · 2 positions", "Daily limit used · 40%", "Margin · healthy"] },
  { id: "journal", label: "Your journal", core: 4, pos: [COLUMN.sourceX, -2, 0], samples: ["Plan · wait for London close", "Note · no entries pre-NFP", "Last trade · +1.2R"] },
];

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

/* --------------------------------------------------------------- avatar */

/** The avatar act, in act fractions (same in both cuts). */
export const AVATAR = {
  merge: [0.0, 0.1] as const, // cores fold into the AI
  assemble: [0.08, 0.32] as const, // parts fly in around the core
  wave: [0.32, 0.46] as const,
  listen: [0.46, 0.58] as const, // the question arrives
  think: [0.58, 0.66] as const,
  answer: [0.66, 0.94] as const, // it speaks
  /** Avatar placement in the 3D stage: feet y, scale (robot units → scene). */
  place: { x: 0, y: -1.2, scale: 0.44 },
  /**
   * Seconds the parts take to come together once scroll reaches the build
   * (avatar act, finale, OS overlay): timed, so a fast flick still shows it all.
   */
  buildSeconds: 1.3,
};

/* ------------------------------------------------------------- the gate */

export const GATE = { x: 2.4, radius: 1.05, tilt: 0.55 };

/* --------------------------------------------------------------- films */

const ACTS: Record<FilmKind, { id: ActId; vh: number; label: string }[]> = {
  desktop: [
    // Acts are kept short so the film moves even on a slow scroll (2140 vh).
    // The finale still settles (core home, robot wave, register) by .65 of its act.
    { id: "hero", vh: 70, label: "AFVAR AI" },
    { id: "cores", vh: 120, label: "Multicore" },
    { id: "stream", vh: 180, label: "Every tick" },
    { id: "think", vh: 180, label: "How it thinks" },
    { id: "always", vh: 130, label: "Always on" },
    { id: "avatar", vh: 380, label: "Meet AFVAR" },
    { id: "os", vh: 820, label: "The OS" },
    { id: "trust", vh: 160, label: "Trust" },
    { id: "finale", vh: 100, label: "Join" },
  ],
  compact: [
    { id: "hero", vh: 110, label: "AFVAR AI" },
    { id: "cores", vh: 200, label: "Multicore" },
    { id: "stream", vh: 300, label: "Every tick" },
    { id: "think", vh: 280, label: "How it thinks" },
    { id: "always", vh: 200, label: "Always on" },
    { id: "avatar", vh: 440, label: "Meet AFVAR" },
    { id: "trust", vh: 240, label: "Trust" },
    { id: "finale", vh: 160, label: "Join" },
  ],
};

type V3 = readonly [number, number, number];
/** A camera beat: where it is in the film, landscape framing, portrait framing. */
type Beat = { act: ActId; f: number; pos: V3; look: V3; pPos: V3; pLook: V3 };

const BEATS: Beat[] = [
  { act: "hero", f: 0, pos: [0.2, 0.15, 7.4], look: [-1.35, 0, 0], pPos: [0, -0.4, 9.5], pLook: [0, -1.6, 0] },
  { act: "cores", f: 0.55, pos: [1.4, 1.25, 8.2], look: [-1.7, 0, 0], pPos: [0, 0.6, 13.6], pLook: [0, -2.1, 0] },
  { act: "stream", f: 0.25, pos: [0.7, 0.35, 11.2], look: [0.3, 0.05, 0], pPos: [1.05, -0.6, 9.2], pLook: [1.05, -1.6, 0] },
  { act: "stream", f: 0.85, pos: [0.45, 0.2, 11.0], look: [0.3, 0, 0], pPos: [1.05, -0.6, 9.1], pLook: [1.05, -1.62, 0] },
  { act: "think", f: 0.45, pos: [0.35, 0.15, 9.8], look: [0.35, 0, 0], pPos: [1.0, -0.6, 8.7], pLook: [1.0, -1.55, 0] },
  { act: "always", f: 0.5, pos: [-0.2, 0.0, 12.0], look: [-2.45, 0, 0], pPos: [0, -2.0, 18.3], pLook: [0, -3.25, 0] },
  { act: "avatar", f: 0.2, pos: [0.7, 0.7, 7.6], look: [-1.25, 0.25, 0], pPos: [0, 0.6, 7.2], pLook: [0, -0.8, 0] },
  { act: "avatar", f: 0.62, pos: [0.25, 0.4, 6.5], look: [-1.25, 0.25, 0], pPos: [0, 0.3, 6.3], pLook: [0, -0.75, 0] },
  { act: "avatar", f: 0.93, pos: [0.15, 0.35, 6.3], look: [-1.2, 0.25, 0], pPos: [0, 0.3, 6.2], pLook: [0, -0.75, 0] },
  { act: "os", f: 0.0, pos: [0.05, 0.2, 3.2], look: [0, 0.12, 0], pPos: [0, 0.2, 3.2], pLook: [0, 0.12, 0] },
  { act: "os", f: 0.045, pos: [0.0, 0.12, 1.25], look: [0, 0.12, 0], pPos: [0, 0.12, 1.25], pLook: [0, 0.12, 0] },
  { act: "os", f: 0.955, pos: [0.02, 0.12, 1.3], look: [0, 0.12, 0], pPos: [0, 0.12, 1.3], pLook: [0, 0.12, 0] },
  { act: "trust", f: 0.35, pos: [0.1, 0.8, 8.6], look: [-0.9, 0, 0], pPos: [1.2, -0.8, 9.8], pLook: [1.2, -1.8, 0] },
  { act: "finale", f: 0.7, pos: [0.2, 0.15, 7.6], look: [-1.35, 0, 0], pPos: [0.45, 0.2, 8.4], pLook: [0.45, -1.15, 0] },
];

export interface Film {
  kind: FilmKind;
  story: Story<ActId>;
  has: (id: ActId) => boolean;
  /** Master progress at fraction f of act id (clamped to the film's acts). */
  at: (id: ActId, f: number) => number;
  plan: { a: number; b: number; from: Layout; to: Layout }[];
  camera: CameraKey[];
  cameraPortrait: CameraKey[];
  sound: SceneCue<Cue>[];
  /** 0→1→0 presence of an act with a soft edge (act fractions). */
  weight: (p: number, id: ActId, soft?: number) => number;
  /** Composed frame for reduced motion. */
  settledP: number;
  /** Vertical scale of the pipeline column in portrait (phones fit it into a short art band). */
  portraitColumnSqueeze: number;
  /** Vertical offset of the pipeline column in portrait: centres it in the visible art band. */
  portraitColumnLift: number;
}

export function createFilm(kind: FilmKind, acts = ACTS[kind], allBeats = BEATS, portraitColumnSqueeze = 1, portraitColumnLift = 0): Film {
  const desktop = kind === "desktop";
  // Desktop: copy hands off at each act boundary (see defineStory handoff).
  const story = defineStory(acts, { handoff: desktop });
  const has = (id: ActId) => story.order.includes(id);
  const at = (id: ActId, f: number) => story.at(id, f);
  const S = at;

  // Layout moves [start, end] in act fractions. Desktop spreads each move over
  // most of its act so a slow scroll keeps moving instead of parking on a hold.
  const T = desktop
    ? { orbit: [0.05, 0.6], column: [0.03, 0.35], ring: [0.02, 0.4], tight: [0, 0.4], home: [0.05, 0.65] }
    : { orbit: [0.1, 0.4], column: [0.05, 0.2], ring: [0.02, 0.25], tight: [0, 0.18], home: [0.1, 0.6] };
  const plan: Film["plan"] = [
    { a: 0, b: S("cores", T.orbit[0]), from: "inside", to: "inside" },
    { a: S("cores", T.orbit[0]), b: S("cores", T.orbit[1]), from: "inside", to: "orbit" },
    { a: S("cores", T.orbit[1]), b: S("stream", T.column[0]), from: "orbit", to: "orbit" },
    { a: S("stream", T.column[0]), b: S("stream", T.column[1]), from: "orbit", to: "column" },
    { a: S("stream", T.column[1]), b: S("always", T.ring[0]), from: "column", to: "column" },
    { a: S("always", T.ring[0]), b: S("always", T.ring[1]), from: "column", to: "ring" },
    { a: S("always", T.ring[1]), b: S("avatar", 0.0), from: "ring", to: "ring" },
    { a: S("avatar", 0.0), b: S("avatar", AVATAR.merge[1]), from: "ring", to: "inside" },
    { a: S("avatar", AVATAR.merge[1]), b: S("trust", T.tight[0]), from: "inside", to: "inside" },
    { a: S("trust", T.tight[0]), b: S("trust", T.tight[1]), from: "inside", to: "tight" },
    { a: S("trust", T.tight[1]), b: S("finale", T.home[0]), from: "tight", to: "tight" },
    { a: S("finale", T.home[0]), b: S("finale", T.home[1]), from: "tight", to: "inside" },
    { a: S("finale", T.home[1]), b: 1.01, from: "inside", to: "inside" },
  ];

  const beats = allBeats.filter((b) => has(b.act));
  const camera: CameraKey[] = beats.map((b) => ({ at: S(b.act, b.f), pos: b.pos, look: b.look }));
  const cameraPortrait: CameraKey[] = beats.map((b) => ({ at: S(b.act, b.f), pos: b.pPos, look: b.pLook }));
  const last = beats[beats.length - 1];
  camera.push({ at: 1, pos: [last.pos[0], last.pos[1], last.pos[2] + 0.1], look: last.look });
  cameraPortrait.push({ at: 1, pos: [last.pPos[0], last.pPos[1], last.pPos[2] + 0.1], look: last.pLook });

  const sound: SceneCue<Cue>[] = [
    { at: S("cores", 0.12), cue: "latch" },
    { at: S("stream", 0.12), cue: "tick" },
    { at: S("think", THINK_OUT), cue: "verdict" },
    { at: S("always", 0.1), cue: "whoosh" },
    { at: S("avatar", 0.3), cue: "latch" },
    { at: S("avatar", AVATAR.answer[0]), cue: "ping" },
    ...(has("os") ? [{ at: S("os", 0.02), cue: "whoosh" as Cue }] : []),
    // Plays each time the "Place trade · refused" label is on screen (it shows from trust .3 to .85).
    { at: S("trust", 0.3), until: S("trust", 0.85), cue: "alert" },
  ];

  const weight = (p: number, id: ActId, soft = 0.12) => {
    const [a, b] = story.range[id];
    const s = (b - a) * soft;
    return easeInOut(ramp(p, a - s * 0.5, a + s) * (1 - ramp(p, b - s, b + s * 0.5)));
  };

  return { kind, story, has, at, plan, camera, cameraPortrait, sound, weight, settledP: 0.012, portraitColumnSqueeze, portraitColumnLift };
}

export const DESKTOP_FILM = createFilm("desktop");
export const COMPACT_FILM = createFilm("compact");


// The root homepage keeps the OS chapter in the small-screen cut. The original
// /home-demo cut and its desktop-only OS timeline remain available to that route.
const mobileLengths: Record<ActId, number> = {
  hero: 90, cores: 110, stream: 135, think: 135, always: 95, avatar: 220,
  os: 340, trust: 110, finale: 90,
};

// Several compositions (the label orbit, the pipeline column, the policy gate)
// are wider than a 360–430 px portrait screen: at the shared beats the camera
// crops the orbit labels, the column and the gate at the viewport edges. The
// phone cut pulls the portrait camera straight back on those acts — the look
// target is unchanged, so each arrangement simply renders smaller and whole.
const PHONE_PORTRAIT_PULLBACK: Partial<Record<ActId, number>> = {
  cores: 1.2,
  stream: 1.3,
  think: 1.3,
  trust: 1.45,
};
const PHONE_BEATS: Beat[] = BEATS.map((beat) => {
  const back = PHONE_PORTRAIT_PULLBACK[beat.act];
  return back ? { ...beat, pPos: [beat.pPos[0], beat.pPos[1], beat.pPos[2] * back] } : beat;
});

export const HOME_MOBILE_FILM = createFilm("compact", ACTS.desktop.map(act => ({ ...act, vh: mobileLengths[act.id] })), PHONE_BEATS, 0.8, 0.42);

// Compact landscape (tablets on their side, landscape phones ≥ 640 px) puts the
// caption in the left 48 % of the stage. Pan the desktop camera path sideways
// (camera and target together, by a share of its distance) so each act's art
// sits in the right-hand space instead of under the caption; the contain-fit
// then keeps it whole. Cached so the poster and the live canvas share one path.
const SIDE_PAN = 0.12;
const panned = new WeakMap<readonly CameraKey[], CameraKey[]>();
export function compactLandscapeCamera(keys: readonly CameraKey[]): CameraKey[] {
  let out = panned.get(keys);
  if (!out) {
    out = keys.map(({ at, pos, look }) => {
      const dx = Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]) * SIDE_PAN;
      return { at, pos: [pos[0] - dx, pos[1], pos[2]], look: [look[0] - dx, look[1], look[2]] };
    });
    panned.set(keys, out);
  }
  return out;
}

// The root home's portrait stage shows its full-height canvas through a shorter
// art row. Its framing puts the subject about a third down the canvas (32 svh,
// i.e. 0.36 above the centre in NDC). Tilt the whole path up by that much
// instead, so the subject sits at the canvas centre and the canvas itself can
// be centred on the row: then the contain-fit's zoom origin is the middle of
// the visible art, and pulling back keeps the art centred instead of sliding
// it out of the row. Same picture, same motion. (fov 50 for portrait.)
export const PORTRAIT_FOCUS_NDC = 0.36;
const PORTRAIT_HALF_FOV = Math.tan((50 / 2) * Math.PI / 180);
const centred = new WeakMap<readonly CameraKey[], CameraKey[]>();
function centredPortraitCamera(keys: readonly CameraKey[]): CameraKey[] {
  let out = centred.get(keys);
  if (!out) {
    out = keys.map(({ at, pos, look }) => {
      const dy = Math.hypot(pos[0] - look[0], pos[1] - look[1], pos[2] - look[2]) * PORTRAIT_HALF_FOV * PORTRAIT_FOCUS_NDC;
      return { at, pos: [pos[0], pos[1] + dy, pos[2]], look: [look[0], look[1] + dy, look[2]] };
    });
    centred.set(keys, out);
  }
  return out;
}

/** The camera path a film plays at an orientation (shared by poster and canvas). */
export const filmCamera = (film: Film, portrait: boolean): CameraKey[] =>
  portrait
    ? film === HOME_MOBILE_FILM ? centredPortraitCamera(film.cameraPortrait) : film.cameraPortrait
    : film.kind === "compact" ? compactLandscapeCamera(film.camera) : film.camera;
/** The root home's portrait canvas is centred on its art row (see above). */
export const centredPortraitStage = (film: Film, portrait: boolean) => portrait && film === HOME_MOBILE_FILM;
