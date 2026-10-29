"use client";

import { ContactShadows, Environment, Float, Lightformer, RoundedBox, Sparkles } from "@react-three/drei";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import type { CapabilitySlug, IconTone } from "../../types";

/**
 * Real-time WebGL models for the capability "Supporting preview"
 * (three.js via @react-three/fiber). All geometry is procedural — no model
 * files — and schematic: shapes only, no prices, names or results (WA-T06).
 * Loaded on demand by Scene3D; the CSS scene stays as the fallback.
 */

const C = {
  gold: "#00E676",
  cyan: "#FF3B3B", // the bear red, paired with the bull green above (site theme)
  purple: "#92f9c6",
  red: "#FF3B3B",
  green: "#00E676",
  slate: "#3a4247",
  line: "#3a4247",
  panel: "#141a1c",
  bg: "#050809",
};
const TONE: Record<IconTone, string> = { gold: C.gold, cyan: C.cyan, purple: C.purple, red: C.red, green: C.green, slate: C.slate };

type Live = { still: boolean };

/* ------------------------------------------------------------------ timing */

// Every loop is 7s; reduced motion freezes the clock at a moment where all
// pieces have finished building.
const PERIOD = 7;
const FROZEN = 4;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const backOut = (x: number) => {
  const k = clamp01(x) - 1;
  return 1 + 2.4 * k * k * k + 1.4 * k * k;
};
const now = (s: RootState, still: boolean) => (still ? FROZEN : s.clock.elapsedTime);
/** Builds 0→1 from `start` over `grow` seconds, holds, and folds away before the loop restarts. */
function build(t: number, start: number, grow = 0.5, ease = easeOut) {
  const p = t % PERIOD;
  return ease((p - start) / grow) * (1 - easeOut((p - (PERIOD - 0.6)) / 0.45));
}

/* ------------------------------------------------------------------- stage */

export function Models3D({
  slug,
  tone,
  run,
  still,
  hover,
}: {
  slug: CapabilitySlug;
  tone: IconTone;
  run: boolean;
  still: boolean;
  hover: RefObject<boolean>;
}) {
  const Scene = SCENES[slug];
  const accent = TONE[tone];
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.35, 7.4], fov: 34 }}
      frameloop={run ? "always" : "demand"}
      // Transparent: the model sits directly on the page (no box), the page backdrop shows through.
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[C.bg, 10, 17]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[4, 7, 6]} angle={0.45} penumbra={1} intensity={110} color="#f2fff8" />
      <pointLight position={[-4, -1, 3]} intensity={22} color={accent} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -5]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color={accent} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        {/* bear-red rim from the environment (baked once — no per-material shader cost) */}
        <Lightformer form="rect" intensity={2} color={C.red} position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="ring" intensity={3} position={[2, 3, 6]} scale={2.5} />
      </Environment>

      <Rig hover={hover} still={still}>
        <Scene still={still} />
      </Rig>

      <Sparkles count={26} scale={[9, 4.5, 3]} size={2.2} speed={still ? 0 : 0.3} opacity={0.6} color={accent} />
      <Sparkles count={14} scale={[9, 4.5, 3]} size={2} speed={still ? 0 : 0.28} opacity={0.5} color={C.red} />
      <ContactShadows position={[0, -1.8, 0]} opacity={0.55} scale={14} blur={2.4} far={4} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.9} />
        <Vignette darkness={0.55} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/** Turns the whole scene toward the pointer while hovered; sways gently otherwise. */
function Rig({ hover, still, children }: { hover: RefObject<boolean>; still: boolean; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    if (!g.current) return;
    if (still) {
      g.current.rotation.set(0.08, -0.22, 0);
      return;
    }
    const t = s.clock.elapsedTime;
    const ry = hover.current ? s.pointer.x * 0.45 : Math.sin(t * 0.35) * 0.3;
    const rx = hover.current ? -s.pointer.y * 0.22 : 0.06 + Math.cos(t * 0.27) * 0.06;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, ry, 3, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, rx, 3, dt);
  });
  return <group ref={g}>{children}</group>;
}

function Bob({ still, children, speed = 1.4, float = 0.6, rotation = 0.2 }: Live & { children: ReactNode; speed?: number; float?: number; rotation?: number }) {
  if (still) return <>{children}</>;
  return (
    <Float speed={speed} floatIntensity={float} rotationIntensity={rotation}>
      {children}
    </Float>
  );
}

/* --------------------------------------------------------------- materials */

function PanelMat() {
  return <meshPhysicalMaterial color={C.panel} metalness={0.25} roughness={0.32} clearcoat={0.5} clearcoatRoughness={0.3} />;
}
function GlossMat({ color, glow = 0.25 }: { color: string; glow?: number }) {
  return <meshPhysicalMaterial color={color} emissive={color} emissiveIntensity={glow} metalness={0.2} roughness={0.22} clearcoat={1} />;
}
function GoldMat() {
  return <meshPhysicalMaterial color={C.gold} metalness={1} roughness={0.2} clearcoat={0.6} />;
}
function NeonMat({ color, intensity = 2.2 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />;
}

/* ------------------------------------------------------------ small pieces */

function Panel({ size, ...props }: { size: [number, number, number] } & ThreeGroupProps) {
  return (
    <group {...props}>
      <RoundedBox args={size} radius={0.08} smoothness={4}>
        <PanelMat />
      </RoundedBox>
    </group>
  );
}
type ThreeGroupProps = { position?: [number, number, number]; rotation?: [number, number, number] };

function TextLine({ w, ...props }: { w: number } & ThreeGroupProps) {
  return (
    <group {...props}>
      <RoundedBox args={[w, 0.06, 0.02]} radius={0.02} position={[w / 2, 0, 0]}>
        <meshStandardMaterial color={C.line} />
      </RoundedBox>
    </group>
  );
}

function Coin({ still, position, spin = 0.8 }: Live & { position: [number, number, number]; spin?: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current && !still) ref.current.rotation.y += dt * spin;
  });
  return (
    <Bob still={still} speed={1.8} float={1.2}>
      <group ref={ref} position={position} rotation={[0, 0.6, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.32, 0.32, 0.07, 64]} />
          <GoldMat />
        </mesh>
        {[0.04, -0.04].map((z) => (
          <mesh key={z} position={[0, 0, z]}>
            <torusGeometry args={[0.24, 0.016, 12, 64]} />
            <GoldMat />
          </mesh>
        ))}
      </group>
    </Bob>
  );
}

function useStarGeometry() {
  return useMemo(() => {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.45 : 1;
      const a = Math.PI / 2 + (i * Math.PI) / 5;
      if (i === 0) s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
      else s.lineTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 });
    g.center();
    return g;
  }, []);
}

/* ------------------------------------------------------------------ scenes */

const SCENES: Record<CapabilitySlug, (p: Live) => ReactNode> = {
  charts: ChartsScene,
  research: ResearchScene,
  alerts: AlertsScene,
  "trade-review": ReviewScene,
  community: CommunityScene,
};

const CANDLES = [0.32, 0.4, 0.36, 0.5, 0.44, 0.58, 0.52, 0.64, 0.6, 0.55, 0.68, 0.74, 0.7, 0.82, 0.9];
const CANDLE_X = (i: number) => -2.1 + (i * 4.2) / (CANDLES.length - 1);
const CANDLE_BASE = -1.07;

function ChartsScene({ still }: Live) {
  const bars = useRef<(THREE.Group | null)[]>([]);
  const trend = useRef<THREE.Mesh>(null);
  const star = useStarGeometry();
  const tube = useMemo(() => {
    const pts = CANDLES.map((h, i) => new THREE.Vector3(CANDLE_X(i), CANDLE_BASE + h * 2.2 * 0.58, 0.2));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 200, 0.032, 12, false);
  }, []);

  useFrame((s) => {
    const t = now(s, still);
    bars.current.forEach((b, i) => b?.scale.setY(Math.max(0.001, build(t, i * 0.07))));
    const g = trend.current?.geometry;
    if (g?.index) g.setDrawRange(0, Math.floor((g.index.count * build(t, 0.7, 1.6)) / 3) * 3);
  });

  return (
    <group position={[-0.55, 0, 0]}>
      <Panel size={[5.2, 3.1, 0.1]} position={[0, 0.3, -0.45]} />
      <RoundedBox args={[5.2, 0.14, 1.4]} radius={0.06} position={[0, -1.15, 0]}>
        <PanelMat />
      </RoundedBox>
      {CANDLES.map((h, i) => {
        const up = i === 0 || h >= CANDLES[i - 1];
        const H = h * 2.2;
        const color = up ? C.green : C.red;
        return (
          <group key={i} position={[CANDLE_X(i), CANDLE_BASE, 0]} ref={(el) => void (bars.current[i] = el)}>
            <RoundedBox args={[0.17, H * 0.6, 0.17]} radius={0.03} position={[0, H * 0.45, 0]}>
              <GlossMat color={color} />
            </RoundedBox>
            <mesh position={[0, H * 0.48, 0]}>
              <cylinderGeometry args={[0.012, 0.012, H * 0.92, 6]} />
              <meshStandardMaterial color={color} />
            </mesh>
          </group>
        );
      })}
      <mesh ref={trend} geometry={tube}>
        <NeonMat color={C.gold} />
      </mesh>

      <Bob still={still}>
        <group position={[3.15, 0.35, 0.9]} rotation={[0, -0.4, 0]}>
          <RoundedBox args={[1.5, 1.95, 0.09]} radius={0.08}>
            <meshPhysicalMaterial color="#272b29" metalness={0.1} roughness={0.12} transmission={0.35} thickness={0.6} clearcoat={1} />
          </RoundedBox>
          {[1, 0, 1, 1, 0].map((up, i) => (
            <group key={i} position={[0, 0.68 - i * 0.34, 0.07]}>
              <mesh position={[-0.52, 0, 0]}>
                <sphereGeometry args={[0.065, 24, 24]} />
                <NeonMat color={up ? C.green : C.red} intensity={1.2} />
              </mesh>
              <TextLine w={0.62} position={[-0.38, 0, 0]} />
              <mesh geometry={star} position={[0.5, 0, 0]} scale={0.085}>
                <GoldMat />
              </mesh>
            </group>
          ))}
        </group>
      </Bob>

      <Coin still={still} position={[-1.9, -1.2, 1.5]} />
      <Coin still={still} position={[2.75, -1.0, 1.2]} spin={-1.1} />
      <Coin still={still} position={[3.25, 1.75, 0.5]} spin={0.6} />
    </group>
  );
}

function ResearchScene({ still }: Live) {
  const lens = useRef<THREE.Group>(null);
  const progress = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = now(s, still);
    if (lens.current) lens.current.position.set(0.55 + Math.sin(t * 0.6) * 0.85, 0.1 + Math.cos(t * 0.9) * 0.55, 1.35);
    progress.current?.scale.setX(Math.max(0.001, build(t, 0.4, 1.4)));
  });

  const docs: { p: [number, number, number]; r: [number, number, number]; icon: string }[] = [
    { p: [-1.5, 0.15, -0.7], r: [0, 0.32, 0.07], icon: C.slate },
    { p: [-0.45, 0.05, -0.1], r: [0, 0.12, 0.02], icon: "#00A85A" },
    { p: [0.65, -0.05, 0.5], r: [0, -0.1, -0.05], icon: C.cyan },
  ];

  return (
    <group>
      {docs.map((d, i) => (
        <Bob key={i} still={still} speed={1.1} float={0.35} rotation={0.08}>
          <group position={d.p} rotation={d.r}>
            <RoundedBox args={[1.95, 2.55, 0.06]} radius={0.08}>
              <PanelMat />
            </RoundedBox>
            <RoundedBox args={[0.3, 0.3, 0.12]} radius={0.07} position={[-0.6, 0.95, 0.06]}>
              <GlossMat color={d.icon} glow={0.4} />
            </RoundedBox>
            <TextLine w={0.8} position={[-0.35, 0.95, 0.05]} />
            {[1.5, 1.3, 1.42, 0.9, 1.35, 1.1].map((w, j) => (
              <TextLine key={j} w={w} position={[-0.75, 0.5 - j * 0.24, 0.04]} />
            ))}
            {i === 2 && (
              <group ref={progress} position={[-0.75, -0.95, 0.05]}>
                <mesh position={[0.6, 0, 0]}>
                  <boxGeometry args={[1.2, 0.07, 0.03]} />
                  <NeonMat color={C.cyan} />
                </mesh>
              </group>
            )}
          </group>
        </Bob>
      ))}

      <group ref={lens} rotation={[0.1, -0.2, 0]}>
        <mesh>
          <torusGeometry args={[0.55, 0.07, 32, 96]} />
          <meshPhysicalMaterial color="#d9f7e8" metalness={1} roughness={0.15} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.53, 0.53, 0.05, 64]} />
          <meshPhysicalMaterial color="#e7fef2" transmission={1} roughness={0} thickness={0.5} ior={1.5} />
        </mesh>
        <group rotation={[0, 0, Math.PI / 4]}>
          <mesh position={[0, -1.0, 0]}>
            <cylinderGeometry args={[0.08, 0.09, 0.85, 32]} />
            <meshPhysicalMaterial color="#1b1f1d" metalness={0.4} roughness={0.35} clearcoat={1} />
          </mesh>
          <mesh position={[0, -0.6, 0]}>
            <cylinderGeometry args={[0.1, 0.1, 0.1, 32]} />
            <GoldMat />
          </mesh>
        </group>
      </group>
    </group>
  );
}

function useBellGeometry() {
  return useMemo(() => {
    const profile = [
      [0, 1.0],
      [0.14, 0.98],
      [0.24, 0.9],
      [0.31, 0.74],
      [0.35, 0.5],
      [0.4, 0.26],
      [0.5, 0.08],
      [0.62, -0.02],
      [0.64, -0.08],
      [0.58, -0.1],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(profile, 96);
  }, []);
}

function AlertsScene({ still }: Live) {
  const bell = useBellGeometry();
  const bellRef = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const hit = useRef<THREE.Mesh>(null);
  const line = useRef<THREE.Mesh>(null);
  const knob = useRef<THREE.Mesh>(null);
  const track = useRef<THREE.MeshPhysicalMaterial>(null);
  const off = useMemo(() => new THREE.Color("#3a4350"), []);
  const on = useMemo(() => new THREE.Color(C.green), []);
  const tube = useMemo(() => {
    const pts = [
      [-1.6, -0.8],
      [-0.9, -0.62],
      [-0.3, -0.35],
      [0.15, -0.05],
      [0.3, 0.1],
      [0.8, 0.45],
      [1.5, 0.62],
    ].map(([x, y]) => new THREE.Vector3(x, y, 0.08));
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.03, 12, false);
  }, []);

  useFrame((s) => {
    const t = now(s, still);
    const draw = build(t, 0.3, 1.8);
    const g = line.current?.geometry;
    if (g?.index) g.setDrawRange(0, Math.floor((g.index.count * draw) / 3) * 3);
    // The alert fires once the line has crossed the threshold.
    const fired = build(t, 1.4, 0.4, backOut);
    hit.current?.scale.setScalar(Math.max(0.001, fired));
    const p = t % PERIOD;
    const swing = p > 1.4 ? Math.sin((p - 1.4) * 11) * 0.35 * Math.exp(-(p - 1.4) * 1.3) : 0;
    if (bellRef.current) bellRef.current.rotation.z = still ? 0.12 : swing;
    rings.current.forEach((r, i) => {
      if (!r) return;
      const q = still ? 0.35 + i * 0.2 : ((t * 0.45 + i / 3) % 1);
      r.scale.setScalar(0.7 + q * 1.6);
      (r.material as THREE.MeshBasicMaterial).opacity = (1 - q) * 0.7;
    });
    const k = build(t, 1.6, 0.35);
    knob.current?.position.setX(-0.2 + k * 0.4);
    track.current?.color.lerpColors(off, on, k);
  });

  return (
    <group>
      <group position={[-1.4, 0.05, -0.35]} rotation={[0, 0.25, 0]}>
        <RoundedBox args={[3.6, 2.4, 0.08]} radius={0.08}>
          <PanelMat />
        </RoundedBox>
        {Array.from({ length: 16 }, (_, i) => (
          <mesh key={i} position={[-1.55 + i * 0.205, 0.1, 0.06]}>
            <boxGeometry args={[0.11, 0.025, 0.02]} />
            <NeonMat color={C.purple} intensity={0.9} />
          </mesh>
        ))}
        <mesh ref={line} geometry={tube}>
          <NeonMat color={C.gold} />
        </mesh>
        <mesh ref={hit} position={[0.3, 0.1, 0.1]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <NeonMat color={C.purple} intensity={4} />
        </mesh>
      </group>

      <group position={[1.75, 0.35, 0.6]}>
        {[0, 1, 2].map((i) => (
          <mesh key={i} ref={(el) => void (rings.current[i] = el)} position={[0, 0.35, -0.2]}>
            <torusGeometry args={[0.7, 0.012, 8, 96]} />
            <meshBasicMaterial color={C.purple} transparent toneMapped={false} />
          </mesh>
        ))}
        <Bob still={still} float={0.4} rotation={0.05}>
          <group ref={bellRef}>
            <group position={[0, -0.9, 0]}>
              <mesh geometry={bell} position={[0, 0.9, 0]}>
                <meshPhysicalMaterial color="#b1fbd6" metalness={0.9} roughness={0.18} clearcoat={1} side={THREE.DoubleSide} />
              </mesh>
            </group>
            <mesh position={[0, -0.12, 0]}>
              <sphereGeometry args={[0.12, 32, 32]} />
              <GoldMat />
            </mesh>
            <mesh position={[0, 1.05, 0]}>
              <torusGeometry args={[0.1, 0.03, 16, 48]} />
              <GoldMat />
            </mesh>
          </group>
        </Bob>
      </group>

      <Bob still={still} speed={1.6}>
        <group position={[1.9, -1.3, 1.1]} rotation={[0.2, -0.3, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <capsuleGeometry args={[0.2, 0.42, 12, 32]} />
            <meshPhysicalMaterial ref={track} color="#3a4350" roughness={0.25} clearcoat={1} />
          </mesh>
          <mesh ref={knob} position={[-0.2, 0, 0.08]}>
            <sphereGeometry args={[0.17, 32, 32]} />
            <meshPhysicalMaterial color="#ffffff" roughness={0.3} clearcoat={1} />
          </mesh>
        </group>
      </Bob>
    </group>
  );
}

const SHARES = [
  { share: 0.4, color: C.gold, depth: 0.5 },
  { share: 0.27, color: C.cyan, depth: 0.36 },
  { share: 0.19, color: C.red, depth: 0.28 },
  { share: 0.14, color: C.green, depth: 0.2 },
];
const SHARE_STARTS = SHARES.map((_, i) => SHARES.slice(0, i).reduce((sum, x) => sum + x.share, 0));

function ReviewScene({ still }: Live) {
  const segs = useRef<(THREE.Mesh | null)[]>([]);
  const donut = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Group | null)[]>([]);
  const rows = useRef<(THREE.Group | null)[]>([]);
  const geos = useMemo(() => {
    return SHARES.map(({ share, depth }, i) => {
      const a0 = SHARE_STARTS[i] * Math.PI * 2 + 0.03;
      const a1 = (SHARE_STARTS[i] + share) * Math.PI * 2 - 0.03;
      const s = new THREE.Shape();
      s.absarc(0, 0, 1.1, a0, a1, false);
      s.absarc(0, 0, 0.62, a1, a0, true);
      return new THREE.ExtrudeGeometry(s, { depth, curveSegments: 48, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 4 });
    });
  }, []);

  useFrame((s, dt) => {
    const t = now(s, still);
    segs.current.forEach((m, i) => m?.scale.setZ(Math.max(0.001, build(t, 0.3 + i * 0.2, 0.6, backOut))));
    if (donut.current && !still) donut.current.rotation.z += dt * 0.25;
    bars.current.forEach((b, i) => b?.scale.setY(Math.max(0.001, build(t, 0.8 + i * 0.1))));
    rows.current.forEach((r, i) => {
      if (!r) return;
      const k = build(t, 0.2 + i * 0.15, 0.4);
      r.position.x = (1 - k) * 0.4;
      r.scale.setScalar(Math.max(0.001, k));
    });
  });

  return (
    <group>
      <group position={[-1.75, 0.15, -0.3]} rotation={[0, 0.32, 0]}>
        <RoundedBox args={[2.4, 2.8, 0.08]} radius={0.08}>
          <PanelMat />
        </RoundedBox>
        <RoundedBox args={[0.32, 0.32, 0.12]} radius={0.07} position={[-0.8, 1.05, 0.06]}>
          <GlossMat color={C.red} glow={0.4} />
        </RoundedBox>
        <TextLine w={0.9} position={[-0.55, 1.05, 0.05]} />
        {[0, 1, 2, 3].map((i) => (
          <group key={i} ref={(el) => void (rows.current[i] = el)} position={[0, 0.45 - i * 0.48, 0.06]}>
            <RoundedBox args={[2.05, 0.36, 0.04]} radius={0.06}>
              <meshPhysicalMaterial color="#2a2f2c" roughness={0.3} clearcoat={1} />
            </RoundedBox>
            <mesh position={[-0.82, 0, 0.04]}>
              <sphereGeometry args={[0.07, 24, 24]} />
              <NeonMat color={i === 2 ? C.slate : C.green} intensity={i === 2 ? 0.3 : 1.2} />
            </mesh>
            <TextLine w={1.0} position={[-0.65, 0, 0.04]} />
            <TextLine w={0.3} position={[0.55, 0, 0.04]} />
          </group>
        ))}
      </group>

      <Bob still={still} float={0.5} rotation={0.1}>
        <group ref={donut} position={[1.55, 0.25, 0.3]} rotation={[-0.95, 0, 0]}>
          {geos.map((g, i) => (
            <mesh key={i} geometry={g} ref={(el) => void (segs.current[i] = el)}>
              <meshPhysicalMaterial color={SHARES[i].color} metalness={0.35} roughness={0.2} clearcoat={1} emissive={SHARES[i].color} emissiveIntensity={0.15} />
            </mesh>
          ))}
        </group>
      </Bob>

      <group position={[0.15, -1.6, 1.2]}>
        {[0.5, 0.8, 0.35, 1, 0.65].map((h, i) => (
          <group key={i} position={[i * 0.3, 0, 0]} ref={(el) => void (bars.current[i] = el)}>
            <RoundedBox args={[0.2, h * 0.9, 0.2]} radius={0.04} position={[0, (h * 0.9) / 2, 0]}>
              <GlossMat color={i === 2 ? C.red : C.green} glow={0.35} />
            </RoundedBox>
          </group>
        ))}
      </group>
    </group>
  );
}

const BUBBLES: { p: [number, number, number]; me: boolean; avatar?: string; w: number }[] = [
  { p: [0.0, 1.05, 0], me: false, avatar: C.cyan, w: 2.0 },
  { p: [1.2, 0.05, 0.5], me: true, w: 1.8 },
  { p: [0.1, -0.95, 0.9], me: false, avatar: C.gold, w: 2.2 },
];

function CommunityScene({ still }: Live) {
  const bubbles = useRef<(THREE.Group | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = now(s, still);
    bubbles.current.forEach((b, i) => b?.scale.setScalar(Math.max(0.001, build(t, 0.3 + i * 0.9, 0.5, backOut))));
    dots.current.forEach((d, i) => d?.position.setY(still ? 0 : Math.abs(Math.sin(t * 6 - i * 0.7)) * 0.1));
  });

  return (
    <group>
      <group position={[-2.55, 0.1, -0.5]} rotation={[0, 0.4, 0]}>
        <RoundedBox args={[1.5, 2.8, 0.08]} radius={0.08}>
          <PanelMat />
        </RoundedBox>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[0, 1.0 - i * 0.42, 0.05]}>
            {i === 1 && (
              <RoundedBox args={[1.3, 0.32, 0.02]} radius={0.06}>
                <meshStandardMaterial color={C.green} transparent opacity={0.25} />
              </RoundedBox>
            )}
            <mesh position={[-0.48, 0, 0.02]}>
              <octahedronGeometry args={[0.06]} />
              <meshStandardMaterial color={i === 1 ? C.green : C.slate} />
            </mesh>
            <TextLine w={0.5 + (i % 3) * 0.15} position={[-0.35, 0, 0.02]} />
          </group>
        ))}
      </group>

      {BUBBLES.map((b, i) => (
        <Bob key={i} still={still} speed={1.2} float={0.4} rotation={0.06}>
          <group position={b.p}>
            <group ref={(el) => void (bubbles.current[i] = el)}>
              <RoundedBox args={[b.w, 0.75, 0.22]} radius={0.18} smoothness={6}>
                {b.me ? <GlossMat color={C.green} glow={0.3} /> : <meshPhysicalMaterial color="#2d3230" roughness={0.2} clearcoat={1} />}
              </RoundedBox>
              <mesh position={[(b.me ? 1 : -1) * (b.w / 2 - 0.2), -0.42, 0]} rotation={[0, 0, Math.PI + (b.me ? 0.6 : -0.6)]}>
                <coneGeometry args={[0.12, 0.28, 24]} />
                {b.me ? <GlossMat color={C.green} glow={0.3} /> : <meshPhysicalMaterial color="#2d3230" roughness={0.2} clearcoat={1} />}
              </mesh>
              <TextLine w={b.w * 0.7} position={[-b.w * 0.38, 0.12, 0.12]} />
              <TextLine w={b.w * 0.42} position={[-b.w * 0.38, -0.1, 0.12]} />
              {b.avatar && (
                <group position={[-b.w / 2 - 0.45, -0.1, 0]}>
                  <mesh position={[0, 0.14, 0]}>
                    <sphereGeometry args={[0.17, 32, 32]} />
                    <meshPhysicalMaterial color={b.avatar} metalness={0.5} roughness={0.2} clearcoat={1} />
                  </mesh>
                  <mesh position={[0, -0.2, 0]}>
                    <sphereGeometry args={[0.26, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshPhysicalMaterial color={b.avatar} metalness={0.5} roughness={0.2} clearcoat={1} />
                  </mesh>
                </group>
              )}
            </group>
          </group>
        </Bob>
      ))}

      <group position={[2.6, -1.05, 1.0]}>
        <RoundedBox args={[0.75, 0.36, 0.14]} radius={0.16}>
          <meshPhysicalMaterial color="#2d3230" roughness={0.2} clearcoat={1} />
        </RoundedBox>
        {[0, 1, 2].map((i) => (
          <group key={i} position={[-0.18 + i * 0.18, 0, 0.13]}>
            <mesh ref={(el) => void (dots.current[i] = el)}>
              <sphereGeometry args={[0.05, 16, 16]} />
              <meshStandardMaterial color="#cbd0ce" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}
