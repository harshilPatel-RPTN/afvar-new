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
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { createContext, useContext, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { clamp01, window4, type Window4 } from "../story/timeline";
import { cameraViewport, createCameraTrack, sampleCameraTrack, type CameraKey } from "./framing";

export type { CameraKey } from "./framing";
/** A sound at progress `at`. With `until`, it plays every time progress enters [at, until] from either side. */
export type SceneCue<C extends string = string> = { at: number; cue: C; until?: number };

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
  /** The canvas already occupies only the usable space beneath the navigation. */
  belowHeader?: boolean;
  /** Damping strength of the scroll → scene progress (higher = snappier). */
  damp?: number;
  cues?: readonly SceneCue<C>[];
  onCue?: (cue: C) => void;
  bloom?: number;
  bloomLevels?: number;
  background?: string;
  /** Device-pixel-ratio range (lower on phones). */
  dpr?: [number, number];
  /** Extra zoom factor per frame (progress, canvas width, height), e.g. to keep a wide composition inside a narrow stage. */
  zoomFit?: (p: number, width: number, height: number) => number;
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
  belowHeader = false,
  damp = 4.2,
  cues,
  onCue,
  bloom = 0.75,
  bloomLevels,
  background,
  dpr = [1, 1.75],
  zoomFit,
  children,
}: CoreCanvasProps<C>) {
  const smoothed = useRef(still ? settledP : 0);
  const labels = useRef<HTMLDivElement | null>(null);
  const ctx = useMemo(() => ({ smoothed, still, labels }), [still]);
  // Phones get lighter edge smoothing (2× instead of 4×): the pixels are small anyway.
  const [msaa] = useState(() => (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches ? 2 : 4));
  return (
    // Inactive (off-screen) stages take no pointer/wheel events: R3F would otherwise raycast (and force layout) on every wheel tick.
    <div className="relative h-full w-full" style={active ? undefined : { pointerEvents: "none" }}>
    <div ref={labels} className="pointer-events-none absolute inset-0 z-[1] overflow-hidden" />
    <Canvas
      dpr={dpr}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: [...camera[0].pos], fov }}
      // Composer MSAA handles the edges; retain alpha so the homepage has no panel seam.
      gl={{ alpha: true, antialias: false, powerPreference: "high-performance", stencil: false }}
      onCreated={({ gl }) => gl.setClearColor(background ?? 0x000000, background ? 1 : 0)}
      aria-hidden="true"
    >
      <StoryFrameContext.Provider value={ctx}>
        {background && <color attach="background" args={[background]} />}
        <fog attach="fog" args={[background ?? COLORS.bg, 10, 28]} />
        <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={settledP} lambda={damp} />
        <AdaptiveQuality />
        {cues && onCue ? <CueRunner smoothed={smoothed} cues={cues} onCue={onCue} /> : null}
        <CameraRig smoothed={smoothed} still={still} keys={camera} fov={fov} parallax={parallax} belowHeader={belowHeader} zoomFit={zoomFit} />

        <ambientLight intensity={0.16} />
        <spotLight position={[5, 7, 6]} angle={0.5} penumbra={1} intensity={40} color="#E5F1E8" />
        <Environment resolution={256} frames={1}>
          <Lightformer form="rect" intensity={1.6} position={[0, 5, -4]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={1.1} color={COLORS.mint} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
          <Lightformer form="rect" intensity={0.4} color="#90ACA0" position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
        </Environment>

        {children}

        <EffectComposer multisampling={msaa}>
          <Bloom mipmapBlur levels={bloomLevels} luminanceThreshold={0.85} intensity={bloom} />
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
  const lastFrame = useRef(-Infinity);
  useFrame((_, dt) => {
    const target = still ? settledP : clamp01(progress.current ?? 0);
    // First frame, or the first frame after the loop was paused (off screen,
    // covered): show where the story is now, never a stale or easing frame.
    const now = performance.now();
    const resumed = now - lastFrame.current > 250;
    lastFrame.current = now;
    if (still || resumed) {
      smoothedRef.current = target;
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
      if (c.until !== undefined) {
        // Window cue: fires on every entry, scrolling down or up, even if a frame jumps past the edge.
        const inside = p >= c.at && p <= c.until;
        if (inside && armed.current[i]) {
          armed.current[i] = false;
          onCue(c.cue);
        } else if (!inside) armed.current[i] = true;
        return;
      }
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
  const viewportDpr = useThree((s) => s.viewport.dpr);
  const [small] = useState(() => window.matchMedia("(max-width: 767px)").matches);
  // Degrade only. Every DPR change reallocates the drawing buffer and the
  // composer targets; raising it again after a smooth stretch made the
  // resolution flip-flop (1.75 ↔ 1.5) while scrolling. Once lowered, it stays.
  const ceiling = useRef(Infinity);
  const lower = (dpr: number) => {
    const next = Math.min(dpr, ceiling.current, viewportDpr);
    if (next >= Math.min(ceiling.current, viewportDpr)) return;
    ceiling.current = next;
    setDpr(next);
  };
  return (
    <PerformanceMonitor
      factor={small ? 0.3 : 1}
      flipflops={3}
      onChange={({ factor }) => lower(Math.round((1 + 0.75 * factor) * 4) / 4)}
      onFallback={() => lower(1)}
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
  belowHeader,
  zoomFit,
}: {
  smoothed: RefObject<number>;
  still: boolean;
  keys: readonly CameraKey[];
  fov: number;
  parallax: number;
  belowHeader: boolean;
  zoomFit?: (p: number, width: number, height: number) => number;
}) {
  const track = useMemo(() => createCameraTrack(keys), [keys]);
  const drift = useRef({ x: 0, y: 0 });

  useFrame((s, dt) => {
    const p = smoothed.current ?? 0;
    sampleCameraTrack(track, p, camPos, camLook);
    if (!still) {
      drift.current.x = THREE.MathUtils.damp(drift.current.x, s.pointer.x * parallax, 3.5, dt);
      drift.current.y = THREE.MathUtils.damp(drift.current.y, s.pointer.y * parallax * 0.6, 3.5, dt);
      camLook.x += drift.current.x;
      camLook.y += drift.current.y;
    }
    s.camera.position.copy(camPos);
    s.camera.lookAt(camLook);
    const cam = s.camera as THREE.PerspectiveCamera;
    // Narrower landscape screens (≈1024–1600 px): the DOM copy column is rem-sized, so it
    // takes a bigger share of the width. Pull back a little and slide the scene right
    // so the 3D keeps clear of the copy, as it does on a 1920 screen.
    const { width: w, height: h } = s.size;
    // 1920 → none · 1280 → 0.87× and 56 px right · 1024 (4:3) → 0.72× and 46 px right.
    const view = cameraViewport(w, h, belowHeader);
    const { shift, drop } = view;
    const zoom = zoomFit ? Math.round(view.zoom * zoomFit(p, w, h) * 1000) / 1000 : view.zoom;
    const vo = cam.view;
    if (cam.fov !== fov || cam.zoom !== zoom || (vo ? -vo.offsetX : 0) !== shift || (vo ? -vo.offsetY : 0) !== drop || (vo && (vo.fullWidth !== w || vo.fullHeight !== h))) {
      cam.fov = fov;
      cam.zoom = zoom;
      if (shift || drop) cam.setViewOffset(w, h, -shift, -drop, w, h);
      else cam.clearViewOffset();
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
  tone?: "neutral" | "ai" | "gold" | "up" | "down";
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
  const color = tone === "up" ? COLORS.up : tone === "down" ? COLORS.down : (tone === "ai" || tone === "gold") ? COLORS.mint : COLORS.ink;
  const border = tone === "neutral" ? "rgba(255,255,255,0.18)" : color;
  return (
    <Html position={position as [number, number, number]} portal={labels as RefObject<HTMLElement>} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        style={{ opacity: 0, visibility: "hidden", color, borderColor: border }}
        className="whitespace-nowrap border bg-[#10231B] px-2.5 py-1 font-mono text-[11px] uppercase tracking-[0.16em] [@media(max-height:520px)]:px-1.5 [@media(max-height:520px)]:py-0.5 [@media(max-height:520px)]:text-[8.5px] [@media(max-height:520px)]:tracking-[0.1em]"
      >
        {children}
      </div>
    </Html>
  );
}
