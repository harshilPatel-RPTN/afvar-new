"use client";

// Chapter 08 — COMMUNITY scene. Fixed official rooms inside a boundary, stray
// noise outside fading away, traders arriving, a chart travelling room to
// room, and verified records lighting up. Same motion system as every chapter.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  BOUNDARY,
  CAMERA_KEYS,
  FLOOR_Y,
  FOV,
  GRID_REVEAL,
  MEMBERS,
  PARALLAX,
  PROGRESS_DAMP,
  ROOM,
  ROOMS,
  SETTLED_P,
  SHARE,
  STRAYS,
  VERIFIED,
  roomCenter,
  roomRiseAt,
} from "./communityConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

export interface CommunitySceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
}

type Shared = { smoothed: RefObject<number>; still: boolean };

export default function CommunityScene({ progress, active, still }: CommunitySceneProps) {
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
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.14} />
        <spotLight position={[5, 8, 6]} angle={0.5} penumbra={1} intensity={55} color="#e8edf6" />
        <pointLight position={[-5, 2.5, -4]} intensity={16} color={COLORS.up} />
        <pointLight position={[5, 0.5, 3]} intensity={4} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.7} position={[0, 5, -4]} scale={[12, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.up} position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 3, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.down} position={[6, -0.5, 1]} rotation-y={-Math.PI / 2} scale={[8, 2, 1]} />
      </Environment>

      <Rooms {...shared} />
      <Boundary {...shared} />
      <Strays {...shared} />
      <Members {...shared} />
      <SharedChart {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 0]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={20} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />
        <Vignette darkness={0.45} offset={0.3} />
      </EffectComposer>
    </Canvas>
  );
}

/* ------------------------------------------------------------------- rooms */

/** Hexagonal plates with six machined posts — fixed, official, unrenamable. */
function Rooms({ smoothed }: Shared) {
  const posts = useRef<(THREE.Group | null)[]>([]);
  const plateMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  const postOffsets = useMemo(
    () =>
      Array.from({ length: 6 }, (_, k) => {
        const a = (k / 6) * Math.PI * 2;
        return [Math.cos(a) * ROOM.plateRadius * 0.92, Math.sin(a) * ROOM.plateRadius * 0.92] as const;
      }),
    [],
  );

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const verified = easeInOut(ramp(p, VERIFIED.window[0], VERIFIED.window[1]));
    ROOMS.forEach((_, i) => {
      const [a, b] = roomRiseAt(i);
      const rise = easeOut(ramp(p, a, b));
      const g = posts.current[i];
      if (g) {
        g.visible = rise > 0.001;
        g.scale.setY(Math.max(0.0001, rise));
      }
      const mat = plateMats.current[i];
      if (mat) mat.emissiveIntensity = (0.08 + rise * 0.16) * (1 + verified * 1.6);
    });
  });

  return (
    <group name="Rooms">
      {ROOMS.map((room, i) => (
        <group key={room.key} position={roomCenter(i)}>
          <mesh position={[0, 0.02, 0]}>
            <cylinderGeometry args={[ROOM.plateRadius, ROOM.plateRadius, 0.04, 6]} />
            <meshStandardMaterial
              ref={(el) => void (plateMats.current[i] = el)}
              color="#141a17"
              metalness={0.8}
              roughness={0.35}
              emissive={COLORS.up}
              emissiveIntensity={0.08}
            />
          </mesh>
          <group ref={(el) => void (posts.current[i] = el)} visible={false}>
            {postOffsets.map(([x, z], k) => (
              <mesh key={k} position={[x, ROOM.postHeight / 2, z]}>
                <boxGeometry args={[0.035, ROOM.postHeight, 0.035]} />
                <meshStandardMaterial color={COLORS.metalBright} metalness={0.9} roughness={0.28} emissive={COLORS.up} emissiveIntensity={0.15} />
              </mesh>
            ))}
          </group>
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- boundary */

function Boundary({ smoothed }: Shared) {
  const mat = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    if (mat.current) mat.current.opacity = easeOut(ramp(p, BOUNDARY.rise[0], BOUNDARY.rise[1])) * 0.45;
  });

  return (
    <mesh position={[0, FLOOR_Y + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <torusGeometry args={[BOUNDARY.radius, 0.01, 8, 128]} />
      <meshBasicMaterial ref={mat} color={COLORS.up} transparent opacity={0} toneMapped={false} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ strays */

const strayMatrix = new THREE.Matrix4();

/** Unofficial noise outside the boundary — flickers, then dissolves. */
function Strays({ smoothed, still }: Shared) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const spots = useMemo(
    () =>
      Array.from({ length: STRAYS.count }, (_, i) => {
        const a = (i / STRAYS.count) * Math.PI * 2 + ((i * 37) % 11) * 0.05;
        const r = STRAYS.rMin + (((i * 53) % 17) / 17) * (STRAYS.rMax - STRAYS.rMin);
        return new THREE.Vector3(Math.cos(a) * r, 0.25 + ((i * 29) % 7) * 0.05, Math.sin(a) * r);
      }),
    [],
  );

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const m = mesh.current;
    if (!m) return;
    const alive = 1 - easeInOut(ramp(p, STRAYS.fade[0], STRAYS.fade[1]));
    m.visible = alive > 0.001;
    if (!m.visible) return;
    for (let i = 0; i < spots.length; i++) {
      const flicker = still ? 0.7 : 0.55 + 0.45 * Math.sin(s.clock.elapsedTime * (2 + (i % 4)) + i);
      const size = 0.04 * alive * flicker;
      strayMatrix.makeScale(size, size, size).setPosition(spots[i]);
      m.setMatrixAt(i, strayMatrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, STRAYS.count]}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color={COLORS.down} transparent opacity={0.6} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  );
}

/* ----------------------------------------------------------------- members */

const memberMatrix = new THREE.Matrix4();
const memberPos = new THREE.Vector3();
const homePos = new THREE.Vector3();
const fromPos = new THREE.Vector3();
const haloMatrix = new THREE.Matrix4();
const haloQuat = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0));
const haloScale = new THREE.Vector3();

/** Traders streaming in from outside and gathering around each room. Every
 *  third one carries a verified record (halo). */
function Members({ smoothed, still }: Shared) {
  const dots = useRef<THREE.InstancedMesh>(null);
  const halos = useRef<THREE.InstancedMesh>(null);
  const total = ROOMS.length * MEMBERS.perRoom;
  const haloCount = Math.ceil(total / VERIFIED.every);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const d = dots.current;
    const h = halos.current;
    if (!d || !h) return;
    const verified = easeOut(ramp(p, VERIFIED.window[0], VERIFIED.window[1]));
    const t = still ? 0 : s.clock.elapsedTime * MEMBERS.speed;
    let hi = 0;
    for (let i = 0; i < total; i++) {
      const room = Math.floor(i / MEMBERS.perRoom);
      const k = i % MEMBERS.perRoom;
      const [cx, , cz] = roomCenter(room);
      const a = (k / MEMBERS.perRoom) * Math.PI * 2 + t;
      homePos.set(cx + Math.cos(a) * MEMBERS.orbit, MEMBERS.y, cz + Math.sin(a) * MEMBERS.orbit);
      const outA = ROOMS[room].angle + (k - MEMBERS.perRoom / 2) * 0.12;
      fromPos.set(Math.cos(outA) * MEMBERS.from, MEMBERS.y + 0.6, Math.sin(outA) * MEMBERS.from);
      const s0 = MEMBERS.arrive.start + i * MEMBERS.arrive.step;
      const arrived = easeInOut(ramp(p, s0, s0 + MEMBERS.arrive.dur));
      memberPos.copy(fromPos).lerp(homePos, arrived);
      const size = MEMBERS.size * (arrived > 0.001 ? 1 : 0);
      memberMatrix.makeScale(size, size, size).setPosition(memberPos);
      d.setMatrixAt(i, memberMatrix);

      if (i % VERIFIED.every === 0) {
        const r = VERIFIED.haloRadius * verified * (arrived > 0.99 ? 1 : 0);
        haloScale.setScalar(Math.max(0.0001, r));
        haloMatrix.compose(memberPos, haloQuat, haloScale);
        h.setMatrixAt(hi++, haloMatrix);
      }
    }
    d.instanceMatrix.needsUpdate = true;
    h.instanceMatrix.needsUpdate = true;
    h.visible = verified > 0.001;
  });

  return (
    <group name="Members">
      <instancedMesh ref={dots} args={[undefined, undefined, total]}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshStandardMaterial color="#d8e2dc" metalness={0.3} roughness={0.4} emissive={COLORS.upBright} emissiveIntensity={0.35} />
      </instancedMesh>
      <instancedMesh ref={halos} args={[undefined, undefined, haloCount]} visible={false}>
        <torusGeometry args={[1, 0.12, 8, 32]} />
        <meshBasicMaterial color={COLORS.upBright} toneMapped={false} />
      </instancedMesh>
    </group>
  );
}

/* ------------------------------------------------------------ shared chart */

const chartPos = new THREE.Vector3();

const CHART_CANDLES: readonly { x: number; h: number; up: boolean }[] = [
  { x: -0.16, h: 0.12, up: true },
  { x: -0.08, h: 0.18, up: true },
  { x: 0, h: 0.1, up: false },
  { x: 0.08, h: 0.22, up: true },
  { x: 0.16, h: 0.15, up: false },
];

/** A real chart object travelling room to room, leaving a drawn link behind. */
function SharedChart({ smoothed }: Shared) {
  const chart = useRef<THREE.Group>(null);
  const link = useRef<THREE.Mesh>(null);

  const { curve, geo } = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    SHARE.rooms.forEach((r, idx) => {
      const [x, , z] = roomCenter(r);
      pts.push(new THREE.Vector3(x, SHARE.y, z));
      const next = SHARE.rooms[idx + 1];
      if (next !== undefined) {
        const [nx, , nz] = roomCenter(next);
        pts.push(new THREE.Vector3((x + nx) / 2 * 0.6, SHARE.y + SHARE.hop, (z + nz) / 2 * 0.6));
      }
    });
    const c = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    return { curve: c, geo: new THREE.TubeGeometry(c, 160, 0.008, 6, false) };
  }, []);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const t = easeInOut(ramp(p, SHARE.window[0], SHARE.window[1]));
    const g = chart.current;
    if (g) {
      g.visible = p > SHARE.window[0] - 0.01;
      curve.getPointAt(Math.max(0.0001, t), chartPos);
      g.position.copy(chartPos);
    }
    if (link.current) {
      link.current.visible = t > 0.001;
      setDraw(link.current, t);
    }
  });

  return (
    <group name="SharedChart">
      <group ref={chart} visible={false}>
        {/* small backing plate so it reads as a chart object */}
        <mesh position={[0, 0.1, -0.03]}>
          <boxGeometry args={[0.46, 0.32, 0.01]} />
          <meshStandardMaterial color="#0e1411" metalness={0.6} roughness={0.4} />
        </mesh>
        {CHART_CANDLES.map((c, i) => (
          <mesh key={i} position={[c.x, c.h / 2, 0]}>
            <boxGeometry args={[0.04, c.h, 0.03]} />
            <meshStandardMaterial color={c.up ? COLORS.up : COLORS.down} emissive={c.up ? COLORS.up : COLORS.down} emissiveIntensity={0.6} toneMapped={false} />
          </mesh>
        ))}
      </group>
      <mesh geometry={geo} ref={link} visible={false}>
        <meshStandardMaterial color={COLORS.up} emissive={COLORS.up} emissiveIntensity={0.85} toneMapped={false} />
      </mesh>
    </group>
  );
}
