"use client";

// Two ways to put the AFVAR avatar on screen:
//   <AvatarActor>   inside any R3F scene (e.g. a <CoreCanvas> film)
//   <AvatarOverlay> its own transparent canvas over DOM UI (e.g. the OS screen),
//                   placed in the DOM's design pixels so it can stand in a
//                   corner, walk to a window, or run across the whole screen.
// Both drive the same lazily-built rig; mount only one at a time.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import type { MotionValue } from "framer-motion";
import { useEffect, useLayoutEffect, useRef } from "react";
import type * as THREE from "three";
import type { AvatarRig } from "./rig";
import { AVATAR_HEIGHT, avatarFrame, useAvatarRig, type AvatarFrame } from "./rig";

/** Frame-rate independent exponential approach (THREE.MathUtils.damp). */
const THREE_damp = (x: number, y: number, lambda: number, dt: number) => x + (y - x) * (1 - Math.exp(-lambda * dt));

export type AvatarTrack = (p: number, t: number, out: AvatarFrame) => AvatarFrame;

/** True when the rig currently hangs in this root's scene (one robot, one parent). */
function ownedBy(rig: AvatarRig, scene: THREE.Scene): boolean {
  for (let o = rig.root.parent; o; o = o.parent) if (o === scene) return true;
  return false;
}

/**
 * Hosts the shared robot in this scene. Not a <primitive object={rig.root}>:
 * R3F keeps one instance per object (object.__r3f), so a second host's
 * primitive reuses the first host's instance, bails out against the wrong
 * root's scene and never attaches — the robot vanished from the stage. The
 * robot is hung imperatively in a holder group instead, hidden until this
 * host's first update has placed it (no flash with the previous host's
 * scene-unit or pixel transform). If it is ever left without a parent while
 * this host owns it, the frame loop hangs it back (see `adopt`).
 */
function useHost(rig: AvatarRig | null, here = true) {
  const holder = useRef<THREE.Group>(null);
  useLayoutEffect(() => {
    const h = holder.current;
    if (!rig || !here || !h) return;
    rig.mount(h);
    return () => rig.release(h);
  }, [rig, here]);
  return holder;
}
/** Re-hang an orphaned robot in this host; true when the rig is in this host's scene. */
function adopt(rig: AvatarRig, holder: THREE.Group | null, scene: THREE.Scene): boolean {
  if (!rig.root.parent && holder) rig.mount(holder);
  return ownedBy(rig, scene);
}

/**
 * Assembly is a one-way intro. Tracks write `explode` as a pure function of
 * progress, so scrolling back would play the build in reverse (head ring
 * floating off, arms spread, parts scattered). Instead: once (partly)
 * assembled, the robot stays that way and shrinks out smoothly over the same
 * stretch of scroll; it assembles again only after it has left the stage.
 */
type Assembly = { held: number };
const assembly = (): Assembly => ({ held: -1 });
function oneWay(f: AvatarFrame, a: Assembly): AvatarFrame {
  if (!f.visible) {
    a.held = -1;
    return f;
  }
  const raw = f.explode;
  if (a.held < 0 || raw <= a.held) {
    a.held = raw;
    return f;
  }
  const span = 1 - a.held;
  const u = span > 1e-3 ? Math.min(1, (raw - a.held) / span) : 1;
  f.explode = a.held;
  f.scale *= 1 - u * u * (3 - 2 * u);
  return f;
}

/** Compile the avatar's shaders once per renderer, in idle time, so its first appearance never stutters. */
function usePrecompile(rig: AvatarRig | null) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    if (!rig) return;
    const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (id: number) => void };
    const run = () => {
      // compileAsync builds the programs synchronously, then waits for the driver;
      // the avatar is only "visible" during that synchronous call, never in a frame.
      const was = rig.root.visible;
      rig.root.visible = true;
      const done = gl.compileAsync(rig.root, camera, scene);
      rig.root.visible = was;
      done.catch(() => {});
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(run, { timeout: 2000 });
      return () => w.cancelIdleCallback?.(id);
    }
    const id = window.setTimeout(run, 300);
    return () => window.clearTimeout(id);
  }, [rig, gl, scene, camera]);
}

/** The avatar inside an existing R3F scene. `track` returns the frame for progress p at time t. */
export function AvatarActor({ track, getP, still = false, quality = "balanced" }: { track: AvatarTrack; getP: () => number; still?: boolean; quality?: "balanced" | "performance" }) {
  const rig = useAvatarRig();
  usePrecompile(rig);
  const holder = useHost(rig);
  const out = useRef(avatarFrame());
  const held = useRef(assembly());
  useFrame((s, dt) => {
    if (!rig || !adopt(rig, holder.current, s.scene)) return;
    const t = still ? 1 : s.clock.elapsedTime;
    rig.update(Math.min(dt, 0.1), t, oneWay(track(getP(), t, out.current), held.current), { reduced: still, quality });
  });
  return <group ref={holder} name="AFVAR_AvatarHost" />;
}

/**
 * The avatar over DOM UI laid out in design pixels (default 1200×660, fitted
 * like <OsScreen>). In the frame, x / y are the feet in design px and `scale`
 * is the avatar's height in design px.
 */
export function AvatarOverlay({
  mv,
  track,
  design = [1200, 660],
  still = false,
  here = true,
  className = "",
}: {
  mv: MotionValue<number>;
  track: AvatarTrack;
  design?: readonly [number, number];
  still?: boolean;
  /**
   * The rig is on this canvas. When false the canvas stays alive but hidden and
   * on demand (only set-up frames: environment, resize) while the rig lives in
   * another scene — so handing it back never builds a new renderer.
   */
  here?: boolean;
  className?: string;
}) {
  const host = useRef<HTMLDivElement>(null);
  // Hide before paint when the rig leaves; it is shown again from the first
  // frame that has placed the rig (OverlayActor), never on a stale image.
  useLayoutEffect(() => {
    if (!here && host.current) host.current.style.visibility = "hidden";
  }, [here]);
  const reveal = () => {
    if (host.current && host.current.style.visibility === "hidden") host.current.style.visibility = "";
  };
  return (
    <div ref={host} aria-hidden="true" className={`pointer-events-none ${className}`}>
      <Canvas
        frameloop={here ? "always" : "demand"}
        orthographic
        // The host scales this layer with a CSS transform while scrolling: measure the
        // layout box (offsetSize) and only on real resizes, so scrolling never
        // reallocates the buffer or re-places the robot in 50 ms steps.
        resize={{ scroll: false, offsetSize: true }}
        dpr={[1, 1.75]} camera={{ position: [0, 0, 400], zoom: 1, near: 1, far: 2000 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <hemisphereLight args={["#f0f7ff", "#5d6a70", 1.1]} />
        <directionalLight position={[-300, 900, 400]} intensity={2.6} color="#fff9ee" />
        <directionalLight position={[500, 300, 200]} intensity={1.1} color="#c8e4ff" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={1.4} position={[0, 5, -4]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#A8DEC2" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        </Environment>
        <OverlayActor mv={mv} track={track} design={design} still={still} here={here} reveal={reveal} />
      </Canvas>
    </div>
  );
}

function OverlayActor({
  mv,
  track,
  design,
  still,
  here,
  reveal,
}: {
  mv: MotionValue<number>;
  track: AvatarTrack;
  design: readonly [number, number];
  still: boolean;
  here: boolean;
  /** Called after each update has placed the rig: shows a parked canvas again. */
  reveal: () => void;
}) {
  const rig = useAvatarRig();
  usePrecompile(rig);
  const holder = useHost(rig, here);
  const out = useRef(avatarFrame());
  const placed = useRef(avatarFrame());
  const held = useRef(assembly());
  const eased = useRef({ p: 0, t: -1 });
  useLayoutEffect(() => {
    // A new stay in this host starts from the live progress, never a stale one.
    if (here) eased.current.t = -1;
  }, [here]);
  useFrame((s, dt) => {
    if (!rig || !here || !adopt(rig, holder.current, s.scene)) return;
    const t = still ? 1 : s.clock.elapsedTime;
    // The overlay follows RAW scroll progress (the DOM desktop does too), but a
    // wheel notch can jump it by several percent of the OS act: ease the robot's
    // own progress towards it so size and position never teleport between
    // frames. Snap on the first frame here, after a pause, or on a huge jump.
    const raw = mv.get();
    const ease = eased.current;
    ease.p = ease.t < 0 || dt > 0.25 || Math.abs(raw - ease.p) > 0.05 ? raw : THREE_damp(ease.p, raw, 10, dt);
    ease.t = t;
    const f = oneWay(track(ease.p, t, out.current), held.current);
    // The live size: a render-time closure can lag a resize by a frame.
    const size = s.size;
    const k = Math.min(size.width / design[0], size.height / design[1]);
    const ox = (size.width - design[0] * k) / 2;
    const oy = (size.height - design[1] * k) / 2;
    const g = placed.current;
    Object.assign(g, f);
    g.x = ox + f.x * k - size.width / 2;
    g.y = size.height / 2 - (oy + f.y * k);
    g.z = 0;
    g.scale = (f.scale * k) / AVATAR_HEIGHT;
    rig.update(Math.min(dt, 0.1), t, g, { reduced: still });
    reveal();
  });
  return <group ref={holder} name="AFVAR_AvatarHost" />;
}
