"use client";

// The AFVAR AI core — one continuous WebGL stage for the whole home story.
// The same objects persist across every act and transform with the scroll:
// the core opens into seven cores, the cores ride a 24-hour ring, listen,
// unfold into OS windows, escort requests through the policy gate and fold
// back in. Every transform is a pure function of (damped progress, clock), so
// reverse scroll replays cleanly. Built on the chapter engine in ../sceneLib.
//
//   default export AiCoreScene({ progress, active, still })
import { Environment, Lightformer, RoundedBox } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MachinedArc } from "../MachinedArc";
import { AdaptiveQuality, CameraRig, ProgressDamper, SceneLabel, SoundCues } from "../sceneLib";
import {
  CAMERA_KEYS,
  COLORS,
  CORE,
  DOCK,
  FOV,
  GATE,
  LANE_RADIUS,
  LANES,
  ORBIT,
  OS_Z,
  PARALLAX,
  PROGRESS_DAMP,
  RING,
  SATELLITES,
  SETTLED_P,
  SOUND,
  STREAM_PARTICLES,
  WINDOWS,
  actWeight,
  coreGlow,
  easeInOut,
  easeOut,
  ramp,
} from "./aiConfig";

export interface AiCoreSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** Real direction per lane (same order as LANES), from the live feed. */
  marketUp?: readonly boolean[];
}

type Shared = { smoothed: RefObject<number>; still: boolean };

export default function AiCoreScene({ progress, active, still, marketUp }: AiCoreSceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);
  const shared: Shared = { smoothed, still };

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: [...CAMERA_KEYS[0].pos], fov: FOV[0] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, 10, 26]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />
      <AdaptiveQuality />
      <SoundCues smoothed={smoothed} cues={SOUND} />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <ambientLight intensity={0.16} />
      <spotLight position={[5, 7, 6]} angle={0.5} penumbra={1} intensity={40} color="#f1ece2" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.gold} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.4} color="#9fb3c8" position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <Core {...shared} />
      <Thoughts {...shared} />
      <Satellites {...shared} />
      <Lanes {...shared} marketUp={marketUp} />
      <ClockRing {...shared} />
      <VoiceRings {...shared} />
      <Desktop {...shared} />
      <PolicyGate {...shared} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.85} intensity={0.75} />
        <Vignette darkness={0.5} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/* ------------------------------------------------------------------ core */

/** The protagonist: a gold mind behind glass, breathing while it thinks. */
function Core({ smoothed, still }: Shared) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const shell = useRef<THREE.Mesh>(null);
  const neural = useRef<THREE.Group>(null);
  const nucleus = useRef<THREE.MeshBasicMaterial>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = s.clock.elapsedTime;
    // Faster "thinking" while listening; a steady heartbeat otherwise.
    const listen = actWeight(p, "ask");
    const hz = CORE.beatHz * (1 + listen * 1.2);
    const beat = still ? 0.5 : 0.5 + 0.5 * Math.sin(t * Math.PI * 2 * hz);
    const glow = coreGlow(p) * (1 - CORE.beatDepth + CORE.beatDepth * beat * 2);
    if (inner.current) inner.current.emissiveIntensity = 0.55 * glow;
    if (nucleus.current) nucleus.current.color.setScalar(1).lerp(GOLD_HOT, 0.4).multiplyScalar(1.5 + glow);
    if (neural.current && !still) {
      neural.current.rotation.y = t * (0.35 + listen * 0.8);
      neural.current.rotation.x = t * 0.21;
    }
    if (light.current) light.current.intensity = 10 + glow * 10;
    // The core makes room while the OS is on screen, then returns.
    const os = actWeight(p, "os");
    const scale = 1 - os * 0.35 + 0.03 * beat;
    group.current?.scale.setScalar(scale);
    if (shell.current && !still) shell.current.rotation.y = t * 0.15;
  });

  return (
    <group ref={group} name="Core">
      <mesh>
        <icosahedronGeometry args={[CORE.radius, 6]} />
        <meshStandardMaterial ref={inner} color={COLORS.goldDeep} emissive={COLORS.gold} emissiveIntensity={0.55} roughness={0.35} metalness={0.2} transparent opacity={0.7} depthWrite={false} toneMapped={false} />
      </mesh>
      {/* the mind inside: two counter-turning geodesic nets and a white-hot nucleus */}
      <group ref={neural}>
        <mesh>
          <icosahedronGeometry args={[CORE.radius * 0.82, 1]} />
          <meshBasicMaterial color={COLORS.goldHot} wireframe transparent opacity={0.9} toneMapped={false} />
        </mesh>
        <mesh rotation={[0.6, 0.9, 0]}>
          <dodecahedronGeometry args={[CORE.radius * 0.6, 0]} />
          <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.7} toneMapped={false} />
        </mesh>
      </group>
      <mesh>
        <sphereGeometry args={[CORE.radius * 0.16, 24, 24]} />
        <meshBasicMaterial ref={nucleus} color="#FFF4DA" toneMapped={false} />
      </mesh>
      <mesh ref={shell}>
        <icosahedronGeometry args={[CORE.shell, 2]} />
        <meshPhysicalMaterial color="#d9b77a" metalness={0} roughness={0.12} transmission={0.9} thickness={0.5} ior={1.4} clearcoat={1} transparent opacity={0.55} />
      </mesh>
      <mesh>
        <icosahedronGeometry args={[CORE.shell * 1.002, 2]} />
        <meshBasicMaterial color={COLORS.gold} wireframe transparent opacity={0.12} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.gold} intensity={12} distance={9} decay={2} />
    </group>
  );
}

/** A slow cloud of gold sparks orbiting the core: thought in motion. */
function Thoughts({ smoothed, still }: Shared) {
  const points = useRef<THREE.Points>(null);
  const COUNT = 260;
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    const pos = new Float32Array(COUNT * 3);
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < COUNT; i++) {
      const r = 1.05 + rnd() * 1.1;
      const th = rnd() * Math.PI * 2;
      const ph = Math.acos(2 * rnd() - 1);
      pos[i * 3] = r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      pos[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th);
    }
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    if (!points.current) return;
    if (!still) points.current.rotation.y = s.clock.elapsedTime * 0.06;
    const mat = points.current.material as THREE.PointsMaterial;
    mat.opacity = 0.55 * (1 - actWeight(p, "os") * 0.8);
  });

  return (
    <points ref={points} geometry={geo}>
      <pointsMaterial color={COLORS.goldHot} size={0.028} sizeAttenuation transparent opacity={0.55} depthWrite={false} toneMapped={false} />
    </points>
  );
}

/* ------------------------------------------------------- seven satellites */

type Layout = "inside" | "orbit" | "ring" | "os" | "tight";

/** Hold / move segments for the cores across the story. */
const PLAN: { a: number; b: number; from: Layout; to: Layout }[] = [
  { a: 0, b: 0.075, from: "inside", to: "inside" },
  { a: 0.075, b: 0.135, from: "inside", to: "orbit" },
  { a: 0.135, b: 0.36, from: "orbit", to: "orbit" },
  { a: 0.36, b: 0.42, from: "orbit", to: "ring" },
  { a: 0.42, b: 0.49, from: "ring", to: "ring" },
  { a: 0.49, b: 0.535, from: "ring", to: "tight" },
  { a: 0.535, b: 0.63, from: "tight", to: "tight" },
  { a: 0.63, b: 0.69, from: "tight", to: "os" },
  { a: 0.69, b: 0.785, from: "os", to: "os" },
  { a: 0.785, b: 0.84, from: "os", to: "tight" },
  { a: 0.84, b: 0.93, from: "tight", to: "tight" },
  { a: 0.93, b: 0.985, from: "tight", to: "inside" },
  { a: 0.985, b: 1.01, from: "inside", to: "inside" },
];

const GOLD_HOT = new THREE.Color("#FFD98A");
const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();

function place(layout: Layout, i: number, t: number, out: THREE.Vector3) {
  const n = SATELLITES.length;
  switch (layout) {
    case "inside":
      return out.set(0, 0, 0);
    case "orbit":
    case "tight": {
      const r = layout === "tight" ? ORBIT.radius * 0.72 : ORBIT.radius;
      const a = (i / n) * Math.PI * 2 + t * ORBIT.speed;
      return out.set(Math.cos(a) * r, Math.sin(a) * r * ORBIT.tilt, Math.sin(a) * r * 0.9);
    }
    case "ring": {
      const a = Math.PI / 2 - (i / n) * Math.PI * 2;
      return out.set(Math.cos(a) * RING.radius, Math.sin(a) * RING.radius + RING.y, 0);
    }
    case "os": {
      if (i < WINDOWS.length) return out.set(WINDOWS[i].x, WINDOWS[i].y, OS_Z + 0.08);
      return out.set(0, 1.25, 0.3); // the verify core stays by the AI, checking
    }
  }
}

function Satellites({ smoothed, still }: Shared) {
  const nodes = useRef<(THREE.Group | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    const seg = PLAN.find((x) => p >= x.a && p < x.b) ?? PLAN[PLAN.length - 1];
    const k = easeInOut(ramp(p, seg.a, seg.b));
    const osW = actWeight(p, "os");
    const quiet = 1 - 0.4 * actWeight(p, "trust") - 0.25 * actWeight(p, "ask");
    nodes.current.forEach((g, i) => {
      if (!g) return;
      place(seg.from, i, t, scratchA);
      place(seg.to, i, t, scratchB);
      g.position.copy(scratchA.lerp(scratchB, seg.from === seg.to ? 0 : k));
      // Born from the core, gone back into it; small while they are windows.
      const born = easeOut(ramp(p, 0.075 + i * 0.006, 0.125 + i * 0.006));
      const merged = 1 - easeOut(ramp(p, 0.94 + i * 0.004, 0.985));
      const size = born * merged * quiet * (1 - osW * 0.55 * (i < WINDOWS.length ? 1 : 0));
      g.scale.setScalar(Math.max(0.0001, size));
      g.visible = size > 0.002;
    });
  });

  // Labels show while the cores are introduced, and again on the ring.
  const labelWindow = [0.12, 0.14, 0.2, 0.215] as const;
  return (
    <group name="Satellites">
      {SATELLITES.map((sat, i) => (
        <group key={sat.id} ref={(el) => void (nodes.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[ORBIT.size, 28, 28]} />
            <meshStandardMaterial color={COLORS.goldDeep} emissive={sat.id === "verify" ? COLORS.goldHot : COLORS.gold} emissiveIntensity={1.4} roughness={0.3} toneMapped={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[ORBIT.size * 1.7, 0.006, 8, 48]} />
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          <SceneLabel position={[0, ORBIT.size + 0.28, 0]} smoothed={smoothed} show={labelWindow}>
            {sat.label}
          </SceneLabel>
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------------- eight market lanes */

/** Every tick of eight markets streams into the cores (stream act). */
function Lanes({ smoothed, still, marketUp }: Shared & { marketUp?: readonly boolean[] }) {
  const upOf = (j: number) => marketUp?.[j] ?? LANES[j].up;
  const group = useRef<THREE.Group>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const matrix = useMemo(() => new THREE.Matrix4(), []);
  const color = useMemo(() => new THREE.Color(), []);
  const origins = useMemo(
    () =>
      LANES.map((_, j) => {
        const a = Math.PI * (-0.08 + (j / (LANES.length - 1)) * 0.68);
        return new THREE.Vector3(Math.cos(a) * LANE_RADIUS * 0.8, Math.sin(a) * LANE_RADIUS * 0.5, -3.2 - (j % 3) * 1.1);
      }),
    [],
  );
  const lineGeos = useMemo(() => origins.map((o) => new THREE.BufferGeometry().setFromPoints([o, new THREE.Vector3(0, 0, 0)])), [origins]);
  const scratch = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = ramp(p, 0.2, 0.25) * (1 - ramp(p, 0.355, 0.4));
    if (group.current) group.current.visible = w > 0.002;
    if (w <= 0.002) return;
    group.current?.children.forEach((c) => {
      const m = (c as THREE.Line).material as THREE.LineBasicMaterial | undefined;
      if (m && "opacity" in m && (c as THREE.Line).isLine) m.opacity = 0.32 * w;
    });
    const mesh = dots.current;
    if (!mesh) return;
    const t = still ? 0 : s.clock.elapsedTime;
    let n = 0;
    origins.forEach((o, j) => {
      for (let k = 0; k < STREAM_PARTICLES; k++) {
        const u = (k / STREAM_PARTICLES + t * (0.22 + j * 0.015)) % 1;
        scratch.copy(o).lerp(new THREE.Vector3(0, 0, 0), easeOut(u));
        const size = 0.035 * w * (1 - u * 0.6);
        matrix.makeScale(size, size, size).setPosition(scratch);
        mesh.setMatrixAt(n, matrix);
        mesh.setColorAt(n, color.set(upOf(j) ? COLORS.up : COLORS.down));
        n++;
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
  });

  const labelWindow = [0.245, 0.27, 0.33, 0.35] as const;
  return (
    <group ref={group} name="Lanes" visible={false}>
      {lineGeos.map((g, j) => (
        <lineSegments key={j} geometry={g}>
          <lineBasicMaterial color={upOf(j) ? COLORS.up : COLORS.down} transparent opacity={0} toneMapped={false} />
        </lineSegments>
      ))}
      <instancedMesh ref={dots} args={[undefined, undefined, LANES.length * STREAM_PARTICLES]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial toneMapped={false} />
      </instancedMesh>
      {origins.map((o, j) => (
        <SceneLabel key={LANES[j].sym} position={[o.x, o.y + 0.32, o.z]} smoothed={smoothed} show={labelWindow} tone={upOf(j) ? "up" : "down"}>
          {LANES[j].sym}
        </SceneLabel>
      ))}
    </group>
  );
}

/* --------------------------------------------------------- 24-hour ring */

const SESSIONS = [
  { name: "Sydney", from: 22, to: 7 },
  { name: "Tokyo", from: 0, to: 9 },
  { name: "London", from: 8, to: 17 },
  { name: "New York", from: 13, to: 22 },
] as const;

/** Hour h (UTC) → angle, midnight at the top, clockwise. */
const hourAngle = (h: number) => Math.PI / 2 - (h / 24) * Math.PI * 2;

function ClockRing({ smoothed, still }: Shared) {
  const group = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Group>(null);
  const arcs = useMemo(
    () =>
      SESSIONS.map((sess, i) => {
        const span = ((sess.to - sess.from + 24) % 24) / 24;
        const start = hourAngle(sess.to); // torus arcs run counter-clockwise
        return { span: span * Math.PI * 2, start, r: RING.radius + 0.16 + i * 0.09, name: sess.name, mid: hourAngle((sess.from + (((sess.to - sess.from + 24) % 24) / 2)) % 24) };
      }),
    [],
  );

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = actWeight(p, "always", 0.04);
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.85 + 0.15 * w);
    }
    // The hand sweeps a full day across the act — and keeps turning.
    const day = ramp(p, 0.37, 0.49) * Math.PI * 2 + (still ? 0 : s.clock.elapsedTime * 0.05);
    if (hand.current) hand.current.rotation.z = -day;
  });

  const labelWindow = [0.4, 0.42, 0.47, 0.49] as const;
  return (
    <group ref={group} name="ClockRing" visible={false}>
      <mesh>
        <torusGeometry args={[RING.radius, RING.tube, 8, 200]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {Array.from({ length: 24 }, (_, h) => {
        const a = hourAngle(h);
        const len = h % 6 === 0 ? 0.22 : 0.1;
        return (
          <mesh key={h} position={[Math.cos(a) * (RING.radius - len / 2), Math.sin(a) * (RING.radius - len / 2), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[len, 0.012, 0.012]} />
            <meshBasicMaterial color={h % 6 === 0 ? COLORS.goldHot : "#6D7578"} toneMapped={false} />
          </mesh>
        );
      })}
      {arcs.map((a, i) => (
        <mesh key={a.name} rotation={[0, 0, a.start]}>
          <torusGeometry args={[a.r, 0.035, 8, 120, a.span]} />
          <meshBasicMaterial color={["#2E6B52", "#3E8E6B", "#00B862", COLORS.up][i]} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      {arcs.map((a) => (
        <SceneLabel key={`l-${a.name}`} position={[Math.cos(a.mid) * (a.r + 0.45), Math.sin(a.mid) * (a.r + 0.45), 0]} smoothed={smoothed} show={labelWindow}>
          {a.name}
        </SceneLabel>
      ))}
      <group ref={hand}>
        <mesh position={[0, (RING.radius + 0.6) / 2, 0]}>
          <boxGeometry args={[0.018, RING.radius - 0.4, 0.018]} />
          <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
        </mesh>
      </group>
      <SceneLabel position={[0, RING.radius + 1.0, 0]} smoothed={smoothed} show={labelWindow}>
        Crypto · 24/7/365
      </SceneLabel>
    </group>
  );
}

/* ----------------------------------------------------------- voice rings */

function VoiceRings({ smoothed, still }: Shared) {
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = actWeight(p, "ask", 0.03);
    const t = still ? 0.35 : s.clock.elapsedTime;
    rings.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * 0.55 + i / 3) % 1;
      m.visible = w > 0.002;
      m.scale.setScalar(1.1 + phase * 1.6);
      (m.material as THREE.MeshBasicMaterial).opacity = w * (1 - phase) * 0.7;
    });
  });
  return (
    <group name="VoiceRings">
      {[0, 1, 2].map((i) => (
        <mesh key={i} ref={(el) => void (rings.current[i] = el)} visible={false}>
          <torusGeometry args={[CORE.shell, 0.01, 8, 120]} />
          <meshBasicMaterial color={COLORS.goldHot} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* --------------------------------------------------- the OS desktop */

/** Six cores unfold into windows; a dock settles underneath. Charts are one
 *  window among many — AFVAR is the operating system around them. */
function Desktop({ smoothed }: Shared) {
  const wins = useRef<(THREE.Group | null)[]>([]);
  const dock = useRef<THREE.Group>(null);
  const chartGeo = useMemo(() => {
    const pts = [0, 0.18, 0.08, 0.32, 0.22, 0.5, 0.38, 0.62, 0.55, 0.8].map((y, i) => new THREE.Vector3(-1.0 + i * 0.22, -0.45 + y, 0.03));
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, []);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    WINDOWS.forEach((_, i) => {
      const g = wins.current[i];
      if (!g) return;
      const k = easeOut(ramp(p, 0.645 + i * 0.008, 0.695 + i * 0.008)) * (1 - easeInOut(ramp(p, 0.775, 0.815)));
      g.visible = k > 0.002;
      g.scale.set(Math.max(0.0001, k), Math.max(0.0001, k), 1);
    });
    const d = easeOut(ramp(p, 0.68, 0.72)) * (1 - easeInOut(ramp(p, 0.775, 0.81)));
    if (dock.current) {
      dock.current.visible = d > 0.002;
      dock.current.position.y = DOCK.y - (1 - d) * 0.6;
    }
  });

  const labelWindow = [0.69, 0.7, 0.765, 0.78] as const;
  return (
    <group name="Desktop">
      {WINDOWS.map((w, i) => (
        <group key={w.label} ref={(el) => void (wins.current[i] = el)} position={[w.x, w.y, OS_Z]} visible={false}>
          <RoundedBox args={[w.w, w.h, 0.04]} radius={0.06} smoothness={4}>
            <meshPhysicalMaterial color="#14181b" roughness={0.35} metalness={0.1} clearcoat={0.6} />
          </RoundedBox>
          <mesh position={[0, w.h / 2 - 0.12, 0.025]}>
            <planeGeometry args={[w.w - 0.08, 0.005]} />
            <meshBasicMaterial color="#3A4046" />
          </mesh>
          {[0, 1, 2].map((d) => (
            <mesh key={d} position={[-w.w / 2 + 0.14 + d * 0.11, w.h / 2 - 0.07, 0.025]}>
              <circleGeometry args={[0.025, 16]} />
              <meshBasicMaterial color={i === 0 && d === 0 ? COLORS.gold : "#3A3F42"} toneMapped={false} />
            </mesh>
          ))}
          {i === 0 ? (
            <lineSegments geometry={chartGeo}>
              <lineBasicMaterial color={COLORS.up} toneMapped={false} />
            </lineSegments>
          ) : (
            [0, 1, 2].map((r) => (
              <mesh key={r} position={[-w.w / 2 + 0.2 + (w.w * 0.6) / 2, w.h / 2 - 0.36 - r * 0.2, 0.025]}>
                <planeGeometry args={[w.w * (0.6 - r * 0.12), 0.05]} />
                <meshBasicMaterial color={r === 0 ? "#4A545A" : "#2A3034"} />
              </mesh>
            ))
          )}
          <SceneLabel position={[0, w.h / 2 + 0.2, 0]} smoothed={smoothed} show={labelWindow}>
            {w.label}
          </SceneLabel>
        </group>
      ))}
      <group ref={dock} position={[DOCK.x, DOCK.y, OS_Z + 0.6]} visible={false}>
        <RoundedBox args={[(SATELLITES.length + 0.6) * DOCK.gap, DOCK.size + 0.22, 0.06]} radius={0.12} smoothness={4}>
          <meshPhysicalMaterial color="#101315" roughness={0.4} clearcoat={0.5} />
        </RoundedBox>
        {SATELLITES.map((sat, i) => (
          <RoundedBox key={sat.id} args={[DOCK.size, DOCK.size, 0.08]} radius={0.08} smoothness={4} position={[(i - (SATELLITES.length - 1) / 2) * DOCK.gap, 0, 0.06]}>
            <meshStandardMaterial color={i === 0 ? COLORS.gold : "#232a2f"} emissive={i === 0 ? COLORS.gold : "#000000"} emissiveIntensity={i === 0 ? 0.9 : 0} toneMapped={false} />
          </RoundedBox>
        ))}
      </group>
    </group>
  );
}

/* --------------------------------------------------------- policy gate */

/** Every request passes the gate. Workspace actions go through; a trade
 *  request is stopped at the gate and refused. */
function PolicyGate({ smoothed, still }: Shared) {
  const group = useRef<THREE.Group>(null);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const refused = useRef<THREE.Mesh>(null);
  const PASS = 5;

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = actWeight(p, "trust", 0.035);
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.6 + 0.4 * w);
    }
    if (w <= 0.002) return;
    const t = still ? 0.4 : s.clock.elapsedTime;
    packets.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.28 + i / PASS) % 1;
      m.position.set(0.9 + u * 4.4, Math.sin(i * 1.7) * 0.35, Math.cos(i * 2.3) * 0.3);
      m.scale.setScalar(0.07 * w * (u < 0.92 ? 1 : (1 - u) / 0.08));
    });
    // The refused request: travels to the gate, stops, flashes, dissolves.
    if (refused.current) {
      const u = ramp(p, 0.83, 0.86);
      const fade = 1 - ramp(p, 0.885, 0.91);
      refused.current.position.set(0.9 + u * (GATE.x - 1.25), -0.05, 0);
      const flash = u >= 1 && !still ? 0.6 + 0.4 * Math.abs(Math.sin(t * 6)) : 1;
      refused.current.scale.setScalar(Math.max(0.0001, 0.11 * fade * flash * ramp(p, 0.815, 0.83)));
    }
  });

  const gateLabel = [0.82, 0.835, 0.9, 0.92] as const;
  const refuseLabel = [0.855, 0.865, 0.895, 0.91] as const;
  return (
    <group ref={group} name="PolicyGate" visible={false}>
      <group position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <MachinedArc radius={GATE.radius} thickness={0.12} />
        <mesh>
          <torusGeometry args={[GATE.radius - 0.1, 0.012, 8, 120]} />
          <meshBasicMaterial color={COLORS.gold} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <circleGeometry args={[GATE.radius - 0.08, 48]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.06} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: PASS }, (_, i) => (
        <mesh key={i} ref={(el) => void (packets.current[i] = el)}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={refused}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={COLORS.down} toneMapped={false} />
      </mesh>
      <SceneLabel position={[GATE.x, GATE.radius + 0.35, 0]} smoothed={smoothed} show={gateLabel}>
        Policy gate
      </SceneLabel>
      <SceneLabel position={[GATE.x - 0.4, -0.55, 0]} smoothed={smoothed} show={refuseLabel} tone="down">
        Place trade · refused
      </SceneLabel>
    </group>
  );
}
