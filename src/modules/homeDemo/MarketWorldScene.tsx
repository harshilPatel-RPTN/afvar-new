"use client";

// Chapter 02 — THE MARKET WORLD scene. Eight illustrative price lanes drawn
// through a dark field, waking in a directional wave, organising into three
// territories, swept once by a provenance scanline, then settling wide.
// Same motion system as every chapter: damped master progress, spline camera,
// everything a pure function of (progress, clock).
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  CAMERA_KEYS,
  FLOOR_Y,
  FLOW,
  FOV,
  GRID_REVEAL,
  GROUPS,
  LANES,
  LANE_CANDLES,
  LANE_RADIUS,
  LANE_REVEAL,
  PARALLAX,
  PROGRESS_DAMP,
  RIBBON,
  SCAN,
  SETTLED_P,
  TERRITORY_SHIFT,
  lanePoints,
} from "./marketWorldConfig";
import { COLORS } from "./originConfig";
import { AdaptiveQuality, CameraRig, FadeGrid, ProgressDamper, setDraw } from "./sceneLib";
import { easeInOut, easeOut, ramp } from "./timeline";

/** Per-lane data in LANES order: the closes that shape it and its direction. */
export type LaneData = { closes: readonly number[]; up: boolean };

export interface MarketWorldSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** Real closes from the AFVAR data layer; falls back to illustrative walks. */
  lanes?: readonly LaneData[];
}

type Shared = { smoothed: RefObject<number>; still: boolean; curves: THREE.CatmullRomCurve3[]; ups: readonly boolean[] };

/** Group origin x at progress p (packed → spread as territories form). */
const groupX = (g: number, p: number) =>
  THREE.MathUtils.lerp(GROUPS[g].packedX, GROUPS[g].spreadX, easeInOut(ramp(p, TERRITORY_SHIFT[0], TERRITORY_SHIFT[1])));

/** Lane i draw fraction at progress p (directional wave). */
const laneDrawn = (i: number, p: number) => easeOut(ramp(p, LANE_REVEAL.start + i * LANE_REVEAL.step, LANE_REVEAL.start + i * LANE_REVEAL.step + LANE_REVEAL.dur));

export default function MarketWorldScene({ progress, active, still, lanes }: MarketWorldSceneProps) {
  const smoothed = useRef(still ? SETTLED_P : 0);

  const curves = useMemo(
    () => LANES.map((lane, i) => new THREE.CatmullRomCurve3(lanePoints(lane, lanes?.[i]?.closes), false, "centripetal")),
    [lanes],
  );
  const ups = useMemo(() => LANES.map((lane, i) => lanes?.[i]?.up ?? lane.up), [lanes]);

  const shared: Shared = { smoothed, still, curves, ups };

  return (
    <Canvas
      dpr={[1, 1.75]}
      frameloop={active && !still ? "always" : "demand"}
      camera={{ position: CAMERA_KEYS[0].pos as unknown as THREE.Vector3, fov: FOV[0] }}
      gl={{ alpha: true, antialias: true, powerPreference: "high-performance" }}
      aria-hidden="true"
    >
      <fog attach="fog" args={[COLORS.bg, 14, 34]} />

      <ProgressDamper progress={progress} smoothed={smoothed} still={still} settledP={SETTLED_P} lambda={PROGRESS_DAMP} />

      <AdaptiveQuality />
      <CameraRig smoothed={smoothed} still={still} keys={CAMERA_KEYS} fov={FOV} parallax={PARALLAX} />

      <group name="LightingGroup">
        <ambientLight intensity={0.13} />
        <spotLight position={[8, 10, -6]} angle={0.5} penumbra={1} intensity={55} color="#e8edf6" />
        <pointLight position={[-6, 3, 6]} intensity={16} color={COLORS.up} />
        <pointLight position={[7, 1.5, 10]} intensity={4} color={COLORS.down} />
      </group>
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 6, -6]} scale={[14, 4, 1]} />
        <Lightformer form="rect" intensity={1.1} color={COLORS.up} position={[-7, 2, 4]} rotation-y={Math.PI / 2} scale={[10, 3, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.down} position={[7, 0, 6]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>

      <LaneField {...shared} />
      <LaneCandles {...shared} />
      <FlowTicks {...shared} />
      <TerritoryPlates {...shared} />
      <ScanLine {...shared} />
      <FadeGrid smoothed={smoothed} reveal={GRID_REVEAL} position={[0, FLOOR_Y, 2]} cell={COLORS.gridCell} section={COLORS.gridSection} fadeDistance={30} />

      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.5} />

      </EffectComposer>
    </Canvas>
  );
}

/* ------------------------------------------------------------- lane field */

/** A vertical area-fill wall from the price line down to the floor. */
function ribbonGeometry(curve: THREE.CatmullRomCurve3, segments: number): THREE.BufferGeometry {
  const pos = new Float32Array((segments + 1) * 2 * 3);
  const idx: number[] = [];
  const pt = new THREE.Vector3();
  for (let i = 0; i <= segments; i++) {
    curve.getPointAt(i / segments, pt);
    pos.set([pt.x, pt.y, pt.z, pt.x, FLOOR_Y, pt.z], i * 6);
    if (i < segments) {
      const a = i * 2;
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setIndex(idx);
  return g;
}

function LaneField({ smoothed, still, curves, ups }: Shared) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const laneMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const laneMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const ribbonMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const ribbonMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const geos = useMemo(() => curves.map((c) => new THREE.TubeGeometry(c, 160, LANE_RADIUS, 7, false)), [curves]);
  const ribbonGeos = useMemo(() => curves.map((c) => ribbonGeometry(c, RIBBON.segments)), [curves]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    GROUPS.forEach((_, g) => groupRefs.current[g]?.position.setX(groupX(g, p)));
    LANES.forEach((lane, i) => {
      const drawn = laneDrawn(i, p);
      const mesh = laneMeshes.current[i];
      if (mesh) {
        mesh.visible = drawn > 0.001;
        setDraw(mesh, drawn);
      }
      // The area fill follows the line down to the floor as it draws.
      const ribbon = ribbonMeshes.current[i];
      if (ribbon) {
        ribbon.visible = drawn > 0.001;
        setDraw(ribbon, drawn);
      }
      const rMat = ribbonMats.current[i];
      if (rMat) rMat.opacity = RIBBON.opacity * Math.min(1, drawn * 1.5);
      const mat = laneMats.current[i];
      if (mat) {
        // Light up as the lane draws; crypto shimmers gently — it never sleeps.
        let glow = 0.25 + drawn * 0.75;
        if (!still && lane.flowSpeed > 1) glow += 0.18 * (0.5 + 0.5 * Math.sin(s.clock.elapsedTime * 1.4));
        mat.emissiveIntensity = glow;
      }
    });
  });

  return (
    <group name="LaneField">
      {GROUPS.map((group, g) => (
        <group key={group.key} ref={(el) => void (groupRefs.current[g] = el)} position={[group.packedX, 0, 0]}>
          {LANES.map((lane, i) =>
            lane.group === g ? (
              <group key={lane.symbol} position={[lane.localX, 0, 0]}>
                <mesh geometry={geos[i]} ref={(el) => void (laneMeshes.current[i] = el)} visible={false}>
                  <meshStandardMaterial
                    ref={(el) => void (laneMats.current[i] = el)}
                    color={ups[i] ? COLORS.up : COLORS.down}
                    emissive={ups[i] ? COLORS.up : COLORS.down}
                    emissiveIntensity={0.25}
                    toneMapped={false}
                  />
                </mesh>
                <mesh geometry={ribbonGeos[i]} ref={(el) => void (ribbonMeshes.current[i] = el)} visible={false}>
                  <meshBasicMaterial
                    ref={(el) => void (ribbonMats.current[i] = el)}
                    color={ups[i] ? COLORS.up : COLORS.down}
                    transparent
                    opacity={0}
                    side={THREE.DoubleSide}
                    depthWrite={false}
                  />
                </mesh>
              </group>
            ) : null,
          )}
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------ lane candles */

type CandleDatum = { lane: number; u: number; local: THREE.Vector3; h: number; up: boolean };

const candleMatrix = new THREE.Matrix4();

/** Writes one frame of candle matrices: each rises as its lane head passes. */
function placeCandles(mesh: THREE.InstancedMesh | null, list: readonly CandleDatum[], p: number) {
  if (!mesh) return;
  mesh.visible = p > LANE_REVEAL.start;
  if (!mesh.visible) return;
  for (let idx = 0; idx < list.length; idx++) {
    const c = list[idx];
    const lane = LANES[c.lane];
    const k = easeOut(ramp(laneDrawn(c.lane, p), c.u, c.u + LANE_CANDLES.revealSpan));
    const gx = groupX(lane.group, p) + lane.localX + c.local.x;
    const hh = Math.max(0.0001, c.h * k);
    candleMatrix.makeScale(LANE_CANDLES.width, hh, LANE_CANDLES.width).setPosition(gx, FLOOR_Y + hh / 2, c.local.z);
    mesh.setMatrixAt(idx, candleMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}

/** Candlestick fields beneath every lane — the chart language that makes the
 *  lanes unmistakably markets. Candles rise as the lane head passes them. */
function LaneCandles({ smoothed, curves }: Shared) {
  const upMesh = useRef<THREE.InstancedMesh>(null);
  const downMesh = useRef<THREE.InstancedMesh>(null);

  const { ups, downs } = useMemo(() => {
    const tangent = new THREE.Vector3();
    const all: CandleDatum[] = [];
    LANES.forEach((lane, i) => {
      for (let k = 0; k < LANE_CANDLES.perLane; k++) {
        const u = LANE_CANDLES.uStart + (k / (LANE_CANDLES.perLane - 1)) * (LANE_CANDLES.uEnd - LANE_CANDLES.uStart);
        const local = curves[i].getPointAt(u, new THREE.Vector3());
        curves[i].getTangentAt(u, tangent);
        const jitter = ((lane.seed * 31 + k * 17) % 89) / 89; // deterministic 0..1
        const h = Math.max(LANE_CANDLES.minHeight, (local.y - FLOOR_Y) * LANE_CANDLES.heightScale * (0.55 + 0.5 * jitter));
        all.push({ lane: i, u, local, h, up: tangent.y >= 0 });
      }
    });
    return { ups: all.filter((c) => c.up), downs: all.filter((c) => !c.up) };
  }, [curves]);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    placeCandles(upMesh.current, ups, p);
    placeCandles(downMesh.current, downs, p);
  });

  return (
    <group name="LaneCandles">
      <instancedMesh ref={upMesh} args={[undefined, undefined, ups.length]} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#0B3B26" metalness={0.7} roughness={0.3} emissive={COLORS.up} emissiveIntensity={0.22} />
      </instancedMesh>
      <instancedMesh ref={downMesh} args={[undefined, undefined, downs.length]} visible={false}>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color="#4A1713" metalness={0.7} roughness={0.3} emissive={COLORS.down} emissiveIntensity={0.18} />
      </instancedMesh>
    </group>
  );
}

/* -------------------------------------------------------------- flow ticks */

const tickScratch = new THREE.Vector3();
const tickMatrix = new THREE.Matrix4();

/** Raw ticks flowing along every lit lane; one instanced mesh for all lanes. */
function FlowTicks({ smoothed, still, curves }: Shared) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const total = LANES.length * FLOW.perLane;

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const m = mesh.current;
    if (!m) return;
    const vis = ramp(p, FLOW.window[0], FLOW.window[0] + 0.05) * (1 - ramp(p, FLOW.window[1], FLOW.window[1] + 0.03));
    m.visible = vis > 0.001;
    if (!m.visible) return;
    let idx = 0;
    for (let i = 0; i < LANES.length; i++) {
      const lane = LANES[i];
      const drawn = laneDrawn(i, p);
      const gx = groupX(lane.group, p) + lane.localX;
      for (let k = 0; k < FLOW.perLane; k++) {
        const phase = (k / FLOW.perLane + (still ? 0.04 * k : s.clock.elapsedTime * FLOW.speed * lane.flowSpeed)) % 1;
        const u = phase * Math.max(0.0001, drawn);
        curves[i].getPointAt(u, tickScratch);
        tickScratch.x += gx;
        const size = drawn < 0.02 ? 0 : FLOW.size * vis * (0.55 + 0.45 * Math.sin(phase * Math.PI));
        tickMatrix.makeScale(size, size, size).setPosition(tickScratch);
        m.setMatrixAt(idx++, tickMatrix);
      }
    }
    m.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, total]} visible={false}>
      <sphereGeometry args={[1, 8, 8]} />
      <meshBasicMaterial color="#8CE8BE" transparent opacity={0.7} toneMapped={false} depthWrite={false} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- territory plates */

/** Faint floor plates that name the three territories as the groups spread. */
function TerritoryPlates({ smoothed }: Shared) {
  const mats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const groups = useRef<(THREE.Group | null)[]>([]);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const k = easeInOut(ramp(p, TERRITORY_SHIFT[0], TERRITORY_SHIFT[1]));
    GROUPS.forEach((_, g) => {
      groups.current[g]?.position.setX(groupX(g, p));
      const mat = mats.current[g];
      if (mat) mat.opacity = k * 0.05;
      const grp = groups.current[g];
      if (grp) grp.visible = k > 0.001;
    });
  });

  return (
    <group name="TerritoryPlates">
      {GROUPS.map((group, g) => (
        <group key={group.key} ref={(el) => void (groups.current[g] = el)} position={[group.spreadX, 0, 0]} visible={false}>
          <mesh position={[0, 0.006, 2]} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[group.width, 26]} />
            <meshBasicMaterial ref={(el) => void (mats.current[g] = el)} color={COLORS.up} transparent opacity={0} depthWrite={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------------------------- scan line */

/** The provenance sweep: a faint sheet with one crisp bright leading edge
 *  travels the field once — a scan, not a wall of light. */
function ScanLine({ smoothed }: Shared) {
  const group = useRef<THREE.Group>(null);
  const sheet = useRef<THREE.MeshBasicMaterial>(null);
  const edge = useRef<THREE.MeshBasicMaterial>(null);

  useFrame(() => {
    const p = smoothed.current ?? 0;
    const t = ramp(p, SCAN.window[0], SCAN.window[1]);
    const g = group.current;
    if (!g) return;
    g.visible = t > 0.001 && t < 0.999;
    if (!g.visible) return;
    g.position.set(0, 0, THREE.MathUtils.lerp(SCAN.z[0], SCAN.z[1], easeInOut(t)));
    const fade = Math.sin(Math.PI * t);
    if (sheet.current) sheet.current.opacity = 0.07 * fade;
    if (edge.current) edge.current.opacity = 0.9 * fade;
  });

  return (
    <group ref={group} visible={false}>
      <mesh position={[0, SCAN.y, 0]}>
        <boxGeometry args={[SCAN.width, SCAN.y * 2, 0.01]} />
        <meshBasicMaterial ref={sheet} color="#7FE0B5" transparent opacity={0} toneMapped={false} depthWrite={false} blending={THREE.AdditiveBlending} />
      </mesh>
      {/* the bright leading edge at the top and along the floor */}
      <mesh position={[0, SCAN.y * 2, 0]}>
        <boxGeometry args={[SCAN.width, 0.012, 0.012]} />
        <meshBasicMaterial ref={edge} color={COLORS.upBright} transparent opacity={0} toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
