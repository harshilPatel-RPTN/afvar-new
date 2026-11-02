"use client";

// Idle motion for the /platform heroes. A hero's progress is fixed (its frame),
// so these run on the clock alone: gentle, slow, and cheap — group transforms
// and material values only, no allocations per frame. When the scene is still
// (reduced motion) each one settles on its finished frame and stops.
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useStoryFrame } from "@/modules/afvarOs/gl";

const TAU = Math.PI * 2;

/** 0…1 wave with a period of `period` seconds, offset by `phase` (0…1 of a period). */
export const wave = (t: number, period: number, phase = 0) => 0.5 + 0.5 * Math.sin(((t / period) + phase) * TAU);

type Glow = { mat: THREE.Material & { opacity: number }; opacity: number; emissive: number };

/**
 * Breathes the light of everything inside: transparent materials' opacity and
 * standard materials' emissive glow swing between (1 − amp)× and 1× of their own
 * value, on a `period`-second wave. Opaque basic materials are left as they are.
 */
export function Pulse({ period = 3, amp = 0.4, phase = 0, children }: { period?: number; amp?: number; phase?: number; children: ReactNode }) {
  const { still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const glows = useRef<Glow[] | null>(null);
  useFrame((s) => {
    const g = group.current;
    if (!g) return;
    if (!glows.current) {
      const found: Glow[] = [];
      g.traverse((o) => {
        const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
        if (!m || Array.isArray(m)) return;
        const emissive = (m as THREE.MeshStandardMaterial).emissiveIntensity;
        if (m.transparent || typeof emissive === "number") found.push({ mat: m as Glow["mat"], opacity: m.opacity, emissive: emissive ?? 0 });
      });
      glows.current = found;
    }
    const k = still ? 1 : 1 - amp * wave(s.clock.elapsedTime, period, phase);
    for (const x of glows.current) {
      if (x.mat.transparent) x.mat.opacity = x.opacity * k;
      if (x.emissive) (x.mat as THREE.MeshStandardMaterial).emissiveIntensity = x.emissive * k;
    }
  });
  return <group ref={group}>{children}</group>;
}

/** Floats its children: a slow bob (y), drift (x) and tilt (z), each on its own period. */
export function Float({
  y = 0.04,
  x = 0,
  tilt = 0,
  period = 5,
  phase = 0,
  position,
  rotation,
  children,
}: {
  y?: number;
  x?: number;
  tilt?: number;
  period?: number;
  phase?: number;
  position?: [number, number, number];
  rotation?: [number, number, number] | [number, number, number, THREE.EulerOrder];
  children: ReactNode;
}) {
  const { still } = useStoryFrame();
  const outer = useRef<THREE.Group>(null);
  useFrame((s) => {
    const g = outer.current;
    if (!g) return;
    const t = still ? 0 : s.clock.elapsedTime;
    const a = still ? 0 : Math.sin((t / period + phase) * TAU);
    const b = still ? 0 : Math.sin((t / (period * 1.37) + phase) * TAU);
    g.position.set(x * b, y * a, 0);
    g.rotation.z = tilt * b;
  });
  return (
    <group position={position} rotation={rotation}>
      <group ref={outer}>{children}</group>
    </group>
  );
}

/** Cumulative lengths of a polyline (for `along`). */
export function lengths(path: readonly THREE.Vector3[]): number[] {
  const out = [0];
  for (let i = 1; i < path.length; i++) out.push(out[i - 1] + path[i].distanceTo(path[i - 1]));
  return out;
}

/** The point a fraction `u` of the way along a polyline (no allocation). */
export function along(path: readonly THREE.Vector3[], lens: readonly number[], u: number, out: THREE.Vector3): THREE.Vector3 {
  const d = Math.min(1, Math.max(0, u)) * lens[lens.length - 1];
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i++;
  const f = (d - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1]);
  return out.copy(path[i - 1]).lerp(path[i], f);
}

const m4 = new THREE.Matrix4();
const at = new THREE.Vector3();

/**
 * A glint that runs along each path in turn — a line being traced. One draw
 * call for all paths (instanced); each glint takes its path's colour.
 */
export function Tracer({ paths, colors, size = 0.03, period = 4, stagger = 0.19, intensity = 2 }: { paths: readonly THREE.Vector3[][]; colors: readonly string[]; size?: number; period?: number; stagger?: number; intensity?: number }) {
  const { still } = useStoryFrame();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const lens = useRef<{ src: readonly THREE.Vector3[][]; lens: number[][] } | null>(null);
  useFrame((s) => {
    const im = mesh.current;
    if (!im) return;
    if (!lens.current || lens.current.src !== paths) {
      lens.current = { src: paths, lens: paths.map(lengths) };
      const c = new THREE.Color();
      paths.forEach((_, k) => im.setColorAt(k, c.set(colors[k] ?? colors[0]).multiplyScalar(intensity)));
      if (im.instanceColor) im.instanceColor.needsUpdate = true;
    }
    const t = still ? period * 0.6 : s.clock.elapsedTime;
    for (let k = 0; k < paths.length; k++) {
      const u = (t / period + k * stagger) % 1;
      along(paths[k], lens.current.lens[k], u, at);
      // grows in, runs, fades out at the line's end
      const r = size * Math.sin(Math.PI * u);
      m4.makeScale(r, r, r).setPosition(at);
      im.setMatrixAt(k, m4);
    }
    im.count = paths.length;
    im.instanceMatrix.needsUpdate = true;
  });
  if (!paths.length) return null;
  return (
    <instancedMesh key={paths.length} ref={mesh} args={[undefined, undefined, paths.length]} frustumCulled={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}
