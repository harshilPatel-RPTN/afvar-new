"use client";

// Chapter 03 — INTELLIGENCE scene. A reasoning lattice: the question node
// pulses, paths draw through three layers of reasoning nodes, supporting
// paths brighten while contradicting paths dim, survivors converge into the
// output core and the verdict crystallises. Same motion system as every
// chapter — damped master progress, spline camera, pure functions of p.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  CAMERA_KEYS,
  CONVERGE,
  CORE3,
  FLOOR_Y,
  FOV,
  GRID_REVEAL,
  INPUT,
  NODES,
  NODE_PULSE,
  OUTPUT,
  PARALLAX,
  PATHS,
  PATH_RADIUS,
  PATH_REVEAL,
  PROGRESS_DAMP,
  SETTLED_P,
  WEIGH,
  coreIntensity3,
  SOUND,
} from "./intelligenceConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, SoundCues, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface IntelligenceSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

export default function IntelligenceScene({ progress, active, still }: IntelligenceSceneProps) {
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
      <fog attach="fog" args={[COLORS.bg, 9, 22]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />

      <AdaptiveQuality />

      <SoundCues smoothed={smoothed} cues={SOUND} />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.14} />
        <spotLight position={[5, 8, 6]} angle={0.45} penumbra={1} intensity={55} color="#e8edf6" />
        <pointLight position={[-5, 2.5, -4]} intensity={16} color={COLORS.up} />
        <pointLight position={[4, 0, 3]} intensity={4} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.7} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.down} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <QuestionNode {...shared} />
      <ReasonLattice {...shared} />
      <OutputCore {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[-1, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={20} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />
        <Vignette darkness={0.45} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/* ----------------------------------------------------------- question node */

/** The question: a pulsing point of light where the journey begins. */
function QuestionNode({ smoothed, still }: Shared) {
  const halo = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    // Pulses while the question stage holds, calms once reasoning takes over.
    const calm = 1 - 0.7 * ramp(p, 0.18, 0.3);
    const beat = still ? 0.35 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 1.8)), 8) * calm;
    halo.current?.scale.setScalar(1 + beat * 0.5);
    if (light.current) light.current.intensity = 2 + beat * 3;
    const mat = halo.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.18 + beat * 0.25;
  });

  return (
    <group position={INPUT} name="QuestionNode">
      <mesh>
        <sphereGeometry args={[0.06, 20, 20]} />
        <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.12, 20, 20]} />
        <meshBasicMaterial color={COLORS.up} transparent opacity={0.22} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.up} intensity={2} distance={4} decay={2} />
    </group>
  );
}

/* --------------------------------------------------------- reasoning lattice */

function ReasonLattice({ smoothed }: Shared) {
  const pathMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const pathMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const nodeMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const geos = useMemo(
    () =>
      PATHS.map((path) => {
        const pts = path.via.map((n) => new THREE.Vector3(...NODES[n]));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, "centripetal"), 120, PATH_RADIUS, 7, false);
      }),
    [],
  );

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const weigh = easeInOut(ramp(p, WEIGH[0], WEIGH[1]));
    const converge = easeInOut(ramp(p, CONVERGE[0], CONVERGE[1]));

    PATHS.forEach((path, i) => {
      const w0 = PATH_REVEAL.start + i * PATH_REVEAL.step;
      const explored = easeOut(ramp(p, w0, w0 + PATH_REVEAL.dur));
      // Supporting paths hold their final reach back until convergence.
      const drawn = path.up ? explored * (1 - PATH_REVEAL.holdBack) + PATH_REVEAL.holdBack * converge : explored;
      const mesh = pathMeshes.current[i];
      if (mesh) {
        mesh.visible = drawn > 0.001;
        setDraw(mesh, drawn);
      }
      const mat = pathMats.current[i];
      if (mat) {
        if (path.up) {
          mat.emissiveIntensity = 0.5 + weigh * 0.65;
          mat.opacity = 1;
        } else {
          mat.emissiveIntensity = 0.55 - weigh * 0.38;
          mat.opacity = 1 - weigh * 0.65;
        }
      }
    });

    // Reasoning nodes wake as the first paths pass through them.
    for (let n = 1; n < NODES.length - 1; n++) {
      const mat = nodeMats.current[n];
      if (!mat) continue;
      const w0 = NODE_PULSE.start + (n - 1) * NODE_PULSE.step;
      mat.emissiveIntensity = 0.1 + easeOut(ramp(p, w0, w0 + NODE_PULSE.dur)) * 0.6;
    }
  });

  return (
    <group name="ReasonLattice">
      {PATHS.map((path, i) => (
        <mesh key={i} geometry={geos[i]} ref={(el) => void (pathMeshes.current[i] = el)} visible={false}>
          <meshStandardMaterial
            ref={(el) => void (pathMats.current[i] = el)}
            color={path.up ? COLORS.up : COLORS.down}
            emissive={path.up ? COLORS.up : COLORS.down}
            emissiveIntensity={0.5}
            transparent
            toneMapped={false}
          />
        </mesh>
      ))}
      {NODES.slice(1, -1).map((pos, idx) => (
        <mesh key={idx} position={pos}>
          <sphereGeometry args={[0.07, 18, 18]} />
          <meshStandardMaterial
            ref={(el) => void (nodeMats.current[idx + 1] = el)}
            color={COLORS.metalBright}
            metalness={0.9}
            roughness={0.25}
            emissive={COLORS.up}
            emissiveIntensity={0.1}
          />
        </mesh>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------- output core */

/** The verdict: a core that forms only when the surviving paths reach it. */
function OutputCore({ smoothed }: Shared) {
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const shell = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const glow = coreIntensity3(p);
    if (inner.current) inner.current.emissiveIntensity = 0.15 + glow * 1.35;
    if (light.current) light.current.intensity = 0.5 + glow * 13;
    // The shell scales in with convergence — the verdict literally forms.
    const k = easeInOut(ramp(p, CONVERGE[0], CONVERGE[1]));
    shell.current?.parent?.scale.setScalar(0.25 + 0.75 * k);
  });

  return (
    <group position={OUTPUT} name="OutputCore">
      <mesh ref={shell}>
        <sphereGeometry args={[CORE3.shellRadius, 40, 40]} />
        <meshPhysicalMaterial color="#35604A" metalness={0} roughness={0.16} transmission={0.92} thickness={0.4} ior={1.45} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <mesh>
        <sphereGeometry args={[CORE3.innerRadius, 24, 24]} />
        <meshStandardMaterial ref={inner} color="#07301D" emissive={COLORS.up} emissiveIntensity={0.15} roughness={0.3} toneMapped={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.up} intensity={0.5} distance={7} decay={2} />
    </group>
  );
}
