"use client";

// Chapter 07 — JOURNAL scene. Trades as entry→exit arcs on a session timeline,
// a playhead that replays them, plan-followed / plan-broken tags, and threads
// that reveal where the losses cluster. Same motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  ARC_RADIUS,
  ARC_REVEAL,
  CAMERA_KEYS,
  FLOOR_Y,
  FOV,
  GRID_REVEAL,
  PARALLAX,
  PLAYHEAD,
  PROGRESS_DAMP,
  SETTLED_P,
  TAG,
  TAG_REVEAL,
  THREADS,
  TRADES,
} from "./journalConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface JournalSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

/** Small alternating depth so arcs don't sit on one flat plane. */
const tradeZ = (i: number) => (i % 2 === 0 ? 0.14 : -0.14);

const playheadX = (p: number) => THREE.MathUtils.lerp(PLAYHEAD.x[0], PLAYHEAD.x[1], easeInOut(ramp(p, PLAYHEAD.window[0], PLAYHEAD.window[1])));

export default function JournalScene({ progress, active, still }: JournalSceneProps) {
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
      <fog attach="fog" args={[COLORS.bg, 9, 22]} />

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

      <TimelineAxis />
      <TradeArcs {...shared} />
      <Playhead {...shared} />
      <PatternThreads {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={22} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />

      </EffectComposer>
    </Canvas>
  );
}

/* ----------------------------------------------------------- timeline axis */

function TimelineAxis() {
  return (
    <mesh position={[0, FLOOR_Y + 0.003, 0]}>
      <boxGeometry args={[13.6, 0.006, 0.006]} />
      <meshBasicMaterial color={COLORS.up} transparent opacity={0.35} toneMapped={false} />
    </mesh>
  );
}

/* --------------------------------------------------------------- trade arcs */

function TradeArcs({ smoothed }: Shared) {
  const arcs = useRef<(THREE.Mesh | null)[]>([]);
  const arcMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const tags = useRef<(THREE.Mesh | null)[]>([]);

  const data = useMemo(
    () =>
      TRADES.map((t, i) => {
        const z = tradeZ(i);
        const mid = (t.x0 + t.x1) / 2;
        const curve = new THREE.QuadraticBezierCurve3(
          new THREE.Vector3(t.x0, FLOOR_Y, z),
          new THREE.Vector3(mid, FLOOR_Y + t.h * 2, z),
          new THREE.Vector3(t.x1, FLOOR_Y, z),
        );
        return { geo: new THREE.TubeGeometry(curve, 64, ARC_RADIUS, 7, false), apex: curve.getPoint(0.5) };
      }),
    [],
  );

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const head = playheadX(p);
    const focus = easeInOut(ramp(p, THREADS.focus[0], THREADS.focus[1]));
    TRADES.forEach((t, i) => {
      const s0 = ARC_REVEAL.start + i * ARC_REVEAL.step;
      const drawn = easeOut(ramp(p, s0, s0 + ARC_REVEAL.dur));
      const mesh = arcs.current[i];
      if (mesh) {
        mesh.visible = drawn > 0.001;
        setDraw(mesh, drawn);
      }
      // Replayed trades brighten as the playhead crosses them.
      const replayed = ramp(head, t.x0, t.x1);
      const mat = arcMats.current[i];
      if (mat) {
        // In the pattern stage, planned wins recede a touch so the clusters read.
        const dim = t.plan && t.win ? focus * 0.25 : 0;
        mat.emissiveIntensity = (0.35 + replayed * 0.6) * (1 - dim);
      }
      const tag = tags.current[i];
      if (tag) {
        const k = easeOut(ramp(p, TAG_REVEAL.start + i * TAG_REVEAL.step, TAG_REVEAL.start + i * TAG_REVEAL.step + TAG_REVEAL.dur));
        tag.visible = k > 0.001;
        tag.scale.setScalar(Math.max(0.0001, k));
      }
    });
  });

  return (
    <group name="TradeArcs">
      {TRADES.map((t, i) => (
        <group key={i}>
          <mesh geometry={data[i].geo} ref={(el) => void (arcs.current[i] = el)} visible={false}>
            <meshStandardMaterial
              ref={(el) => void (arcMats.current[i] = el)}
              color={t.win ? COLORS.up : COLORS.down}
              emissive={t.win ? COLORS.up : COLORS.down}
              emissiveIntensity={0.35}
              toneMapped={false}
            />
          </mesh>
          {/* tag ring: plan followed (green) / plan broken (red) */}
          <mesh position={[data[i].apex.x, data[i].apex.y + TAG.lift, data[i].apex.z]} ref={(el) => void (tags.current[i] = el)} visible={false}>
            <torusGeometry args={[TAG.radius, 0.012, 8, 32]} />
            <meshBasicMaterial color={t.plan ? COLORS.upBright : COLORS.down} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- playhead */

function Playhead({ smoothed }: Shared) {
  const bar = useRef<THREE.Mesh>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const t = ramp(p, PLAYHEAD.window[0], PLAYHEAD.window[1]);
    const m = bar.current;
    if (!m) return;
    m.visible = t > 0.001 && t < 0.999;
    if (!m.visible) return;
    m.position.set(playheadX(p), PLAYHEAD.height / 2, 0);
    (m.material as THREE.MeshBasicMaterial).opacity = 0.5 * Math.sin(Math.PI * t) + 0.1;
  });

  return (
    <mesh ref={bar} visible={false}>
      <boxGeometry args={[0.012, PLAYHEAD.height, PLAYHEAD.depth]} />
      <meshBasicMaterial color={COLORS.upBright} transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
    </mesh>
  );
}

/* ---------------------------------------------------------- pattern threads */

/** Threads that link plan-broken trades (red) and plan-followed trades (green). */
function PatternThreads({ smoothed }: Shared) {
  const broken = useRef<THREE.Mesh>(null);
  const followed = useRef<THREE.Mesh>(null);

  const geos = useMemo(() => {
    const apexes = TRADES.map((t, i) => new THREE.Vector3((t.x0 + t.x1) / 2, FLOOR_Y + t.h + TAG.lift + THREADS.lift, tradeZ(i)));
    const through = (filter: (t: (typeof TRADES)[number]) => boolean) =>
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3(apexes.filter((_, i) => filter(TRADES[i])), false, "centripetal"),
        120,
        0.008,
        6,
        false,
      );
    return { broken: through((t) => !t.plan), followed: through((t) => t.plan) };
  }, []);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const b = easeInOut(ramp(p, THREADS.broken[0], THREADS.broken[1]));
    const f = easeInOut(ramp(p, THREADS.followed[0], THREADS.followed[1]));
    if (broken.current) {
      broken.current.visible = b > 0.001;
      setDraw(broken.current, b);
    }
    if (followed.current) {
      followed.current.visible = f > 0.001;
      setDraw(followed.current, f);
    }
  });

  return (
    <group name="PatternThreads">
      <mesh geometry={geos.broken} ref={broken} visible={false}>
        <meshStandardMaterial color={COLORS.down} emissive={COLORS.down} emissiveIntensity={1.0} toneMapped={false} />
      </mesh>
      <mesh geometry={geos.followed} ref={followed} visible={false}>
        <meshStandardMaterial color={COLORS.up} emissive={COLORS.up} emissiveIntensity={0.7} toneMapped={false} />
      </mesh>
    </group>
  );
}
