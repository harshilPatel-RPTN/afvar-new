"use client";

// Chapter 04 — CONTEXT scene. A price line with visible spikes, event pillars
// rising at the moments that caused them, sentiment-coloured threads tying
// each event to its move, and a pulsing countdown on the next event. Same
// motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  CAMERA_KEYS,
  EVENTS,
  FLOOR_Y,
  FOCUS,
  FOV,
  GRID_REVEAL,
  LINE_DRAW,
  LINE_RADIUS,
  PARALLAX,
  PILLAR,
  PROGRESS_DAMP,
  SETTLED_P,
  makeLineCurve,
} from "./contextConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface ContextSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

export default function ContextScene({ progress, active, still }: ContextSceneProps) {
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
      <fog attach="fog" args={[COLORS.bg, 10, 24]} />

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

      <PriceLine {...shared} />
      <EventPillars {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={24} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />

      </EffectComposer>
    </Canvas>
  );
}

/* -------------------------------------------------------------- price line */

function PriceLine({ smoothed }: Shared) {
  const line = useRef<THREE.Mesh>(null);
  const geo = useMemo(() => new THREE.TubeGeometry(makeLineCurve(), 220, LINE_RADIUS, 8, false), []);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    setDraw(line.current, easeOut(ramp(p, LINE_DRAW[0], LINE_DRAW[1])));
  });

  return (
    <mesh ref={line} geometry={geo} name="PriceLine">
      <meshStandardMaterial color={COLORS.up} emissive={COLORS.up} emissiveIntensity={0.95} toneMapped={false} />
    </mesh>
  );
}

/* ----------------------------------------------------------- event pillars */

function EventPillars({ smoothed, still }: Shared) {
  const pillars = useRef<(THREE.Group | null)[]>([]);
  const rings = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const tips = useRef<(THREE.Mesh | null)[]>([]);
  const threads = useRef<(THREE.Mesh | null)[]>([]);
  const focusLight = useRef<THREE.PointLight>(null);

  const threadGeos = useMemo(
    () =>
      EVENTS.map((ev) => {
        const top = new THREE.Vector3(ev.x, PILLAR.height, 0);
        const target = new THREE.Vector3(...ev.spike);
        const mid = top.clone().lerp(target, 0.5).add(new THREE.Vector3(0.15, 0.3, 0));
        return new THREE.TubeGeometry(new THREE.CatmullRomCurve3([top, mid, target]), 50, PILLAR.threadRadius, 6, false);
      }),
    [],
  );

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    EVENTS.forEach((ev, i) => {
      const rise = easeOut(ramp(p, ev.reveal[0], ev.reveal[1]));
      const g = pillars.current[i];
      if (g) {
        g.visible = rise > 0.001;
        g.scale.setY(Math.max(0.0001, rise));
      }
      const ring = rings.current[i];
      if (ring) ring.opacity = rise * 0.35;
      setDraw(threads.current[i], easeInOut(ramp(p, ev.thread[0], ev.thread[1])));
      if (threads.current[i]) threads.current[i]!.visible = p > ev.thread[0];

      // The next event counts down: sharp tick pulses on its tip.
      const tip = tips.current[i];
      if (tip) {
        let pulse = 0.45;
        if (i === FOCUS.index) {
          const focusK = ramp(p, FOCUS.window[0], FOCUS.window[0] + 0.04) * (1 - ramp(p, FOCUS.window[1], FOCUS.window[1] + 0.04));
          pulse = 0.45 + (still ? 0.3 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 2.6)), 10)) * focusK;
          if (focusLight.current) focusLight.current.intensity = focusK * (2 + pulse * 6);
        }
        tip.scale.setScalar(0.8 + pulse * 0.5);
      }
    });
  });

  return (
    <group name="EventPillars">
      {EVENTS.map((ev, i) => {
        const glow = ev.up ? COLORS.up : COLORS.down;
        return (
          <group key={ev.key}>
            {/* pillar rises from the floor */}
            <group position={[ev.x, FLOOR_Y, 0]} ref={(el) => void (pillars.current[i] = el)} visible={false}>
              <mesh position={[0, PILLAR.height / 2, 0]}>
                <cylinderGeometry args={[PILLAR.radius, PILLAR.radius, PILLAR.height, 8]} />
                <meshStandardMaterial color={COLORS.metalBright} metalness={0.85} roughness={0.3} emissive={glow} emissiveIntensity={0.25} />
              </mesh>
              <mesh position={[0, PILLAR.height, 0]} ref={(el) => void (tips.current[i] = el)}>
                <sphereGeometry args={[0.045, 14, 14]} />
                <meshBasicMaterial color={glow} toneMapped={false} />
              </mesh>
              {i === FOCUS.index ? <pointLight ref={focusLight} position={[0, PILLAR.height, 0]} color={glow} intensity={0} distance={4} decay={2} /> : null}
            </group>
            {/* base ring on the floor */}
            <mesh position={[ev.x, FLOOR_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <torusGeometry args={[PILLAR.ringRadius, 0.006, 8, 48]} />
              <meshBasicMaterial ref={(el) => void (rings.current[i] = el)} color={glow} transparent opacity={0} toneMapped={false} />
            </mesh>
            {/* thread: the event ties to the move it drove */}
            <mesh geometry={threadGeos[i]} ref={(el) => void (threads.current[i] = el)} visible={false}>
              <meshStandardMaterial color={glow} emissive={glow} emissiveIntensity={0.9} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
