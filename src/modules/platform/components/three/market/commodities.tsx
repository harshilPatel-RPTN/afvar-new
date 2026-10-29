"use client";

/** Commodities model: a gold bar pyramid, a silver stack and an oil drum dripping into a rippling pool. */
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { clamp01, easeOut, GOLD, Halo, Live, Metal, SILVER, Stamp, useIngotGeometry, useLocalClock } from "./parts";

/* -------------------------------------------------------------- commodities */

/* Bars: footprint at scale 0.6 is ≈1.01 × 0.29 (with bevel), so rows step 0.32 and columns 1.06. */
const ROW = 0.32;
const COL = 1.06;
/** [x, y, z, start time]. Each upper bar starts only after the bars beneath it have fully settled. */
const GOLD_BARS: Array<[number, number, number, number]> = [
  [-COL, 0, 0, 0.15],
  [0, 0, 0, 0.35],
  [COL, 0, 0, 0.55],
  [-COL / 2, ROW, 0, 1.15],
  [COL / 2, ROW, 0, 1.35],
  [0, ROW * 2, 0, 1.95],
];
const SILVER_BARS: Array<[number, number, number, number]> = [
  [-COL / 2, 0, 0, 0.75],
  [COL / 2, 0, 0, 0.95],
  [0, ROW, 0, 1.6],
];
const FALL = 0.5;
const SETTLE = 0.34;
const DROP_HEIGHT = 2.4;

/** Height above rest: gravity fall, then two decaying hops. Never below rest, so bars never interpenetrate. */
function barLift(t: number, start: number) {
  const u = (t - start) / FALL;
  if (u < 1) return DROP_HEIGHT * (1 - u * u);
  const v = clamp01((t - start - FALL) / SETTLE);
  return 0.07 * Math.abs(Math.sin(v * Math.PI * 2)) * (1 - v) * (1 - v);
}

function Bars({ time, bars, color = GOLD, stamp = true }: { time: RefObject<number>; bars: Array<[number, number, number, number]>; color?: string; stamp?: boolean }) {
  const ingot = useIngotGeometry();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    const t = time.current;
    group.current?.children.forEach((child, i) => {
      const [, y, , start] = bars[i];
      child.visible = t > start;
      child.position.y = y + barLift(t, start);
    });
  });
  return (
    <group ref={group}>
      {bars.map(([x, y, z]) => (
        <group key={`${x}:${y}`} position={[x, y, z]}>
          <group scale={0.6}>
            <mesh geometry={ingot}>
              <meshPhysicalMaterial color={color} metalness={1} roughness={0.3} envMapIntensity={0.8} />
            </mesh>
            {stamp && <Stamp />}
          </group>
        </group>
      ))}
    </group>
  );
}

/* Oil: a lacquered drum with a gold tap; every cycle a droplet swells at the nozzle, falls and rings the pool. */
const DRUM_R = 0.42;
const DRUM_H = 1.22;
const TAP_Z = DRUM_R + 0.36;
const NOZZLE_Y = 0.42;
const OIL_START = 2.8;
const CYCLE = 3.2;
const SWELL = 1.5;
const GRAVITY = 6;
const POOL = 0.4;
const RIPPLE_MAX = 0.34;
const IMPACT = SWELL + Math.sqrt((2 * (NOZZLE_Y - 0.06)) / GRAVITY);

const OIL_BLACK = { color: "#0b0d12", metalness: 0.2, roughness: 0.12, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 0.8 } as const;

/** Drum shell: straight walls, bevelled chimes and a recessed top. */
function useDrumGeometry() {
  return useMemo(() => {
    const c = 0.025;
    const p = [
      [0, 0],
      [DRUM_R - c, 0],
      [DRUM_R, c],
      [DRUM_R, DRUM_H - c],
      [DRUM_R - c, DRUM_H],
      [DRUM_R - 0.05, DRUM_H],
      [DRUM_R - 0.05, DRUM_H - c],
      [0, DRUM_H - c],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(p, 96);
  }, []);
}

function Ripple({ time, delay }: { time: RefObject<number>; delay: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (!ref.current) return;
    const t = time.current - OIL_START;
    const age = (((t - IMPACT - delay) % CYCLE) + CYCLE) % CYCLE;
    const k = clamp01(age / 1.7);
    ref.current.visible = t > IMPACT + delay && k < 1;
    ref.current.scale.setScalar(0.04 + easeOut(k) * (RIPPLE_MAX - 0.04));
    (ref.current.material as THREE.MeshStandardMaterial).opacity = Math.pow(1 - k, 1.5) * 0.95;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} visible={false}>
      <torusGeometry args={[1, 0.022, 8, 96]} />
      <meshStandardMaterial color={GOLD} emissive={GOLD} emissiveIntensity={1.5} transparent depthWrite={false} toneMapped={false} />
    </mesh>
  );
}

function Oil({ time }: { time: RefObject<number> }) {
  const shell = useDrumGeometry();
  const drum = useRef<THREE.Group>(null);
  const droplet = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const t = time.current;
    if (drum.current) {
      const k = easeOut((t - 1.9) / 0.8);
      drum.current.scale.setScalar(Math.max(0.001, k));
    }
    if (!droplet.current) return;
    const local = t - OIL_START;
    if (local < 0) {
      droplet.current.visible = false;
      return;
    }
    const p = local % CYCLE;
    if (p < SWELL) {
      const s = easeOut(p / SWELL);
      droplet.current.visible = true;
      droplet.current.scale.set(s, s * (1 + 0.35 * s), s);
      droplet.current.position.y = NOZZLE_Y - 0.03 - 0.03 * s;
    } else {
      const f = p - SWELL;
      const y = NOZZLE_Y - 0.06 - 0.5 * GRAVITY * f * f;
      droplet.current.visible = y > 0.03;
      droplet.current.scale.set(0.85, 1.4, 0.85);
      droplet.current.position.y = y;
    }
  });

  return (
    <group>
      <group position={[0, 0, TAP_Z]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 0]}>
          <circleGeometry args={[POOL, 96]} />
          <meshStandardMaterial color="#08090c" metalness={0.9} roughness={0.32} envMapIntensity={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.007, 0]}>
          <torusGeometry args={[POOL, 0.007, 8, 128]} />
          <meshStandardMaterial color="#c07a2c" emissive="#c07a2c" emissiveIntensity={0.7} toneMapped={false} />
        </mesh>
        <Ripple time={time} delay={0} />
        <Ripple time={time} delay={0.4} />
        <mesh ref={droplet} visible={false}>
          <sphereGeometry args={[0.04, 24, 16]} />
          <meshPhysicalMaterial {...OIL_BLACK} emissive="#5a3510" emissiveIntensity={0.35} />
        </mesh>
      </group>
      <group ref={drum} scale={0.001}>
        <mesh geometry={shell}>
          <meshPhysicalMaterial color="#1c201e" metalness={0.55} roughness={0.24} clearcoat={1} clearcoatRoughness={0.08} envMapIntensity={0.85} />
        </mesh>
        {/* rolled ribs and chimes in gold */}
        {[0.035, DRUM_H * 0.36, DRUM_H * 0.64, DRUM_H - 0.035].map((y) => (
          <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[DRUM_R + 0.004, 0.018, 12, 96]} />
            <Metal roughness={0.28} />
          </mesh>
        ))}
        {/* lid and bung */}
        <mesh position={[0, DRUM_H - 0.02, 0]}>
          <cylinderGeometry args={[DRUM_R - 0.05, DRUM_R - 0.05, 0.012, 64]} />
          <meshPhysicalMaterial color="#161817" metalness={0.6} roughness={0.3} clearcoat={0.6} envMapIntensity={0.7} />
        </mesh>
        <mesh position={[0.2, DRUM_H + 0.01, -0.08]}>
          <cylinderGeometry args={[0.055, 0.06, 0.05, 32]} />
          <Metal roughness={0.26} />
        </mesh>
        {/* tap: a gold spout out of the front wall turning down into a nozzle */}
        <mesh position={[0, NOZZLE_Y + 0.1, DRUM_R + 0.18]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.38, 24]} />
          <Metal roughness={0.26} />
        </mesh>
        <mesh position={[0, NOZZLE_Y + 0.1, DRUM_R + 0.01]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.03, 32]} />
          <Metal roughness={0.26} />
        </mesh>
        <mesh position={[0, NOZZLE_Y + 0.05, TAP_Z]}>
          <cylinderGeometry args={[0.03, 0.024, 0.14, 24]} />
          <Metal roughness={0.26} />
        </mesh>
        <mesh position={[0, NOZZLE_Y + 0.1, TAP_Z]}>
          <sphereGeometry args={[0.036, 24, 16]} />
          <Metal roughness={0.26} />
        </mesh>
      </group>
    </group>
  );
}

/** A warm light that sweeps across the face of the gold every few seconds. */
function Glint({ time }: { time: RefObject<number> }) {
  const light = useRef<THREE.PointLight>(null);
  useFrame(() => {
    if (!light.current) return;
    const p = ((time.current - 2.4) % 5.2) / 1.6;
    const on = time.current > 2.4 && p < 1;
    const u = on ? 0.5 - 0.5 * Math.cos(Math.PI * p) : 0;
    light.current.position.x = -1.9 + u * 3.8;
    light.current.intensity = on ? Math.sin(Math.PI * p) * 7 : 0;
  });
  return <pointLight ref={light} position={[-1.9, 0.75, 0.85]} color="#ffe2a8" distance={2.6} decay={2} intensity={0} />;
}

export function CommoditiesScene({ still }: Live) {
  const time = useLocalClock(still);

  return (
    <group position={[0, -1.05, 0]} scale={0.94}>
      <group scale={[1, 1, 0.5]}>
        <Halo radius={3.95} color={GOLD} intensity={1.1} />
      </group>
      <group position={[-2.03, 0.16, 0]}>
        <Bars time={time} bars={GOLD_BARS} />
        <Glint time={time} />
      </group>
      <group position={[1.03, 0.16, 0]}>
        <Bars time={time} bars={SILVER_BARS} color={SILVER} stamp={false} />
      </group>
      <group position={[3.05, 0, -0.35]}>
        <Oil time={time} />
      </group>
    </group>
  );
}
