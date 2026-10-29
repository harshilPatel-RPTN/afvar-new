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
import { useRef } from "react";
import { AVATAR_HEIGHT, avatarFrame, useAvatarRig, type AvatarFrame } from "./rig";

export type AvatarTrack = (p: number, t: number, out: AvatarFrame) => AvatarFrame;

/** The avatar inside an existing R3F scene. `track` returns the frame for progress p at time t. */
export function AvatarActor({ track, getP, still = false, quality = "balanced" }: { track: AvatarTrack; getP: () => number; still?: boolean; quality?: "balanced" | "performance" }) {
  const rig = useAvatarRig();
  const out = useRef(avatarFrame());
  useFrame((s, dt) => {
    if (!rig) return;
    const t = still ? 1 : s.clock.elapsedTime;
    rig.update(Math.min(dt, 0.1), t, track(getP(), t, out.current), { reduced: still, quality });
  });
  return rig ? <primitive object={rig.root} dispose={null} /> : null;
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
  className = "",
}: {
  mv: MotionValue<number>;
  track: AvatarTrack;
  design?: readonly [number, number];
  still?: boolean;
  className?: string;
}) {
  return (
    <div aria-hidden="true" className={`pointer-events-none ${className}`}>
      <Canvas orthographic dpr={[1, 1.75]} camera={{ position: [0, 0, 400], zoom: 1, near: 1, far: 2000 }} gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}>
        <hemisphereLight args={["#f0f7ff", "#5d6a70", 1.1]} />
        <directionalLight position={[-300, 900, 400]} intensity={2.6} color="#fff9ee" />
        <directionalLight position={[500, 300, 200]} intensity={1.1} color="#c8e4ff" />
        <Environment resolution={128} frames={1}>
          <Lightformer form="rect" intensity={1.4} position={[0, 5, -4]} scale={[12, 4, 1]} />
          <Lightformer form="rect" intensity={0.8} color="#E9B44C" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        </Environment>
        <OverlayActor mv={mv} track={track} design={design} still={still} />
      </Canvas>
    </div>
  );
}

function OverlayActor({ mv, track, design, still }: { mv: MotionValue<number>; track: AvatarTrack; design: readonly [number, number]; still: boolean }) {
  const rig = useAvatarRig();
  const size = useThree((s) => s.size);
  const out = useRef(avatarFrame());
  const placed = useRef(avatarFrame());
  useFrame((s, dt) => {
    if (!rig) return;
    const t = still ? 1 : s.clock.elapsedTime;
    const f = track(mv.get(), t, out.current);
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
  });
  return rig ? <primitive object={rig.root} dispose={null} /> : null;
}
