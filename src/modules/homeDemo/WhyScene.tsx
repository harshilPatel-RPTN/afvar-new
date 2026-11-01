"use client";

// Chapter 09 — WHY AFVAR scene. Deliberately minimal: one line receding into
// the dark, three machined markers lighting in turn, then the whole scene
// recedes so the reasons can be read. Same motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";
import { CAMERA_KEYS, DIM, FLOOR_Y, FOV, GRID_REVEAL, LINE, MARKERS, PARALLAX, PROGRESS_DAMP, SETTLED_P } from "./whyConfig";

export interface WhySceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

export default function WhyScene({ progress, active, still }: WhySceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);
  const shared: Shared = { smoothed, still };

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: CAMERA_KEYS[0].pos as unknown as THREE.Vector3, fov: FOV[0] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[COLORS.bg, 6, 18]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />

      <AdaptiveQuality />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <ambientLight intensity={0.12} />
      <spotLight position={[4, 7, 6]} angle={0.45} penumbra={1} intensity={40} color="#e8edf6" />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.4} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={0.9} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
      </Environment>

      <QuietLine {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={16} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.45} />

      </EffectComposer>
    </Canvas>
  );
}

function QuietLine({ smoothed }: Shared) {
  const line = useRef<THREE.Mesh>(null);
  const lineMat = useRef<THREE.MeshStandardMaterial>(null);
  const rings = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);

  const { geo, points } = useMemo(() => {
    const curve = new THREE.LineCurve3(new THREE.Vector3(...LINE.from), new THREE.Vector3(...LINE.to));
    return {
      geo: new THREE.TubeGeometry(curve, 120, LINE.radius, 8, false),
      points: MARKERS.map((m) => curve.getPointAt(m.u)),
    };
  }, []);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const dim = 1 - 0.65 * easeInOut(ramp(p, DIM[0], DIM[1]));
    setDraw(line.current, easeOut(ramp(p, LINE.draw[0], LINE.draw[1])));
    if (lineMat.current) lineMat.current.emissiveIntensity = 0.7 * dim;
    MARKERS.forEach((m, i) => {
      const lit = easeOut(ramp(p, m.light[0], m.light[1]));
      const ring = rings.current[i];
      if (ring) ring.emissiveIntensity = (0.05 + lit * 0.9) * dim;
      dots.current[i]?.scale.setScalar(Math.max(0.0001, lit * dim));
    });
  });

  // Rings stand perpendicular to the line direction.
  const yaw = Math.atan2(LINE.to[0] - LINE.from[0], LINE.to[2] - LINE.from[2]);

  return (
    <group name="QuietLine">
      <mesh ref={line} geometry={geo}>
        <meshStandardMaterial ref={lineMat} color={COLORS.up} emissive={COLORS.up} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
      {points.map((pt, i) => (
        <group key={i} position={pt} rotation={[0, yaw, 0]}>
          <mesh>
            <torusGeometry args={[0.26, 0.022, 14, 64]} />
            <meshStandardMaterial
              ref={(el) => void (rings.current[i] = el)}
              color={COLORS.metalBright}
              metalness={0.92}
              roughness={0.25}
              emissive={COLORS.up}
              emissiveIntensity={0.05}
            />
          </mesh>
          <mesh ref={(el) => void (dots.current[i] = el)} scale={0.0001}>
            <sphereGeometry args={[0.05, 16, 16]} />
            <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
