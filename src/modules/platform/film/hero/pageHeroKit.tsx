"use client";

// Shared pieces of the page heroes (PageHeroScenes and the scenes in ./scenes):
// entrance curves, the pointer lean, glass cards and 3D candles.
import { useFrame } from "@react-three/fiber";
import { useRef, type ReactNode } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";

/** Props every page-hero scene receives. `variant` narrows a shared kind (e.g. a market group's id). */
export type PageSceneProps = { portrait: boolean; variant?: string };

export const clamp01 = (k: number) => Math.min(1, Math.max(0, k));
/** A part's entrance: 0→1 over `dur` seconds from `delay`, eased out. */
export const ease = (t: number, delay: number, dur = 0.7) => 1 - (1 - clamp01((t - delay) / dur)) ** 3;
/** The same entrance with a spring's overshoot; never exactly 0, so the matrix stays invertible. */
export const pop = (t: number, delay: number, dur = 0.8) => {
  const k = clamp01((t - delay) / dur) - 1;
  return Math.max(0.001, 1 + 2.70158 * k ** 3 + 1.70158 * k ** 2);
};
/** A candle's live tick: two detuned sines, so neighbours never move in lockstep. */
export const tick = (t: number, i: number) => 0.6 * Math.sin(t * 1.3 + i * 1.7) + 0.4 * Math.sin(t * 2.9 + i * 0.6);
/** The bits of a GlowLine (drei's Line2) a scene animates: its material, and how many segments it draws. */
export type LineHandle = { material: { opacity: number; dashOffset: number }; geometry: { instanceCount: number; setPositions: (a: Float32Array) => unknown } };
/** Draws the first `k` (0–1) of a line of `segs` segments — a line drawing itself on. */
export const draw = (l: LineHandle | null, k: number, segs: number) => {
  if (l) l.geometry.instanceCount = Math.round(k * segs);
};

/** A page model turns a little toward the pointer (damped), so it answers the hand. */
export function Lean({ children, yaw = 0.22, pitch = 0.1 }: { children: ReactNode; yaw?: number; pitch?: number }) {
  const { still } = useStoryFrame();
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!g.current || still) return;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, s.pointer.x * yaw, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, -s.pointer.y * pitch, 3, dt);
  });
  return <group ref={g}>{children}</group>;
}

export const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
export const face = (x: number, y: number): [number, number, number, THREE.EulerOrder] => [-x, -y, 0, "YXZ"];
/** A vertical glass card facing the camera (GlassPlate lies flat by default). */
export function Card({ w, h, edge = 0.5, gold = false, opacity = 0.7, children }: { w: number; h: number; edge?: number; gold?: boolean; opacity?: number; children?: ReactNode }) {
  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <GlassPlate width={w} depth={h} thickness={0.03} radius={0.07} edge={gold ? 0.95 : edge} edgeColor={gold ? COLORS.gold : "#92A399"} tint={gold ? "#0E1F17" : "#06110C"} opacity={opacity} />
      </group>
      {children}
    </group>
  );
}
/** Text-like lines on a card (in the card's own x/y). */
export function Lines({ w, ys, goldAt = -1 }: { w: number; ys: number[]; goldAt?: number }) {
  return (
    <>
      {ys.map((y, i) => (
        <GlowLine key={i} points={[v(-w / 2, y, 0.03), v(i === goldAt ? w / 2 : w / 2 - 0.2, y, 0.03)]} color={i === goldAt ? COLORS.gold : "#2F4A3D"} intensity={i === goldAt ? 1.25 : 1} width={i === goldAt ? 1.8 : 1.1} />
      ))}
    </>
  );
}
export function Candle({ x, z = 0, o, c, h, l, s = 0.16 }: { x: number; z?: number; o: number; c: number; h: number; l: number; s?: number }) {
  const up = c >= o;
  const body = Math.max(0.04, Math.abs(c - o));
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (h + l) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, h - l, 6]} />
        <meshBasicMaterial color={hdr(up ? COLORS.up : COLORS.down, 0.9)} toneMapped={false} />
      </mesh>
      <mesh position={[0, (o + c) / 2, 0]}>
        <boxGeometry args={[s, body, s]} />
        <meshPhysicalMaterial color={up ? "#0E2A1B" : "#2A0E0E"} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={0.35} metalness={0.3} roughness={0.35} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}
