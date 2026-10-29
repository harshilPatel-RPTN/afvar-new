"use client";

// The WebGL side of a scroll story. <CoreCanvas> sets up the AFVAR look
// (background, fog, studio light, environment, bloom) and the motion system
// (damped progress, spline camera, sound cues, adaptive quality). Anything
// inside reads the damped progress with useStoryFrame().
//
//   <CoreCanvas progress={s.progressRef} active={s.active} still={false} camera={KEYS} cues={CUES} onCue={playCue}>
//     <AiCore />
//     …your scene…
//   </CoreCanvas>
import { Environment, Html, Lightformer, PerformanceMonitor } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { clamp01, easeInOut, ramp, window4, type Window4 } from "../story/timeline";

export type CameraKey = { at: number; pos: readonly [number, number, number]; look: readonly [number, number, number] };
export type SceneCue<C extends string = string> = { at: number; cue: C };

interface StoryFrame {
  /** Damped master progress — read inside useFrame. */
  smoothed: RefObject<number>;
  /** Static frame (reduced motion): no clock-driven motion. */
  still: boolean;
  /** Fixed DOM parent for <Html> labels (prevents remounts when R3F connects events). */
  labels: RefObject<HTMLDivElement | null>;
}

const StoryFrameContext = createContext<StoryFrame | null>(null);

/** Damped progress + still flag for anything inside <CoreCanvas>. */
export function useStoryFrame(): StoryFrame {
  const ctx = useContext(StoryFrameContext);
  if (!ctx) throw new Error("useStoryFrame must be used inside <CoreCanvas>");
  return ctx;
}

export interface CoreCanvasProps<C extends string> {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** Progress used when `still` (the composed frame). */
  settledP: number;
  camera: readonly CameraKey[];
  fov?: number;
  parallax?: number;
  /** Damping strength of the scroll → scene progress (higher = snappier). */
  damp?: number;
  cues?: readonly SceneCue<C>[];
  onCue?: (cue: C) => void;
  bloom?: number;
  /** Device-pixel-ratio range (lower on phones). */
  dpr?: [number, number];
  children: ReactNode;
}

export function CoreCanvas<C extends string>({
  progress,
  active,
  still,
  settledP,
  camera,
  fov = 38,
  parallax = 0.12,
  damp = 4.2,
  cues,
  onCue,
  bloom = 0.75,
  dpr = [1, 1.75],
  children,
}: CoreCanvasProps<C>) {
  const smoothed = useRef(still ? settledP : 0);
  const labels = useRef<HTMLDivElement | null>(null);
  const ctx = useMemo(() => ({ smoothed, still, labels }), [still]);
  return (
    <div className="relative h-full w-full">
    <div ref={labels} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" />
    <Canvas
      dpr={dpr}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: [...camera[0].pos], fov }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <StoryFrameContext.Provider value={ctx}>
        <color attach="background" args={[COLORS.bg]} />
        <fog attach="fog" args={[COLORS.bg, 10, 28]} />
        <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={settledP} lambda={damp} />
        <AdaptiveQuality />
        {cues && onCue ? <CueRunner smoothed={smoothed} cues={cues} onCue={onCue} /> : null}
        <CameraRig smoothed={smoothed} still={still} keys={camera} fov={fov} parallax={parallax} />

        <ambientLight intensity={0.16} />
        <spotLight position={[5, 7, 6]} angle={0.5} penumbra={1} intensity={40} color="#f1ece2" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={1.6} position={[0, 5, -4]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.1} color={COLORS.gold} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="rect" intensity={0.4} color="#9fb3c8" position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>

        {children}

        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={0.85} intensity={bloom} />
          <Vignette darkness={0.5} offset={0.3} />
        </EffectComposer>
      </StoryFrameContext.Provider>
    </Canvas>
    </div>
  );
}

/* ------------------------------------------------------------- internals */

function ProgressDamper({
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
  const primed = useRef(false);
  useFrame((_, dt) => {
    const target = still ? settledP : clamp01(progress.current ?? 0);
    if (still || !primed.current) {
      smoothedRef.current = target;
      primed.current = true;
      return;
    }
    // Large jumps (rail navigation) settle quickly instead of crawling.
    const gap = Math.abs(target - (smoothedRef.current ?? 0));
    smoothedRef.current = THREE.MathUtils.damp(smoothedRef.current ?? 0, target, lambda + gap * 12, Math.min(dt, 0.1));
  }, -10);
  return null;
}

function CueRunner<C extends string>({ smoothed, cues, onCue }: { smoothed: RefObject<number>; cues: readonly SceneCue<C>[]; onCue: (c: C) => void }) {
  const prev = useRef<number | null>(null);
  const armed = useRef(cues.map(() => true));
  useFrame(() => {
    const p = smoothed.current ?? 0;
    const last = prev.current;
    prev.current = p;
    if (last === null) return;
    cues.forEach((c, i) => {
      if (armed.current[i] && last < c.at && p >= c.at && p - c.at < 0.02) {
        armed.current[i] = false;
        onCue(c.cue);
      } else if (!armed.current[i] && p < c.at - 0.01) {
        armed.current[i] = true;
      }
    });
  }, -5);
  return null;
}

function AdaptiveQuality() {
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

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();

function CameraRig({
  smoothed,
  still,
  keys,
  fov,
  parallax,
}: {
  smoothed: RefObject<number>;
  still: boolean;
  keys: readonly CameraKey[];
  fov: number;
  parallax: number;
}) {
  const posCurve = useMemo(() => new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"), [keys]);
  const lookCurve = useMemo(() => new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"), [keys]);
  const drift = useRef({ x: 0, y: 0 });

  useFrame((s, dt) => {
    const p = smoothed.current ?? 0;
    let i = 0;
    while (i < keys.length - 2 && p > keys[i + 1].at) i++;
    const t = easeInOut(ramp(p, keys[i].at, keys[i + 1].at));
    const u = (i + t) / (keys.length - 1);
    posCurve.getPoint(u, camPos);
    lookCurve.getPoint(u, camLook);
    if (!still) {
      drift.current.x = THREE.MathUtils.damp(drift.current.x, s.pointer.x * parallax, 3.5, dt);
      drift.current.y = THREE.MathUtils.damp(drift.current.y, s.pointer.y * parallax * 0.6, 3.5, dt);
      camLook.x += drift.current.x;
      camLook.y += drift.current.y;
    }
    s.camera.position.copy(camPos);
    s.camera.lookAt(camLook);
    const cam = s.camera as THREE.PerspectiveCamera;
    if (cam.fov !== fov) {
      cam.fov = fov;
      cam.updateProjectionMatrix();
    }
  });
  return null;
}

/* ---------------------------------------------------------------- labels */

/** A DOM label pinned to a point in the scene, faded over a progress window. */
export function SceneLabel({
  position,
  show,
  tone = "neutral",
  children,
}: {
  position: readonly [number, number, number];
  show: Window4 | ((p: number) => number);
  tone?: "neutral" | "gold" | "up" | "down";
  children: ReactNode;
}) {
  const { smoothed, labels } = useStoryFrame();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const p = smoothed.current ?? 0;
    const o = typeof show === "function" ? show(p) : window4(p, show);
    if (ref.current) {
      ref.current.style.opacity = String(o);
      ref.current.style.visibility = o < 0.01 ? "hidden" : "visible";
    }
  });
  const color = tone === "up" ? COLORS.up : tone === "down" ? COLORS.down : tone === "gold" ? COLORS.gold : COLORS.ink;
  const border = tone === "neutral" ? "rgba(255,255,255,0.18)" : color;
  return (
    <Html position={position as [number, number, number]} portal={labels as RefObject<HTMLElement>} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        style={{ opacity: 0, visibility: "hidden", color, borderColor: border }}
        className="whitespace-nowrap border bg-[#0F1214] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em]"
      >
        {children}
      </div>
    </Html>
  );
}
