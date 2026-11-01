"use client";

// Shared pieces of the AFVAR AI scene, with the home film's exact look:
// the seven specialist cores and the gold pulses they send into the AI.
// Pages drive them with pure functions of (damped progress, clock), so
// scrolling back replays cleanly.
//
//   const pos = useCorePositions();
//   <CoreNodes positions={pos} place={(p, t, i, out) => …} size={(p, i) => …} />
//   <CorePulses positions={pos} weight={(p) => …} hot={(p) => index | -1} />
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { easeInOut } from "../story/timeline";
import { SceneLabel, useStoryFrame } from "./stage";

/** The seven specialist cores of the AFVAR AI (same order and names everywhere). */
export const AI_CORES = [
  { id: "market", label: "Market core" },
  { id: "macro", label: "Macro core" },
  { id: "news", label: "News core" },
  { id: "risk", label: "Risk core" },
  { id: "memory", label: "Memory core" },
  { id: "voice", label: "Voice core" },
  { id: "verify", label: "Verify core" },
] as const;
export type AiCoreId = (typeof AI_CORES)[number]["id"];
export const coreIndex = (id: AiCoreId) => AI_CORES.findIndex((c) => c.id === id);

/** Size of a core node (scene units). */
export const CORE_NODE = 0.17;

/** One live position per core, written by <CoreNodes/> every frame before anyone reads it. */
export function useCorePositions(): THREE.Vector3[] {
  return useMemo(() => AI_CORES.map(() => new THREE.Vector3()), []);
}

/** Orbit / ring / tight-orbit placement used by the home film. */
export function orbitPlace(i: number, t: number, radius: number, out: THREE.Vector3, { tilt = 0.38, speed = 0.12, depth = 0.9 } = {}) {
  const a = (i / AI_CORES.length) * Math.PI * 2 + t * speed;
  return out.set(Math.cos(a) * radius, Math.sin(a) * radius * tilt, Math.sin(a) * radius * depth);
}

export function CoreNodes({
  positions,
  place,
  size,
  glow,
  labelShow,
  labels = true,
}: {
  positions: THREE.Vector3[];
  /** Write core i's position at progress p / time t into `out`. */
  place: (p: number, t: number, i: number, out: THREE.Vector3) => void;
  /** Scale of core i (0 hides it; 1 normal; ~1.55 speaking). */
  size: (p: number, i: number) => number;
  /** Emissive strength of core i (home: 1.4 calm, 3.2 speaking, 0.7 listening). */
  glow?: (p: number, i: number) => number;
  /** Opacity of core i's name label. */
  labelShow?: (p: number, i: number) => number;
  /** Mount the DOM labels at all (keep false far from the acts that show them). */
  labels?: boolean;
}) {
  const { smoothed, still } = useStoryFrame();
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    nodes.current.forEach((g, i) => {
      place(p, t, i, positions[i]);
      if (!g) return;
      g.position.copy(positions[i]);
      const k = size(p, i);
      g.scale.setScalar(Math.max(0.0001, k));
      g.visible = k > 0.002;
      const m = mats.current[i];
      if (m && glow) m.emissiveIntensity = glow(p, i);
    });
  }, -4);

  const shows = useMemo(() => AI_CORES.map((_, i) => (p: number) => (labelShow ? labelShow(p, i) : 0)), [labelShow]);

  return (
    <group name="CoreNodes">
      {AI_CORES.map((core, i) => (
        <group key={core.id} ref={(el) => void (nodes.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[CORE_NODE, 28, 28]} />
            <meshStandardMaterial
              ref={(el) => void (mats.current[i] = el)}
              color={COLORS.goldDeep}
              emissive={core.id === "verify" ? COLORS.goldHot : COLORS.gold}
              emissiveIntensity={1.4}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[CORE_NODE * 1.7, 0.006, 8, 48]} />
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {labels && labelShow ? (
            <SceneLabel position={[0, CORE_NODE + 0.3, 0]} show={shows[i]} tone="gold">
              {core.label}
            </SceneLabel>
          ) : null}
        </group>
      ))}
    </group>
  );
}

const PULSES_PER = 3;

/** Gold pulses from every core into the centre; the `hot` core burns brightest. */
export function CorePulses({ positions, weight, hot }: { positions: THREE.Vector3[]; weight: (p: number) => number; hot?: (p: number) => number }) {
  const { smoothed, still } = useStoryFrame();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const [m4, col, pos, gold, hotCol] = useMemo(() => [new THREE.Matrix4(), new THREE.Color(), new THREE.Vector3(), new THREE.Color(COLORS.gold), new THREE.Color(COLORS.goldHot)] as const, []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = weight(p);
    const im = mesh.current;
    if (!im) return;
    im.visible = w > 0.002;
    if (!im.visible) return;
    const t = still ? 0.6 : s.clock.elapsedTime;
    const speaking = hot ? hot(p) : -1;
    let n = 0;
    for (let i = 0; i < AI_CORES.length; i++) {
      for (let k = 0; k < PULSES_PER; k++) {
        const u = (t * 0.55 + k / PULSES_PER + i * 0.17) % 1;
        pos.copy(positions[i]).multiplyScalar(1 - easeInOut(u));
        const on = speaking === i;
        const size = (on ? 0.06 : 0.035) * w * (1 - u * 0.5);
        m4.makeScale(size, size, size).setPosition(pos);
        im.setMatrixAt(n, m4);
        im.setColorAt(n, col.copy(on ? hotCol : gold).multiplyScalar(on ? 3 : speaking >= 0 ? 0.6 : 1.4));
        n++;
      }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, AI_CORES.length * PULSES_PER]} visible={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/**
 * Mount children only while the damped progress is inside [lo, hi]. Far-away
 * parts (and their DOM labels) stay unmounted until the film gets near them.
 */
export function useNearRange(lo: number, hi: number): boolean {
  const { smoothed } = useStoryFrame();
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

export function NearRange({ lo, hi, children }: { lo: number; hi: number; children: React.ReactNode }) {
  return useNearRange(lo, hi) ? <>{children}</> : null;
}
