"use client";

// /platform's centrepiece — the platform itself, as an exploded stack of glass
// layers. The home shows the AI; this page shows the system it runs:
//
//   You        the Ask AFVAR bar: type or speak, English or हिन्दी
//   Workspace  the five area tiles — the doors to the five pages
//   AI         a gold circuit with the spark (the AI) at its centre
//   Markets    eight live lines drawn from real hourly closes
//
// A request runs down the spine and back up. Every transform is a pure
// function of (damped progress, clock), so scrolling back replays.
import { Html, type Line } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ComponentRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { LANE_KEYS, type Quotes } from "@/modules/homeDemo/kit";
import { APPS } from "../overviewFilm";
import { AreaTile } from "../parts/AreaTile";
import { closesPoints, dirColor } from "../parts/closes";
import { Float, Pulse, Tracer, along, lengths } from "../parts/idle";

export const STACK = {
  width: 2.8,
  depth: 1.85,
  /** Layer heights in stack space, bottom → top. */
  y: [-1.5, -0.5, 0.5, 1.45] as const,
  spin: -Math.PI / 4,
  tilt: 0.42,
  /** Lift of the whole stack (scene units). */
  lift: 0.12,
} as const;
export const LAYERS = ["Markets", "AI", "Workspace", "You"] as const;

/** Inside the stack: turn a child back to face the camera (inverse of the stack's spin + tilt). */
const FACE: [number, number, number, THREE.EulerOrder] = [-STACK.tilt, -STACK.spin, 0, "YXZ"];
const TOP = 0.04; // a plate's top face (thickness / 2 + bevel)
const TAU = Math.PI * 2;
type LineObj = ComponentRef<typeof Line>;

/* ------------------------------------------------------------ the request */
// Every LOOP seconds a request runs the stack: the Ask bar's orb fires, a gold
// bead runs down the spine to the markets (their lines brighten as it lands),
// and the answer runs back up — the AI circuit glows, one workspace tile lifts,
// the orb pulses. Pure functions of the clock; a still frame shows none of it.
const LOOP = 7.5;
const DOWN = [0.35, 1.75] as const; // s into the loop: You → Markets
const UP = [2.05, 4.05] as const; // the answer: Markets → You
const SPINE = [STACK.y[3] - 0.08, STACK.y[0] + 0.06] as const; // top, bottom (stack y)
const upAt = (y: number) => UP[0] + ((UP[1] - UP[0]) * (y - SPINE[1])) / (SPINE[0] - SPINE[1]);
/** When the request reaches each layer, bottom → top. */
const HIT = [DOWN[1], upAt(STACK.y[1]), upAt(STACK.y[2]), UP[1]] as const;
/** A quick rise (0.14 s) and a soft ~1 s fall. */
const flash = (d: number) => (d < 0 ? 0 : d < 0.14 ? d / 0.14 : Math.exp(-(d - 0.14) * 2.4));
const inLoop = (t: number) => ((t % LOOP) + LOOP) % LOOP;
/** How lit layer `i` (0 Markets … 3 You) is by the request at clock `t` (0…1). */
function requestGlow(t: number, i: number): number {
  const s = inLoop(t);
  const g = flash(s - HIT[i]);
  // the orb also fires as the request leaves
  return i === 3 ? Math.max(g, 0.75 * flash(s - (DOWN[0] - 0.2))) : g;
}
/** The workspace tile the answer lifts this loop (each in turn). */
const liftedTile = (t: number) => Math.floor(t / LOOP) % APPS.length;

/** A layer's name, beside its right corner (layer space). */
const LABEL_AT: [number, number, number] = [STACK.width / 2 + 0.32, 0, -STACK.depth / 2 - 0.22];

export function PlatformStack({ quotes, compact, lite = false, labelShow }: { quotes: Quotes; compact: boolean; lite?: boolean; labelShow: (p: number) => number }) {
  const { still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    const t = still ? 0 : s.clock.elapsedTime;
    if (group.current) {
      // a slow turntable sway (±9°, 21 s) and a gentle bob
      group.current.rotation.y = STACK.spin + 0.16 * Math.sin((t / 21) * TAU);
      group.current.position.y = STACK.lift + 0.05 * Math.sin(t * 0.7);
    }
    // the layers breathe apart and together (~9 s), each a beat after the one below
    // (phones: no breathing); a layer the request reaches rises a touch
    layers.current.forEach((g, i) => {
      if (!g) return;
      const breathe = lite ? 0 : 0.075 * Math.sin(t * 0.7 - i * 0.35);
      g.position.y = STACK.y[i] * (1 + breathe) + (still ? 0 : 0.05 * requestGlow(t, i));
    });
  });
  return (
    <group ref={group} name="PlatformStack" position={[0, STACK.lift, 0]} rotation={[STACK.tilt, STACK.spin, 0]}>
      {/* each layer's name rides with its layer */}
      <group ref={(el) => void (layers.current[0] = el)} position={[0, STACK.y[0], 0]}>
        <MarketsLayer quotes={quotes} lite={lite} />
        <LayerLabel position={LABEL_AT} show={labelShow} compact={compact}>
          {LAYERS[0]}
        </LayerLabel>
      </group>
      <group ref={(el) => void (layers.current[1] = el)} position={[0, STACK.y[1], 0]}>
        <AiLayer lite={lite} />
        <LayerLabel position={LABEL_AT} show={labelShow} compact={compact}>
          {LAYERS[1]}
        </LayerLabel>
      </group>
      <group ref={(el) => void (layers.current[2] = el)} position={[0, STACK.y[2], 0]}>
        <WorkspaceLayer compact={compact} lite={lite} />
        <LayerLabel position={LABEL_AT} show={labelShow} compact={compact}>
          {LAYERS[2]}
        </LayerLabel>
      </group>
      <group ref={(el) => void (layers.current[3] = el)} position={[0, STACK.y[3], 0]}>
        <YouLayer compact={compact} />
        <LayerLabel position={LABEL_AT} show={labelShow} compact={compact}>
          {LAYERS[3]}
        </LayerLabel>
      </group>
      <Spine />
    </group>
  );
}

/* ---------------------------------------------------------------- markets */

/** Eight real markets as live lines across the bottom layer (green / red = up / down over the window). */
function MarketsLayer({ quotes, lite }: { quotes: Quotes; lite: boolean }) {
  const lanes = useMemo(
    () =>
      LANE_KEYS.flatMap(([key], k) => {
        const closes = quotes[key]?.closes ?? [];
        if (closes.length < 2) return [];
        const z = -0.66 + (k * 1.32) / (LANE_KEYS.length - 1);
        const pts = closesPoints(closes, { x0: -1.15, x1: 1.15, y0: TOP + 0.04, y1: TOP + 0.28, z });
        return [{ key, pts, color: dirColor(closes) }];
      }),
    [quotes],
  );
  const paths = useMemo(() => lanes.map((l) => l.pts), [lanes]);
  const colors = useMemo(() => lanes.map((l) => l.color), [lanes]);
  const bases = useMemo(() => lanes.map((l) => hdr(l.color, 0.9)), [lanes]);
  const { still } = useStoryFrame();
  const lines = useRef<(LineObj | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  // the request lands: every line brightens and thickens, the newest prices swell
  useFrame((s) => {
    const g = still ? 0 : requestGlow(s.clock.elapsedTime, 0);
    for (let k = 0; k < bases.length; k++) {
      const l = lines.current[k];
      if (l) {
        l.material.color.copy(bases[k]).multiplyScalar(1 + 1.3 * g);
        l.material.linewidth = 1.1 + 1.3 * g;
      }
      dots.current[k]?.scale.setScalar(1 + 1.4 * g);
    }
  });
  return (
    <group name="Markets">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.4} />
      {/* the prices being read: a glint traces each line, the lines shimmer in turn (phones: neither) */}
      {lite ? null : <Tracer paths={paths} colors={colors} size={0.026} period={5.5} stagger={0.137} />}
      {lanes.map((l, k) => {
        const line = <GlowLine ref={(el: LineObj | null) => void (lines.current[k] = el)} points={l.pts} color={l.color} intensity={0.9} width={1.1} opacity={0.72} />;
        return (
          <group key={l.key}>
            {lite ? (
              line
            ) : (
              <Pulse period={4} amp={0.45} phase={k / 8}>
                {line}
              </Pulse>
            )}
            <mesh ref={(el) => void (dots.current[k] = el)} position={l.pts[l.pts.length - 1]}>
              <sphereGeometry args={[0.028, 12, 12]} />
              <meshBasicMaterial color={hdr(l.color, 1.6)} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

/* --------------------------------------------------------------------- AI */

/** Circuit traces from the die to the plate's edges (plate x, z). */
const TRACES: [number, number][][] = [
  [[0.22, 0], [0.66, 0], [0.9, 0.24], [1.22, 0.24]],
  [[-0.22, 0], [-0.66, 0], [-0.9, -0.24], [-1.22, -0.24]],
  [[0, 0.22], [0, 0.46], [0.28, 0.74]],
  [[0, -0.22], [0, -0.46], [-0.28, -0.74]],
  [[0.16, 0.16], [0.42, 0.42], [0.92, 0.42], [1.1, 0.62]],
  [[-0.16, -0.16], [-0.42, -0.42], [-0.92, -0.42], [-1.1, -0.62]],
  [[0.16, -0.16], [0.46, -0.46], [0.88, -0.46]],
  [[-0.16, 0.16], [-0.46, 0.46], [-0.88, 0.46]],
];

/** The AI layer: a gold circuit; pulses run out from the die where the spark burns. */
const TRACE = hdr(COLORS.gold, 1.15);
const DIE = new THREE.Color(COLORS.gold);

function AiLayer({ lite }: { lite: boolean }) {
  const { still } = useStoryFrame();
  const traces = useRef<(LineObj | null)[]>([]);
  const dieMat = useRef<THREE.MeshStandardMaterial>(null);
  const spark = useRef<THREE.Group>(null);
  const paths = useMemo(() => TRACES.map((tr) => tr.map(([x, z]) => new THREE.Vector3(x, TOP + 0.006, z))), []);
  const lens = useMemo(() => paths.map(lengths), [paths]);
  const die = useMemo(() => {
    const r = 0.2;
    return [new THREE.Vector3(-r, TOP + 0.006, -r), new THREE.Vector3(r, TOP + 0.006, -r), new THREE.Vector3(r, TOP + 0.006, r), new THREE.Vector3(-r, TOP + 0.006, r), new THREE.Vector3(-r, TOP + 0.006, -r)];
  }, []);
  const pulses = useRef<THREE.InstancedMesh>(null);
  const [m4, v] = useMemo(() => [new THREE.Matrix4(), new THREE.Vector3()] as const, []);
  useFrame((s) => {
    const im = pulses.current;
    if (!im) return;
    const t = still ? 2.2 : s.clock.elapsedTime;
    // the answer passes: the circuit flares (colour, width, die, beads), the spark swells
    const g = still ? 0 : requestGlow(t, 1);
    for (let k = 0; k < traces.current.length; k++) {
      const l = traces.current[k];
      if (!l) continue;
      l.material.color.copy(TRACE).multiplyScalar(1 + 1.4 * g);
      l.material.linewidth = 1.25 + 1.3 * g;
    }
    dieMat.current?.emissive.copy(DIE).multiplyScalar(1 + 3 * g);
    // the spark breathes (~3.2 s; phones: only the flare)
    spark.current?.scale.setScalar(1 + (still || lite ? 0 : 0.14 * Math.sin((t / 3.2) * TAU)) + 0.6 * g);
    paths.forEach((p, k) => {
      const u = (t * 0.2 + k * 0.137) % 1;
      along(p, lens[k], u, v);
      const size = 0.032 * (1 + 1.2 * g) * Math.sin(Math.PI * u);
      m4.makeScale(size, size, size).setPosition(v);
      im.setMatrixAt(k, m4);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="AI">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.75} tint="#0E1F17" />
      {/* the circuit pulses with the AI's work (~2.6 s) */}
      <Pulse period={2.6} amp={0.5}>
        {paths.map((p, k) => (
          <group key={k}>
            <GlowLine ref={(el: LineObj | null) => void (traces.current[k] = el)} points={p} color={COLORS.gold} intensity={1.15} width={1.25} opacity={0.85} />
            <mesh position={p[p.length - 1]}>
              <boxGeometry args={[0.07, 0.012, 0.07]} />
              <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh position={[0, TOP + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.4, 0.4]} />
          <meshStandardMaterial ref={dieMat} color="#1B1408" metalness={0.6} roughness={0.35} emissive={COLORS.gold} emissiveIntensity={0.3} />
        </mesh>
        <GlowLine points={die} color={COLORS.goldHot} intensity={1.3} width={1.4} />
      </Pulse>
      <instancedMesh ref={pulses} args={[undefined, undefined, TRACES.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={hdr(COLORS.goldHot, 2.2)} toneMapped={false} />
      </instancedMesh>
      <Float position={[0, TOP + 0.2, 0]} rotation={FACE} y={0.035} period={3.2}>
        <group ref={spark}>
          <AiSpark size={0.075} glow={1.15} />
        </group>
      </Float>
    </group>
  );
}

/* -------------------------------------------------------------- workspace */

/** The five area tiles stand in a row across the layer, in front of the spine. */
function WorkspaceLayer({ compact, lite }: { compact: boolean; lite: boolean }) {
  const spots = useMemo(
    () =>
      APPS.map((_, k) => {
        // along the diagonal that reads left → right on screen, nudged towards the front
        const u = (k - 2) * 0.19;
        return new THREE.Vector3(STACK.width * u + 0.17, 0, -STACK.depth * u + 0.27);
      }),
    [],
  );
  const { still } = useStoryFrame();
  const doors = useRef<(THREE.Group | null)[]>([]);
  const pads = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const faces = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  // the answer lifts one door (each loop the next), lit gold, its pad glowing
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const g = still ? 0 : requestGlow(t, 2);
    const on = liftedTile(t);
    for (let k = 0; k < APPS.length; k++) {
      const gk = k === on ? g : 0;
      const d = doors.current[k];
      if (d) d.position.y = 0.16 * gk;
      const p = pads.current[k];
      if (p) p.opacity = 0.1 + 0.45 * gk;
      const f = faces.current[k];
      if (f) f.emissiveIntensity = 0.03 + 0.5 * gk;
    }
  });
  return (
    <group name="Workspace">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.5} />
      {APPS.map((app, k) => (
        <group key={app.slug} position={spots[k]}>
          <mesh position={[0, TOP + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial ref={(el) => void (pads.current[k] = el)} color={COLORS.gold} transparent opacity={0.1} depthWrite={false} toneMapped={false} />
          </mesh>
          {/* the doors bob in turn (phones: still — each moving tile re-places its DOM glyph every frame) */}
          <group ref={(el) => void (doors.current[k] = el)}>
            <Float position={[0, TOP + 0.22, 0]} rotation={FACE} y={lite ? 0 : 0.035} period={4.2} phase={k / 5}>
              <AreaTile glyph={app.glyph} size={0.36} icon={compact ? 13 : 17} matRef={(el: THREE.MeshStandardMaterial | null) => void (faces.current[k] = el)} />
            </Float>
          </group>
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------- you */

/** The top layer: the Ask AFVAR bar — type or speak, English or हिन्दी. */
function YouLayer({ compact }: { compact: boolean }) {
  const { labels, still } = useStoryFrame();
  const bar = useRef<THREE.Group>(null);
  const orb = useRef<HTMLSpanElement>(null);
  const last = useRef(0);
  // the orb fires as a request leaves and pulses as the answer arrives; the bar swells with it
  useFrame((s) => {
    const g = still ? 0 : requestGlow(s.clock.elapsedTime, 3);
    bar.current?.scale.setScalar(1 + 0.05 * g);
    const el = orb.current;
    if (!el || Math.abs(g - last.current) < 0.01) return;
    last.current = g;
    el.style.transform = g > 0.01 ? `scale(${(1 + 0.9 * g).toFixed(3)})` : "";
    el.style.boxShadow = g > 0.01 ? `0 0 ${(8 + 14 * g).toFixed(1)}px ${(2 + 4 * g).toFixed(1)}px rgba(240,180,41,${(0.75 * g).toFixed(3)})` : "";
  });
  return (
    <group name="You">
      <group ref={bar} position={[0, 0.1, 0]} rotation={FACE}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <GlassPlate width={compact ? 1.45 : 1.9} depth={0.32} radius={0.15} thickness={0.04} edge={0.85} tint="#06110C" opacity={0.92} />
        </group>
        <Html center position={[0, 0, 0.05]} portal={labels as RefObject<HTMLElement>} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-[0.8em] whitespace-nowrap text-[#B7C5BC]" style={{ fontSize: compact ? "10px" : "clamp(9.5px, 1.3vh, 12.5px)" }}>
            <span ref={orb} className="h-[0.55em] w-[0.55em] rounded-full bg-[#A8DEC2] shadow-[0_0_8px_2px_rgba(168,222,194,0.6)]" />
            <span>{compact ? "Ask AFVAR" : "Ask AFVAR or type a command"}</span>
            <span className="afv-voice flex h-[1em] items-center gap-[2px]" aria-hidden="true">
              {[0.55, 1, 0.7].map((h, i) => (
                <span key={i} className="w-[2px] rounded-full bg-[#A8DEC2]" style={{ height: `${h}em`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            {compact ? null : <span className="font-mono text-[0.78em] tracking-[0.14em] text-[#92A399]">EN · हिन्दी</span>}
          </div>
        </Html>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------ spine */

/** The path a request takes: from you, through the AI, down to the markets and back. */
function Spine() {
  const { still } = useStoryFrame();
  const pts = useMemo(() => [new THREE.Vector3(0, SPINE[0], 0), new THREE.Vector3(0, SPINE[1], 0)], []);
  const beads = useRef<(THREE.Mesh | null)[]>([]);
  const line = useRef<LineObj>(null);
  // bead 0 is the request (down), bead 1 the answer (back up); the dashes flow while one travels
  useFrame((s) => {
    const t = still ? 1.05 : s.clock.elapsedTime;
    const at = inLoop(t);
    let travel = 0;
    beads.current.forEach((m, k) => {
      if (!m) return;
      const [a, b] = k === 0 ? DOWN : UP;
      const u = (at - a) / (b - a);
      if (u < 0 || u > 1) {
        m.scale.setScalar(0.0001);
        return;
      }
      const hump = Math.sin(Math.PI * u);
      travel = Math.max(travel, hump);
      m.position.lerpVectors(pts[k], pts[1 - k], u);
      m.scale.setScalar(0.012 + 0.02 * hump);
    });
    const l = line.current;
    if (l) {
      l.material.opacity = 0.45 + (still ? 0 : 0.45 * travel);
      l.material.dashOffset = still ? 0 : -t * 0.35;
    }
  });
  return (
    <group name="Spine">
      <GlowLine ref={line} points={pts} color={COLORS.gold} intensity={1} width={1} opacity={0.45} dashed dashSize={0.06} gapSize={0.05} />
      {[0, 1].map((k) => (
        <mesh key={k} ref={(el) => void (beads.current[k] = el)}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 1.5)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/* ----------------------------------------------------------------- labels */

const projected = new THREE.Vector3();

/** A layer's name, beside its right corner (smaller on phones, where the stack is small). Kept inside the canvas: on near-square desktops (1920×1080 in the 1440 frame) the corner sits at the edge. */
function LayerLabel({ position, show, compact, children }: { position: [number, number, number]; show: (p: number) => number; compact: boolean; children: ReactNode }) {
  const { smoothed, labels } = useStoryFrame();
  const ref = useRef<HTMLDivElement>(null);
  useFrame(() => {
    const o = show(smoothed.current ?? 0);
    if (ref.current) {
      ref.current.style.opacity = String(o);
      ref.current.style.visibility = o < 0.01 ? "hidden" : "visible";
    }
  });
  return (
    <Html
      position={position}
      portal={labels as RefObject<HTMLElement>}
      center
      zIndexRange={[20, 0]}
      style={{ pointerEvents: "none" }}
      calculatePosition={(el, camera, size) => {
        projected.setFromMatrixPosition(el.matrixWorld).project(camera);
        const half = (ref.current?.offsetWidth ?? 0) / 2 + 8;
        const x = ((projected.x + 1) / 2) * size.width;
        return [Math.min(Math.max(x, half), size.width - half), ((1 - projected.y) / 2) * size.height];
      }}
    >
      <div
        ref={ref}
        style={{ opacity: 0, visibility: "hidden" }}
        className={`whitespace-nowrap border border-[rgba(255,255,255,0.18)] bg-[#10231B] font-mono uppercase text-[#F2F5F2] ${compact ? "px-1.5 py-px text-[8.5px] tracking-[0.12em]" : "px-2.5 py-1 text-[11px] tracking-[0.16em] [@media(max-height:520px)]:px-1.5 [@media(max-height:520px)]:py-0.5 [@media(max-height:520px)]:text-[8.5px]"}`}
      >
        {children}
      </div>
    </Html>
  );
}
