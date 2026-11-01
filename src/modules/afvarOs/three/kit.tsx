"use client";

// The AFVAR material kit for every page that is not the home. The home shows
// the AI itself (<AiCore>); other pages show what the AI works on, built from
// the same light and materials so every page reads as one family:
//
//   <AiSpark />          the AI at work — the white-hot light from the core's centre
//   <GoldDust />         the drifting gold dust of every AFVAR scene
//   <GlassPlate />       smoked glass with a gold edge (rounded corners)
//   <GlowLine />         a crisp screen-space line (gold = the AI; green / red = up / down)
//
// Everything reads the damped progress and the clock through useStoryFrame(),
// so parts must live inside <CoreCanvas>.
import { Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ComponentProps } from "react";
import * as THREE from "three";
import { COLORS } from "../theme";
import { useStoryFrame } from "./stage";

type V3 = readonly [number, number, number];

/** HDR colour (toneMapped=false): values above 1 bloom. */
export function hdr(hex: string, k: number): THREE.Color {
  return new THREE.Color(hex).multiplyScalar(k);
}

/* ------------------------------------------------------------------ spark */

/**
 * The AI at work: the white-hot nucleus of the home core, alone, with a gold
 * halo. On the home it sits inside the core; everywhere else it moves through
 * the page's object doing the work.
 */
export function AiSpark({ position = [0, 0, 0], size = 0.075, glow = 1, light = true, ring = true }: { position?: V3; size?: number; glow?: number; light?: boolean; ring?: boolean }) {
  const { still } = useStoryFrame();
  const nucleus = useRef<THREE.MeshBasicMaterial>(null);
  const halo = useRef<THREE.Mesh>(null);
  const lamp = useRef<THREE.PointLight>(null);
  const white = useMemo(() => new THREE.Color("#FFF4DA"), []);
  useFrame((s) => {
    const t = still ? 0 : s.clock.elapsedTime;
    // the home core's heartbeat (1.15 Hz)
    const beat = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * 1.15);
    nucleus.current?.color.copy(white).multiplyScalar((2.2 + 0.8 * beat) * glow);
    halo.current?.scale.setScalar(1 + 0.14 * beat);
    if (lamp.current) lamp.current.intensity = (1.4 + 1 * beat) * glow;
  });
  return (
    <group position={position as [number, number, number]}>
      <mesh>
        <sphereGeometry args={[size, 24, 24]} />
        <meshBasicMaterial ref={nucleus} color="#FFF4DA" toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[size * 2.1, 24, 24]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.13} depthWrite={false} toneMapped={false} />
      </mesh>
      {ring ? (
        <mesh>
          <torusGeometry args={[size * 2.7, size * 0.07, 8, 64]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 1.1)} transparent opacity={0.6} toneMapped={false} />
        </mesh>
      ) : null}
      {light ? <pointLight ref={lamp} color={COLORS.gold} intensity={2} distance={2.6} decay={2} /> : null}
    </group>
  );
}

/* ------------------------------------------------------------------- dust */

const wrap = (v: number, span: number) => ((((v + span / 2) % span) + span) % span) - span / 2;

/** Drifting gold dust in a box (the home core's thought sparks, spread through a whole scene). */
export function GoldDust({
  count = 260,
  box = [10, 6, 6],
  center = [0, 0, 0],
  size = 0.026,
  opacity = 0.5,
  drift = [0.03, 0.015, 0],
  seed = 11,
}: {
  count?: number;
  box?: V3;
  center?: V3;
  size?: number;
  opacity?: number;
  /** Scene units per second, per axis (the dust wraps inside the box). */
  drift?: V3;
  seed?: number;
}) {
  const { still } = useStoryFrame();
  const points = useRef<THREE.Points>(null);
  const [base, geo] = useMemo(() => {
    let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const b = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      b[i * 3] = (rnd() - 0.5) * box[0];
      b[i * 3 + 1] = (rnd() - 0.5) * box[1];
      b[i * 3 + 2] = (rnd() - 0.5) * box[2];
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(b.slice(), 3));
    return [b, g] as const;
  }, [count, box, seed]);
  useFrame((s) => {
    const g = points.current?.geometry;
    if (!g || (still && g.userData.placed)) return;
    const t = still ? 0 : s.clock.elapsedTime;
    const a = g.attributes.position.array as Float32Array;
    for (let i = 0; i < count; i++) {
      a[i * 3] = wrap(base[i * 3] + drift[0] * t, box[0]);
      a[i * 3 + 1] = wrap(base[i * 3 + 1] + drift[1] * t, box[1]);
      a[i * 3 + 2] = wrap(base[i * 3 + 2] + drift[2] * t, box[2]);
    }
    g.attributes.position.needsUpdate = true;
    g.userData.placed = true;
  });
  return (
    <points ref={points} geometry={geo} position={center as [number, number, number]} frustumCulled={false}>
      <pointsMaterial color={COLORS.goldHot} size={size} sizeAttenuation transparent opacity={opacity} depthWrite={false} toneMapped={false} />
    </points>
  );
}

/* ------------------------------------------------------------- glass plate */

function roundedRect(w: number, d: number, r: number): THREE.Shape {
  const x = -w / 2;
  const y = -d / 2;
  const s = new THREE.Shape();
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r);
  s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d);
  s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/**
 * Smoked glass with a gold edge, lying flat (XZ plane, top face up at y = thickness / 2).
 * `edge` is the opacity of the gold rim; `tint` the glass body.
 */
export function GlassPlate({
  width,
  depth,
  thickness = 0.05,
  radius = 0.14,
  edge = 0.55,
  edgeColor = COLORS.gold,
  tint = "#0A0D0F",
  opacity = 0.55,
  dashed = false,
}: {
  width: number;
  depth: number;
  thickness?: number;
  radius?: number;
  edge?: number;
  edgeColor?: string;
  tint?: string;
  opacity?: number;
  /** Outline only (no glass body), dashed — a layer that is "there" but light. */
  dashed?: boolean;
}) {
  const [body, outline] = useMemo(() => {
    const shape = roundedRect(width, depth, radius);
    const g = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 6 });
    // extruded along +z: lay it flat with the top face up
    g.rotateX(-Math.PI / 2);
    g.translate(0, -thickness / 2, 0);
    const pts = shape.getPoints(10).map((p) => new THREE.Vector3(p.x, thickness / 2 + 0.014, -p.y));
    pts.push(pts[0].clone());
    return [g, pts] as const;
  }, [width, depth, thickness, radius]);
  return (
    <group>
      {dashed ? null : (
        <mesh geometry={body} renderOrder={-1}>
          <meshPhysicalMaterial color={tint} metalness={0.4} roughness={0.62} transparent opacity={opacity} depthWrite={false} envMapIntensity={0.3} />
        </mesh>
      )}
      <Line points={outline} color={hdr(edgeColor, 1.05)} lineWidth={dashed ? 1 : 1.25} transparent opacity={edge} toneMapped={false} dashed={dashed} dashSize={0.08} gapSize={0.06} />
    </group>
  );
}

/* -------------------------------------------------------------- glow line */

/** A crisp screen-space line in an HDR colour (gold = the AI; green / red = up / down). */
export function GlowLine({ points, color = COLORS.gold, intensity = 1.2, width = 1.4, opacity = 1, ...rest }: { points: THREE.Vector3[] | V3[]; color?: string; intensity?: number; width?: number; opacity?: number } & Omit<ComponentProps<typeof Line>, "points" | "color" | "lineWidth">) {
  const c = useMemo(() => hdr(color, intensity), [color, intensity]);
  return <Line points={points as THREE.Vector3[]} color={c} lineWidth={width} transparent opacity={opacity} toneMapped={false} {...rest} />;
}
