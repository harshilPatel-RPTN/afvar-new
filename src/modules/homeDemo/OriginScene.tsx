"use client";

// Chapter 01 — ORIGIN scene. One master scroll progress drives everything;
// every transform is a pure function of (smoothed progress, clock), so reverse
// scroll replays cleanly and nothing is a one-shot trigger. The raw progress
// ref is damped inside the render loop (PROGRESS_DAMP) — that inertia, plus a
// continuous camera spline with a slow FOV dolly, is what makes the chapter
// read as a tracking shot instead of a scrubbed timeline.
//
//   default export OriginScene({ progress, active, still })
//   - progress: ref with raw scroll progress 0..1 (never React state)
//   - active:   render loop may run (near viewport, tab visible)
//   - still:    reduced motion / non-cinematic — one composed static frame
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { MachinedArc } from "./MachinedArc";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, SoundCues, setDraw } from "./sceneLib";
import {
  ARCS,
  BEAMS,
  CAMERA_KEYS,
  CANDLE,
  COLORS,
  CORE,
  CORE_POS,
  FLOOR_Y,
  FOV,
  GRID_REVEAL,
  PARALLAX,
  PATH_DRAW,
  PATH_RADIUS,
  PROGRESS_DAMP,
  SETTLED_P,
  STREAM,
  coreIntensity,
  easeInOut,
  easeOut,
  makePathCurve,
  ramp,
  SOUND,
} from "./originConfig";

export interface OriginSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type CandleDatum = { point: THREE.Vector3; u: number; height: number; up: boolean; tip: THREE.Vector3 };

type Shared = { smoothed: RefObject<number>; still: boolean; curve: THREE.CatmullRomCurve3; candles: CandleDatum[] };

export default function OriginScene({ progress, active, still }: OriginSceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);

  const curve = useMemo(() => makePathCurve(), []);
  const candles = useMemo<CandleDatum[]>(() => {
    const tangent = new THREE.Vector3();
    return Array.from({ length: CANDLE.count }, (_, i) => {
      const u = CANDLE.uStart + (i / (CANDLE.count - 1)) * (CANDLE.uEnd - CANDLE.uStart);
      const point = curve.getPointAt(u, new THREE.Vector3());
      curve.getTangentAt(u, tangent);
      const height = Math.max(CANDLE.minHeight, (point.y - FLOOR_Y) * CANDLE.heightScale);
      return { point, u, height, up: tangent.y >= 0, tip: new THREE.Vector3(point.x, FLOOR_Y + height, point.z) };
    });
  }, [curve]);

  const shared: Shared = { smoothed, still, curve, candles };

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: CAMERA_KEYS[0].pos as unknown as THREE.Vector3, fov: FOV[0] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[COLORS.bg, 9, 22]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />

      <AdaptiveQuality />

      <SoundCues smoothed={smoothed} cues={SOUND} />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.14} />
        <spotLight position={[6, 8, 6]} angle={0.45} penumbra={1} intensity={60} color="#e8edf6" />
        <pointLight position={[-4, 2.5, -4]} intensity={18} color={COLORS.up} />
        <pointLight position={[5, -0.5, 3]} intensity={4.5} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.8} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.2} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.5} color={COLORS.down} position={[6, -1, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <TickHead {...shared} />
      <PathStream {...shared} />
      <CandleField {...shared} />
      <Instrument {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[4.5, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={22} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />

      </EffectComposer>
    </Canvas>
  );
}

/* ---------------------------------------------------------- the tick head */

const headPos = new THREE.Vector3();

/** The protagonist: one bright tick that rides the end of the drawn path. */
function TickHead({ smoothed, still, curve }: Shared) {
  const group = useRef<THREE.Group>(null);
  const halo = useRef<THREE.Mesh>(null);
  const light = useRef<THREE.PointLight>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const drawn = easeOut(ramp(p, PATH_DRAW[0], PATH_DRAW[1]));
    curve.getPointAt(Math.max(0.0001, drawn), headPos);
    group.current?.position.copy(headPos);
    // Sharp tick-tick pulse (not a soft breathing glow); still frame holds steady.
    const beat = still ? 0.4 : Math.pow(Math.abs(Math.sin(s.clock.elapsedTime * 2.2)), 10);
    const glow = 0.8 + beat * 0.5 + coreIntensity(p) * 0.1;
    halo.current?.scale.setScalar(1 + beat * 0.5);
    if (light.current) light.current.intensity = 2.5 + beat * 3;
    const mat = halo.current?.material as THREE.MeshBasicMaterial | undefined;
    if (mat) mat.opacity = 0.2 + beat * 0.25;
    const coreMat = (group.current?.children[0] as THREE.Mesh | undefined)?.material as THREE.MeshBasicMaterial | undefined;
    coreMat?.color.set(COLORS.upBright).multiplyScalar(glow);
  });

  return (
    <group ref={group} name="TickHead">
      <mesh>
        <sphereGeometry args={[0.055, 20, 20]} />
        <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
      </mesh>
      <mesh ref={halo}>
        <sphereGeometry args={[0.11, 20, 20]} />
        <meshBasicMaterial color={COLORS.up} transparent opacity={0.25} toneMapped={false} depthWrite={false} />
      </mesh>
      <pointLight ref={light} color={COLORS.up} intensity={3} distance={4} decay={2} />
    </group>
  );
}

/* --------------------------------------------------- path line + raw ticks */

const dotScratch = new THREE.Vector3();

function PathStream({ smoothed, still, curve }: Shared) {
  const line = useRef<THREE.Mesh>(null);
  const dots = useRef<THREE.InstancedMesh>(null);
  const dotMatrix = useMemo(() => new THREE.Matrix4(), []);

  const lineGeo = useMemo(() => new THREE.TubeGeometry(curve, 220, PATH_RADIUS, 8, false), [curve]);
  // Built outside JSX, so R3F won't free it: release the GPU buffers on unmount.
  useEffect(() => () => lineGeo.dispose(), [lineGeo]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const drawn = easeOut(ramp(p, PATH_DRAW[0], PATH_DRAW[1]));
    setDraw(line.current, drawn);

    // Raw ticks flowing along the drawn stretch, behind the head (stage 2+).
    const mesh = dots.current;
    if (!mesh) return;
    const vis = window4Stream(p);
    mesh.visible = vis > 0.001 && drawn > 0.02;
    if (!mesh.visible) return;
    for (let i = 0; i < STREAM.count; i++) {
      const phase = (i / STREAM.count + (still ? 0 : s.clock.elapsedTime * STREAM.speed)) % 1;
      const u = phase * drawn;
      curve.getPointAt(Math.max(0.0001, u), dotScratch);
      const size = STREAM.size * vis * (0.6 + 0.4 * Math.sin(phase * Math.PI));
      dotMatrix.makeScale(size, size, size).setPosition(dotScratch);
      mesh.setMatrixAt(i, dotMatrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <group name="PathStream">
      <mesh ref={line} geometry={lineGeo}>
        <meshStandardMaterial color={COLORS.up} emissive={COLORS.up} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      <instancedMesh ref={dots} args={[undefined, undefined, STREAM.count]} visible={false}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#8CE8BE" transparent opacity={0.75} toneMapped={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}

const window4Stream = (p: number) => ramp(p, STREAM.window[0], STREAM.window[0] + 0.05) * (1 - ramp(p, STREAM.window[1], STREAM.window[1] + 0.06));

/* ------------------------------------------------------------ candle field */

/** Candles crystallise under the path as the head passes their station. */
function CandleField({ smoothed, candles }: Shared) {
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const drawn = easeOut(ramp(p, PATH_DRAW[0], PATH_DRAW[1]));
    groups.current.forEach((g, i) => {
      if (!g) return;
      const c = candles[i];
      // A candle rises once the head has passed its u — tied to the draw, not time.
      const k = easeOut(ramp(drawn, c.u, c.u + CANDLE.revealSpan));
      g.visible = k > 0.001;
      g.scale.setY(Math.max(0.0001, k));
    });
  });

  return (
    <group name="CandleField">
      {candles.map((c, i) => {
        const body = c.up ? "#0B3B26" : "#5a211c";
        const glow = c.up ? COLORS.up : COLORS.down;
        return (
          <group key={i} position={[c.point.x, FLOOR_Y, c.point.z]} ref={(el) => void (groups.current[i] = el)} visible={false}>
            <mesh position={[0, c.height / 2, 0]}>
              <boxGeometry args={[CANDLE.width, c.height, CANDLE.width * 0.9]} />
              <meshPhysicalMaterial color={body} metalness={0.75} roughness={0.25} clearcoat={0.8} clearcoatRoughness={0.2} emissive={glow} emissiveIntensity={0.14} />
            </mesh>
            {/* fine wick reaching toward the path */}
            <mesh position={[0, c.height * 0.72, 0]}>
              <cylinderGeometry args={[0.009, 0.009, c.height * 1.44, 6]} />
              <meshStandardMaterial color={glow} metalness={0.4} roughness={0.4} emissive={glow} emissiveIntensity={0.28} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* -------------------------------------------- the instrument (stage 4 core) */

/** Three machined arcs assemble into a gimbal around the newest tick. */
function Instrument({ smoothed, still, candles }: Shared) {
  const arcRefs = useRef<(THREE.Group | null)[]>([]);
  const inner = useRef<THREE.MeshStandardMaterial>(null);
  const light = useRef<THREE.PointLight>(null);
  const beams = useRef<(THREE.Mesh | null)[]>([]);

  const beamGeos = useMemo(
    () =>
      BEAMS.fromCandles.map((ci) => {
        const from = candles[ci].tip;
        const mid = from.clone().lerp(CORE_POS, 0.5).add(new THREE.Vector3(0, 0.35, 0));
        const beamCurve = new THREE.CatmullRomCurve3([from.clone(), mid, CORE_POS.clone()]);
        return new THREE.TubeGeometry(beamCurve, 60, BEAMS.radius, 6, false);
      }),
    [candles],
  );
  useEffect(() => () => beamGeos.forEach((g) => g.dispose()), [beamGeos]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const glow = coreIntensity(p);
    if (inner.current) inner.current.emissiveIntensity = 0.2 + glow * 1.4;
    if (light.current) light.current.intensity = 1 + glow * 14;

    ARCS.forEach((a, i) => {
      const g = arcRefs.current[i];
      if (!g) return;
      const k = easeInOut(ramp(p, a.window[0], a.window[1]));
      g.visible = k > 0.001;
      // Fly in from a scattered offset, un-spin into the final orientation.
      g.position.set(CORE_POS.x + a.from[0] * (1 - k), CORE_POS.y + a.from[1] * (1 - k), CORE_POS.z + a.from[2] * (1 - k));
      const residual = a.spin * (1 - k);
      g.rotation.set(a.rot[0] + residual * 0.6, a.rot[1] + residual, a.rot[2] + residual * 0.4);
      // Assembled: slow precession that dies at settle (an instrument stabilising).
      if (!still && k > 0.999) {
        const calm = 1 - ramp(p, 0.9, 0.98);
        g.rotation.y += Math.sin(s.clock.elapsedTime * 0.3 + i) * 0.04 * calm;
      }
    });

    beams.current.forEach((m, i) => {
      if (!m) return;
      const f = easeInOut(ramp(p, BEAMS.draw[0] + i * 0.02, BEAMS.draw[1] + i * 0.02));
      m.visible = f > 0.001;
      setDraw(m, f);
    });
  });

  return (
    <group name="Instrument">
      {ARCS.map((a, i) => (
        <group key={i} ref={(el) => void (arcRefs.current[i] = el)} visible={false} position={[CORE_POS.x, CORE_POS.y, CORE_POS.z]}>
          <MachinedArc radius={a.radius} thickness={a.tube * 2.2} phiLength={a.arc} />
        </group>
      ))}
      {/* the core itself sits where the newest tick lives */}
      <group position={[CORE_POS.x, CORE_POS.y, CORE_POS.z]}>
        <mesh>
          <sphereGeometry args={[CORE.shellRadius, 40, 40]} />
          <meshPhysicalMaterial color="#35604A" metalness={0} roughness={0.16} transmission={0.92} thickness={0.4} ior={1.45} clearcoat={1} clearcoatRoughness={0.08} />
        </mesh>
        <mesh>
          <sphereGeometry args={[CORE.innerRadius, 24, 24]} />
          <meshStandardMaterial ref={inner} color="#07301D" emissive={COLORS.up} emissiveIntensity={0.3} roughness={0.3} toneMapped={false} />
        </mesh>
        <pointLight ref={light} color={COLORS.up} intensity={1} distance={7} decay={2} />
      </group>
      {beamGeos.map((geo, i) => (
        <mesh key={i} ref={(el) => void (beams.current[i] = el)} geometry={geo} visible={false}>
          <meshStandardMaterial color={COLORS.upBright} emissive={COLORS.upBright} emissiveIntensity={1.1} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

