"use client";

// Shared WebGL building blocks for every /home-demo chapter scene: the damped
// master progress, the spline camera rig, draw-range reveal and the fading
// grid floor. One motion system — every chapter inherits the same "video"
// inertia and camera language.
import { Grid, Html, PerformanceMonitor } from "@react-three/drei";
import { useFrame, useThree } from "@react-three/fiber";
import { useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { playCue, type Cue } from "./audio";
import { clamp01, easeInOut, easeOut, ramp, window4 } from "./timeline";

export type CameraKey = { at: number; pos: readonly [number, number, number]; look: readonly [number, number, number] };

/* ------------------------------------------------------- progress smoothing */

/** Damps the raw scroll progress; runs before every consumer (priority -10).
 *  The first frame snaps to the target, so a scene remounted mid-chapter
 *  starts where the scroll is instead of replaying from zero. */
export function ProgressDamper({
  progress,
  smoothed: smoothedRef,
  still,
  settledP,
  lambda,
}: {
  progress: RefObject<number>;
  smoothed: RefObject<number>;
  still: boolean;
  settledP: number;
  lambda: number;
}) {
  const primedRef = useRef(false);
  useFrame((_, dt) => {
    const target = still ? settledP : clamp01(progress.current ?? 0);
    if (still || !primedRef.current) {
      smoothedRef.current = target;
      primedRef.current = true;
      return;
    }
    smoothedRef.current = THREE.MathUtils.damp(smoothedRef.current ?? 0, target, lambda, dt);
  }, -10);
  return null;
}

/* ------------------------------------------------------------ sound cues */

export type SoundCue = { at: number; cue: Cue };

/** Fires one-shot sounds when the damped progress crosses a cue going
 *  forward — so the sound lands on the visual beat, not the raw scroll.
 *  Each cue fires at most once per pass and re-arms only after scrolling
 *  back well below it. Mounting mid-chapter never fires anything. */
export function SoundCues({ smoothed, cues }: { smoothed: RefObject<number>; cues: readonly SoundCue[] }) {
  const prevRef = useRef<number | null>(null);
  const armedRef = useRef(cues.map(() => true));
  useFrame(() => {
    const p = smoothed.current ?? 0;
    const prev = prevRef.current;
    prevRef.current = p;
    if (prev === null) return;
    cues.forEach((c, i) => {
      if (armedRef.current[i] && prev < c.at && p >= c.at) {
        armedRef.current[i] = false;
        playCue(c.cue);
      } else if (!armedRef.current[i] && p < c.at - 0.06) {
        armedRef.current[i] = true;
      }
    });
  }, -5);
  return null;
}

/* ----------------------------------------------------------- scene labels */

/** A plain DOM label pinned to a point in the scene, faded by the damped
 *  progress over a [in, in, out, out] window — so 3D parts say what they are. */
export function SceneLabel({
  position,
  smoothed,
  show,
  tone = "neutral",
  portal,
  children,
}: {
  portal?: RefObject<HTMLElement>;
  position: readonly [number, number, number];
  smoothed: RefObject<number>;
  show: readonly [number, number, number, number];
  tone?: "neutral" | "up" | "down";
  children: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    if (ref.current) ref.current.style.opacity = String(window4(smoothed.current ?? 0, show));
  });
  const color = tone === "up" ? "#00E676" : tone === "down" ? "#FF3B3B" : "#F5F7F7";
  return (
    <Html position={position as [number, number, number]} portal={portal} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        style={{ opacity: 0, color, borderColor: tone === "neutral" ? "rgba(255,255,255,0.18)" : color }}
        className="whitespace-nowrap border bg-[#111416] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em]"
      >
        {children}
      </div>
    </Html>
  );
}

/* ------------------------------------------------------ adaptive quality */

/** Lowers the pixel ratio when frames drop and restores it with headroom
 *  (1× – 1.75×). Desktop starts at full quality; phones start low and earn
 *  more. Only measures while rendering. */
export function AdaptiveQuality() {
  const setDpr = useThree((s) => s.setDpr);
  const [small] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  return (
    <PerformanceMonitor
      factor={small ? 0.3 : 1}
      flipflops={3}
      onChange={({ factor }) => setDpr(Math.round((1 + 0.75 * factor) * 4) / 4)}
      onFallback={() => setDpr(1)}
    />
  );
}

/* ------------------------------------------------------------- camera rig */

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();

/** Continuous spline through the keys; `at` maps progress → curve parameter. */
export function CameraRig({
  smoothed,
  still,
  keys,
  fov,
  parallax,
}: {
  smoothed: RefObject<number>;
  still: boolean;
  keys: readonly CameraKey[];
  fov: readonly [number, number];
  parallax: number;
}) {
  const posCurve = useMemo(
    () => new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
    [keys],
  );
  const lookCurve = useMemo(
    () => new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    [keys],
  );
  const drift = useRef({ x: 0, y: 0 });

  useFrame((s, dt) => {
    const p = smoothed.current ?? 0;
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].at) i++;
    const t = ramp(p, keys[i].at, keys[i + 1].at);
    const u = (i + t) / (keys.length - 1);
    posCurve.getPoint(u, camPos);
    lookCurve.getPoint(u, camLook);

    if (!still) {
      // Damped pointer parallax bends the look target, never the scroll story.
      drift.current.x = THREE.MathUtils.damp(drift.current.x, s.pointer.x * parallax, 3.5, dt);
      drift.current.y = THREE.MathUtils.damp(drift.current.y, s.pointer.y * parallax * 0.6, 3.5, dt);
      camLook.x += drift.current.x;
      camLook.y += drift.current.y;
      // Tiny handheld sway that dies as the story settles.
      camPos.y += Math.sin(s.clock.elapsedTime * 0.5) * (1 - p) * 0.02;
    }

    s.camera.position.copy(camPos);
    s.camera.lookAt(camLook);
    const cam = s.camera as THREE.PerspectiveCamera;
    cam.fov = THREE.MathUtils.lerp(fov[0], fov[1], easeInOut(p));
    cam.updateProjectionMatrix();
  });
  return null;
}

/* ---------------------------------------------------------- reveal helpers */

/** Draw an indexed tube up to fraction `f` of its length. */
export const setDraw = (mesh: THREE.Mesh | null, f: number) => {
  const g = mesh?.geometry;
  if (g?.index) g.setDrawRange(0, Math.floor((g.index.count * clamp01(f)) / 3) * 3);
};

/* -------------------------------------------------------------- grid floor */

type GridUniforms = { cellColor?: THREE.Color; sectionColor?: THREE.Color };

/** drei Grid whose line colours fade up from black over a progress window. */
export function FadeGrid({
  smoothed,
  reveal,
  position,
  cell,
  section,
  fadeDistance = 22,
}: {
  smoothed: RefObject<number>;
  reveal: readonly [number, number];
  position: readonly [number, number, number];
  cell: THREE.Color;
  section: THREE.Color;
  fadeDistance?: number;
}) {
  const grid = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const k = easeOut(ramp(p, reveal[0], reveal[1]));
    const mat = grid.current?.material as unknown as GridUniforms | undefined;
    mat?.cellColor?.copy(cell).multiplyScalar(k);
    mat?.sectionColor?.copy(section).multiplyScalar(k);
    if (grid.current) grid.current.visible = k > 0.001;
  });

  return (
    <Grid
      ref={grid}
      position={position as [number, number, number]}
      args={[40, 40]}
      cellSize={0.5}
      cellThickness={0.6}
      cellColor="#000000"
      sectionSize={2.5}
      sectionThickness={1}
      sectionColor="#000000"
      fadeDistance={fadeDistance}
      fadeStrength={1.5}
      infiniteGrid
      visible={false}
    />
  );
}
