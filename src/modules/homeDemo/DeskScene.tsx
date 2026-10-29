"use client";

// Chapter 10 — THE DESK scene. Eight app panels fly in from scattered depth
// and assemble into one workspace, the AI core beams to every window, and the
// whole desk then contracts into a single tick of light — the first frame of
// Chapter 01. Same motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  BEAMS10,
  CAMERA_KEYS,
  COLLAPSE,
  CORE10,
  FOV,
  PANELS,
  PANEL_DEPTH,
  PARALLAX,
  PROGRESS_DAMP,
  SETTLED_P,
  assembleAt,
  scatterPose,
  SOUND,
} from "./deskConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, ProgressDamper, SoundCues, setDraw } from "./sceneLib";
import { easeInOut, ramp } from "./timeline";

export interface DeskSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

const beamAt = (i: number) => BEAMS10.start + i * BEAMS10.step;

export default function DeskScene({ progress, active, still }: DeskSceneProps) {
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

      <SoundCues smoothed={smoothed} cues={SOUND} />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.16} />
        <spotLight position={[4, 7, 7]} angle={0.5} penumbra={1} intensity={60} color="#e8edf6" />
        <pointLight position={[-5, 2.5, 3]} intensity={14} color={COLORS.up} />
        <pointLight position={[5, 0, 3]} intensity={4} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.7} position={[0, 5, 4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.down} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <Desk {...shared} />
      <Core {...shared} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />
        <Vignette darkness={0.45} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/* -------------------------------------------------------------------- desk */

const CHART_CANDLES = Array.from({ length: 16 }, (_, k) => {
  const h = 0.18 + (((k * 37) % 13) / 13) * 0.55 + k * 0.025;
  return { x: -1.45 + k * 0.19, h, up: ((k * 53) % 5) !== 1 };
});

const BAR_WIDTHS = [0.72, 0.5, 0.84];

/** All panels + beams live in one group so the collapse scales the world into the core. */
function Desk({ smoothed }: Shared) {
  const world = useRef<THREE.Group>(null);
  const panels = useRef<(THREE.Group | null)[]>([]);
  const accents = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const beams = useRef<(THREE.Mesh | null)[]>([]);

  const poses = useMemo(() => PANELS.map((_, i) => scatterPose(i)), []);
  const beamGeos = useMemo(
    () =>
      PANELS.map((panel) => {
        const [cx, cy] = panel.rect;
        const to = new THREE.Vector3(cx, cy, PANEL_DEPTH);
        const mid = CORE10.pos.clone().lerp(to, 0.5).add(new THREE.Vector3(0, 0.15, 0.25));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([CORE10.pos.clone(), mid, to]), 40, BEAMS10.radius, 6, false);
      }),
    [],
  );

  useFrame(() => {
    const p = smoothed.current ?? 0;
    PANELS.forEach((panel, i) => {
      const g = panels.current[i];
      if (!g) return;
      const [a, b] = assembleAt(i);
      const k = easeInOut(ramp(p, a, b));
      const pose = poses[i];
      g.position.set(
        THREE.MathUtils.lerp(pose.pos.x, panel.rect[0], k),
        THREE.MathUtils.lerp(pose.pos.y, panel.rect[1], k),
        THREE.MathUtils.lerp(pose.pos.z, 0, k),
      );
      g.rotation.set(pose.rot.x * (1 - k), pose.rot.y * (1 - k), pose.rot.z * (1 - k));

      const connected = easeInOut(ramp(p, beamAt(i), beamAt(i) + BEAMS10.dur));
      const accent = accents.current[i];
      if (accent) accent.emissiveIntensity = 0.15 + k * 0.3 + connected * 0.65;

      const beam = beams.current[i];
      if (beam) {
        beam.visible = connected > 0.001;
        setDraw(beam, connected);
      }
    });

    // Collapse: scale the whole world about the core — x' = s·x + P·(1 − s).
    const c = easeInOut(ramp(p, COLLAPSE[0], COLLAPSE[1]));
    const s = Math.max(0.0001, 1 - c);
    const w = world.current;
    if (w) {
      w.scale.setScalar(s);
      w.position.copy(CORE10.pos).multiplyScalar(1 - s);
      w.visible = c < 0.999;
    }
  });

  return (
    <group ref={world} name="Desk">
      {PANELS.map((panel, i) => {
        const [, , pw, ph] = panel.rect;
        const glow = panel.accent === "up" ? COLORS.up : COLORS.down;
        return (
          <group key={panel.key} ref={(el) => void (panels.current[i] = el)}>
            {/* machined window body */}
            <mesh>
              <boxGeometry args={[pw, ph, PANEL_DEPTH]} />
              <meshStandardMaterial color="#0c110e" metalness={0.6} roughness={0.45} />
            </mesh>
            {/* title-bar accent */}
            <mesh position={[0, ph / 2 - 0.05, PANEL_DEPTH / 2 + 0.002]}>
              <boxGeometry args={[pw * 0.94, 0.018, 0.004]} />
              <meshStandardMaterial ref={(el) => void (accents.current[i] = el)} color={glow} emissive={glow} emissiveIntensity={0.15} toneMapped={false} />
            </mesh>
            {panel.kind === "chart"
              ? CHART_CANDLES.map((c, k) => (
                  <mesh key={k} position={[c.x, -ph / 2 + 0.2 + c.h / 2, PANEL_DEPTH / 2 + 0.01]}>
                    <boxGeometry args={[0.08, c.h, 0.012]} />
                    <meshStandardMaterial
                      color={c.up ? COLORS.up : COLORS.down}
                      emissive={c.up ? COLORS.up : COLORS.down}
                      emissiveIntensity={0.45}
                      toneMapped={false}
                    />
                  </mesh>
                ))
              : BAR_WIDTHS.map((bw, k) => (
                  <mesh key={k} position={[-pw / 2 + (pw * bw) / 2 + 0.08, ph / 2 - 0.16 - k * Math.min(0.14, (ph - 0.2) / 3.2), PANEL_DEPTH / 2 + 0.003]}>
                    <boxGeometry args={[(pw - 0.16) * bw, 0.03, 0.004]} />
                    <meshStandardMaterial color="#26352d" emissive={COLORS.up} emissiveIntensity={0.08} />
                  </mesh>
                ))}
          </group>
        );
      })}
      {beamGeos.map((geo, i) => (
        <mesh key={i} geometry={geo} ref={(el) => void (beams.current[i] = el)} visible={false}>
          <meshStandardMaterial color={COLORS.upBright} emissive={COLORS.upBright} emissiveIntensity={1.0} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------- core */

/** The AI core: appears to connect the desk, then remains as the first tick. */
function Core({ smoothed, still }: Shared) {
  const group = useRef<THREE.Group>(null);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const appear = easeInOut(ramp(p, CORE10.appear[0], CORE10.appear[1]));
    const c = easeInOut(ramp(p, COLLAPSE[0], COLLAPSE[1]));
    const g = group.current;
    if (g) {
      g.visible = appear > 0.001;
      // After the collapse it shrinks to tick size and keeps the tick's beat.
      g.scale.setScalar(Math.max(0.0001, appear * (1 - 0.6 * c)));
    }
    const beat = still ? 0.4 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 2.2)), 10);
    if (inner.current) inner.current.emissiveIntensity = 0.9 + c * (0.6 + beat * 1.2);
    if (light.current) light.current.intensity = appear * (6 + c * beat * 8);
    // The glass shell melts away as it becomes a single point of light.
    const mat = shell.current?.material as THREE.MeshPhysicalMaterial | undefined;
    if (mat) mat.opacity = 1 - c;
  });

  return (
    <group ref={group} position={CORE10.pos} visible={false} name="Core">
      <mesh ref={shell}>
        <sphereGeometry args={[CORE10.shellRadius, 40, 40]} />
        <meshPhysicalMaterial
          color="#35604A"
          metalness={0}
          roughness={0.16}
          transmission={0.92}
          thickness={0.4}
          ior={1.45}
          clearcoat={1}
          clearcoatRoughness={0.08}
          transparent
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[CORE10.innerRadius, 24, 24]} />
        <meshStandardMaterial ref={inner} color="#07301D" emissive={COLORS.up} emissiveIntensity={0.9} roughness={0.3} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.up} intensity={0} distance={7} decay={2} />
    </group>
  );
}
