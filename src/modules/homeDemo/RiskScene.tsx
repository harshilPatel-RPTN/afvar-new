"use client";

// Chapter 06 — RISK GUARDIAN scene. The account core with orbiting positions,
// a guardian perimeter raised from plain words, exposure spreading toward the
// limit, and a warning that only warns — every position keeps orbiting, nothing
// is closed. Same motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useRef, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "./originConfig";
import {
  CAMERA_KEYS,
  CORE6,
  EXPOSURE,
  FLOOR_Y,
  FOV,
  GRID_REVEAL,
  PARALLAX,
  PERIMETER,
  POSITIONS,
  PROGRESS_DAMP,
  SETTLED_P,
  WARNING,
} from "./riskConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface RiskSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

/** Warning envelope: on through the window, released over `calm`. */
const warnLevel = (p: number) =>
  ramp(p, WARNING.window[0], WARNING.window[0] + 0.03) * (1 - easeInOut(ramp(p, WARNING.calm[0], WARNING.calm[1])));

export default function RiskScene({ progress, active, still }: RiskSceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);
  const shared: Shared = { smoothed, still };

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: CAMERA_KEYS[0].pos as unknown as THREE.Vector3, fov: FOV[0] }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <color attach="background" args={[COLORS.bg]} />
      <fog attach="fog" args={[COLORS.bg, 9, 20]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />

      <AdaptiveQuality />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.14} />
        <spotLight position={[5, 8, 6]} angle={0.45} penumbra={1} intensity={55} color="#e8edf6" />
        <pointLight position={[-5, 2.5, -4]} intensity={16} color={COLORS.up} />
        <pointLight position={[5, 0.5, 3]} intensity={4.5} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.7} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.down} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <AccountCore {...shared} />
      <OrbitingPositions {...shared} />
      <GuardianPerimeter {...shared} />
      <ExposureField {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={20} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />
        <Vignette darkness={0.45} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/* ------------------------------------------------------------ account core */

function AccountCore({ smoothed, still }: Shared) {
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const warn = warnLevel(p);
    // Calm heartbeat that quickens under pressure, settles after the warning.
    const rate = 1.2 + ramp(p, EXPOSURE.window[0], EXPOSURE.window[1]) * 1.6 - easeInOut(ramp(p, WARNING.calm[0], WARNING.calm[1])) * 1.2;
    const beat = still ? 0.35 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * rate)), 8);
    if (inner.current) inner.current.emissiveIntensity = 0.7 + beat * 0.7 + warn * 0.3;
    if (light.current) light.current.intensity = 4 + beat * 5;
  });

  return (
    <group position={CORE6.pos as unknown as THREE.Vector3} name="AccountCore">
      <mesh>
        <sphereGeometry args={[CORE6.shellRadius, 40, 40]} />
        <meshPhysicalMaterial color="#35604A" metalness={0} roughness={0.16} transmission={0.92} thickness={0.4} ior={1.45} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[CORE6.innerRadius, 24, 24]} />
        <meshStandardMaterial ref={inner} color="#07301D" emissive={COLORS.up} emissiveIntensity={0.7} roughness={0.3} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.up} intensity={4} distance={6} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------- orbiting positions */

/** Open positions circling the account. One turns rogue — and still, nothing
 *  is closed: the Guardian never acts. */
function OrbitingPositions({ smoothed, still }: Shared) {
  const chips = useRef<(THREE.Mesh | null)[]>([]);
  const rogueMat = useRef<THREE.MeshStandardMaterial | null>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const rogue = easeInOut(ramp(p, POSITIONS.rogueWindow[0], POSITIONS.rogueWindow[1]));
    const t = still ? 0 : s.clock.elapsedTime * POSITIONS.speed;
    chips.current.forEach((chip, i) => {
      if (!chip) return;
      const a = t + (i / POSITIONS.count) * Math.PI * 2;
      chip.position.set(Math.cos(a) * POSITIONS.orbitRadius, POSITIONS.orbitY + Math.sin(a * 1.7) * 0.06, Math.sin(a) * POSITIONS.orbitRadius);
      chip.rotation.y = -a;
      if (i === POSITIONS.rogueIndex) chip.scale.setScalar(1 + rogue * 0.65);
    });
    if (rogueMat.current) {
      rogueMat.current.emissive.copy(ROGUE_FROM).lerp(ROGUE_TO, rogue);
      rogueMat.current.emissiveIntensity = 0.3 + rogue * 0.5;
    }
  });

  return (
    <group name="OrbitingPositions">
      {Array.from({ length: POSITIONS.count }, (_, i) => (
        <mesh key={i} ref={(el) => void (chips.current[i] = el)}>
          <boxGeometry args={[POSITIONS.size, POSITIONS.size * 0.55, POSITIONS.size * 0.18]} />
          {i === POSITIONS.rogueIndex ? (
            <meshStandardMaterial ref={rogueMat} color="#1a2b22" metalness={0.8} roughness={0.3} emissive={COLORS.up} emissiveIntensity={0.3} />
          ) : (
            <meshStandardMaterial color="#1a2b22" metalness={0.8} roughness={0.3} emissive={COLORS.up} emissiveIntensity={0.3} />
          )}
        </mesh>
      ))}
    </group>
  );
}
const ROGUE_FROM = new THREE.Color("#00E676");
const ROGUE_TO = new THREE.Color("#FF3B3B");

/* -------------------------------------------------------- guardian perimeter */

function GuardianPerimeter({ smoothed, still }: Shared) {
  const wallMat = useRef<THREE.MeshStandardMaterial>(null);
  const wall = useRef<THREE.Mesh>(null);
  const ringMat = useRef<THREE.MeshBasicMaterial>(null);
  const outerMat = useRef<THREE.MeshBasicMaterial>(null);
  const ripples = useRef<(THREE.Mesh | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const rise = easeOut(ramp(p, PERIMETER.rise[0], PERIMETER.rise[1]));
    const warn = warnLevel(p);
    if (wall.current) {
      wall.current.visible = rise > 0.001;
      wall.current.scale.setY(Math.max(0.0001, rise));
    }
    if (wallMat.current) {
      // Green while guarding; pulses red while warning; returns to green.
      const pulse = still ? 0.5 : 0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 4);
      wallMat.current.emissive.copy(ROGUE_FROM).lerp(ROGUE_TO, warn * (0.55 + 0.45 * pulse));
      wallMat.current.emissiveIntensity = 0.35 + warn * (0.5 + pulse * 0.5);
      wallMat.current.opacity = 0.18 * rise + warn * 0.12;
    }
    if (ringMat.current) ringMat.current.opacity = rise * 0.5;
    if (outerMat.current) outerMat.current.opacity = easeOut(ramp(p, PERIMETER.outerRise[0], PERIMETER.outerRise[1])) * 0.2;

    // Warning ripples expanding from the perimeter outward — a broadcast, not an action.
    ripples.current.forEach((m, i) => {
      if (!m) return;
      const t = still ? 0.4 : ((s.clock.elapsedTime * 0.5 + i / WARNING.ripples) % 1);
      m.visible = warn > 0.01;
      const r = PERIMETER.radius + t * 1.4;
      m.scale.setScalar(r / PERIMETER.radius);
      (m.material as THREE.MeshBasicMaterial).opacity = warn * (1 - t) * 0.35;
    });
  });

  return (
    <group name="GuardianPerimeter">
      {/* translucent guardian wall */}
      <mesh position={[0, 0, 0]} ref={wall} visible={false}>
        <cylinderGeometry args={[PERIMETER.radius, PERIMETER.radius, PERIMETER.wallHeight * 2, 64, 1, true]} />
        <meshStandardMaterial
          ref={wallMat}
          color="#10241a"
          emissive={COLORS.up}
          emissiveIntensity={0.35}
          transparent
          opacity={0}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* floor rings: the daily-loss limit and the fainter drawdown limit */}
      <mesh position={[0, FLOOR_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PERIMETER.radius, 0.008, 8, 96]} />
        <meshBasicMaterial ref={ringMat} color={COLORS.up} transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh position={[0, FLOOR_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <torusGeometry args={[PERIMETER.outerRadius, 0.006, 8, 96]} />
        <meshBasicMaterial ref={outerMat} color={COLORS.up} transparent opacity={0} toneMapped={false} />
      </mesh>
      {/* warning ripples */}
      {Array.from({ length: WARNING.ripples }, (_, i) => (
        <mesh key={i} position={[0, FLOOR_Y + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]} visible={false} ref={(el) => void (ripples.current[i] = el)}>
          <torusGeometry args={[PERIMETER.radius, 0.012, 8, 96]} />
          <meshBasicMaterial color={COLORS.down} transparent opacity={0} toneMapped={false} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ exposure field */

/** The exposure disc spreading from the core toward the limit — and receding
 *  after the warning, because the trader acted. AFVAR never did. */
function ExposureField({ smoothed }: Shared) {
  const disc = useRef<THREE.Mesh>(null);
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const grow = easeInOut(ramp(p, EXPOSURE.window[0], EXPOSURE.window[1]));
    const recede = easeInOut(ramp(p, WARNING.calm[0], WARNING.calm[1]));
    const r = THREE.MathUtils.lerp(EXPOSURE.from, EXPOSURE.to, grow * (1 - 0.35 * recede));
    const m = disc.current;
    if (m) {
      m.visible = grow > 0.001;
      m.scale.setScalar(r);
    }
    if (mat.current) {
      mat.current.color.copy(ROGUE_FROM).lerp(ROGUE_TO, grow * (1 - recede));
      mat.current.opacity = EXPOSURE.maxOpacity * grow;
    }
  });

  return (
    <mesh position={[0, FLOOR_Y + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} ref={disc} visible={false}>
      <circleGeometry args={[1, 64]} />
      <meshBasicMaterial ref={mat} color={COLORS.up} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}
