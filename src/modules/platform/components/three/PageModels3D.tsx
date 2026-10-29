"use client";

import { ContactShadows, Environment, Float, Lightformer, RoundedBox, Sparkles, Trail, useCursor } from "@react-three/drei";
import { Canvas, useFrame, type RootState } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";

/**
 * WebGL models for the W4/W6/W7 public pages, following the platform module's
 * Models3D conventions (procedural geometry, 7s build loop, Rig pointer-sway,
 * frozen clock under reduced motion). Every scene is hover-interactive: parts
 * light up and lift under the cursor (drei pointer events + useCursor).
 *   podium — pricing: plan steps on a bull/bear ring, green and red coins, floating candles
 *   signal — about: the AFVAR mark, a green and a red orbit, comet nodes with trails
 *   beacon — contact: green beacon, red halo, rising pulses, green and red paper planes
 *   library — resources: an open guidebook, a flipping page, a scanning lens
 *   pathway — product guides: a marker climbing a path of step tiles to a flag
 */

export type PageModelKind = "podium" | "signal" | "beacon" | "markets" | "commodities" | "forex" | "crypto" | "briefs" | "library" | "pathway";

const C = {
  gold: "#ecc574",
  cyan: "#5df6aa",
  purple: "#92f9c6",
  green: "#00E676",
  red: "#FF3B3B",
  panel: "#141a1c",
  line: "#3a4247",
  bg: "#0f1010",
};
const ACCENT: Record<PageModelKind, string> = {
  podium: C.green,
  signal: C.green,
  beacon: C.green,
  markets: C.green,
  commodities: C.green,
  forex: C.green,
  crypto: C.green,
  briefs: C.green,
  library: C.green,
  pathway: C.green,
};
/** Models in the site's green / red theme: neutral black stage, white key, a red rim against the green. */
const MARKET: Partial<Record<PageModelKind, true>> = { podium: true, signal: true, beacon: true, library: true, pathway: true, markets: true, commodities: true, forex: true, crypto: true, briefs: true };
const MARKET_BG = "#050809";

type Live = { still: boolean };

const PERIOD = 7;
const FROZEN = 4;
const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);
const now = (s: RootState, still: boolean) => (still ? FROZEN : s.clock.elapsedTime);
function build(t: number, start: number, grow = 0.5) {
  const p = t % PERIOD;
  return easeOut((p - start) / grow) * (1 - easeOut((p - (PERIOD - 0.6)) / 0.45));
}

/* ------------------------------------------------------------------- stage */

export function PageModels3D({ kind, run, still, hover }: { kind: PageModelKind; run: boolean; still: boolean; hover: RefObject<boolean> }) {
  const accent = ACCENT[kind];
  const market = MARKET[kind] === true;
  const bg = market ? MARKET_BG : C.bg;
  const Scene = SCENES[kind];
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ position: [0, 0.35, 7.4], fov: 34 }}
      frameloop={run ? "always" : "demand"}
      // Transparent: the model sits directly on the page (no box), the page backdrop shows through.
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[bg, 10, 17]} />
      <ambientLight intensity={0.3} />
      <spotLight position={[4, 7, 6]} angle={0.45} penumbra={1} intensity={110} color={market ? "#f2fff8" : "#fff1d0"} />
      <pointLight position={[-4, -1, 3]} intensity={22} color={accent} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={2.4} position={[0, 5, -5]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={1.6} color={accent} position={[-6, 1, 0]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={market ? 2 : 1.2} color={market ? C.red : undefined} position={[6, 0, 1]} rotation-y={-Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="ring" intensity={3} position={[2, 3, 6]} scale={2.5} />
      </Environment>

      <Rig hover={hover} still={still}>
        <Scene still={still} />
      </Rig>

      <Sparkles count={market ? 28 : 40} scale={[9, 4.5, 3]} size={2.4} speed={still ? 0 : 0.4} opacity={0.6} color={accent} />
      {market && <Sparkles count={16} scale={[9, 4.5, 3]} size={2.2} speed={still ? 0 : 0.35} opacity={0.5} color={C.red} />}
      <ContactShadows position={[0, -1.8, 0]} opacity={0.55} scale={14} blur={2.4} far={4} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.95} />
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
    const ry = hover.current ? s.pointer.x * 0.7 : Math.sin(t * 0.35) * 0.32;
    const rx = hover.current ? -s.pointer.y * 0.34 : 0.06 + Math.cos(t * 0.27) * 0.07;
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, ry, 3.4, dt);
    g.current.rotation.x = THREE.MathUtils.damp(g.current.rotation.x, rx, 3.4, dt);
    g.current.position.y = Math.sin(t * 0.5) * 0.05;
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

function PanelMat({ glowRef, glow = C.gold, color = C.panel }: { glowRef?: RefObject<THREE.MeshPhysicalMaterial | null>; glow?: string; color?: string }) {
  return <meshPhysicalMaterial ref={glowRef} color={color} emissive={glow} emissiveIntensity={0} metalness={0.25} roughness={0.32} clearcoat={0.5} clearcoatRoughness={0.3} />;
}
function GlossMat({ color, glow = 0.25, matRef }: { color: string; glow?: number; matRef?: RefObject<THREE.MeshPhysicalMaterial | null> }) {
  return <meshPhysicalMaterial ref={matRef} color={color} emissive={color} emissiveIntensity={glow} metalness={0.2} roughness={0.22} clearcoat={1} />;
}
function GoldMat() {
  return <meshPhysicalMaterial color={C.gold} metalness={1} roughness={0.2} clearcoat={0.6} />;
}
function NeonMat({ color, intensity = 2.2 }: { color: string; intensity?: number }) {
  return <meshStandardMaterial color={color} emissive={color} emissiveIntensity={intensity} toneMapped={false} />;
}

/**
 * Invisible, static pointer target. Parts that lift or slide on hover must not
 * be their own hover target: they move out from under the cursor, un-hover,
 * drop back and re-hover forever (visible flicker at the edges).
 */
function HitBox({ args, position, rotation, onHot }: { args: [number, number, number]; position: [number, number, number]; rotation?: [number, number, number]; onHot: (hot: boolean) => void }) {
  return (
    <mesh
      position={position}
      rotation={rotation}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHot(true);
      }}
      onPointerOut={() => onHot(false)}
    >
      <boxGeometry args={args} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** Spinning coin; grows and spins faster under the cursor. Gold (markets) or green / red glass with a candle emblem. */
function Coin({ still, position, scale = 1, spin = 0.8, tone = "gold" }: Live & { position: [number, number, number]; scale?: number; spin?: number; tone?: "gold" | "green" | "red" }) {
  const ref = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((_, dt) => {
    if (!ref.current) return;
    if (!still) ref.current.rotation.y += dt * spin * (hot ? 3 : 1);
    const target = scale * (hot ? 1.22 : 1);
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, target, 8, dt));
  });
  const color = tone === "red" ? C.red : C.green;
  return (
    <Bob still={still} speed={1.8} float={1.2}>
      <group ref={ref} position={position} scale={scale} rotation={[0, 0.6, 0]} onPointerOver={() => setHot(true)} onPointerOut={() => setHot(false)}>
        {tone === "gold" ? (
          <>
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
          </>
        ) : (
          <>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.32, 0.32, 0.07, 64]} />
              <meshPhysicalMaterial color="#0b1210" emissive={color} emissiveIntensity={0.35} metalness={0.4} roughness={0.15} clearcoat={1} />
            </mesh>
            <mesh>
              <torusGeometry args={[0.32, 0.02, 12, 72]} />
              <NeonMat color={color} intensity={2.4} />
            </mesh>
            {/* candle emblem on both faces */}
            {[0.04, -0.04].map((z) => (
              <group key={z} position={[0, 0, z]}>
                <mesh>
                  <boxGeometry args={[0.07, 0.24, 0.012]} />
                  <NeonMat color={color} intensity={2.8} />
                </mesh>
                <mesh>
                  <boxGeometry args={[0.014, 0.38, 0.012]} />
                  <NeonMat color={color} intensity={2.2} />
                </mesh>
              </group>
            ))}
          </>
        )}
      </group>
    </Bob>
  );
}

/** A small floating candlestick, bobbing on its own beat. */
function FloatCandle({ still, position, up, h }: Live & { position: [number, number, number]; up: boolean; h: number }) {
  const ref = useRef<THREE.Group>(null);
  const seed = position[0] * 1.7 + position[2];
  useFrame((s) => {
    const t = now(s, still);
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(t * 1.1 + seed) * 0.12;
      ref.current.rotation.y = Math.sin(t * 0.6 + seed) * 0.5;
    }
  });
  const color = up ? C.green : C.red;
  return (
    <group ref={ref} position={position}>
      <mesh>
        <boxGeometry args={[0.13, h, 0.13]} />
        <NeonMat color={color} intensity={1.6} />
      </mesh>
      <mesh>
        <boxGeometry args={[0.02, h + 0.22, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
    </group>
  );
}

/** Half a ring, for the bull (green) / bear (red) floor arcs. */
function HalfRing({ radius, color, flip = false, intensity = 1.7 }: { radius: number; color: string; flip?: boolean; intensity?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, flip ? Math.PI : 0]} position={[0, 0.02, 0]}>
      <torusGeometry args={[radius, 0.018, 8, 96, Math.PI]} />
      <NeonMat color={color} intensity={intensity} />
    </mesh>
  );
}

/* --------------------------------------------------- podium (W4 · pricing) */

const STEPS: Array<{ x: number; h: number; tone: "bull" | "core" | "bear" }> = [
  { x: -1.9, h: 0.9, tone: "bull" },
  { x: 0, h: 2, tone: "core" },
  { x: 1.9, h: 1.4, tone: "bear" },
];

/** One plan step: builds in, glows its colour when hovered (the hover box never moves). */
function Step({ step, still }: Live & { step: (typeof STEPS)[number] }) {
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const mat2 = useRef<THREE.MeshPhysicalMaterial>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    const base = step.tone === "core" ? 0.32 + Math.sin(t * 1.6) * 0.12 : 0.06;
    for (const m of [mat.current, mat2.current]) if (m) m.emissiveIntensity = THREE.MathUtils.damp(m.emissiveIntensity, hot ? base + 0.5 : base, 6, dt);
  });
  return (
    <group>
      {step.tone === "core" ? (
        <>
          <RoundedBox args={[0.75, step.h, 1.1]} radius={0.09} smoothness={4} position={[-0.375, step.h / 2, 0]}>
            <GlossMat color={C.green} glow={0.32} matRef={mat} />
          </RoundedBox>
          <RoundedBox args={[0.75, step.h, 1.1]} radius={0.09} smoothness={4} position={[0.375, step.h / 2, 0]}>
            <GlossMat color={C.red} glow={0.32} matRef={mat2} />
          </RoundedBox>
        </>
      ) : (
        <RoundedBox args={[1.5, step.h, 1.1]} radius={0.09} smoothness={4} position={[0, step.h / 2, 0]}>
          <PanelMat glowRef={mat} glow={step.tone === "bull" ? C.green : C.red} color="#161817" />
        </RoundedBox>
      )}
      {/* lit top edge in the step's colour */}
      {step.tone !== "core" && (
        <mesh position={[0, step.h + 0.005, 0.52]}>
          <boxGeometry args={[1.32, 0.02, 0.02]} />
          <NeonMat color={step.tone === "bull" ? C.green : C.red} intensity={2.2} />
        </mesh>
      )}
      <HitBox args={[1.6, step.h + 0.2, 1.2]} position={[0, (step.h + 0.2) / 2, 0]} onHot={setHot} />
    </group>
  );
}

function PodiumScene({ still }: Live) {
  const grow = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const rings = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    const t = now(s, still);
    grow.current?.children.forEach((child, index) => {
      const k = build(t, 0.3 + index * 0.35, 0.8);
      child.scale.setY(Math.max(0.001, k));
    });
    if (orbit.current && !still) orbit.current.rotation.y += dt * 0.45;
    if (rings.current) {
      const pulse = 1 + Math.sin(t * 2.1) * 0.025;
      rings.current.scale.setScalar(pulse);
      if (!still) rings.current.rotation.y += dt * 0.12;
    }
  });
  return (
    <group position={[0, -1.6, 0]}>
      <group ref={grow}>
        {STEPS.map((step) => (
          <group key={step.x} position={[step.x, 0, 0]}>
            <Step step={step} still={still} />
          </group>
        ))}
      </group>
      <Coin still={still} position={[0, 2.85, 0]} scale={1.55} tone="green" />
      <Coin still={still} position={[-1.9, 1.55, 0.2]} scale={0.8} spin={-0.6} tone="green" />
      <Coin still={still} position={[1.95, 2.05, -0.1]} scale={1} spin={0.5} tone="red" />
      {[
        { p: [-2.9, 1.9, -0.6] as [number, number, number], up: true, h: 0.42 },
        { p: [-1.1, 3.4, -0.8] as [number, number, number], up: true, h: 0.3 },
        { p: [1.1, 3.6, -0.7] as [number, number, number], up: false, h: 0.34 },
        { p: [2.9, 2.9, -0.5] as [number, number, number], up: false, h: 0.46 },
        { p: [3.3, 1.2, 0.4] as [number, number, number], up: true, h: 0.26 },
      ].map((c) => (
        <FloatCandle key={c.p.join()} still={still} position={c.p} up={c.up} h={c.h} />
      ))}
      {/* small change orbiting the core plan, alternating bull and bear */}
      <group ref={orbit} position={[0, 1.15, 0]}>
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i / 8) * Math.PI * 2;
          return (
            <mesh key={i} position={[Math.cos(a) * 2.75, Math.sin(a * 3) * 0.12, Math.sin(a) * 2.75]} rotation={[Math.PI / 2, 0, a]}>
              <cylinderGeometry args={[0.1, 0.1, 0.03, 32]} />
              <NeonMat color={i % 2 ? C.red : C.green} intensity={1.6} />
            </mesh>
          );
        })}
      </group>
      {/* the floor ring: bull half, bear half */}
      <group ref={rings}>
        <HalfRing radius={3.1} color={C.green} />
        <HalfRing radius={3.1} color={C.red} flip />
        <HalfRing radius={2.75} color={C.red} intensity={0.9} />
        <HalfRing radius={2.75} color={C.green} flip intensity={0.9} />
      </group>
    </group>
  );
}

/* ----------------------------------------------------- signal (W6 · about) */

/** One bar of the mark: glow sweeps up the trio; hovering lifts and lights it. */
function Bar({ index, height, still }: Live & { index: number; height: number }) {
  const group = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    if (group.current) {
      group.current.scale.setY(Math.max(0.001, build(t, 0.3 + index * 0.3, 0.7)));
      group.current.position.y = THREE.MathUtils.damp(group.current.position.y, hot ? 0.18 : 0, 6, dt);
    }
    if (mat.current) {
      const sweep = Math.max(0, Math.sin(t * 1.4 - index * 0.9)) ** 3 * 0.5;
      const base = index === 2 ? 0.35 : 0.0;
      mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, base + sweep + (hot ? 0.5 : 0), 6, dt);
    }
  });
  const glow = index === 0 ? C.red : C.green;
  return (
    <>
      <group ref={group}>
        <RoundedBox args={[0.8, height, 0.8]} radius={0.22} smoothness={4} position={[(index - 1) * 1.35, height / 2, 0]}>
          {index === 2 ? <GlossMat color={C.green} glow={0.35} matRef={mat} /> : <PanelMat glowRef={mat} glow={glow} color="#161817" />}
        </RoundedBox>
      </group>
      {/* Hover target stays put while the bar lifts, so the cursor never slips off its edge and flickers. */}
      <HitBox args={[0.9, height + 0.3, 0.9]} position={[(index - 1) * 1.35, (height + 0.3) / 2, 0]} onHot={setHot} />
    </>
  );
}

function OrbitNode({ still, radius, speed, phase, color, size }: Live & { radius: number; speed: number; phase: number; color: string; size: number }) {
  const node = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = now(s, still);
    const a = phase + t * speed;
    node.current?.position.set(Math.cos(a) * radius, Math.sin(a * 1.7) * 0.5, Math.sin(a) * radius * 0.48);
  });
  return (
    <group ref={node}>
      <Trail width={0.5} length={5} decay={1.6} color={color} attenuation={(w) => w * w}>
        <mesh>
          <sphereGeometry args={[size, 24, 24]} />
          <NeonMat color={color} intensity={2.8} />
        </mesh>
      </Trail>
    </group>
  );
}

function SignalScene({ still }: Live) {
  const heights = [1.1, 1.9, 2.8];
  return (
    <group position={[0, -1.5, 0]}>
      {heights.map((h, index) => (
        <Bar key={h} index={index} height={h} still={still} />
      ))}
      {/* twin orbits: a bull and a bear comet tracing crossed rings around the mark */}
      <group position={[0, 1.4, 0]} rotation={[0.5, 0, -0.25]}>
        <mesh>
          <torusGeometry args={[2.95, 0.014, 8, 128]} />
          <NeonMat color={C.green} intensity={1.4} />
        </mesh>
        <OrbitNode still={still} radius={2.95} speed={0.9} phase={1.1} color={C.green} size={0.14} />
      </group>
      <group position={[0, 1.7, 0]} rotation={[-0.42, 0.3, 0.3]}>
        <mesh>
          <torusGeometry args={[2.45, 0.012, 8, 128]} />
          <NeonMat color={C.red} intensity={1.3} />
        </mesh>
        <OrbitNode still={still} radius={2.45} speed={-0.65} phase={3.6} color={C.red} size={0.12} />
      </group>
      <HalfRing radius={2.4} color={C.green} intensity={1.2} />
      <HalfRing radius={2.4} color={C.red} flip intensity={1.2} />
    </group>
  );
}

/* ---------------------------------------------------- beacon (W7 · contact) */

/** Broadcast pulse: a small halo that rises off the lamp while expanding and fading. */
function Pulse({ still, delay, fast }: Live & { delay: number; fast: RefObject<boolean> }) {
  const ref = useRef<THREE.Mesh>(null);
  const phase = useRef(delay);
  useFrame((_, dt) => {
    if (!still) phase.current += dt * (fast.current ? 1.8 : 1);
    const k = (phase.current % 3) / 3;
    if (ref.current) {
      ref.current.position.y = 2.6 + k * 1.3;
      ref.current.scale.setScalar(0.35 + k * 1.5);
      (ref.current.material as THREE.MeshStandardMaterial).opacity = (1 - k) * 0.55;
    }
  });
  const color = delay === 1 ? C.red : C.green;
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[1, 0.025, 8, 96]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} transparent toneMapped={false} />
    </mesh>
  );
}

/** Folded paper plane flying nose-forward with a banked turn and a vapor trail. */
function PaperPlane({ still, radius, speed, phase, y, tone = "white" }: Live & { radius: number; speed: number; phase: number; y: number; tone?: "white" | "green" | "red" }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = now(s, still);
    const a = phase + t * speed;
    if (ref.current) {
      ref.current.position.set(Math.cos(a) * radius, y + Math.sin(a * 2) * 0.3, Math.sin(a) * radius * 0.6);
      // nose (+x) points along the direction of travel; bank through the turn
      ref.current.rotation.set(0, -a + (speed > 0 ? Math.PI : 0), 0.28 + Math.sin(a * 2) * 0.3);
    }
  });
  const color = tone === "green" ? C.green : tone === "red" ? C.red : "#f2f3f2";
  const trail = tone === "green" ? C.green : tone === "red" ? C.red : "#B9F6CA";
  return (
    <group ref={ref}>
      <Trail width={0.35} length={4} decay={2} color={trail} attenuation={(w) => w * w}>
        <group rotation={[0, 0, -Math.PI / 2]} scale={1.15}>
          {[0.5, -0.5].map((side) => (
            <mesh key={side} rotation={[side * 0.55, 0, 0]} position={[0, 0, 0.02 * side]}>
              <coneGeometry args={[0.16, 0.62, 3]} />
              <GlossMat color={color} glow={tone === "white" ? 0.12 : 0.45} />
            </mesh>
          ))}
        </group>
      </Trail>
    </group>
  );
}

function BeaconScene({ still }: Live) {
  const lamp = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Group>(null);
  const fast = useRef(false);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    if (lamp.current) {
      const k = 1.6 + Math.sin(t * 2.4) * 0.7;
      const target = still ? 2 : k + 1.2 + (hot ? 1.6 : 0);
      const mat = lamp.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = THREE.MathUtils.damp(mat.emissiveIntensity, target, 6, dt);
      lamp.current.scale.setScalar(THREE.MathUtils.damp(lamp.current.scale.x, hot ? 1.18 : 1, 6, dt));
    }
    if (halo.current && !still) halo.current.rotation.z += dt * (hot ? 1.6 : 0.8);
  });
  return (
    <group position={[0, -1.7, 0]}>
      {/* tapered obelisk: green band at the waist, red trim at the base */}
      {[
        { y: 0.45, s: 1.15, h: 0.9 },
        { y: 1.35, s: 0.85, h: 0.95 },
        { y: 2.1, s: 0.6, h: 0.6 },
      ].map((tier) => (
        <RoundedBox key={tier.y} args={[tier.s, tier.h, tier.s]} radius={0.09} smoothness={4} position={[0, tier.y, 0]}>
          <PanelMat glow={C.green} color="#161817" />
        </RoundedBox>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.93, 0]}>
        <torusGeometry args={[0.66, 0.035, 16, 64]} />
        <NeonMat color={C.green} intensity={2} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.04, 0]}>
        <torusGeometry args={[0.95, 0.04, 16, 64]} />
        <NeonMat color={C.red} intensity={1.8} />
      </mesh>

      {/* the lamp, its red signal orbit, and rising broadcast pulses */}
      <mesh
        ref={lamp}
        position={[0, 2.75, 0]}
        onPointerOver={() => {
          setHot(true);
          fast.current = true;
        }}
        onPointerOut={() => {
          setHot(false);
          fast.current = false;
        }}
      >
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color={C.green} emissive={C.green} emissiveIntensity={2.4} toneMapped={false} />
      </mesh>
      <group ref={halo} position={[0, 2.75, 0]} rotation={[1, 0, 0.3]}>
        <mesh>
          <torusGeometry args={[0.9, 0.016, 8, 96]} />
          <NeonMat color={C.red} intensity={1.8} />
        </mesh>
        <OrbitNode still={still} radius={0.9} speed={1.7} phase={0} color={C.red} size={0.07} />
      </group>
      {[0, 1, 2].map((delay) => (
        <Pulse key={delay} still={still} delay={delay} fast={fast} />
      ))}

      <PaperPlane still={still} radius={2.9} speed={0.55} phase={0} y={1.7} tone="green" />
      <PaperPlane still={still} radius={3.3} speed={-0.4} phase={2.2} y={1} tone="red" />
      <PaperPlane still={still} radius={2.3} speed={0.75} phase={4.4} y={2.3} />

      <HalfRing radius={3} color={C.green} intensity={1.5} />
      <HalfRing radius={3} color={C.red} flip intensity={1.5} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[2.55, 0.012, 8, 96]} />
        <NeonMat color={C.green} intensity={1} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------- markets (W3.1 overview) */

/** Three market tokens orbit one desk: a bar (commodities), a globe (forex),
 *  a link (crypto). Hovering a token pulls it forward. */
function MarketToken({ still, phase, speed, children }: Live & { phase: number; speed: number; children: ReactNode }) {
  const ref = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    const a = phase + t * speed;
    if (!ref.current) return;
    ref.current.position.set(Math.cos(a) * 2.5, 0.9 + Math.sin(a * 1.6) * 0.35, Math.sin(a) * 1.5);
    ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, hot ? 1.3 : 1, 7, dt));
    if (!still) ref.current.rotation.y += dt * 0.8;
  });
  return (
    <group ref={ref} onPointerOver={() => setHot(true)} onPointerOut={() => setHot(false)}>
      {children}
    </group>
  );
}

function MarketsScene({ still }: Live) {
  const ring = useRef<THREE.Mesh>(null);
  const pedestal = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = now(s, still);
    pedestal.current?.scale.setY(Math.max(0.001, build(t, 0.3, 0.8)));
    if (ring.current) (ring.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.4 + Math.sin(t * 2) * 0.6;
  });
  return (
    <group position={[0, -1.4, 0]}>
      <group ref={pedestal}>
        <RoundedBox args={[1.9, 0.5, 1.9]} radius={0.1} smoothness={4} position={[0, 0.25, 0]}>
          <GlossMat color={C.green} glow={0.22} />
        </RoundedBox>
      </group>
      <MarketToken still={still} phase={0} speed={0.45}>
        <RoundedBox args={[0.62, 0.3, 0.34]} radius={0.07} smoothness={4}>
          <GlossMat color={C.green} glow={0.3} />
        </RoundedBox>
      </MarketToken>
      <MarketToken still={still} phase={2.09} speed={0.45}>
        <mesh>
          <sphereGeometry args={[0.32, 32, 32]} />
          <GlossMat color={C.red} glow={0.4} />
        </mesh>
      </MarketToken>
      <MarketToken still={still} phase={4.19} speed={0.45}>
        <group>
          {[-0.14, 0.14].map((x, i) => (
            <mesh key={x} position={[x, 0, 0]} rotation={[i ? Math.PI / 2 : 0, 0.5, 0]}>
              <torusGeometry args={[0.2, 0.055, 16, 48]} />
              <GlossMat color={C.green} glow={0.45} />
            </mesh>
          ))}
        </group>
      </MarketToken>
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <torusGeometry args={[2.9, 0.015, 8, 96]} />
        <NeonMat color={C.green} intensity={1.5} />
      </mesh>
    </group>
  );
}

/* ----------------------------------------------- commodities (W3.2) */

function CommoditiesScene({ still }: Live) {
  const stack = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s) => {
    const t = now(s, still);
    stack.current?.children.forEach((child, index) => {
      child.scale.setScalar(Math.max(0.001, build(t, 0.3 + index * 0.25, 0.6)));
    });
  });
  const bars: Array<[number, number, number, number]> = [
    [-0.55, 0.19, 0.1, 0.1],
    [0.55, 0.19, -0.1, -0.12],
    [0, 0.19, 0.55, 0.05],
    [-0.28, 0.57, 0.22, -0.08],
    [0.3, 0.57, 0.18, 0.1],
    [0, 0.95, 0.2, 0.02],
  ];
  return (
    <group position={[0, -1.5, 0]} onPointerOver={() => setHot(true)} onPointerOut={() => setHot(false)}>
      <group ref={stack}>
        {bars.map(([x, y, z, r], index) => (
          <group key={index} position={[x, y, z]} rotation={[0, r, 0]}>
            <RoundedBox args={[1.05, 0.38, 0.52]} radius={0.09} smoothness={4}>
              <GlossMat color={C.green} glow={hot ? 0.4 : 0.18} />
            </RoundedBox>
          </group>
        ))}
      </group>
      <Coin still={still} position={[1.8, 1.4, 0.3]} scale={1.1} tone="green" />
      <Coin still={still} position={[-1.9, 1.1, -0.2]} scale={0.8} spin={-0.7} tone="red" />
      <HalfRing radius={2.7} color={C.green} intensity={1.5} />
      <HalfRing radius={2.7} color={C.red} flip intensity={1.5} />
    </group>
  );
}

/* ----------------------------------------------------- forex (W3.3) */

/** Two currency spheres trading comet nodes along a shared orbit. */
function ForexScene({ still }: Live) {
  const a = useRef<THREE.Mesh>(null);
  const b = useRef<THREE.Mesh>(null);
  useFrame((s, dt) => {
    const t = now(s, still);
    const pulse = Math.sin(t * 1.6);
    for (const [mesh, side] of [
      [a.current, 1],
      [b.current, -1],
    ] as const) {
      if (!mesh) continue;
      const k = 1 + Math.max(0, pulse * side) * 0.12;
      mesh.scale.setScalar(THREE.MathUtils.damp(mesh.scale.x, k, 5, dt));
    }
  });
  return (
    <group position={[0, -0.35, 0]}>
      <Bob still={still} speed={1.2} float={0.5}>
        <mesh ref={a} position={[-1.7, 0, 0]}>
          <sphereGeometry args={[0.72, 48, 48]} />
          <GlossMat color={C.red} glow={0.35} />
        </mesh>
      </Bob>
      <Bob still={still} speed={1.5} float={0.5}>
        <mesh ref={b} position={[1.7, 0, 0]}>
          <sphereGeometry args={[0.72, 48, 48]} />
          <GlossMat color={C.green} glow={0.35} />
        </mesh>
      </Bob>
      <group rotation={[0.35, 0, 0.1]}>
        <mesh>
          <torusGeometry args={[2.5, 0.012, 8, 128]} />
          <NeonMat color={C.red} intensity={1.2} />
        </mesh>
        <OrbitNode still={still} radius={2.5} speed={0.85} phase={0} color={C.red} size={0.12} />
        <OrbitNode still={still} radius={2.5} speed={0.85} phase={Math.PI} color={C.green} size={0.12} />
      </group>
    </group>
  );
}

/* ---------------------------------------------------- crypto (W3.4) */

/** A chain building link by link, the newest link glowing. */
function CryptoScene({ still }: Live) {
  const chain = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = now(s, still);
    chain.current?.children.forEach((child, index) => {
      child.scale.setScalar(Math.max(0.001, build(t, 0.3 + index * 0.3, 0.6)));
    });
  });
  return (
    <group position={[0, -1.5, 0]}>
      <group ref={chain}>
        {[0, 1, 2, 3].map((index) => (
          <group key={index} position={[(index - 1.5) * 0.78, 0.9 + (index % 2) * 0.05, 0]} rotation={[index % 2 ? Math.PI / 2 : 0, 0, Math.PI / 2]}>
            <mesh>
              <torusGeometry args={[0.42, 0.11, 20, 56]} />
              <GlossMat color={index === 3 ? C.green : "#1c2624"} glow={index === 3 ? 0.6 : 0.12} />
            </mesh>
          </group>
        ))}
      </group>
      <Bob still={still} speed={1.6} float={1}>
        <mesh position={[0, 2.3, 0]} rotation={[0.5, 0.6, 0]}>
          <boxGeometry args={[0.5, 0.5, 0.5]} />
          <GlossMat color={C.red} glow={0.5} />
        </mesh>
      </Bob>
      <HalfRing radius={2.8} color={C.green} intensity={1.4} />
      <HalfRing radius={2.8} color={C.red} flip intensity={1.4} />
    </group>
  );
}

/* ---------------------------------------------------- briefs (W3.7) */

/** A stack of published pages; the top brief lifts off and settles, forever. */
function BriefsScene({ still }: Live) {
  const top = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    if (top.current) {
      const k = (Math.sin(t * 0.9) + 1) / 2;
      const lift = 0.35 + k * 0.5 + (hot ? 0.3 : 0);
      top.current.position.y = THREE.MathUtils.damp(top.current.position.y, 1.1 + lift, 4, dt);
      top.current.rotation.z = THREE.MathUtils.damp(top.current.rotation.z, 0.08 + k * 0.1, 4, dt);
      top.current.rotation.y = THREE.MathUtils.damp(top.current.rotation.y, -0.2 + k * 0.25, 4, dt);
    }
  });
  return (
    <group position={[0, -1.3, 0]}>
      <HitBox args={[2.6, 2.8, 1.9]} position={[0, 1.4, 0]} onHot={setHot} />
      {[0, 1, 2, 3].map((index) => (
        <RoundedBox key={index} args={[2.3, 0.14, 1.6]} radius={0.05} smoothness={4} position={[0, 0.15 + index * 0.21, 0]} rotation={[0, (index % 2) * 0.12 - 0.06, 0]}>
          <PanelMat glow={C.green} color="#161817" />
        </RoundedBox>
      ))}
      <group ref={top} position={[0, 1.4, 0]}>
        <RoundedBox args={[2.3, 0.12, 1.6]} radius={0.05} smoothness={4}>
          <GlossMat color={C.green} glow={0.3} />
        </RoundedBox>
        {[0.45, 0.15, -0.15].map((z, index) => (
          <RoundedBox key={z} args={[index === 0 ? 1.1 : 1.7, 0.03, 0.12]} radius={0.015} position={[index === 0 ? -0.5 : -0.2, 0.08, z]}>
            <meshStandardMaterial color={C.line} />
          </RoundedBox>
        ))}
      </group>
      <HalfRing radius={2.7} color={C.green} intensity={1.4} />
      <HalfRing radius={2.7} color={C.red} flip intensity={1.4} />
    </group>
  );
}

/* --------------------------------------------- library (W5 · resources) */

const PAGE = "#e3eae6";
const CANDLES: Array<{ x: number; h: number; up: boolean }> = [
  { x: -1.4, h: 0.2, up: true },
  { x: -1.17, h: 0.32, up: true },
  { x: -0.94, h: 0.16, up: false },
  { x: -0.71, h: 0.42, up: true },
  { x: -0.48, h: 0.24, up: false },
];
const TEXT_LINES = [-0.72, -0.48, -0.24, 0, 0.24, 0.48, 0.72];

function PageMat() {
  return <meshPhysicalMaterial color={PAGE} emissive={PAGE} emissiveIntensity={0.05} roughness={0.6} clearcoat={0.15} />;
}

/** One resource category card: floats on the orbit, lifts and lights under the cursor. */
function GuideCard({ still, index, count, radius }: Live & { index: number; count: number; radius: number }) {
  const ref = useRef<THREE.Group>(null);
  const mat = useRef<THREE.MeshPhysicalMaterial>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  const a = (index / count) * Math.PI * 2;
  const color = index % 2 ? C.red : C.green;
  useFrame((s, dt) => {
    const t = now(s, still);
    if (ref.current) {
      ref.current.position.y = THREE.MathUtils.damp(ref.current.position.y, 2.15 + Math.sin(t * 1.2 + index) * 0.12 + (hot ? 0.35 : 0), 6, dt);
      ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, hot ? 1.22 : 1, 8, dt));
    }
    if (mat.current) mat.current.emissiveIntensity = THREE.MathUtils.damp(mat.current.emissiveIntensity, hot ? 0.6 : 0.08, 6, dt);
  });
  return (
    <group position={[Math.cos(a) * radius, 0, Math.sin(a) * radius]} rotation={[0, Math.PI / 2 - a, 0]}>
      <HitBox args={[1.2, 1.25, 0.2]} position={[0, 2.35, 0]} onHot={setHot} />
      <group ref={ref} position={[0, 2.15, 0]}>
      <RoundedBox args={[0.95, 0.62, 0.05]} radius={0.04} smoothness={4}>
        <meshPhysicalMaterial ref={mat} color={C.panel} emissive={color} emissiveIntensity={0.08} metalness={0.25} roughness={0.3} clearcoat={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.22, 0.031]}>
        <boxGeometry args={[0.78, 0.04, 0.01]} />
        <NeonMat color={color} intensity={2.4} />
      </mesh>
      {[0.05, -0.07, -0.19].map((y, i) => (
        <mesh key={y} position={[i === 2 ? -0.11 : 0, y, 0.031]}>
          <boxGeometry args={[i === 2 ? 0.56 : 0.78, 0.03, 0.01]} />
          <meshStandardMaterial color={C.line} />
        </mesh>
      ))}
      </group>
    </group>
  );
}

/** A reading lens that drifts across the open pages; grows and brightens under the cursor. */
function Magnifier({ still }: Live) {
  const ref = useRef<THREE.Group>(null);
  const ring = useRef<THREE.MeshStandardMaterial>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    if (ref.current) {
      ref.current.position.set(Math.sin(t * 0.55) * 1.15, 1.05 + Math.sin(t * 1.3) * 0.08, 0.45 + Math.cos(t * 0.42) * 0.35);
      ref.current.scale.setScalar(THREE.MathUtils.damp(ref.current.scale.x, hot ? 1.3 : 1, 8, dt));
    }
    if (ring.current) ring.current.emissiveIntensity = THREE.MathUtils.damp(ring.current.emissiveIntensity, hot ? 3.6 : 1.8, 6, dt);
  });
  return (
    <group ref={ref} rotation={[-0.75, 0.3, 0.2]} onPointerOver={() => setHot(true)} onPointerOut={() => setHot(false)}>
      <mesh>
        <torusGeometry args={[0.36, 0.05, 20, 72]} />
        <meshPhysicalMaterial color="#c9d1cc" metalness={1} roughness={0.18} clearcoat={0.6} />
      </mesh>
      <mesh>
        <torusGeometry args={[0.3, 0.012, 8, 72]} />
        <meshStandardMaterial ref={ring} color={C.green} emissive={C.green} emissiveIntensity={1.8} toneMapped={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.33, 48]} />
        <meshPhysicalMaterial color="#dffff0" transmission={1} thickness={0.4} roughness={0.03} ior={1.4} transparent opacity={0.85} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, -0.68, 0]}>
        <cylinderGeometry args={[0.045, 0.06, 0.64, 24]} />
        <meshPhysicalMaterial color="#17201c" metalness={0.6} roughness={0.3} clearcoat={0.5} />
      </mesh>
    </group>
  );
}

function LibraryScene({ still }: Live) {
  const page = useRef<THREE.Group>(null);
  const candles = useRef<THREE.Group>(null);
  const orbit = useRef<THREE.Group>(null);
  const beam = useRef<THREE.MeshBasicMaterial>(null);
  const rings = useRef<THREE.Group>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  useFrame((s, dt) => {
    const t = now(s, still);
    // a page turns every 3.5s (twice as fast while the book is hovered)
    if (page.current) {
      const p = ((t * (hot ? 2 : 1)) % 3.5) / 3.5;
      const k = still ? 0.45 : 0.5 - Math.cos(clamp01((p - 0.2) / 0.5) * Math.PI) / 2;
      page.current.rotation.z = 0.03 + k * (Math.PI - 0.06);
    }
    candles.current?.children.forEach((child, index) => child.scale.setY(Math.max(0.001, build(t, 0.4 + index * 0.25, 0.5))));
    if (orbit.current && !still) orbit.current.rotation.y += dt * 0.22;
    if (beam.current) beam.current.opacity = THREE.MathUtils.damp(beam.current.opacity, (hot ? 0.16 : 0.07) + Math.sin(t * 1.4) * 0.025, 4, dt);
    if (rings.current) {
      rings.current.children.forEach((ring, index) => ring.scale.setScalar(1 + Math.sin(t * 1.8 + index * 1.6) * 0.035));
    }
  });
  return (
    <group position={[0, -1.4, 0]}>
      {/* the open book */}
      <group rotation={[0.18, 0, 0]} onPointerOver={() => setHot(true)} onPointerOut={() => setHot(false)}>
        <RoundedBox args={[3.7, 0.1, 2.35]} radius={0.04} smoothness={4} position={[0, 0.05, 0]}>
          <meshPhysicalMaterial color="#0d1712" metalness={0.3} roughness={0.35} clearcoat={0.7} />
        </RoundedBox>
        {[-0.9, 0.9].map((x) => (
          <RoundedBox key={x} args={[1.72, 0.16, 2.12]} radius={0.03} smoothness={3} position={[x, 0.18, 0]} rotation={[0, 0, x < 0 ? -0.05 : 0.05]}>
            <PageMat />
          </RoundedBox>
        ))}
        <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.14, 24]} />
          <meshPhysicalMaterial color="#1c2a23" metalness={0.8} roughness={0.25} />
        </mesh>
        {/* left page: a small candlestick chart that draws itself */}
        <group ref={candles}>
          {CANDLES.map((candle) => (
            <group key={candle.x} position={[candle.x + 0.62, 0.27, -0.2]}>
              <mesh position={[0, candle.h / 2, 0]}>
                <boxGeometry args={[0.13, candle.h, 0.13]} />
                <NeonMat color={candle.up ? C.green : C.red} intensity={1.3} />
              </mesh>
              <mesh position={[0, candle.h / 2, 0]}>
                <boxGeometry args={[0.02, candle.h + 0.2, 0.02]} />
                <meshStandardMaterial color={candle.up ? C.green : C.red} />
              </mesh>
            </group>
          ))}
        </group>
        {[0.35, 0.6].map((z, index) => (
          <mesh key={z} position={[-0.95 + index * 0.1, 0.275, z]}>
            <boxGeometry args={[index ? 1.1 : 1.3, 0.012, 0.07]} />
            <meshStandardMaterial color={C.line} />
          </mesh>
        ))}
        {/* right page: lines of a guide */}
        {TEXT_LINES.map((z, index) => (
          <mesh key={z} position={[0.9 - (index % 3 === 2 ? 0.18 : 0), 0.275, z]}>
            <boxGeometry args={[index % 3 === 2 ? 1.0 : 1.36, 0.012, 0.07]} />
            <meshStandardMaterial color={index === 0 ? C.green : C.line} emissive={index === 0 ? C.green : "#000000"} emissiveIntensity={index === 0 ? 1.2 : 0} />
          </mesh>
        ))}
        {/* the turning page, hinged on the spine */}
        <group ref={page} position={[0, 0.27, 0]}>
          <mesh position={[0.84, 0, 0]}>
            <boxGeometry args={[1.66, 0.012, 2.06]} />
            <PageMat />
          </mesh>
        </group>
        {/* light rising off the pages */}
        <mesh position={[0, 1.5, 0]}>
          <cylinderGeometry args={[1.6, 0.5, 2.4, 48, 1, true]} />
          <meshBasicMaterial ref={beam} color={C.green} transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <Magnifier still={still} />

      {/* the five resource categories, orbiting the book */}
      <group ref={orbit}>
        {Array.from({ length: 5 }, (_, index) => (
          <GuideCard key={index} still={still} index={index} count={5} radius={2.6} />
        ))}
      </group>

      <group ref={rings}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[2.75, 0.016, 8, 128]} />
          <NeonMat color={C.green} intensity={1.6} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
          <torusGeometry args={[2.35, 0.012, 8, 128]} />
          <NeonMat color={C.red} intensity={1.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------- pathway (W5.3 · product guides) */

const PATH = Array.from({ length: 6 }, (_, i) => ({ x: -2.5 + i * 1.0, y: i * 0.4, z: i % 2 ? -0.42 : 0.38 }));
const LAST = PATH.length - 1;
const HOP = 0.85;
const RETURN = 1.6;
const CYCLE = LAST * HOP + 0.6 + RETURN;
const GREEN = new THREE.Color(C.green);
const RED = new THREE.Color(C.red);
const IDLE = new THREE.Color("#464f4a");

/** Where the marker is at time t, and how many steps it has completed (-1 = none). */
function pathAt(t: number): { pos: [number, number, number]; reached: number } {
  const c = t % CYCLE;
  const lift = 0.42;
  if (c < LAST * HOP) {
    const k = Math.floor(c / HOP);
    const f = easeOut((c - k * HOP) / HOP);
    const a = PATH[k];
    const b = PATH[k + 1];
    return {
      pos: [THREE.MathUtils.lerp(a.x, b.x, f), THREE.MathUtils.lerp(a.y, b.y, f) + Math.sin(Math.PI * f) * 0.6 + lift, THREE.MathUtils.lerp(a.z, b.z, f)],
      reached: f > 0.9 ? k + 1 : k,
    };
  }
  const end = PATH[LAST];
  if (c < LAST * HOP + 0.6) return { pos: [end.x, end.y + lift, end.z], reached: LAST };
  // the comet flies home over the path, high and wide, and the tiles reset behind it
  const f = (c - LAST * HOP - 0.6) / RETURN;
  const g = 0.5 - Math.cos(f * Math.PI) / 2;
  const start = PATH[0];
  return {
    pos: [THREE.MathUtils.lerp(end.x, start.x, g), THREE.MathUtils.lerp(end.y, start.y, g) + Math.sin(Math.PI * g) * 1.7 + lift, THREE.MathUtils.lerp(end.z, start.z, g) + Math.sin(Math.PI * g) * 1.1],
    reached: f < 0.25 ? LAST : -1,
  };
}

/** One step of a guide: lights green once reached, red while it's next; hover shows its check ring. */
function PathTile({ index, reached }: { index: number; reached: RefObject<number> }) {
  const plate = useRef<THREE.MeshStandardMaterial>(null);
  const check = useRef<THREE.Mesh>(null);
  const [hot, setHot] = useState(false);
  useCursor(hot);
  const p = PATH[index];
  useFrame((_, dt) => {
    const r = reached.current ?? -1;
    const done = index <= r;
    const next = index === r + 1;
    if (plate.current) {
      plate.current.emissive.lerp(done || hot ? GREEN : next ? RED : IDLE, 1 - Math.exp(-8 * dt));
      plate.current.emissiveIntensity = THREE.MathUtils.damp(plate.current.emissiveIntensity, hot ? 3.4 : done ? 1.9 : next ? 1.5 : 0.35, 6, dt);
    }
    if (check.current) {
      check.current.scale.setScalar(THREE.MathUtils.damp(check.current.scale.x, hot || (done && index === LAST) ? 1 : 0.001, 9, dt));
      check.current.rotation.y += dt * 1.6;
    }
  });
  return (
    <group position={[p.x, p.y, p.z]}>
      <mesh position={[0, -(p.y + 0.45) / 2, 0]}>
        <cylinderGeometry args={[0.07, 0.09, p.y + 0.45, 16]} />
        <meshPhysicalMaterial color="#171a18" metalness={0.7} roughness={0.3} />
      </mesh>
      <RoundedBox args={[0.86, 0.16, 0.86]} radius={0.05} smoothness={4}>
        <PanelMat />
      </RoundedBox>
      <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.64, 0.64]} />
        <meshStandardMaterial ref={plate} color="#0a0d0f" emissive={IDLE} emissiveIntensity={0.35} toneMapped={false} />
      </mesh>
      <mesh ref={check} position={[0, 0.62, 0]} scale={0.001}>
        <torusGeometry args={[0.19, 0.026, 10, 48]} />
        <NeonMat color={C.green} intensity={2.8} />
      </mesh>
      <HitBox args={[0.95, 1, 0.95]} position={[0, 0.35, 0]} onHot={setHot} />
    </group>
  );
}

function PathwayScene({ still }: Live) {
  const orb = useRef<THREE.Group>(null);
  const reached = useRef(-1);
  const cloth = useRef<THREE.Group>(null);
  const clothMat = useRef<THREE.MeshStandardMaterial>(null);
  const rings = useRef<THREE.Group>(null);
  useFrame((s, dt) => {
    const t = still ? LAST * HOP + 0.3 : s.clock.elapsedTime;
    const at = pathAt(t);
    reached.current = at.reached;
    orb.current?.position.set(...at.pos);
    if (cloth.current) cloth.current.rotation.y = Math.sin(t * 3.2) * 0.28;
    if (clothMat.current) {
      clothMat.current.emissive.lerp(at.reached === LAST ? GREEN : RED, 1 - Math.exp(-6 * dt));
      clothMat.current.emissiveIntensity = THREE.MathUtils.damp(clothMat.current.emissiveIntensity, at.reached === LAST ? 2.6 : 0.9, 5, dt);
    }
    rings.current?.children.forEach((ring, index) => ring.scale.setScalar(1 + Math.sin(t * 1.8 + index * 1.6) * 0.035));
  });
  const end = PATH[LAST];
  return (
    <group position={[0, -1.55, 0]}>
      {PATH.map((_, index) => (
        <PathTile key={index} index={index} reached={reached} />
      ))}
      {/* the finish flag */}
      <group position={[end.x + 0.2, end.y + 0.08, end.z]}>
        <mesh position={[0, 0.6, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 1.2, 12]} />
          <meshPhysicalMaterial color="#c9d1cc" metalness={1} roughness={0.2} />
        </mesh>
        <group ref={cloth} position={[0, 1.04, 0]}>
          <mesh position={[0.24, 0, 0]}>
            <planeGeometry args={[0.46, 0.3]} />
            <meshStandardMaterial ref={clothMat} color="#0b0e10" emissive={RED} emissiveIntensity={0.9} side={THREE.DoubleSide} toneMapped={false} />
          </mesh>
        </group>
      </group>
      {/* the marker that follows the guide */}
      <group ref={orb}>
        <Trail width={0.7} length={6} decay={1.4} color={C.green} attenuation={(w) => w * w}>
          <mesh>
            <sphereGeometry args={[0.13, 32, 32]} />
            <NeonMat color={C.green} intensity={3.2} />
          </mesh>
        </Trail>
      </group>
      <group ref={rings}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]}>
          <torusGeometry args={[3.1, 0.016, 8, 128]} />
          <NeonMat color={C.green} intensity={1.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.44, 0]}>
          <torusGeometry args={[2.7, 0.012, 8, 128]} />
          <NeonMat color={C.red} intensity={1.3} />
        </mesh>
      </group>
    </group>
  );
}

const SCENES: Record<PageModelKind, (props: Live) => ReactNode> = {
  podium: PodiumScene,
  signal: SignalScene,
  beacon: BeaconScene,
  markets: MarketsScene,
  commodities: CommoditiesScene,
  forex: ForexScene,
  crypto: CryptoScene,
  briefs: BriefsScene,
  library: LibraryScene,
  pathway: PathwayScene,
};
