"use client";

// The home film's WebGL stage. The AI core persists from the first frame to
// the last; around it the seven cores open, receive labelled data packets
// from five sources, reason in turn (each lighting up as it speaks), ride the
// 24-hour ring, listen, fold away while the OS is on screen, and escort
// requests through the policy gate. Every transform is a pure function of
// (damped progress, clock), so scrolling back replays cleanly.
import { Html } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import {
  AiCore,
  AvatarActor,
  COLORS,
  CORE_SIZE,
  CoreCanvas,
  SceneLabel,
  cameraViewport,
  createCameraTrack,
  easeInOut,
  easeOut,
  avatarFrame,
  ramp,
  sampleCameraTrack,
  useStoryFrame,
  window4,
  type AvatarFrame,
  type CameraKey,
  type CoreDrive,
  type Window4,
} from "@/modules/afvarOs";
import { playCue } from "../audio";
import { MachinedArc } from "../MachinedArc";
import { voiceMouth } from "./voice";
import { AVATAR, COLUMN, GATE, ORBIT, PANEL_CAMERA, RING, SATELLITES, SOURCES, THINK, THINK_OUT, columnPos, coreOpeningScale, filmCamera, type ActId, type Film, type Layout } from "./aiConfig";

export interface AiCoreSceneProps {
  film: Film;
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** Portrait framing (phones, tablets upright). */
  portrait: boolean;
  /** Lighter scene for small / mobile GPUs. */
  lite: boolean;
  compactBloom?: boolean;
  belowHeader?: boolean;
  compactPanel?: boolean;
  openingScale: number;
  /** The avatar is on stage here (false while the OS overlay owns it). */
  avatarHere: boolean;
  /** Real price chips for the price source, e.g. "XAU/USD 4,012.10 ▼0.41%". */
  priceTexts: readonly string[];
}

const FilmCtx = createContext<{ film: Film; lite: boolean; portrait: boolean } | null>(null);
function useFilm() {
  const ctx = useContext(FilmCtx);
  if (!ctx) throw new Error("useFilm outside AiCoreScene");
  return ctx;
}
const win = (film: Film, id: ActId, w: Window4): Window4 => [film.at(id, w[0]), film.at(id, w[1]), film.at(id, w[2]), film.at(id, w[3])];

// In an editorial panel the copy lives outside the canvas; frame the orb close
// to the middle instead of leaving the desktop copy column empty.
export default function AiCoreScene({ film, progress, active, still, portrait, lite, openingScale, compactPanel = false, compactBloom = false, belowHeader = false, avatarHere, priceTexts }: AiCoreSceneProps) {
  const ctx = useMemo(() => ({ film, lite, portrait }), [film, lite, portrait]);
  const drive = useMemo(() => makeCoreDrive(film, openingScale), [film, openingScale]);
  // The orbit and the pipeline are composed for a 16:10 stage. The capped
  // 1440 px stage is squarer on taller screens (1920×1080 → 4:3), so pull
  // back through those acts until they span the same width as on 16:10.
  const camera = compactPanel ? PANEL_CAMERA : filmCamera(film, portrait);
  const fov = portrait ? 50 : 38;
  const fit = useMemo(() => {
    if (compactPanel) return undefined;
    const inK = (p: number) => easeInOut(ramp(p, film.at("hero", 0.5), film.at("cores", 0.25)) * (1 - ramp(p, film.at("always", 0.85), film.at("avatar", 0.1))));
    const aspect = (p: number, w: number, h: number) => portrait ? 1 : 1 - (1 - Math.min(1, w / h / 1.6)) * inK(p);
    // Then contain-fit: whatever the screen's aspect and height, pull back
    // just enough that the act's composition stays whole inside the canvas.
    const contain = makeContainFit(film, camera, fov, belowHeader, openingScale, portrait);
    // The fit is a pure function of (progress, size, visible band), but a band
    // or size change, or an act's weight crossing in, can still move it in one
    // step. Ease towards it (≈0.12 s) so the stage never jumps; snap after a
    // pause (first frame, resumed loop) so nothing chases a stale value.
    let zoom = 1;
    let last = -1;
    return {
      zoom: (p: number, w: number, h: number) => {
        const a = aspect(p, w, h);
        const target = Math.min(1, Math.max(0.4, a * contain.fit(p, w, h, a)));
        const now = performance.now();
        const dt = (now - last) / 1000;
        zoom = last < 0 || dt > 0.25 ? target : THREE.MathUtils.damp(zoom, target, 8, dt);
        last = now;
        return zoom;
      },
      // The part of the canvas actually seen, kept up to date by <VisibleBand/>.
      setBand: contain.setBand,
    };
  }, [film, portrait, compactPanel, camera, fov, belowHeader, openingScale]);
  return (
    <CoreCanvas
      belowHeader={belowHeader}
      bloomLevels={compactBloom ? 3 : undefined}
      progress={progress}
      active={active}
      still={still}
      settledP={film.settledP}
      camera={camera}
      fov={fov}
      parallax={portrait ? 0.04 : 0.12}
      bloom={lite ? 0.55 : 0.75}
      dpr={lite ? [1, 1.4] : [1, 1.75]}
      zoomFit={fit?.zoom}
      cues={film.sound}
      onCue={playCue}
    >
      <FilmCtx.Provider value={ctx}>
        <FirstCoreFrame />
        {fit ? <VisibleBand onBand={fit.setBand} /> : null}
        <FinaleShift>
          <AiCore drive={drive} />
          <Satellites />
          <Reasoning />
        </FinaleShift>
        <Near acts={["stream"]}>
          <Streams priceTexts={priceTexts} />
        </Near>
        <Near acts={["always"]}>
          <ClockRing />
        </Near>
        <Near acts={["trust"]}>
          <PolicyGate />
        </Near>
        {avatarHere ? <SceneAvatar /> : null}
      </FilmCtx.Provider>
    </CoreCanvas>
  );
}

/**
 * In the finale the robot stands at the core's right: slide the core (with the
 * cores folded into it) left so there is clear air between its glow and the
 * robot's arm, instead of moving the robot towards the chapter rail.
 */
const finaleShift = (film: Film, portrait: boolean, p: number) =>
  film.has("finale") ? -(portrait ? 0.5 : 0.95) * easeInOut(ramp(p, film.at("finale", 0.08), film.at("finale", 0.45))) : 0;

function FinaleShift({ children }: { children: ReactNode }) {
  const { film, portrait } = useFilm();
  const { smoothed } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (group.current) group.current.position.x = finaleShift(film, portrait, smoothed.current ?? 0);
  }, -5);
  return <group ref={group}>{children}</group>;
}

function FirstCoreFrame() {
  const painted = useRef(false);
  const pending = useRef(0);
  useEffect(() => () => cancelAnimationFrame(pending.current), []);
  useFrame(({ gl }) => {
    if (!painted.current) {
      painted.current = true;
      // This callback runs before the WebGL draw. Keep the poster until that
      // frame has actually been submitted, then reveal the initialized canvas.
      pending.current = requestAnimationFrame(() => {
        gl.domElement.dataset.afvarCorePainted = "";
      });
    }
  });
  return null;
}

/* ---------------------------------------------------------- contain-fit */

/** A point of an act's composition and the screen-space half size (px) of
 * whatever is pinned there (a DOM label), so the label stays whole too. */
type FitPoint = { at: THREE.Vector3; px: number; py: number };
/** Canvas edge clearance (px); the right edge also clears the chapter rail. */
const FIT_EDGE = { left: 16, right: 56, top: 14, bottom: 30 };
const HEADER_PX = 72;
/** `copy`: right edge (px from the canvas' left) of the desktop copy column of the cores / pipeline acts. */
type Band = { top: number; right: number; bottom: number; left: number; copy: number };

/**
 * Measures how much of each canvas edge is hidden: the fixed header over the
 * pinned stage, the clipping art row (portrait phones and tablets keep a
 * full-height canvas behind a shorter, masked row) and the stacked intro
 * card. Runs on resize only.
 */
function VisibleBand({ onBand }: { onBand: (band: Band) => void }) {
  const canvas = useThree((s) => s.gl.domElement);
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    const clip = canvas.closest<HTMLElement>(".home-story-scene, .home-story-intro-art");
    const stage = canvas.closest<HTMLElement>(".home-story-stage");
    const measure = () => {
      const k = canvas.getBoundingClientRect();
      if (!k.width || !k.height) return;
      let top = k.top, bottom = k.bottom, left = k.left;
      const right = k.right;
      // (The compact landscape caption column is not a band edge: the zoom
      // origin sits near its edge, so fitting to it would shrink the art to a dot.)
      if (clip) {
        const c = clip.getBoundingClientRect();
        // mask-image fades on the portrait art row (top 6 %, bottom 8 %)
        const masked = getComputedStyle(clip).maskImage.includes("gradient");
        top = Math.max(top, c.top + (masked ? c.height * 0.06 : 0));
        bottom = Math.min(bottom, c.bottom - (masked ? c.height * 0.08 : 0));
        left = Math.max(left, c.left);
      }
      if (stage) {
        const st = stage.getBoundingClientRect();
        // The header covers the pinned stage's top edge.
        top = Math.max(top, st.top + HEADER_PX);
      }
      // The cores and pipeline acts share the stage with a copy column on the
      // left (heading + reasoning card); their 3D must stay clear of it.
      let copy = 0;
      for (const el of canvas.closest("#afvar-ai")?.querySelectorAll<HTMLElement>(':is([data-act="cores"], [data-act="stream"], [data-act="think"]) > .pointer-events-auto') ?? []) {
        const r = el.getBoundingClientRect();
        if (r.width) copy = Math.max(copy, r.right - k.left);
      }
      onBand({ top: top - k.top, bottom: k.bottom - bottom, left: left - k.left, right: k.right - right, copy: copy ? copy + 12 : 0 });
      invalidate();
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(canvas);
    if (clip) ro.observe(clip);
    return () => ro.disconnect();
  }, [canvas, onBand, invalidate]);
  return null;
}
/** A uppercase mono SceneLabel: ≈10.5 px per character + padding, 26 px tall. */
const labelHalf = (text: string) => (text.length * 10.5 + 22) / 2;

/**
 * Returns the extra zoom factor (≤ 1) that keeps the main composition of the
 * acts on screen — the core, the orbit and pipeline cores with their labels,
 * the 24-hour ring and the policy gate — fully inside the canvas at any
 * aspect and height. It replays the camera rig's projection for (progress,
 * canvas size), so it is a pure function: no feedback, no jitter. Each act's
 * pull-back is blended by that act's presence, so it eases in and out.
 */
function makeContainFit(film: Film, keys: readonly CameraKey[], fov: number, belowHeader: boolean, openingScale: number, portrait: boolean) {
  let band: Band = { top: 0, right: 0, bottom: 0, left: 0, copy: 0 };
  const track = createCameraTrack(keys);
  const cam = new THREE.PerspectiveCamera(fov, 1, 0.1, 100);
  const pos = new THREE.Vector3();
  const look = new THREE.Vector3();
  const v = new THREE.Vector3();
  const pt = (x: number, y: number, z: number, px = 0, py = 0): FitPoint => ({ at: new THREE.Vector3(x, y, z), px, py });
  const around = (n: number, f: (a: number) => FitPoint) => Array.from({ length: n }, (_, i) => f((i / n) * Math.PI * 2));

  const coreR = CORE_SIZE.shell * 1.12;
  const core = [pt(coreR, 0, 0), pt(-coreR, 0, 0), pt(0, coreR, 0), pt(0, -coreR, 0)];
  const satLabel = Math.max(...SATELLITES.map((s) => labelHalf(s.label)));
  // Orbit (and the tight trust orbit): the ellipse the cores ride, plus their labels above.
  const orbit = (r: number, labels: boolean) =>
    around(16, (a) => pt(Math.cos(a) * r, Math.sin(a) * r * ORBIT.tilt, Math.sin(a) * r * 0.9, 18, 18)).concat(
      labels
        ? around(16, (a) => {
            // Labels sit radially outside their core, shifted out by their own half width (see <Satellites/>).
            const x = Math.cos(a) * r, y = Math.sin(a) * r * ORBIT.tilt, len = Math.hypot(x, y) || 1, reach = ORBIT.size * 1.7 + 0.12;
            return pt(x + (x / len) * reach, y + (y / len) * (reach + 0.12), Math.sin(a) * r * 0.9, 2 * satLabel * Math.abs(x / len) + 6, 13);
          })
        : [],
    );
  const column = (squeeze: number, lift: number, aroundCore: boolean) =>
    SATELLITES.flatMap((s, i) => {
      const c = columnPos(i, squeeze, lift, aroundCore);
      return [pt(c[0], c[1], c[2], 18, 18), pt(c[0], c[1] + ORBIT.size + 0.3, c[2], labelHalf(s.label), 13)];
    });
  const sessionR = RING.radius + 0.16 + 3 * 0.09 + 0.45;
  const ring = [
    ...around(12, (a) => pt(Math.cos(a) * (RING.radius + 0.5), Math.sin(a) * (RING.radius + 0.5), 0)),
    ...around(8, (a) => pt(Math.cos(a) * sessionR, Math.sin(a) * sessionR, 0, labelHalf("New York"), 13)),
    pt(0, RING.radius + 0.95, 0, labelHalf("Crypto · 24/7/365"), 13),
  ];
  const gateTurn = Math.PI / 2 - GATE.tilt;
  const gateR = GATE.radius + 0.06;
  const gate = [
    ...around(12, (a) => pt(GATE.x + Math.cos(a) * gateR * Math.cos(gateTurn), Math.sin(a) * gateR, -Math.cos(a) * gateR * Math.sin(gateTurn))),
    pt(GATE.x, GATE.radius + 0.35, 0, labelHalf("Policy gate"), 13),
    ...orbit(ORBIT.tight, false),
  ];

  // The core's live size (it opens large, hides inside the avatar, returns for trust).
  const coreDrive = makeCoreDrive(film, openingScale);
  // The avatar (feet at its placement; body ≈ 0.87…5.56 robot units tall; its
  // hologram disc and a waving arm reach ≈ ±1.8). The right-hand points keep
  // ~120 px for the chapter rail's active label ("09 JOIN").
  const robot = (x: number, y: number, s: number) => [
    pt(x - 1.8 * s, y + 0.5 * s, 0),
    pt(x - 1.8 * s, y + 5.6 * s, 0),
    pt(x + 1.8 * s, y + 0.5 * s, 0, 120, 0),
    pt(x + 1.8 * s, y + 5.6 * s, 0, 120, 0),
  ];
  const avatar = makeAvatarTrack(film, portrait);
  const frame = avatarFrame();
  const avatarFinale = (p: number) => film.has("finale") ? easeOut(ramp(p, film.at("finale", 0.12), film.at("finale", 0.45))) : 0;
  const pipeline = (p: number) => Math.max(film.weight(p, "cores"), film.weight(p, "stream"), film.weight(p, "think"));
  const groups: { points: FitPoint[]; weight: (p: number) => number; scale: (p: number) => number; clearCopy?: boolean }[] = [
    { points: core, weight: (p) => (finaleShift(film, portrait, p) === 0 ? 1 : 0), scale: (p) => coreDrive(p).scale },
    // The finale core, slid left of the robot.
    { points: core.map((c) => pt(c.at.x + (portrait ? -0.5 : -0.95), c.at.y, c.at.z)), weight: (p) => (finaleShift(film, portrait, p) === 0 ? 0 : 1), scale: (p) => coreDrive(p).scale },
    // The robot on stage in its act (not the finale wave, handled below).
    { points: robot(AVATAR.place.x, AVATAR.place.y, AVATAR.place.scale), weight: (p) => (avatarFinale(p) > 0 ? 0 : Math.min(1, avatar(p, 0, frame).visible ? frame.scale / AVATAR.place.scale : 0)), scale: () => 1 },
    { points: robot(portrait ? 1.05 : 1.45, -1.05, 0.42), weight: avatarFinale, scale: () => 1 },
    // The core again, kept clear of the copy column while it sits beside it.
    { points: core, weight: (p) => (finaleShift(film, portrait, p) === 0 ? pipeline(p) : 0), scale: (p) => coreDrive(p).scale, clearCopy: true },
    { points: orbit(ORBIT.radius, true), weight: (p) => film.weight(p, "cores"), scale: () => 1 },
    {
      points: column(portrait ? film.portraitColumnSqueeze : 1, portrait ? film.portraitColumnLift : 0, portrait),
      weight: (p) => Math.max(film.weight(p, "stream"), film.weight(p, "think")),
      scale: () => 1,
      clearCopy: true,
    },
    // Same group scales as <ClockRing/> and <PolicyGate/>.
    { points: ring, weight: (p) => film.weight(p, "always"), scale: (p) => 0.85 + 0.15 * film.weight(p, "always") },
    { points: gate, weight: (p) => film.weight(p, "trust"), scale: (p) => 0.6 + 0.4 * film.weight(p, "trust") },
  ];

  const fit = (p: number, w: number, h: number, pre: number) => {
    if (!w || !h) return 1;
    const view = cameraViewport(w, h, belowHeader);
    sampleCameraTrack(track, p, pos, look);
    cam.position.copy(pos);
    cam.lookAt(look);
    cam.aspect = w / h;
    cam.zoom = view.zoom * pre;
    if (view.shift || view.drop) cam.setViewOffset(w, h, -view.shift, -view.drop, w, h);
    else cam.clearViewOffset();
    cam.updateProjectionMatrix();
    cam.updateMatrixWorld();
    // Zoom scales the image about the camera axis; the view offset is a fixed
    // shift on top. The look target sits on the axis, so it marks that origin.
    v.copy(look).project(cam);
    const ox = v.x;
    const oy = v.y;
    const b = band;
    const xL = -1 + (2 * (FIT_EDGE.left + b.left)) / w;
    const xCopy = portrait || !b.copy ? xL : Math.max(xL, -1 + (2 * b.copy) / w);
    const xR = 1 - (2 * (FIT_EDGE.right + b.right)) / w;
    const yB = -1 + (2 * (FIT_EDGE.bottom + b.bottom)) / h;
    const yT = 1 - (2 * (FIT_EDGE.top + b.top)) / h;
    // Largest factor s ≤ 1 with lo ≤ o + s·(n − o) ± pad ≤ hi. Zooming out
    // cannot help an edge the zoom origin itself lies beyond: leave it be.
    const limit = (n: number, o: number, pad: number, lo: number, hi: number) => {
      if (o <= lo || o >= hi) return 1;
      const d = n - o;
      if (d > 0 && n + pad > hi) return (hi - pad - o) / d;
      if (d < 0 && n - pad < lo) return (lo + pad - o) / d;
      return 1;
    };
    let k = 1;
    for (let g = 0; g < groups.length; g++) {
      const group = groups[g];
      const wgt = group.weight(p);
      if (wgt < 0.001) continue;
      const scale = group.scale(p);
      if (scale < 0.01) continue;
      let kg = 1;
      for (const { at, px, py } of group.points) {
        v.copy(at).multiplyScalar(scale).project(cam);
        if (v.z > 1) continue; // behind the camera (the dive into the OS)
        kg = Math.min(kg, limit(v.x, ox, (2 * px) / w, group.clearCopy ? xCopy : xL, xR), limit(v.y, oy, (2 * py) / h, yB, yT));
      }
      k = Math.min(k, 1 - wgt * (1 - Math.max(0, kg)));
    }
    return Math.max(0.4, k);
  };
  return { fit, setBand: (next: Band) => void (band = next) };
}

function makeCoreDrive(film: Film, openingScale: number) {
  const out: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
  const A = (f: number) => film.at("avatar", f);
  // A short light swell on the core at every act boundary, tied to scroll, so
  // even a slow scroll reads the hand-off from one chapter to the next. Each
  // swell spans ±12 % of the shorter neighbouring act (follows the act windows).
  const order = film.story.order.filter((id) => film.has(id));
  const swells = order.slice(1).map((id, i) => {
    const prev = film.story.range[order[i]];
    const cur = film.story.range[id];
    const half = 0.12 * Math.min(prev[1] - prev[0], cur[1] - cur[0]);
    return [cur[0] - half, cur[0] - half * 0.25, cur[0] + half * 0.25, cur[0] + half] as Window4;
  });
  return (p: number): CoreDrive => {
    const stream = film.weight(p, "stream");
    const think = film.weight(p, "think");
    const verdict = window4(p, [film.at("think", THINK_OUT - 0.04), film.at("think", THINK_OUT), film.at("think", 0.92), film.at("think", 1)]);
    // The core becomes the avatar's heart: it shrinks inside the assembling body and returns for trust.
    const inside = easeInOut(ramp(p, A(0.18), A(0.32))) * (1 - easeOut(ramp(p, film.at("trust", 0.0), film.at("trust", 0.15))));
    let swell = 0;
    for (const w of swells) swell = Math.max(swell, window4(p, w));
    out.glow = 0.95 + 0.35 * stream + 0.3 * think + 0.6 * verdict + 0.35 * ramp(p, film.at("finale", 0.3), film.at("finale", 0.9)) + 0.45 * easeInOut(swell);
    out.think = Math.max(think, window4(p, [A(0.56), A(0.6), A(0.64), A(0.68)]));
    // The solo core can use more of its column; return to its orbit size
    // as the satellite cores appear around it.
    const introScale = coreOpeningScale(film, p, openingScale);
    out.scale = Math.max(0.0001, 1 - inside) * introScale;
    out.sparks = 1 - inside;
    return out;
  };
}

/* --------------------------------------------------------- mount gating */

/**
 * Mount a part of the scene only while the film is near its acts. Each mounted
 * label is its own React root, so far-away acts stay unmounted until needed.
 */
function useNear(acts: ActId[], margin = 0.04): boolean {
  const { film } = useFilm();
  const { smoothed } = useStoryFrame();
  const present = acts.filter((a) => film.has(a));
  const lo = present.length ? Math.min(...present.map((a) => film.story.range[a][0])) - margin : 2;
  const hi = present.length ? Math.max(...present.map((a) => film.story.range[a][1])) + margin : -1;
  const [near, setNear] = useState(() => {
    const p = smoothed.current ?? 0;
    return p >= lo && p <= hi;
  });
  useFrame(() => {
    const p = smoothed.current ?? 0;
    const n = p >= lo && p <= hi;
    if (n !== near) setNear(n);
  });
  return near;
}

function Near({ acts, margin, children }: { acts: ActId[]; margin?: number; children: ReactNode }) {
  return useNear(acts, margin) ? <>{children}</> : null;
}

/* ----------------------------------------------------------- the avatar */

function SceneAvatar() {
  const { film, portrait, lite } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const track = useMemo(() => makeAvatarTrack(film, portrait), [film, portrait]);
  return <AvatarActor track={track} getP={() => smoothed.current ?? 0} still={still} quality={lite ? "performance" : "balanced"} build={AVATAR.buildSeconds} />;
}

function makeAvatarTrack(film: Film, portrait: boolean) {
  const A = (f: number) => film.at("avatar", f);
  const actEnd = film.has("os") ? film.at("os", 0.06) : film.at("trust", 0.04);
  // The stage fades to the OS over os 0 → .035: the robot shrinks away with it.
  const leaveAt = film.has("os") ? film.at("os", 0.0) : film.at("trust", 0.0);
  const leaveEnd = film.has("os") ? film.at("os", 0.035) : actEnd;
  const fin = (f: number) => film.at("finale", f);
  const P = AVATAR.place;
  // `explode` here only says where the build starts: the host plays it as a
  // timed one-shot from there (AvatarActor `build`), whatever the scroll speed.
  return (p: number, _t: number, out: AvatarFrame): AvatarFrame => {
    const inAct = p >= A(AVATAR.assemble[0]) && p < actEnd;
    const inFinale = p >= fin(0.12);
    out.visible = inAct || inFinale;
    if (!out.visible) return out;
    out.talk = 0;
    out.voice = voiceMouth();
    out.turn = portrait ? 0 : 0.18;
    out.lean = 0;
    out.z = 0;
    if (inFinale) {
      const k = easeOut(ramp(p, fin(0.12), fin(0.45)));
      out.x = portrait ? 1.05 : 1.45;
      out.y = -1.05;
      out.scale = 0.42 * Math.max(0.001, k);
      out.stage = k;
      out.explode = 1 - k;
      out.gesture = "wave";
      out.emotion = "happy";
      out.aura = "idle";
      out.turn = portrait ? -0.15 : -0.25;
      return out;
    }
    const grow = easeOut(ramp(p, A(0.08), A(0.16)));
    // Shrink away before the act ends (the stage fades to the OS meanwhile), so
    // the hand-off never pops a full-size robot in or out at the threshold.
    const leave = 1 - easeInOut(ramp(p, leaveAt, leaveEnd));
    out.x = P.x;
    out.y = P.y;
    out.scale = P.scale * Math.max(0.001, grow * leave);
    out.stage = grow * leave;
    out.explode = 1 - easeInOut(ramp(p, A(0.1), A(AVATAR.assemble[1])));
    if (p < A(AVATAR.wave[0])) {
      out.gesture = "idle";
      out.emotion = "curious";
      out.aura = "connecting";
    } else if (p < A(AVATAR.listen[0])) {
      out.gesture = "wave";
      out.emotion = "happy";
      out.aura = "idle";
    } else if (p < A(AVATAR.think[0])) {
      out.gesture = "listen";
      out.emotion = "focused";
      out.aura = "listening";
    } else if (p < A(AVATAR.answer[0])) {
      out.gesture = "think";
      out.emotion = "thinking";
      out.aura = "thinking";
    } else if (p < A(AVATAR.answer[1])) {
      out.gesture = "explain";
      out.emotion = "confident";
      out.aura = "speaking";
      out.talk = 1;
    } else {
      out.gesture = "acknowledge";
      out.emotion = "happy";
      out.aura = "idle";
    }
    return out;
  };
}

/* ------------------------------------------------------- seven satellites */

/** Live satellite positions, written by <Satellites/> before anyone reads them. */
const satPos = SATELLITES.map(() => new THREE.Vector3());
/** Per-core label visibility from depth (orbit back side fades), written by <Satellites/>. */
const satLabelFade = SATELLITES.map(() => 1);
const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();

function place(layout: Layout, i: number, t: number, out: THREE.Vector3, columnSqueeze = 1, columnLift = 0, aroundCore = false) {
  const n = SATELLITES.length;
  switch (layout) {
    case "inside":
      return out.set(0, 0, 0);
    case "orbit":
    case "tight": {
      const r = layout === "tight" ? ORBIT.tight : ORBIT.radius;
      const a = (i / n) * Math.PI * 2 + t * ORBIT.speed;
      return out.set(Math.cos(a) * r, Math.sin(a) * r * ORBIT.tilt, Math.sin(a) * r * 0.9);
    }
    case "column": {
      const c = columnPos(i, columnSqueeze, columnLift, aroundCore);
      return out.set(c[0], c[1], c[2]);
    }
    case "ring": {
      const a = Math.PI / 2 - (i / n) * Math.PI * 2;
      return out.set(Math.cos(a) * RING.radius, Math.sin(a) * RING.radius, 0);
    }
  }
}

/** Index of the core speaking in the think act, or −1. */
function speakingCore(film: Film, p: number): number {
  if (p < film.at("think", THINK[0].at) || p > film.at("think", THINK_OUT)) return -1;
  let k = 0;
  for (let i = 0; i < THINK.length; i++) if (p >= film.at("think", THINK[i].at)) k = i;
  return THINK[k].core;
}

function Satellites() {
  const { film, portrait } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const labelNodes = useRef<(THREE.Group | null)[]>([]);
  // Right edge of the cores act's copy column, in canvas px (re-read a few times
  // a second, never per frame): orbit labels are kept to the right of it.
  const copyEdge = useRef({ at: -1, x: 0 });

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    const seg = film.plan.find((x) => p >= x.a && p < x.b) ?? film.plan[film.plan.length - 1];
    const k = easeInOut(ramp(p, seg.a, seg.b));
    const speaking = speakingCore(film, p);
    const quiet = 1 - 0.35 * film.weight(p, "trust") - 0.2 * film.weight(p, "avatar");
    const squeeze = portrait ? film.portraitColumnSqueeze : 1;
    const lift = portrait ? film.portraitColumnLift : 0;
    // The think act shares the art band with its tall reasoning card, so the
    // phone cut pulls the column rows a little further toward the band centre.
    const thinkFit = lift ? 1 - 0.22 * film.weight(p, "think") : 1;
    // On the orbit the cores pass in front of and behind each other: push each
    // label radially outward from the centre (a small gap past its sphere) and
    // fade the labels of cores on the far side, so no label sits on a sphere or
    // on another label. In the column the labels sit above their cores.
    const orbitness = film.weight(p, "cores");
    const backZ = ORBIT.radius * 0.9;
    const edge = copyEdge.current;
    if (orbitness > 0.001 && !portrait && (edge.at < 0 || Math.abs(s.clock.elapsedTime - edge.at) > 0.3)) {
      edge.at = s.clock.elapsedTime;
      const copy = s.gl.domElement.closest("#afvar-ai")?.querySelector<HTMLElement>('[data-act="cores"] > .pointer-events-auto');
      edge.x = copy ? copy.getBoundingClientRect().right - s.gl.domElement.getBoundingClientRect().left + 14 : 0;
    }
    nodes.current.forEach((g, i) => {
      place(seg.from, i, t, scratchA, squeeze, lift, portrait);
      place(seg.to, i, t, scratchB, squeeze, lift, portrait);
      satPos[i].copy(scratchA.lerp(scratchB, seg.from === seg.to ? 0 : k));
      if (thinkFit !== 1) satPos[i].y = lift + (satPos[i].y - lift) * thinkFit;
      if (!g) return;
      g.position.copy(satPos[i]);
      const born = easeOut(ramp(p, film.at("cores", 0.1) + i * 0.002, film.at("cores", 0.3) + i * 0.002));
      const merged = 1 - easeOut(ramp(p, film.at("avatar", 0.0), film.at("avatar", 0.1))) * (1 - ramp(p, film.at("trust", 0.0), film.at("trust", 0.15)));
      const back = 1 - easeOut(ramp(p, film.at("finale", 0.15), film.at("finale", 0.6)));
      // The speaking core swells, but only so much that its ring stays clear of
      // the label of the core above it in the column.
      const pop = speaking === i ? 1.3 : 1;
      const size = born * merged * back * quiet * pop;
      const lab = labelNodes.current[i];
      if (lab) {
        const sp = satPos[i];
        const len = Math.hypot(sp.x, sp.y) || 1;
        const dx = sp.x / len;
        const dy = sp.y / len;
        // Clear the ring around the sphere, then the label's own half width
        // (screen px → world units at this core's depth) along x.
        let extra = 0;
        if (orbitness > 0.001 && s.size.width) {
          scratchA.copy(sp).project(s.camera);
          scratchB.copy(sp).setX(sp.x + 1).project(s.camera);
          const pxPerUnit = Math.abs(scratchB.x - scratchA.x) * 0.5 * s.size.width;
          if (pxPerUnit > 1) extra = (labelHalf(SATELLITES[i].label) + 6) / pxPerUnit;
        }
        const reach = ORBIT.size * 1.7 + 0.12;
        // In the column the label sits just above its core's ring. The label is a
        // child of the (scaled) core, so a swelling core would otherwise carry its
        // label up into the row above: keep the gap in screen px instead.
        let above = ORBIT.size + 0.3;
        if (orbitness < 0.999 && s.size.width && size > 0.002) {
          scratchA.copy(sp).project(s.camera);
          scratchB.copy(sp).setY(sp.y + 1).project(s.camera);
          const pxPerUnit = Math.abs(scratchB.y - scratchA.y) * 0.5 * s.size.height;
          if (pxPerUnit > 1) above = ORBIT.size * 1.7 + 19 / pxPerUnit / size;
        }
        lab.position.set(dx * (reach + extra * Math.abs(dx)) * orbitness, above * (1 - orbitness) + dy * (reach + 0.12) * orbitness, 0);
        // Never over the copy column: a label whose left edge would cross it
        // slides right until it clears the column.
        if (orbitness > 0.001 && !portrait && edge.x > 0 && s.size.width) {
          scratchA.copy(sp).add(lab.position).project(s.camera);
          scratchB.copy(sp).add(lab.position).setX(scratchB.x + 1).project(s.camera);
          const pxPerUnit = Math.abs(scratchB.x - scratchA.x) * 0.5 * s.size.width;
          const left = (scratchA.x + 1) * 0.5 * s.size.width - labelHalf(SATELLITES[i].label);
          if (pxPerUnit > 1 && left < edge.x) lab.position.x += ((edge.x - left) / pxPerUnit) * orbitness;
        }
      }
      satLabelFade[i] = 1 - orbitness * (1 - ramp(satPos[i].z, -0.3 * backZ, 0.05 * backZ));
      g.scale.setScalar(Math.max(0.0001, size));
      g.visible = size > 0.002;
      const m = mats.current[i];
      if (m) m.emissiveIntensity = speaking === i ? 3.2 : speaking >= 0 ? 0.7 : 1.4;
    });
  }, -4);

  const labelsNear = useNear(["cores", "stream", "think"]);
  const labelShow = (p: number) =>
    Math.max(
      window4(p, [film.at("cores", 0.3), film.at("cores", 0.42), film.at("cores", 0.9), film.at("cores", 1)]),
      // in the pipeline only once the cores have settled into their column; on portrait
      // screens and the phone cut the think card (which names every core) sits under the column, so they go first
      // (phone landscape: the reading log already routes each line to its core, and space is tight)
      (film.kind === "compact" && !portrait ? 0 : 1) *
        ramp(p, film.at("stream", 0.2), film.at("stream", 0.26)) *
        (1 - (portrait || film.kind === "compact" ? ramp(p, film.at("think", 0.0), film.at("think", 0.08)) : ramp(p, film.at("think", 0.9), film.at("think", 1)))),
    );

  return (
    <group name="Satellites">
      {SATELLITES.map((sat, i) => (
        <group key={sat.id} ref={(el) => void (nodes.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[ORBIT.size, 28, 28]} />
            <meshStandardMaterial
              ref={(el) => void (mats.current[i] = el)}
              color={COLORS.mintDeep}
              emissive={sat.id === "verify" ? COLORS.mintHot : COLORS.mint}
              emissiveIntensity={1.4}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[ORBIT.size * 1.7, 0.006, 8, 48]} />
            <meshBasicMaterial color={COLORS.mint} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {labelsNear ? (
            <group ref={(el) => void (labelNodes.current[i] = el)} position={[0, ORBIT.size + 0.3, 0]}>
              <SceneLabel position={[0, 0, 0]} show={(p) => labelShow(p) * satLabelFade[i]} tone="ai">
                {sat.label}
              </SceneLabel>
            </group>
          ) : null}
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------- data sources → their cores */

const SOURCE_LABEL = [0.55, 0.3] as const;

/** How far the travelling data chips (GBP/USD…, US payrolls…) are faded. */
const CHIP_ALPHA = 0.5;

/** Five sources; labelled packets travel along each line into the core that reads them. */
function Streams({ priceTexts }: { priceTexts: readonly string[] }) {
  const { film, lite, portrait } = useFilm();
  const { labels } = useStoryFrame();
  const CHIPS = lite ? 2 : 3;
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const chips = useRef<(THREE.Group | null)[]>([]);
  const chipEls = useRef<(HTMLDivElement | null)[]>([]);
  const lastText = useRef<number[]>(SOURCES.flatMap(() => Array(CHIPS).fill(-1)));
  const priceRef = useRef(priceTexts);
  useEffect(() => {
    priceRef.current = priceTexts;
  }, [priceTexts]);
  const origins = useMemo(() => SOURCES.map((src) => new THREE.Vector3(...src.pos)), []);
  const sourceNodes = useRef<(THREE.Group | null)[]>([]);
  const labelNodes = useRef<(THREE.Group | null)[]>([]);
  const slides = useMemo(() => SOURCES.map(() => 0), []);
  const lines = useMemo(
    () =>
      SOURCES.map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        return g;
      }),
    [],
  );
  const lineMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "stream", 0.1) * ramp(p, film.at("stream", 0.18), film.at("stream", 0.25));
    if (group.current) group.current.visible = w > 0.002;
    if (w <= 0.002) {
      // Html chips live in the DOM: a hidden group does not hide them.
      chipEls.current.forEach((el) => {
        if (el && el.style.opacity !== "0") el.style.opacity = "0";
      });
      return;
    }
    const t = still ? 1.3 : s.clock.elapsedTime;

    // Keep the source labels inside the stage and clear of the chapter rail
    // (its active label shows from 1440 px): first slide each label left, up
    // to ending at its source, then slide the source column left.
    let pull = 0;
    if (!portrait) {
      const W = s.size.width;
      const safe = W - (window.innerWidth >= 1440 ? 200 : 72);
      SOURCES.forEach((src, j) => {
        const half = (src.label.length * 8.5 + 24) * 0.5;
        const at = (x: number) => (scratchA.set(x + SOURCE_LABEL[0], src.pos[1] + SOURCE_LABEL[1], src.pos[2]).project(s.camera).x + 1) * 0.5 * W;
        const x0 = at(COLUMN.sourceX);
        const perUnit = x0 - at(COLUMN.sourceX - 1);
        const need = perUnit > 0 ? Math.max(0, (x0 + half - safe) / perUnit) : 0;
        slides[j] = Math.min(need, SOURCE_LABEL[0] + half / Math.max(perUnit, 1));
        pull = Math.max(pull, need - slides[j]);
      });
      pull = Math.min(pull, COLUMN.sourceX - COLUMN.x - 1.2);
    } else slides.fill(0);
    SOURCES.forEach((src, j) => {
      origins[j].x = src.pos[0] - pull;
      const node = sourceNodes.current[j];
      if (node) node.position.x = -pull;
      const label = labelNodes.current[j];
      if (label) label.position.x = -slides[j];
    });

    SOURCES.forEach((src, j) => {
      const target = satPos[src.core];
      const attr = lines[j].getAttribute("position") as THREE.BufferAttribute;
      attr.setXYZ(0, origins[j].x, origins[j].y, origins[j].z);
      attr.setXYZ(1, target.x, target.y, target.z);
      attr.needsUpdate = true;
      lines[j].computeBoundingSphere();
      const lm = lineMats.current[j];
      if (lm) lm.opacity = 0.42 * w;

      const texts = src.id === "price" ? priceRef.current : src.samples;
      // As many chips per line as fit end to end on screen, evenly spaced.
      scratchA.copy(origins[j]).project(s.camera);
      scratchB.copy(target).project(s.camera);
      const run = Math.hypot((scratchA.x - scratchB.x) * s.size.width, (scratchA.y - scratchB.y) * s.size.height) * 0.5;
      const fit = Math.max(1, Math.min(CHIPS, Math.floor(run / 220)));
      for (let k = 0; k < CHIPS; k++) {
        const idx = j * CHIPS + k;
        const g = chips.current[idx];
        const el = chipEls.current[idx];
        if (!g || !el) continue;
        if (k >= fit) {
          if (el.style.opacity !== "0") el.style.opacity = "0";
          continue;
        }
        const speed = 0.16 + j * 0.012;
        const phase = t * speed + k / fit + j * 0.13;
        const u = phase % 1;
        g.position.copy(origins[j]).lerp(target, u);
        const edge = ramp(u, 0, 0.12) * (1 - ramp(u, 0.82, 0.97));
        // On a phone the sources sit past the right edge of the frame: fade a
        // chip out before its box reaches the edge instead of hard-clipping it.
        let side = 1;
        if (portrait) {
          const cx = (scratchA.copy(g.position).project(s.camera).x + 1) * 0.5 * s.size.width;
          const half = ((el.textContent?.length ?? 0) * 6.4 + 18) * 0.5; // mono 10.5px ≈ 6.4px/char + padding
          side = ramp(s.size.width - cx - half, 6, 48);
        }
        // Packets stay a quiet layer under the cores and source labels.
        el.style.opacity = String(CHIP_ALPHA * edge * w * side);
        const lap = Math.floor(phase) * fit + k;
        const ti = texts.length ? ((lap % texts.length) + texts.length) % texts.length : -1;
        if (ti !== lastText.current[idx]) {
          lastText.current[idx] = ti;
          el.textContent = ti >= 0 ? texts[ti] : "";
        }
      }
    });
  });

  const showSources = (p: number) => film.weight(p, "stream", 0.1) * ramp(p, film.at("stream", 0.18), film.at("stream", 0.25));
  return (
    <group ref={group} name="Streams" visible={false}>
      {SOURCES.map((src, j) => (
        <group key={src.id}>
          <lineSegments geometry={lines[j]}>
            <lineBasicMaterial ref={(el) => void (lineMats.current[j] = el)} color={src.id === "price" ? COLORS.up : COLORS.mint} transparent opacity={0} toneMapped={false} />
          </lineSegments>
          <group ref={(el) => void (sourceNodes.current[j] = el)}>
            <mesh position={[...src.pos]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={COLORS.mintHot} toneMapped={false} />
            </mesh>
            {/* The source names sit past a phone's right edge: there they would only
                ever peek in half-clipped during camera moves, so portrait skips them. */}
            {!portrait && (
              <group ref={(el) => void (labelNodes.current[j] = el)}>
                <SceneLabel position={[src.pos[0] + SOURCE_LABEL[0], src.pos[1] + SOURCE_LABEL[1], src.pos[2]]} show={showSources} tone="neutral">
                  {src.label}
                </SceneLabel>
              </group>
            )}
          </group>
          {Array.from({ length: CHIPS }, (_, k) => {
            const idx = j * CHIPS + k;
            return (
              <group key={k} ref={(el) => void (chips.current[idx] = el)}>
                <Html center portal={labels as RefObject<HTMLElement>} zIndexRange={[18, 0]} style={{ pointerEvents: "none" }}>
                  <div
                    ref={(el) => void (chipEls.current[idx] = el)}
                    style={{ opacity: 0 }}
                    className={`whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10.5px] tracking-[0.04em] [@media(max-height:520px)]:px-1 [@media(max-height:520px)]:text-[8px] [@media(max-height:520px)]:tracking-normal ${
                      src.id === "price" ? "border-[rgba(0,230,118,0.45)] bg-[#07130D] text-[#C9F5DD]" : "border-[rgba(168,222,194,0.4)] bg-[#06110C] text-[#DAECDF]"
                    }`}
                  />
                </Html>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------- cores → the core (pulses) */

const PULSES_PER = 3;

/** Light pulses from every core into the centre while it streams and thinks; the speaking core burns brightest. */
function Reasoning() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const mint = useMemo(() => new THREE.Color(COLORS.mint), []);
  const hot = useMemo(() => new THREE.Color(COLORS.mintHot), []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = Math.max(film.weight(p, "stream") * 0.55, film.weight(p, "think"));
    const im = mesh.current;
    if (!im) return;
    im.visible = w > 0.002;
    if (!im.visible) return;
    const t = still ? 0.6 : s.clock.elapsedTime;
    const speaking = speakingCore(film, p);
    let n = 0;
    for (let i = 0; i < SATELLITES.length; i++) {
      for (let k = 0; k < PULSES_PER; k++) {
        const u = (t * 0.55 + k / PULSES_PER + i * 0.17) % 1;
        pos.copy(satPos[i]).multiplyScalar(1 - easeInOut(u));
        const on = speaking === i;
        const size = (on ? 0.06 : 0.035) * w * (1 - u * 0.5);
        m4.makeScale(size, size, size).setPosition(pos);
        im.setMatrixAt(n, m4);
        im.setColorAt(n, col.copy(on ? hot : mint).multiplyScalar(on ? 3 : speaking >= 0 ? 0.6 : 1.4));
        n++;
      }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SATELLITES.length * PULSES_PER]} visible={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- 24-hour ring */

const SESSIONS = [
  { name: "Sydney", from: 22, to: 7 },
  { name: "Tokyo", from: 0, to: 9 },
  { name: "London", from: 8, to: 17 },
  { name: "New York", from: 13, to: 22 },
] as const;
const hourAngle = (h: number) => Math.PI / 2 - (h / 24) * Math.PI * 2;

function ClockRing() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Group>(null);
  const arcs = useMemo(
    () =>
      SESSIONS.map((sess, i) => {
        const len = (sess.to - sess.from + 24) % 24;
        return { span: (len / 24) * Math.PI * 2, start: hourAngle(sess.to), r: RING.radius + 0.16 + i * 0.09, name: sess.name, mid: hourAngle((sess.from + len / 2) % 24) };
      }),
    [],
  );

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "always");
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.85 + 0.15 * w);
    }
    const day = ramp(p, film.at("always", 0.15), film.at("always", 0.95)) * Math.PI * 2 + (still ? 0 : s.clock.elapsedTime * 0.05);
    if (hand.current) hand.current.rotation.z = -day;
  });

  const labelWindow = win(film, "always", [0.25, 0.35, 0.85, 0.95]);
  return (
    <group ref={group} name="ClockRing" visible={false}>
      <mesh>
        <torusGeometry args={[RING.radius, RING.tube, 8, 200]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {Array.from({ length: 24 }, (_, h) => {
        const a = hourAngle(h);
        const len = h % 6 === 0 ? 0.22 : 0.1;
        return (
          <mesh key={h} position={[Math.cos(a) * (RING.radius - len / 2), Math.sin(a) * (RING.radius - len / 2), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[len, 0.012, 0.012]} />
            <meshBasicMaterial color={h % 6 === 0 ? COLORS.mintHot : "#92A399"} toneMapped={false} />
          </mesh>
        );
      })}
      {arcs.map((a, i) => (
        <mesh key={a.name} rotation={[0, 0, a.start]}>
          <torusGeometry args={[a.r, 0.035, 8, 120, a.span]} />
          <meshBasicMaterial color={["#2E6B52", "#3E8E6B", "#00B862", COLORS.up][i]} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      {arcs.map((a) => (
        <SceneLabel key={`l-${a.name}`} position={[Math.cos(a.mid) * (a.r + 0.45), Math.sin(a.mid) * (a.r + 0.45), 0]} show={labelWindow}>
          {a.name}
        </SceneLabel>
      ))}
      {["00", "06", "12", "18"].map((h, i) => {
        const a = hourAngle(i * 6);
        return (
          <SceneLabel key={h} position={[Math.cos(a) * (RING.radius - 0.42), Math.sin(a) * (RING.radius - 0.42), 0]} show={labelWindow}>
            {h}:00
          </SceneLabel>
        );
      })}
      <group ref={hand}>
        <mesh position={[0, (RING.radius + 0.6) / 2, 0]}>
          <boxGeometry args={[0.018, RING.radius - 0.4, 0.018]} />
          <meshBasicMaterial color={COLORS.mintHot} toneMapped={false} />
        </mesh>
      </group>
      <SceneLabel position={[0, RING.radius + 0.95, 0]} show={labelWindow} tone="ai">
        Crypto · 24/7/365
      </SceneLabel>
    </group>
  );
}

/* --------------------------------------------------------- policy gate */

function PolicyGate() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const refused = useRef<THREE.Mesh>(null);
  const PASS = 5;

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "trust");
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.6 + 0.4 * w);
    }
    if (w <= 0.002) return;
    const t = still ? 0.4 : s.clock.elapsedTime;
    packets.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.28 + i / PASS) % 1;
      m.position.set(0.9 + u * 4.4, Math.sin(i * 1.7) * 0.35, Math.cos(i * 2.3) * 0.3);
      m.scale.setScalar(0.07 * w * (u < 0.92 ? 1 : (1 - u) / 0.08));
    });
    if (refused.current) {
      const u = ramp(p, film.at("trust", 0.3), film.at("trust", 0.45));
      const fade = 1 - ramp(p, film.at("trust", 0.75), film.at("trust", 0.88));
      refused.current.position.set(0.9 + u * (GATE.x - 1.25), -0.05, 0);
      const flash = u >= 1 && !still ? 0.6 + 0.4 * Math.abs(Math.sin(t * 6)) : 1;
      refused.current.scale.setScalar(Math.max(0.0001, 0.11 * fade * flash * ramp(p, film.at("trust", 0.22), film.at("trust", 0.3))));
    }
  });

  const gateLabel = win(film, "trust", [0.15, 0.25, 0.85, 0.95]);
  const refuseLabel = win(film, "trust", [0.42, 0.48, 0.75, 0.86]);
  return (
    <group ref={group} name="PolicyGate" visible={false}>
      <group position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <MachinedArc radius={GATE.radius} thickness={0.12} />
        <mesh>
          <torusGeometry args={[GATE.radius - 0.1, 0.012, 8, 120]} />
          <meshBasicMaterial color={COLORS.mint} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <circleGeometry args={[GATE.radius - 0.08, 48]} />
        <meshBasicMaterial color={COLORS.mint} transparent opacity={0.06} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: PASS }, (_, i) => (
        <mesh key={i} ref={(el) => void (packets.current[i] = el)}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={COLORS.mintHot} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={refused}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={COLORS.down} toneMapped={false} />
      </mesh>
      <SceneLabel position={[GATE.x, GATE.radius + 0.35, 0]} show={gateLabel} tone="ai">
        Policy gate
      </SceneLabel>
      <SceneLabel position={[GATE.x - 0.4, -0.55, 0]} show={refuseLabel} tone="down">
        Place trade · refused
      </SceneLabel>
    </group>
  );
}
