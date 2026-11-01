"use client";

// Chapter 05 — ALERTS & STRATEGY scene. Condition gates rise over a price
// line, a scanner walks it candle close by candle close, and when the line
// breaks the armed threshold the alert beacon fires — the break happens under
// the user's scroll, so cause and effect are physical. Same motion system as
// every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  BEACON,
  CAMERA_KEYS,
  FLOOR_Y,
  FOV,
  GATES,
  GATE_LOCK,
  GRID_REVEAL,
  LINE_DRAW,
  LINE_RADIUS,
  PARALLAX,
  PROGRESS_DAMP,
  SCANNER,
  SETTLED_P,
  THRESHOLD,
  makeLineCurve,
  LABELS,
  SOUND,
} from "./alertsConfig";
import { COLORS } from "./originConfig";
import {
  AdaptiveQuality,
  CameraRig,
  FadeGrid,
  ProgressDamper,
  SceneLabel,
  SoundCues,
  setDraw,
} from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface AlertsSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = {
  smoothed: RefObject<number>;
  still: boolean;
  curve: THREE.CatmullRomCurve3;
};

/** Line draw fraction: to the hold through `confirm`, completed through `trigger`. */
const lineDrawn = (p: number) =>
  LINE_DRAW.hold * easeOut(ramp(p, LINE_DRAW.phase1[0], LINE_DRAW.phase1[1])) +
  (1 - LINE_DRAW.hold) *
    easeInOut(ramp(p, LINE_DRAW.phase2[0], LINE_DRAW.phase2[1]));

export default function AlertsScene({
  progress,
  active,
  still,
}: AlertsSceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);
  const curve = useMemo(() => makeLineCurve(), []);
  const shared: Shared = { smoothed, still, curve };
  // Labels render into this layer we own, not into the canvas wrapper
  // React manages — so unmounting the scene never fights over the nodes.
  const labelLayer = useRef<HTMLDivElement>(null!);

  return (
    <div className="relative h-full w-full">
      <Canvas
        dpr={[1, 1.75]}
        frameloop={active && !still ? "always" : "demand"}
        camera={{
          position: CAMERA_KEYS[0].pos as unknown as THREE.Vector3,
          fov: FOV[0],
        }}
        gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
        aria-hidden="true"
      >
        <fog attach="fog" args={[COLORS.bg, 10, 24]} />

        <ProgressDamper
          progress={progress}
          smoothed={smoothed}
          still={still}
          settledP={SETTLED_P}
          lambda={PROGRESS_DAMP}
        />

        <AdaptiveQuality />

        <SoundCues smoothed={smoothed} cues={SOUND} />
        <CameraRig
          smoothed={smoothed}
          still={still}
          keys={CAMERA_KEYS}
          fov={FOV}
          parallax={PARALLAX}
        />

        <group name="LightingGroup">
          <ambientLight intensity={0.14} />
          <spotLight
            position={[5, 8, 6]}
            angle={0.45}
            penumbra={1}
            intensity={55}
            color="#e8edf6"
          />
          <pointLight
            position={[-5, 2.5, -4]}
            intensity={16}
            color={COLORS.up}
          />
          <pointLight
            position={[5, 0.5, 3]}
            intensity={4.5}
            color={COLORS.down}
          />
        </group>
        <Environment resolution={256} frames={1}>
          <Lightformer
            form="rect"
            intensity={1.7}
            position={[0, 5, -4]}
            scale={[12, 4, 1]}
          />
          <Lightformer
            form="rect"
            intensity={1.1}
            color={COLORS.up}
            position={[-6, 1, 2]}
            rotation-y={Math.PI / 2}
            scale={[8, 3, 1]}
          />
          <Lightformer
            form="rect"
            intensity={0.45}
            color={COLORS.down}
            position={[6, -0.5, 1]}
            rotation-y={-Math.PI / 2}
            scale={[8, 2, 1]}
          />
        </Environment>

        <PriceLine {...shared} />
        <ThresholdLine {...shared} />
        <ConditionGates {...shared} />
        <Scanner {...shared} />
        <AlertBeacon {...shared} />
        {(Object.keys(LABELS) as (keyof typeof LABELS)[]).map((k) => (
          <SceneLabel
            key={k}
            position={LABELS[k].pos}
            smoothed={smoothed}
            portal={labelLayer}
            show={LABELS[k].show}
            tone={
              k.endsWith("True") || k === "beacon" || k === "breakout"
                ? "up"
                : "neutral"
            }
          >
            {LABELS[k].text}
          </SceneLabel>
        ))}
        <FadeGrid
          smoothed={smoothed}
          reveal={GRID_REVEAL}
          position={[0, FLOOR_Y, 0]}
          cell={COLORS.gridCell}
          section={COLORS.gridSection}
          fadeDistance={24}
        />

        <EffectComposer multisampling={4}>
          <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />

        </EffectComposer>
      </Canvas>
      <div
        ref={labelLayer}
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      />
    </div>
  );
}

/* -------------------------------------------------------------- price line */

function PriceLine({ smoothed, curve }: Shared) {
  const line = useRef<THREE.Mesh>(null);
  const geo = useMemo(
    () => new THREE.TubeGeometry(curve, 220, LINE_RADIUS, 8, false),
    [curve],
  );

  useFrame(() => {
    setDraw(line.current, lineDrawn(smoothed.current ?? 0));
  });

  return (
    <mesh ref={line} geometry={geo} name="PriceLine">
      <meshStandardMaterial
        color={COLORS.up}
        emissive={COLORS.up}
        emissiveIntensity={0.95}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ---------------------------------------------------------------- threshold */

/** The armed "weekly high" level; flashes once when the line breaks it. */
function ThresholdLine({ smoothed, still }: Shared) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);
  const mesh = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const reveal = easeOut(ramp(p, THRESHOLD.reveal[0], THRESHOLD.reveal[1]));
    const d = (p - THRESHOLD.flash.at) / THRESHOLD.flash.width;
    const flash = Math.exp(-d * d);
    if (mesh.current) mesh.current.visible = reveal > 0.001;
    if (mat.current) {
      mat.current.opacity = reveal * (0.3 + flash * 0.7);
      // Breathe faintly while armed, before the break.
      if (
        !still &&
        flash < 0.05 &&
        p > GATE_LOCK[0] &&
        p < THRESHOLD.flash.at
      ) {
        mat.current.opacity =
          reveal * (0.26 + 0.1 * Math.sin(s.clock.elapsedTime * 1.6));
      }
    }
  });

  const width = THRESHOLD.x[1] - THRESHOLD.x[0];
  return (
    <mesh
      ref={mesh}
      position={[(THRESHOLD.x[0] + THRESHOLD.x[1]) / 2, THRESHOLD.y, 0]}
      visible={false}
    >
      <boxGeometry args={[width, 0.012, 0.012]} />
      <meshBasicMaterial
        ref={mat}
        color={COLORS.upBright}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------------- gates */

/** Rectangular condition frames the price line passes through. */
function ConditionGates({ smoothed }: Shared) {
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[][]>([[], []]);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const lock = easeInOut(ramp(p, GATE_LOCK[0], GATE_LOCK[1]));
    GATES.forEach((gate, i) => {
      const rise = easeOut(ramp(p, gate.rise[0], gate.rise[1]));
      const g = groups.current[i];
      if (g) {
        g.visible = rise > 0.001;
        g.scale.setY(Math.max(0.0001, rise));
      }
      mats.current[i]?.forEach((m) => {
        if (m) m.emissiveIntensity = 0.12 + lock * 0.55;
      });
    });
  });

  const bar = 0.045;
  return (
    <group name="ConditionGates">
      {GATES.map((gate, i) => (
        <group
          key={i}
          position={[gate.x, FLOOR_Y, 0]}
          ref={(el) => void (groups.current[i] = el)}
          visible={false}
        >
          {/* frame: two uprights + top beam, standing across the line's z */}
          {[-gate.w / 2, gate.w / 2].map((z, j) => (
            <mesh key={j} position={[0, gate.h / 2, z]}>
              <boxGeometry args={[bar, gate.h, bar]} />
              <meshStandardMaterial
                ref={(el) => void (mats.current[i][j] = el)}
                color={COLORS.metalBright}
                metalness={0.9}
                roughness={0.28}
                emissive={COLORS.up}
                emissiveIntensity={0.12}
              />
            </mesh>
          ))}
          <mesh position={[0, gate.h, 0]}>
            <boxGeometry args={[bar, bar, gate.w + bar]} />
            <meshStandardMaterial
              ref={(el) => void (mats.current[i][2] = el)}
              color={COLORS.metalBright}
              metalness={0.9}
              roughness={0.28}
              emissive={COLORS.up}
              emissiveIntensity={0.12}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- scanner */

const scanPos = new THREE.Vector3();

/** A code ring that walks the line while armed — every closed candle, checked. */
function Scanner({ smoothed, still, curve }: Shared) {
  const ring = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = ramp(p, SCANNER.window[0], SCANNER.window[1]);
    const m = ring.current;
    if (!m) return;
    m.visible = t > 0.001 && t < 0.999;
    if (!m.visible) return;
    // Walk along the drawn line between the configured x-range.
    const u0 = (SCANNER.xRange[0] + 7) / 14;
    const u1 = (SCANNER.xRange[1] + 7) / 14;
    curve.getPointAt(THREE.MathUtils.lerp(u0, u1, easeInOut(t)), scanPos);
    m.position.copy(scanPos);
    m.rotation.y = Math.PI / 2;
    // Sharp check-ticks, not a soft glow.
    const tick = still
      ? 0.4
      : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 2.4)), 10);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.35 + tick * 0.45;
  });

  return (
    <mesh ref={ring} visible={false}>
      <torusGeometry args={[SCANNER.radius, 0.008, 8, 48]} />
      <meshBasicMaterial
        color={COLORS.upBright}
        transparent
        opacity={0}
        toneMapped={false}
      />
    </mesh>
  );
}

/* ------------------------------------------------------------ alert beacon */

const signalScratch = new THREE.Vector3();
const beaconTip = new THREE.Vector3(BEACON.x, BEACON.height, 0);

function AlertBeacon({ smoothed, still }: Shared) {
  const pillar = useRef<THREE.Group>(null);
  const tip = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);
  const signal = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const rise = easeOut(ramp(p, BEACON.rise[0], BEACON.rise[1]));
    if (pillar.current) {
      pillar.current.visible = rise > 0.001;
      pillar.current.scale.setY(Math.max(0.0001, rise));
    }
    // The fired alert: urgent, repeating pulses while the window holds.
    const live =
      ramp(p, BEACON.pulse[0], BEACON.pulse[0] + 0.03) *
      (1 - ramp(p, BEACON.pulse[1], BEACON.pulse[1] + 0.04));
    const pulse =
      (still ? 0.5 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 3)), 8)) *
      live;
    tip.current?.scale.setScalar(0.9 + pulse * 0.8);
    if (light.current) light.current.intensity = live * (1.5 + pulse * 8);

    // The signal node: crossing point → beacon tip.
    const t = ramp(p, BEACON.signal[0], BEACON.signal[1]);
    const m = signal.current;
    if (m) {
      m.visible = t > 0.001 && t < 0.999;
      if (m.visible) {
        signalScratch.copy(THRESHOLD.crossing).lerp(beaconTip, easeInOut(t));
        signalScratch.y += Math.sin(Math.PI * t) * 0.4; // slight arc
        m.position.copy(signalScratch);
      }
    }
  });

  return (
    <group name="AlertBeacon">
      <group position={[BEACON.x, FLOOR_Y, 0]} ref={pillar} visible={false}>
        <mesh position={[0, BEACON.height / 2, 0]}>
          <cylinderGeometry args={[0.018, 0.018, BEACON.height, 8]} />
          <meshStandardMaterial
            color={COLORS.metalBright}
            metalness={0.85}
            roughness={0.3}
            emissive={COLORS.up}
            emissiveIntensity={0.3}
          />
        </mesh>
        <mesh position={[0, BEACON.height, 0]} ref={tip}>
          <sphereGeometry args={[0.055, 16, 16]} />
          <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
        </mesh>
        <pointLight
          ref={light}
          position={[0, BEACON.height, 0]}
          color={COLORS.up}
          intensity={0}
          distance={5}
          decay={2}
        />
      </group>
      <mesh ref={signal} visible={false}>
        <sphereGeometry args={[0.045, 14, 14]} />
        <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
      </mesh>
    </group>
  );
}
