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
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { LANE_KEYS, type Quotes } from "@/modules/homeDemo/kit";
import { APPS } from "../overviewFilm";
import { AreaTile } from "../parts/AreaTile";
import { closesPoints, dirColor } from "../parts/closes";

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

export function PlatformStack({ quotes, compact, labelShow }: { quotes: Quotes; compact: boolean; labelShow: (p: number) => number }) {
  const { still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const layers = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    const t = still ? 0 : s.clock.elapsedTime;
    if (group.current) group.current.rotation.y = STACK.spin + 0.045 * Math.sin(t * 0.21);
    // the layers breathe apart and together
    const k = 1 + 0.035 * Math.sin(t * 0.55);
    layers.current.forEach((g, i) => {
      if (g) g.position.y = STACK.y[i] * k;
    });
  });
  return (
    <group ref={group} name="PlatformStack" position={[0, STACK.lift, 0]} rotation={[STACK.tilt, STACK.spin, 0]}>
      <group ref={(el) => void (layers.current[0] = el)} position={[0, STACK.y[0], 0]}>
        <MarketsLayer quotes={quotes} />
      </group>
      <group ref={(el) => void (layers.current[1] = el)} position={[0, STACK.y[1], 0]}>
        <AiLayer />
      </group>
      <group ref={(el) => void (layers.current[2] = el)} position={[0, STACK.y[2], 0]}>
        <WorkspaceLayer compact={compact} />
      </group>
      <group ref={(el) => void (layers.current[3] = el)} position={[0, STACK.y[3], 0]}>
        <YouLayer compact={compact} />
      </group>
      <Spine />
      {LAYERS.map((name, i) => (
        <LayerLabel key={name} position={[STACK.width / 2 + 0.32, STACK.y[i], -STACK.depth / 2 - 0.22]} show={labelShow} compact={compact}>
          {name}
        </LayerLabel>
      ))}
    </group>
  );
}

/* ---------------------------------------------------------------- markets */

/** Eight real markets as live lines across the bottom layer (green / red = up / down over the window). */
function MarketsLayer({ quotes }: { quotes: Quotes }) {
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
  return (
    <group name="Markets">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.4} />
      {lanes.map((l) => (
        <group key={l.key}>
          <GlowLine points={l.pts} color={l.color} intensity={0.9} width={1.1} opacity={0.72} />
          <mesh position={l.pts[l.pts.length - 1]}>
            <sphereGeometry args={[0.028, 12, 12]} />
            <meshBasicMaterial color={hdr(l.color, 1.6)} toneMapped={false} />
          </mesh>
        </group>
      ))}
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

function along(path: THREE.Vector3[], lens: number[], u: number, out: THREE.Vector3) {
  const total = lens[lens.length - 1];
  const d = u * total;
  let i = 1;
  while (i < lens.length - 1 && lens[i] < d) i++;
  const a = path[i - 1];
  const b = path[i];
  const f = (d - lens[i - 1]) / Math.max(1e-6, lens[i] - lens[i - 1]);
  return out.copy(a).lerp(b, f);
}

/** The AI layer: a gold circuit; pulses run out from the die where the spark burns. */
function AiLayer() {
  const { still } = useStoryFrame();
  const paths = useMemo(() => TRACES.map((tr) => tr.map(([x, z]) => new THREE.Vector3(x, TOP + 0.006, z))), []);
  const lens = useMemo(
    () =>
      paths.map((p) => {
        const out = [0];
        for (let i = 1; i < p.length; i++) out.push(out[i - 1] + p[i].distanceTo(p[i - 1]));
        return out;
      }),
    [paths],
  );
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
    paths.forEach((p, k) => {
      const u = (t * 0.2 + k * 0.137) % 1;
      along(p, lens[k], u, v);
      const size = 0.026 * Math.sin(Math.PI * u);
      m4.makeScale(size, size, size).setPosition(v);
      im.setMatrixAt(k, m4);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return (
    <group name="AI">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.75} tint="#141109" />
      {paths.map((p, k) => (
        <group key={k}>
          <GlowLine points={p} color={COLORS.gold} intensity={1.15} width={1.25} opacity={0.85} />
          <mesh position={p[p.length - 1]}>
            <boxGeometry args={[0.07, 0.012, 0.07]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, TOP + 0.004, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.4, 0.4]} />
        <meshStandardMaterial color="#1B1408" metalness={0.6} roughness={0.35} emissive={COLORS.gold} emissiveIntensity={0.08} />
      </mesh>
      <GlowLine points={die} color={COLORS.goldHot} intensity={1.3} width={1.4} />
      <instancedMesh ref={pulses} args={[undefined, undefined, TRACES.length]}>
        <sphereGeometry args={[1, 10, 10]} />
        <meshBasicMaterial color={hdr(COLORS.goldHot, 2.2)} toneMapped={false} />
      </instancedMesh>
      <group position={[0, TOP + 0.2, 0]} rotation={FACE}>
        <AiSpark size={0.075} />
      </group>
    </group>
  );
}

/* -------------------------------------------------------------- workspace */

/** The five area tiles stand in a row across the layer, in front of the spine. */
function WorkspaceLayer({ compact }: { compact: boolean }) {
  const spots = useMemo(
    () =>
      APPS.map((_, k) => {
        // along the diagonal that reads left → right on screen, nudged towards the front
        const u = (k - 2) * 0.19;
        return new THREE.Vector3(STACK.width * u + 0.17, 0, -STACK.depth * u + 0.27);
      }),
    [],
  );
  return (
    <group name="Workspace">
      <GlassPlate width={STACK.width} depth={STACK.depth} edge={0.5} />
      {APPS.map((app, k) => (
        <group key={app.slug} position={spots[k]}>
          <mesh position={[0, TOP + 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.15, 32]} />
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.1} depthWrite={false} toneMapped={false} />
          </mesh>
          <group position={[0, TOP + 0.22, 0]} rotation={FACE}>
            <AreaTile glyph={app.glyph} size={0.36} icon={compact ? 13 : 17} />
          </group>
        </group>
      ))}
    </group>
  );
}

/* -------------------------------------------------------------------- you */

/** The top layer: the Ask AFVAR bar — type or speak, English or हिन्दी. */
function YouLayer({ compact }: { compact: boolean }) {
  const { labels } = useStoryFrame();
  return (
    <group name="You">
      <group position={[0, 0.1, 0]} rotation={FACE}>
        <group rotation={[Math.PI / 2, 0, 0]}>
          <GlassPlate width={compact ? 1.45 : 1.9} depth={0.32} radius={0.15} thickness={0.04} edge={0.85} tint="#0B0E10" opacity={0.92} />
        </group>
        <Html center position={[0, 0, 0.05]} portal={labels as RefObject<HTMLElement>} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
          <div className="flex items-center gap-[0.8em] whitespace-nowrap text-[#A3AAAC]" style={{ fontSize: compact ? "10px" : "clamp(9.5px, 1.3vh, 12.5px)" }}>
            <span className="h-[0.55em] w-[0.55em] rounded-full bg-[#E9B44C] shadow-[0_0_8px_2px_rgba(233,180,76,0.6)]" />
            <span>{compact ? "Ask AFVAR" : "Ask AFVAR or type a command"}</span>
            <span className="afv-voice flex h-[1em] items-center gap-[2px]" aria-hidden="true">
              {[0.55, 1, 0.7].map((h, i) => (
                <span key={i} className="w-[2px] rounded-full bg-[#E9B44C]" style={{ height: `${h}em`, animationDelay: `${i * 0.15}s` }} />
              ))}
            </span>
            {compact ? null : <span className="font-mono text-[0.78em] tracking-[0.14em] text-[#6D7578]">EN · हिन्दी</span>}
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
  const pts = useMemo(() => [new THREE.Vector3(0, STACK.y[3] - 0.08, 0), new THREE.Vector3(0, STACK.y[0] + 0.06, 0)], []);
  const beads = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = still ? 1.1 : s.clock.elapsedTime;
    beads.current.forEach((m, k) => {
      if (!m) return;
      const u = (t * 0.16 + k * 0.5) % 1;
      m.position.lerpVectors(pts[0], pts[1], u);
      m.scale.setScalar(Math.max(0.0001, 0.014 * Math.sin(Math.PI * u)));
    });
  });
  return (
    <group name="Spine">
      <GlowLine points={pts} color={COLORS.gold} intensity={1} width={1} opacity={0.45} dashed dashSize={0.06} gapSize={0.05} />
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

/** A layer's name, beside its right corner (smaller on phones, where the stack is small). */
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
    <Html position={position} portal={labels as RefObject<HTMLElement>} center zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div
        ref={ref}
        style={{ opacity: 0, visibility: "hidden" }}
        className={`whitespace-nowrap border border-[rgba(255,255,255,0.18)] bg-[#0F1214] font-mono uppercase text-[#F5F7F7] ${compact ? "px-1.5 py-px text-[8.5px] tracking-[0.12em]" : "px-2.5 py-1 text-[11px] tracking-[0.16em] [@media(max-height:520px)]:px-1.5 [@media(max-height:520px)]:py-0.5 [@media(max-height:520px)]:text-[8.5px]"}`}
      >
        {children}
      </div>
    </Html>
  );
}
