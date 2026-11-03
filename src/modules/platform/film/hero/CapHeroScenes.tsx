"use client";

// The 3D heroes of Research, Alerts, Risk Review and Community — each page's
// own centrepiece, built from the shared kit (glass, gold lines, the spark,
// gold dust). Only the hero shows 3D; the sections after it are OS windows.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS, type CameraKey } from "@/modules/afvarOs";
import { AiSpark, CoreCanvas, GlassPlate, GlowLine, GoldDust, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { Float, Pulse, Tracer, along, lengths, wave } from "../parts/idle";
import type { HeroSceneArgs } from "./HeroStage";

export type CapHeroKind = "research" | "alerts" | "risk" | "community";

const CAM: CameraKey[] = [
  { at: 0, pos: [0.2, 0.15, 8.2], look: [-1.45, 0.05, 0] },
  { at: 1, pos: [0.2, 0.15, 8.3], look: [-1.45, 0.05, 0] },
];
const CAM_P: CameraKey[] = [
  { at: 0, pos: [0, -0.4, 11.5], look: [0, -2.1, 0] },
  { at: 1, pos: [0, -0.4, 11.6], look: [0, -2.1, 0] },
];

export default function CapHeroScene({ kind, a }: { kind: CapHeroKind; a: HeroSceneArgs }) {
  return (
    <CoreCanvas progress={a.progress} active={a.active} still={a.still} settledP={0} camera={a.portrait ? CAM_P : CAM} fov={a.portrait ? 50 : 38} parallax={a.portrait ? 0.04 : 0.12} bloom={a.lite ? 0.55 : 0.75} dpr={a.lite ? [1, 1.4] : [1, 1.75]}>
      <Sway>
        {kind === "research" ? <ResearchFan /> : kind === "alerts" ? <AlertLevels lite={a.lite} /> : kind === "risk" ? <RiskTimeline /> : a.portrait ? (
          <CommunityFit>
            <CommunityRooms lite={a.lite} />
          </CommunityFit>
        ) : (
          <CommunityRooms lite={a.lite} />
        )}
      </Sway>
      <GoldDust count={a.lite ? 150 : 220} box={[10, 6.5, 6]} center={[0, 0, -0.6]} drift={[0.02, 0.03, 0]} opacity={0.4} />
    </CoreCanvas>
  );
}

function Sway({ children }: { children: React.ReactNode }) {
  const { still } = useStoryFrame();
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current || still) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = 0.06 * Math.sin(t * 0.26);
    g.current.position.y = 0.045 * Math.sin(t * 0.55);
  });
  return <group ref={g}>{children}</group>;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Inside a group turned by `rot`, face a child back to the camera. */
const face = (x: number, y: number): [number, number, number, THREE.EulerOrder] => [-x, -y, 0, "YXZ"];

/* Research: numbered source cards; a gold thread carries each cited line into its row of the brief. */
const TILT: [number, number] = [0.1, -0.24];
const SOURCES = [0.82, 0.04, -0.74].map((y) => v(-1.5, y, 0));
const SOURCE_CARD = { w: 1.2, h: 0.62 };
const BRIEF = v(1.2, 0, 0.15);
const BRIEF_W = 1.45;
/** World y of the cited rows on the brief, one per source, top to bottom. */
const BRIEF_ROWS = [0.4, 0.05, -0.3];
const MARK_X = BRIEF.x - BRIEF_W / 2 + 0.1;
/** Spark and brief share one cycle: 3.2 s per source, and row k writes as the spark lands on it. */
const CYCLE = 3.2;
const LEAD = 1.4;
const TOTAL = CYCLE * SOURCES.length;
/** Where the reading is: k is the source being read, f how far through its slot (0…1). */
const slot = (t: number) => {
  const c = (t + LEAD) % TOTAL;
  return { c, k: Math.floor(c / CYCLE), f: (c % CYCLE) / CYCLE };
};
/** The spark scans its source until READ, travels, and lands on the brief at LAND (fractions of a slot). */
const READ = 0.25;
const LAND = 0.9;
/** Seconds since brief row r last received its line. */
const sinceLanding = (c: number, r: number) => (c - (r + LAND) * CYCLE + TOTAL) % TOTAL;

type Fade = { mat: THREE.Material; base: number }[];
/** The transparent materials under a group, with their own opacity, so a frame can scale them. */
function fadesOf(g: THREE.Object3D): Fade {
  const out: Fade = [];
  g.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (m && !Array.isArray(m) && m.transparent) out.push({ mat: m, base: m.opacity });
  });
  return out;
}
function useFade() {
  const g = useRef<THREE.Group>(null);
  const cache = useRef<Fade | null>(null);
  const set = (k: number) => {
    if (!g.current) return;
    cache.current ??= fadesOf(g.current);
    for (const x of cache.current) x.mat.opacity = x.base * k;
  };
  return [g, set] as const;
}

/** A rounded rectangle outline in a plate's top plane (x across, z down the plate). */
function roundRect(w: number, h: number, r: number, y = 0.035) {
  const pts: THREE.Vector3[] = [];
  const corners: [number, number, number][] = [
    [w / 2 - r, h / 2 - r, 0],
    [-w / 2 + r, h / 2 - r, 0.5],
    [-w / 2 + r, -h / 2 + r, 1],
    [w / 2 - r, -h / 2 + r, 1.5],
  ];
  for (const [cx, cz, a0] of corners) for (let s = 0; s <= 6; s++) {
    const a = (a0 + s / 12) * Math.PI;
    pts.push(v(cx + r * Math.cos(a), y, cz + r * Math.sin(a)));
  }
  pts.push(pts[0].clone());
  return pts;
}
const SOURCE_RIM = roundRect(SOURCE_CARD.w + 0.05, SOURCE_CARD.h + 0.05, 0.08);
const BRIEF_RIM = roundRect(BRIEF_W + 0.06, 1.86, 0.1);

/** Motion: the spark reads along each thread, source → brief; the cited row writes itself as it lands. */
function ResearchFan() {
  const threads = useMemo(
    () =>
      SOURCES.map((s, i) => {
        const from = v(s.x + 0.42, s.y, 0.03);
        const to = v(MARK_X, BRIEF_ROWS[i], BRIEF.z + 0.03);
        return new THREE.CatmullRomCurve3([from, v(from.x + 0.5, from.y, 0.12), v(to.x - 0.5, to.y, 0.12), to]).getPoints(32);
      }),
    [],
  );
  return (
    <group position={[0.15, 0.02, 0]} rotation={[TILT[0], TILT[1], 0]} scale={1.2}>
      {SOURCES.map((s, i) => (
        <group key={i} position={s} rotation={[Math.PI / 2, 0, 0]}>
          <GlassPlate width={SOURCE_CARD.w} depth={SOURCE_CARD.h} thickness={0.03} radius={0.06} edge={0.5} />
          {/* the source's number, then its title, the cited line in gold and one more line */}
          {Array.from({ length: i + 1 }, (_, n) => (
            <GlowLine key={n} points={[v(-0.5 + n * 0.05, 0.03, -0.2), v(-0.5 + n * 0.05, 0.03, -0.12)]} color={COLORS.gold} intensity={1.2} width={1.4} />
          ))}
          <GlowLine points={[v(-0.3, 0.03, -0.16), v(0.15, 0.03, -0.16)]} color="#3A5A4A" intensity={1} width={1.1} />
          <Pulse period={CYCLE * 3} amp={0.4}>
            <GlowLine points={[v(-0.5, 0.03, 0), v(0.42, 0.03, 0)]} color={COLORS.gold} intensity={1.3} width={1.6} />
          </Pulse>
          <GlowLine points={[v(-0.5, 0.03, 0.16), v(0.1, 0.03, 0.16)]} color="#2A3F35" intensity={1} width={1} />
          <SourceFocus i={i} />
        </group>
      ))}
      <group position={BRIEF} rotation={[Math.PI / 2, 0, 0]}>
        <GlassPlate width={BRIEF_W} depth={1.8} thickness={0.04} radius={0.08} edge={0.85} tint="#0E1F17" opacity={0.75} />
        <Pulse period={3} amp={0.35}>
          <GlowLine points={[v(-0.6, 0.03, -0.7), v(0.35, 0.03, -0.7)]} color={COLORS.gold} intensity={1.2} width={3} />
        </Pulse>
        <BriefRows />
        {[-0.55, -0.7].map((y, k) => (
          <GlowLine key={k} points={[v(-0.6, 0.03, -y), v(k ? 0.05 : 0.4, 0.03, -y)]} color="#24372D" intensity={1} width={1} />
        ))}
        <BriefFlash />
      </group>
      {threads.map((p, i) => (
        <Thread key={i} i={i} points={p} />
      ))}
      <Tracer paths={threads} colors={[COLORS.goldHot]} size={0.014} period={2.4} stagger={0.33} intensity={1.6} />
      <LandingPings />
      <ReadingSpark threads={threads} />
    </group>
  );
}

/** The source being read lights its rim, and a scan line runs down it to the cited line. */
function SourceFocus({ i }: { i: number }) {
  const { still } = useStoryFrame();
  const [rim, setRim] = useFade();
  const [scan, setScan] = useFade();
  const sweep = useRef<THREE.Group>(null);
  useFrame((s) => {
    const { k, f } = slot(s.clock.elapsedTime);
    const on = still || k !== i ? 0 : THREE.MathUtils.smoothstep(f, 0, 0.08) * (1 - THREE.MathUtils.smoothstep(f, 0.55, 0.9));
    setRim(on);
    const u = THREE.MathUtils.clamp(f / READ, 0, 1);
    setScan(still || k !== i ? 0 : Math.sin(Math.PI * u));
    if (sweep.current) sweep.current.position.z = -0.27 + 0.27 * THREE.MathUtils.smoothstep(u, 0, 1);
  });
  return (
    <>
      <group ref={rim}>
        <GlowLine points={SOURCE_RIM} color={COLORS.goldHot} intensity={1.4} width={1.6} opacity={1} />
      </group>
      <group ref={sweep}>
        <group ref={scan}>
          <GlowLine points={[v(-0.56, 0.04, 0), v(0.56, 0.04, 0)]} color={COLORS.goldHot} intensity={1.8} width={2} opacity={1} />
        </group>
      </group>
    </>
  );
}

/** A thread glows while the spark carries its line, and rests dim otherwise. */
function Thread({ i, points }: { i: number; points: THREE.Vector3[] }) {
  const { still } = useStoryFrame();
  const [g, set] = useFade();
  useFrame((s) => {
    const { k, f } = slot(s.clock.elapsedTime);
    set(still ? 0.75 : k === i ? 0.35 + 0.65 * THREE.MathUtils.smoothstep(f, READ - 0.1, READ + 0.05) : 0.32);
  });
  return (
    <group ref={g}>
      <GlowLine points={points} color={COLORS.gold} intensity={1.15} width={1.2} opacity={1} />
    </group>
  );
}

/** A ring ripples out from each citation marker as its line lands. */
function LandingPings() {
  const { still } = useStoryFrame();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const { c } = slot(s.clock.elapsedTime);
    rings.current.forEach((m, r) => {
      if (!m) return;
      const d = sinceLanding(c, r) / 0.9;
      m.visible = !still && d < 1;
      m.scale.setScalar(1 + 2.6 * d);
      (m.material as THREE.MeshBasicMaterial).opacity = 0.9 * (1 - d) * (1 - d);
    });
  });
  return (
    <>
      {BRIEF_ROWS.map((y, r) => (
        <mesh key={r} ref={(el) => void (rings.current[r] = el)} position={[MARK_X + 0.035, y, BRIEF.z + 0.05]} visible={false}>
          <ringGeometry args={[0.03, 0.042, 32]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 1.6)} transparent opacity={0} depthWrite={false} toneMapped={false} />
        </mesh>
      ))}
    </>
  );
}

/** Once the last line lands, the brief's rim flares: the brief is complete. */
function BriefFlash() {
  const { still } = useStoryFrame();
  const [g, set] = useFade();
  useFrame((s) => {
    const d = sinceLanding(slot(s.clock.elapsedTime).c, BRIEF_ROWS.length - 1);
    set(still ? 0 : d < 1.6 ? THREE.MathUtils.smoothstep(d, 0.5, 0.75) * (1 - THREE.MathUtils.smoothstep(d, 0.9, 1.6)) : 0);
  });
  return (
    <group ref={g}>
      <GlowLine points={BRIEF_RIM} color={COLORS.goldHot} intensity={1.5} width={2} opacity={1} />
    </group>
  );
}

/** Each cited row writes left → right as the spark lands on its marker, holds, then all reset together. */
function BriefRows() {
  const { still } = useStoryFrame();
  const rows = useRef<(THREE.Group | null)[]>([]);
  useFrame((s) => {
    const { c } = slot(s.clock.elapsedTime);
    rows.current.forEach((g, k) => {
      if (!g) return;
      const lands = (k + LAND) * CYCLE;
      const w = still ? 1 : c < 0.5 ? 1 - THREE.MathUtils.smoothstep(c, 0, 0.5) : THREE.MathUtils.smoothstep(c, lands - 0.15, lands + 0.75);
      g.scale.x = 0.04 + 0.96 * w;
    });
  });
  return (
    <>
      {BRIEF_ROWS.map((y, k) => (
        <group key={k}>
          {/* the citation marker the thread lands on */}
          <GlowLine points={[v(-0.62, 0.03, -y), v(-0.55, 0.03, -y)]} color={COLORS.gold} intensity={1.3} width={2.2} />
          <group ref={(el) => void (rows.current[k] = el)} position={[-0.48, 0, 0]}>
            <GlowLine points={[v(0, 0.03, -y), v(k === 1 ? 0.8 : 1.0, 0.03, -y)]} color="#4A7560" intensity={1.05} width={1.3} />
          </group>
        </group>
      ))}
    </>
  );
}

const sparkAt = new THREE.Vector3();
/** The spark (the AI) reads along each thread from its source to the brief, then the next. */
function ReadingSpark({ threads }: { threads: THREE.Vector3[][] }) {
  const { still } = useStoryFrame();
  const g = useRef<THREE.Group>(null);
  const lens = useMemo(() => threads.map(lengths), [threads]);
  useFrame((s) => {
    if (!g.current) return;
    // waits on its source while the scan reads it, then eases across and lands on the brief
    const { k, f } = slot(s.clock.elapsedTime);
    along(threads[still ? 0 : k], lens[still ? 0 : k], still ? 0.5 : THREE.MathUtils.smootherstep(f, READ, LAND), sparkAt);
    g.current.position.copy(sparkAt);
  });
  return (
    <group ref={g} position={[-0.2, 0.25, 0.45]}>
      <group rotation={face(TILT[0], TILT[1])}>
        <AiSpark size={0.05} />
      </group>
    </group>
  );
}

/* Alerts: glass planes at your levels; the price line crosses one and it rings. */
const ALERT_PERIOD = 4.5;
const CROSS_X = 0.35;
const glint = new THREE.Vector3();
/** Motion: a glint traces the price line; as it crosses your level the level rings (ripples), the alert card swings like a bell. */
function AlertLevels({ lite }: { lite: boolean }) {
  const { still } = useStoryFrame();
  const rings = useRef<(THREE.Mesh | null)[]>([]);
  const head = useRef<THREE.Mesh>(null);
  const bell = useRef<THREE.Group>(null);
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -2.4 + (i / 40) * 4.8;
      pts.push(v(x, -1.0 + (i / 40) * 1.6 + 0.18 * Math.sin(i * 0.9) + 0.08 * Math.sin(i * 2.3), 0));
    }
    return pts;
  }, []);
  const lens = useMemo(() => lengths(line), [line]);
  // where (0…1 along the line) the price crosses the gold level
  const cross = useMemo(() => {
    let i = 1;
    while (i < line.length - 1 && line[i].x < CROSS_X) i++;
    return lens[i] / lens[lens.length - 1];
  }, [line, lens]);
  useFrame((s) => {
    const u = still ? cross + 0.12 : (s.clock.elapsedTime / ALERT_PERIOD) % 1;
    if (head.current) {
      along(line, lens, u, glint);
      head.current.position.copy(glint);
      head.current.scale.setScalar(0.04 * Math.sin(Math.PI * u) + 0.0001);
    }
    // time since the crossing, in periods (0 = just rang)
    const since = (u - cross + 1) % 1;
    rings.current.forEach((m, k) => {
      if (!m) return;
      const r = Math.min(1, Math.max(0, (since - k * 0.1) * 2.2));
      m.scale.setScalar(0.3 + r * 1.7);
      (m.material as THREE.MeshBasicMaterial).opacity = r <= 0 || r >= 1 ? 0 : 0.75 * (1 - r);
    });
    // the alert card swings like a bell when it rings, then settles
    if (bell.current) bell.current.rotation.z = still ? 0 : 0.09 * Math.exp(-since * 9) * Math.sin(since * ALERT_PERIOD * 14);
  });
  return (
    <group position={[0.3, -0.1, 0]} rotation={[0.35, -0.3, 0]} scale={0.82}>
      {[-0.9, 0, 0.9].map((y, i) => (
        <group key={y} position={[0, y, 0]}>
          <GlassPlate width={5} depth={1.6} thickness={0.03} radius={0.08} edge={i === 1 ? 0.95 : 0.3} edgeColor={i === 1 ? COLORS.gold : "#92A399"} tint={i === 1 ? "#0E1F17" : "#06110C"} opacity={i === 1 ? 0.55 : 0.35} />
        </group>
      ))}
      <GlowLine points={line} color={COLORS.ink} intensity={1.2} width={2} />
      <mesh ref={head}>
        <sphereGeometry args={[1, 12, 12]} />
        <meshBasicMaterial color={hdr(COLORS.ink, 2)} toneMapped={false} />
      </mesh>
      <group position={[CROSS_X, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        {(lite ? [0] : [0, 1]).map((k) => (
          <mesh key={k} ref={(el) => void (rings.current[k] = el)}>
            <ringGeometry args={[0.28, 0.31, 64]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.6)} transparent opacity={0} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
          </mesh>
        ))}
      </group>
      <group position={[CROSS_X, 0.05, 0]} rotation={face(0.35, -0.3)}>
        <AiSpark size={0.07} />
      </group>
      {/* the alert card hangs from its top edge and swings */}
      <group position={[1.3, 1.62, 0.2]}>
        <group ref={bell}>
          <Float y={0.03} period={5}>
            <group position={[0, -0.22, 0]} rotation={[Math.PI / 2 + 0.35, 0, 0]}>
              <GlassPlate width={1.3} depth={0.45} thickness={0.03} radius={0.1} edge={0.9} tint="#06110C" opacity={0.85} />
              <Pulse period={ALERT_PERIOD} amp={0.4}>
                <GlowLine points={[v(-0.45, 0.03, -0.08), v(0.35, 0.03, -0.08)]} color={COLORS.gold} intensity={1.2} width={2.4} />
              </Pulse>
            </group>
          </Float>
        </group>
      </group>
    </group>
  );
}

/* Risk review: past trades as glass bars above your daily-limit line. */
const TRADES = [0.9, -0.5, 1.3, 0.5, -0.8, -1.0, 0.7, 1.5, -0.4, 1.1, -0.6, 0.8];
const barX = (i: number) => -2.3 + i * 0.42;
const SCAN = { y: 1.8, period: 11 };
/** Motion: the bars rise and settle in a wave; the spark reviews them left ↔ right, lighting the trade it reads; the limit line breathes. */
function RiskTimeline() {
  const { still } = useStoryFrame();
  const bars = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const spark = useRef<THREE.Group>(null);
  useFrame((s) => {
    const t = still ? 0 : s.clock.elapsedTime;
    // the spark glides along the trades and back (eased at the ends)
    const sx = still ? barX(7) : barX(0) + (barX(TRADES.length - 1) - barX(0)) * (0.5 - 0.5 * Math.cos((t / SCAN.period) * Math.PI * 2));
    if (spark.current) spark.current.position.x = sx;
    for (let i = 0; i < TRADES.length; i++) {
      const g = bars.current[i];
      if (g) g.scale.y = still ? 1 : 0.84 + 0.16 * wave(t, 5.5, -i / TRADES.length);
      const m = mats.current[i];
      if (m) m.emissiveIntensity = 0.22 + 0.6 * Math.max(0, 1 - Math.abs(sx - barX(i)) / 0.42);
    }
  });
  return (
    <group position={[0.5, -0.25, 0]} rotation={[0.25, -0.4, 0]} scale={0.7}>
      <GlowLine points={[v(-2.6, 0, 0), v(2.6, 0, 0)]} color="#92A399" intensity={1} width={1.2} />
      {TRADES.map((r, i) => {
        const h = Math.abs(r);
        const up = r >= 0;
        return (
          <group key={i} ref={(el) => void (bars.current[i] = el)} position={[barX(i), 0, 0]}>
            <mesh position={[0, up ? h / 2 : -h / 2, 0]}>
              <boxGeometry args={[0.24, h, 0.24]} />
              <meshPhysicalMaterial ref={(el) => void (mats.current[i] = el)} color={up ? "#0E2A1B" : "#2A0E0E"} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={0.25} metalness={0.3} roughness={0.35} transparent opacity={0.85} />
            </mesh>
          </group>
        );
      })}
      <Pulse period={3.4} amp={0.45}>
        <GlowLine points={[v(-2.6, -1.35, 0), v(2.6, -1.35, 0)]} color={COLORS.gold} intensity={1.2} width={1.4} dashed dashSize={0.12} gapSize={0.08} />
      </Pulse>
      <Float y={0.05} tilt={0.025} period={5.5}>
        <group position={[0.85, 2.15, 0]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
          <GlassPlate width={1.4} depth={0.6} thickness={0.03} radius={0.08} edge={0.6} tint="#06110C" opacity={0.85} />
          <GlowLine points={[v(-0.5, 0.03, -0.12), v(0.4, 0.03, -0.12)]} color={COLORS.gold} intensity={1.1} width={2} />
        </group>
      </Float>
      <group ref={spark} position={[0.64, SCAN.y, 0.1]}>
        <group rotation={face(0.25, -0.4)}>
          <AiSpark size={0.065} />
        </group>
      </group>
    </group>
  );
}

/* Community: rooms on a wide plane, traders as lights, shared charts rising as cards. */
const ROOMS_POS = new THREE.Vector3(0.2, -0.6, 0);
const ROOMS_ROT = new THREE.Euler(0.45, -0.3, 0);
const PLATE = { w: 5.2, d: 3 };
const CARD = { w: 1.1, h: 0.65, y: 1.0, step: 0.25 };
const NODES = [v(-1.8, 0, 0.5), v(-0.9, 0, -0.4), v(0, 0, 0.6), v(0.9, 0, -0.3), v(1.8, 0, 0.4), v(-0.3, 0, -1.0), v(1.2, 0, 0.9)];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3], [2, 6], [6, 4], [0, 2]];
const EDGE_PATHS = EDGES.map(([a, b]) => [NODES[a].clone().setY(0.06), NODES[b].clone().setY(0.06)]);
const EDGE_COLORS = EDGES.map(() => COLORS.goldHot);
const NODE_GLOW = NODES.map((_, i) => (i === 2 || i === 4 ? 0.9 : 0.35));
/**
 * Motion (inside the framing — the rooms' and cards' placement is the fit's):
 * the traders bob and light up in turn, messages run along the links, the
 * shared charts float, and someone is typing on the first card.
 */
function CommunityRooms({ lite = false }: { lite?: boolean }) {
  const { still } = useStoryFrame();
  const nodes = useRef<(THREE.Mesh | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((s) => {
    const t = still ? 0 : s.clock.elapsedTime;
    for (let i = 0; i < NODES.length; i++) {
      // one trader "speaks" at a time (~1.1 s each), the rest breathe
      const turn = still ? 0 : Math.max(0, Math.sin(((t / 1.1 - i) / NODES.length) * Math.PI * 2)) ** 6;
      const m = nodes.current[i];
      if (m) m.position.y = 0.14 + (still ? 0 : 0.035 * wave(t, 3.6, i / NODES.length) + 0.07 * turn);
      const mat = mats.current[i];
      if (mat) mat.emissiveIntensity = NODE_GLOW[i] * (0.85 + 0.15 * wave(t, 3.6, i / NODES.length)) + 0.9 * turn;
    }
    // typing dots: a soft bounce, one after another
    dots.current.forEach((d, k) => {
      if (!d) return;
      const b = still ? 0 : Math.max(0, Math.sin(t * 5 - k * 0.9));
      d.position.y = -0.22 + 0.025 * b;
      d.scale.setScalar(0.022 * (0.8 + 0.35 * b));
    });
  });
  return (
    <group position={ROOMS_POS} rotation={ROOMS_ROT}>
      <GlassPlate width={PLATE.w} depth={PLATE.d} thickness={0.04} radius={0.12} edge={0.45} />
      <Pulse period={4} amp={0.35}>
        {EDGE_PATHS.map((p, i) => (
          <GlowLine key={i} points={p} color={COLORS.gold} intensity={1.05} width={1.1} opacity={0.7} />
        ))}
      </Pulse>
      <Tracer paths={lite ? EDGE_PATHS.slice(0, 5) : EDGE_PATHS} colors={EDGE_COLORS} size={0.035} period={2.6} stagger={0.29} intensity={1.8} />
      {NODES.map((n, i) => (
        <mesh key={i} ref={(el) => void (nodes.current[i] = el)} position={[n.x, 0.14, n.z]}>
          <sphereGeometry args={[i === 2 || i === 4 ? 0.13 : 0.1, 24, 24]} />
          <meshStandardMaterial ref={(el) => void (mats.current[i] = el)} color="#1B2023" emissive={COLORS.gold} emissiveIntensity={NODE_GLOW[i]} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      {[1, 3].map((k, i) => (
        <group key={k} position={[NODES[k].x, CARD.y + i * CARD.step, NODES[k].z]} rotation={face(0.45, -0.3)}>
          <Float y={0.04} tilt={0.02} period={4.6} phase={i * 0.45}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <GlassPlate width={SOURCE_CARD.w} depth={SOURCE_CARD.h} thickness={0.03} radius={0.08} edge={0.85} tint="#06110C" opacity={0.85} />
            </group>
            <GlowLine points={[v(-0.4, -0.15, 0.03), v(-0.2, -0.02, 0.03), v(0, -0.08, 0.03), v(0.2, 0.1, 0.03), v(0.4, 0.05, 0.03)]} color={COLORS.gold} intensity={1.2} width={1.6} />
            {i === 0
              ? [0, 1, 2].map((d) => (
                  <mesh key={d} ref={(el) => void (dots.current[d] = el)} position={[0.26 + d * 0.07, -0.22, 0.04]} scale={0.022}>
                    <sphereGeometry args={[1, 10, 10]} />
                    <meshBasicMaterial color={hdr(COLORS.ink, 1.2)} toneMapped={false} />
                  </mesh>
                ))
              : null}
          </Float>
        </group>
      ))}
      <group position={[0.45, 0.35, 0.15]} rotation={face(0.45, -0.3)}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}

/** The rooms' outline (plate corners, the two chart cards, a pad for the glow), in the fit group's space. */
const ROOMS_HULL = (() => {
  const local: THREE.Vector3[] = [];
  for (const x of [-1, 1]) for (const z of [-1, 1]) for (const y of [-0.05, 0.3]) local.push(v((x * PLATE.w) / 2, y, (z * PLATE.d) / 2));
  const card = new THREE.Matrix4();
  const [fx, fy, fz, order] = face(0.45, -0.3);
  [1, 3].forEach((k, i) => {
    card.compose(v(NODES[k].x, CARD.y + i * CARD.step, NODES[k].z), new THREE.Quaternion().setFromEuler(new THREE.Euler(fx, fy, fz, order)), v(1, 1, 1));
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) local.push(v(x * (CARD.w / 2 + 0.06), y * (CARD.h / 2 + 0.06), z * 0.05).applyMatrix4(card));
  });
  const rooms = new THREE.Matrix4().compose(ROOMS_POS, new THREE.Quaternion().setFromEuler(ROOMS_ROT), v(1, 1, 1));
  return local.map((p) => p.applyMatrix4(rooms));
})();

const NAV_H = 72;
const tmp = new THREE.Vector3();

/** The hero's free area in canvas pixels: above the copy (phones, tablets) or right of it (short landscape). */
function freeArea(canvas: HTMLCanvasElement, w: number, h: number) {
  const m = Math.max(12, Math.round(0.03 * Math.min(w, h)));
  const sec = canvas.closest("section");
  // The copy's outer box (it carries the landscape scale; the inner motion layers don't move it).
  const copy = sec && Array.from(sec.querySelectorAll<HTMLElement>("[data-afv-copy]")).find((e) => e.offsetParent !== null)?.parentElement?.parentElement;
  const top = NAV_H + m;
  if (!sec || !copy) return { l: m, t: top, r: w - m, b: h - m, max: 1 };
  const sr = sec.getBoundingClientRect();
  const c = copy.getBoundingClientRect();
  const cl = c.left - sr.left;
  const cr = c.right - sr.left;
  const ct = c.top - sr.top;
  // A left column (short landscape phones): the scene sits to its right, level with the copy and
  // a little larger (the landscape camera pulls back), clear of the corner chat dock.
  if (ct < h * 0.5 && cr < w * 0.66 && cl < w * 0.2) return { l: cr + m, t: top, r: w - m, b: Math.min(h - m, c.bottom - sr.top), max: 1.4 };
  return { l: m, t: top, r: w - m, b: Math.max(top + 40, ct - m), max: 1 };
}

/**
 * Portrait / compact framing for Community: the rooms plane is wide, so on
 * phones and tablets a fixed scale either runs off the sides or under the copy.
 * Size and centre it live in the free area (navbar → copy, or beside the copy
 * on short landscape phones), never larger than the desktop build (a little
 * larger beside the copy, where the landscape camera has pulled back).
 */
function CommunityFit({ children }: { children: React.ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const last = useRef({ key: "", at: -1, frames: 0 });
  useFrame(({ camera, size, gl, clock, invalidate }) => {
    const grp = g.current;
    if (!grp) return;
    const L = last.current;
    const key = `${size.width}x${size.height}`;
    const t = clock.elapsedTime;
    // Refit on resize, for the first frames (camera rig settles) and then once a second.
    if (key === L.key && L.frames > 8 && t - L.at < 1) return;
    L.frames = key === L.key ? L.frames + 1 : 0;
    L.key = key;
    L.at = t;
    const { width: w, height: h } = size;
    const cam = camera as THREE.PerspectiveCamera;
    cam.updateMatrixWorld();
    const f = freeArea(gl.domElement, w, h);
    let s = grp.scale.x;
    let x = grp.position.x;
    let y = grp.position.y;
    const dist = cam.position.length();
    const perPx = (2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov / 2))) / (h * cam.zoom);
    for (let i = 0; i < 6; i++) {
      let l = Infinity, r = -Infinity, tp = Infinity, b = -Infinity;
      for (const p of ROOMS_HULL) {
        tmp.copy(p).multiplyScalar(s);
        tmp.x += x;
        tmp.y += y;
        tmp.project(cam);
        const px = ((tmp.x + 1) / 2) * w;
        const py = ((1 - tmp.y) / 2) * h;
        l = Math.min(l, px); r = Math.max(r, px); tp = Math.min(tp, py); b = Math.max(b, py);
      }
      const k = Math.min((f.r - f.l) / (r - l), (f.b - f.t) / (b - tp));
      s = Math.min(f.max, s * k);
      x += ((f.l + f.r) / 2 - (l + r) / 2) * perPx;
      y -= ((f.t + f.b) / 2 - (tp + b) / 2) * perPx;
    }
    if (Math.abs(s - grp.scale.x) + Math.abs(x - grp.position.x) + Math.abs(y - grp.position.y) > 1e-4) {
      grp.scale.setScalar(s);
      grp.position.set(x, y, 0);
      invalidate();
    }
  });
  return <group ref={g}>{children}</group>;
}
