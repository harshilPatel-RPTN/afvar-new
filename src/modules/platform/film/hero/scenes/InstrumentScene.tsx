"use client";

// Instrument hero (/market/[category]/[instrument]).
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { INST, type GroupId } from "../../sections/marketMap";
import { draw, ease, face, Lean, pop, tick, v, type LineHandle, type PageSceneProps } from "../pageHeroKit";

/*
 * Instrument: the page's own analysis as one object. Hourly candles on a glass
 * base (a series seeded by the instrument, so gold, oil and EUR/USD each draw
 * their own), a faint volume layer under them, the two levels code found in
 * them — support (grey, dashed, its touches marked) and resistance (mint, the
 * one price is testing) — an event pin rising from the timeline at the candle
 * it moved, and an alert ring with a small bell where price meets the level.
 * The plinth carries the group's emblem: ingots (metals), a drop (oil), a pair
 * of coins (forex), a hex coin (crypto). No feed yet → the candles are ghosts.
 */
const N = 12;
const X0 = -1.42;
const DX = 0.28;
const BODY = 0.17;
/** Support / resistance heights (plate is y = 0). */
const S = 0.62;
const R = 1.5;
const py = (p: number) => S + p * (R - S);
const ALERT_X = 2.0;
const TEST_FROM = 3.2;
const TEST_PERIOD = 5.2;
const RING_PULSES = 2;

type Bar = { o: number; c: number; h: number; l: number; vol: number; touch: boolean };
type Series = { bars: Bar[]; event: number; kPeak: number };

/** A small seeded PRNG (mulberry32), so a slug always draws the same chart. */
function rng(seed: string) {
  let a = 2166136261;
  for (let i = 0; i < seed.length; i++) a = Math.imul(a ^ seed.charCodeAt(i), 16777619);
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VOLATILITY: Record<GroupId, number> = { commodities: 1, forex: 0.65, crypto: 1.45 };

/** Normalised (0 = support, 1 = resistance) candles: a range that tags support twice, jumps on an event, then climbs to test resistance. */
function series(slug: string, group: GroupId): Series {
  const r = rng(slug);
  const vol = VOLATILITY[group];
  const event = 4 + Math.floor(r() * 3);
  const touch2 = event + 2;
  const keys: [number, number][] = [
    [0, 0.42 + r() * 0.2],
    [2, 0.07],
    [event - 1, 0.28 + r() * 0.08],
    [event, 0.66 + r() * 0.08],
    [touch2, 0.1],
    [N - 1, 0.88],
  ];
  const at = (i: number) => {
    let k = 0;
    while (k < keys.length - 2 && i > keys[k + 1][0]) k++;
    const [i0, p0] = keys[k];
    const [i1, p1] = keys[k + 1];
    return p0 + ((p1 - p0) * (i - i0)) / (i1 - i0);
  };
  const bars: Bar[] = [];
  let prev = keys[0][1] + 0.07;
  for (let i = 0; i < N; i++) {
    const isKey = keys.some(([k]) => k === i);
    const c = Math.min(0.9, Math.max(0.06, at(i) + (isKey ? 0 : (r() - 0.5) * 0.14 * vol)));
    const o = Math.min(0.9, Math.max(0.06, prev + (r() - 0.5) * 0.03));
    const touch = i === 2 || i === touch2;
    const last = i === N - 1;
    const h = last ? 0.955 : Math.min(0.93, Math.max(o, c) + 0.02 + r() * 0.07 * vol);
    const l = touch ? 0 : Math.max(0.03, Math.min(o, c) - 0.02 - r() * 0.07 * vol);
    const vv = i === event ? 0.34 : 0.07 + 0.3 * Math.abs(c - o) + (touch ? 0.06 : 0) + r() * 0.05;
    bars.push({ o, c, h, l, vol: vv, touch });
    prev = c;
  }
  // The live candle grows just far enough for its high to tag resistance.
  return { bars, event, kPeak: (R + 0.006) / py(bars[N - 1].h) };
}

/** The idle "price tests resistance" cycle: rise 0…1 (peaks at mid-period), the touch flash, and the ring's pulse (0…1, -1 = idle). */
function testCycle(t: number) {
  if (t < TEST_FROM) return { rise: 0, flash: 0, ring: -1 };
  const ph = ((t - TEST_FROM) / TEST_PERIOD) % 1;
  const rise = (0.5 - 0.5 * Math.cos(ph * Math.PI * 2)) ** 3;
  const flash = Math.max(0, 1 - Math.abs(ph - 0.5) * 7);
  const ring = ph >= 0.5 ? Math.min(1, (ph - 0.5) / 0.32) : -1;
  return { rise, flash, ring };
}

/** A candle whose wick and body share an opacity (ghosts when the feed is pending). Bottom at the plate (scale from y = 0). */
function Candle3({ x, o, c, h, l, ghost }: { x: number; o: number; c: number; h: number; l: number; ghost: boolean }) {
  const up = c >= o;
  const body = Math.max(0.035, Math.abs(c - o));
  return (
    <group position={[x, 0, 0]}>
      <mesh position={[0, (h + l) / 2, 0]}>
        <cylinderGeometry args={[0.011, 0.011, h - l, 6]} />
        <meshBasicMaterial color={hdr(up ? COLORS.up : COLORS.down, ghost ? 0.45 : 0.9)} toneMapped={false} transparent opacity={ghost ? 0.35 : 1} />
      </mesh>
      <mesh position={[0, (o + c) / 2, 0]}>
        <boxGeometry args={[BODY, body, BODY]} />
        <meshPhysicalMaterial color={up ? "#0E2A1B" : "#2A0E0E"} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={ghost ? 0.12 : 0.35} metalness={0.3} roughness={0.35} transparent opacity={ghost ? 0.3 : 0.9} depthWrite={!ghost} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------ emblems */

const METAL = { gold: "#B49A5E", silver: "#AEB8BB" } as const;

function Ingots({ tone }: { tone: string }) {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(0.075 * Math.SQRT2, 0.105 * Math.SQRT2, 0.095, 4, 1);
    g.rotateY(Math.PI / 4);
    g.scale(1.75, 1, 1);
    return g;
  }, []);
  return (
    <group>
      {[
        [-0.0, 0.0475, -0.09],
        [0.0, 0.0475, 0.09],
        [0.0, 0.1425, 0],
      ].map((p, i) => (
        <mesh key={i} geometry={geo} position={p as [number, number, number]}>
          <meshPhysicalMaterial color={tone} metalness={0.95} roughness={0.28} clearcoat={0.6} emissive={tone} emissiveIntensity={0.08} />
        </mesh>
      ))}
    </group>
  );
}

function Drop() {
  const geo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    for (let i = 0; i <= 24; i++) {
      const a = (i / 24) * Math.PI;
      pts.push(new THREE.Vector2(0.15 * Math.sin(a) * Math.sin(a / 2) ** 1.1, 0.19 * Math.cos(a)));
    }
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return (
    <group position={[0, 0.2, 0]}>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#06120D" metalness={0.35} roughness={0.08} clearcoat={1} clearcoatRoughness={0.05} emissive={COLORS.gold} emissiveIntensity={0.06} />
      </mesh>
      <mesh position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.098, 0.004, 6, 48]} />
        <meshBasicMaterial color={hdr(COLORS.gold, 1.2)} toneMapped={false} transparent opacity={0.7} />
      </mesh>
    </group>
  );
}

function Coin({ rim, face: tone }: { rim: string; face: string }) {
  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.16, 0.16, 0.032, 40]} />
        <meshPhysicalMaterial color={tone} metalness={0.85} roughness={0.3} clearcoat={0.5} emissive={rim} emissiveIntensity={0.05} />
      </mesh>
      {[0.017, -0.017].map((y) => (
        <mesh key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.125, 0.004, 6, 48]} />
          <meshBasicMaterial color={hdr(rim, 1.15)} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function CoinPair() {
  return (
    <group position={[0, 0.17, 0]}>
      <group position={[-0.08, 0.02, -0.05]} rotation={[0, 0.35, 0.08]}>
        <Coin rim={COLORS.gold} face="#20352B" />
      </group>
      <group position={[0.08, -0.01, 0.06]} rotation={[0, -0.25, -0.06]}>
        <Coin rim="#92A399" face="#2A3236" />
      </group>
    </group>
  );
}

function HexCoin() {
  return (
    <group position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <cylinderGeometry args={[0.19, 0.19, 0.05, 6]} />
        <meshPhysicalMaterial color="#14251D" metalness={0.8} roughness={0.25} clearcoat={0.7} emissive={COLORS.gold} emissiveIntensity={0.07} flatShading />
      </mesh>
      {[0.027, -0.027].map((y) => (
        <group key={y} position={[0, y, 0]} rotation={[Math.PI / 2, 0, Math.PI / 2]}>
          <mesh>
            <torusGeometry args={[0.12, 0.005, 4, 6]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
          </mesh>
          <mesh>
            <torusGeometry args={[0.055, 0.004, 4, 6]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.1)} toneMapped={false} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Emblem({ slug, group }: { slug: string; group: GroupId }) {
  if (group === "forex") return <CoinPair />;
  if (group === "crypto") return <HexCoin />;
  if (slug === "oil") return <Drop />;
  return <Ingots tone={slug === "silver" ? METAL.silver : METAL.gold} />;
}

/** A small hanging bell (a lathe profile) for the price alert. */
function Bell() {
  const geo = useMemo(() => {
    const pts = [
      [0.001, 0.2],
      [0.03, 0.196],
      [0.052, 0.175],
      [0.06, 0.14],
      [0.064, 0.09],
      [0.076, 0.045],
      [0.1, 0.014],
      [0.108, 0],
    ].map(([x, y]) => new THREE.Vector2(x, y));
    return new THREE.LatheGeometry(pts, 32);
  }, []);
  return (
    <group>
      <mesh geometry={geo}>
        <meshPhysicalMaterial color="#10261C" metalness={0.7} roughness={0.25} clearcoat={0.8} emissive={COLORS.gold} emissiveIntensity={0.18} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.104, 0.006, 6, 40]} />
        <meshBasicMaterial color={hdr(COLORS.gold, 1.5)} toneMapped={false} />
      </mesh>
      <mesh position={[0, -0.02, 0]}>
        <sphereGeometry args={[0.022, 12, 12]} />
        <meshBasicMaterial color={hdr(COLORS.gold, 1.4)} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.215, 0]}>
        <torusGeometry args={[0.02, 0.005, 6, 20]} />
        <meshBasicMaterial color={hdr(COLORS.gold, 1.2)} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* --------------------------------------------------------------- scene */

export function InstrumentScene({ variant }: PageSceneProps) {
  const { still } = useStoryFrame();
  const info = INST[variant ?? ""] ?? INST.gold;
  const ghost = !info.key;
  const { bars, event, kPeak } = useMemo(() => series(info.slug, info.group), [info.slug, info.group]);
  const touches = useMemo(() => bars.flatMap((b, i) => (b.touch ? [i] : [])), [bars]);
  const ex = X0 + event * DX;

  const base = useRef<THREE.Group>(null);
  const emblem = useRef<THREE.Group>(null);
  const turn = useRef<THREE.Group>(null);
  const candles = useRef<(THREE.Group | null)[]>([]);
  const vols = useRef<(THREE.Group | null)[]>([]);
  const supRoll = useRef<THREE.Group>(null);
  const support = useRef<LineHandle | null>(null);
  const dots = useRef<(THREE.Group | null)[]>([]);
  const resRoll = useRef<THREE.Group>(null);
  const resist = useRef<LineHandle | null>(null);
  const halo = useRef<LineHandle | null>(null);
  const time = useRef<LineHandle | null>(null);
  const stem = useRef<LineHandle | null>(null);
  const gem = useRef<THREE.Group>(null);
  const pinBase = useRef<THREE.Group>(null);
  const alert = useRef<THREE.Group>(null);
  const bell = useRef<THREE.Group>(null);
  const rings = useRef<(THREE.Mesh | null)[]>([]);

  // Enter: the glass base slides open and the emblem springs up on it; the candles rise left to right with their volume;
  // support unrolls and its two touches light, resistance unrolls out of the spark; the event pin climbs out of the
  // timeline, then the alert ring and bell pop onto the level.
  // Live: the candles tick; every TEST_PERIOD s the last candle pushes up into resistance — the level flares, the ring
  // pulses outward and the bell rings; the emblem turns slowly, the event gem bobs, support's dashes march.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const cyc = still || ghost ? { rise: 0, flash: 0, ring: -1 } : testCycle(t);
    if (base.current) base.current.scale.x = still ? 1 : Math.max(0.001, ease(t, 0.1, 0.8));
    if (emblem.current) {
      emblem.current.scale.setScalar(still ? 1 : pop(t, 0.4, 0.8));
      emblem.current.position.y = still ? 0 : 0.03 * Math.sin(t * 0.8);
    }
    if (turn.current) turn.current.rotation.y = still ? 0.5 : 0.5 + t * 0.35;
    for (let i = 0; i < N; i++) {
      const d = 0.55 + i * 0.075;
      const g = candles.current[i];
      if (g) {
        g.visible = still || t > d; // not a flat sliver before its turn
        const live = i === N - 1 ? 1 + (kPeak - 1) * cyc.rise : 1 + (ghost ? 0 : 0.012 * tick(t, i));
        g.scale.y = still ? 1 : pop(t, d, 0.7) * live;
      }
      const vg = vols.current[i];
      if (vg) {
        vg.visible = still || t > d;
        vg.scale.y = still ? 1 : Math.max(0.001, ease(t, d + 0.1, 0.6) * (1 + 0.12 * tick(t * 0.7, i + 3)));
      }
    }
    if (supRoll.current) supRoll.current.scale.x = still ? 1 : Math.max(0.001, ease(t, 1.45, 0.9));
    if (support.current) support.current.material.dashOffset = still ? 0 : -t * 0.18;
    dots.current.forEach((g, j) => {
      if (!g) return;
      const k = still ? 1 : pop(t, 1.9 + j * 0.2, 0.6);
      const beat = still ? 0 : Math.max(0, Math.sin(t * 0.9 - j * 1.6)) ** 8;
      g.scale.setScalar(k * (1 + 0.5 * beat));
    });
    if (resRoll.current) resRoll.current.scale.x = still ? 1 : Math.max(0.001, ease(t, 1.75, 1));
    if (resist.current) resist.current.material.opacity = (ghost ? 0.5 : 0.8) + 0.2 * cyc.flash;
    if (halo.current) halo.current.material.opacity = (ghost ? 0.04 : 0.1) + 0.32 * cyc.flash;
    draw(time.current, still ? 1 : ease(t, 0.6, 1.2), N);
    draw(stem.current, still ? 1 : ease(t, 2.15, 0.7), 1);
    if (stem.current) stem.current.material.opacity = still ? 0.8 : 0.55 + 0.25 * (0.5 + 0.5 * Math.sin(t * 1.3));
    if (pinBase.current) pinBase.current.scale.setScalar(still ? 1 : pop(t, 2.05, 0.6) * (1 + 0.15 * Math.sin(t * 1.3)));
    if (gem.current) {
      const k = still ? 1 : ease(t, 2.3, 0.8);
      gem.current.scale.setScalar(still ? 1 : pop(t, 2.45, 0.7));
      gem.current.position.y = R + 0.4 - 0.9 * (1 - k) + (still ? 0 : 0.04 * Math.sin(t * 1.1));
      gem.current.rotation.y = still ? 0.6 : t * 0.6;
    }
    if (alert.current) alert.current.scale.setScalar(still ? 1 : pop(t, 2.6, 0.7));
    if (bell.current) bell.current.rotation.z = still ? 0 : 0.32 * cyc.flash * Math.sin(t * 22) + 0.03 * Math.sin(t * 1.2);
    rings.current.forEach((m, j) => {
      if (!m) return;
      // two rings, one period apart in the wake of the touch
      const q = cyc.ring < 0 ? -1 : Math.min(1, cyc.ring * (1 + j * 0.35) - j * 0.18);
      m.visible = q > 0;
      if (q > 0) {
        m.scale.setScalar(1 + 1.8 * q);
        (m.material as THREE.MeshBasicMaterial).opacity = 0.85 * (1 - q) ** 1.5;
      }
    });
  });

  return (
    <group position={[0.1, -0.95, 0]} rotation={[0.25, -0.38, 0]} scale={0.78}>
      <Lean>
        <group ref={base}>
          <GlassPlate width={4.4} depth={1.6} thickness={0.03} radius={0.1} edge={0.35} />
        </group>

        {/* the timeline along the back of the plate */}
        <GlowLine ref={(l: LineHandle | null) => { time.current = l; }} points={Array.from({ length: N + 1 }, (_, i) => v(X0 - DX / 2 + i * DX, 0.03, -0.52))} color="#2F4A3D" intensity={1.2} width={1.2} />

        {/* group emblem on its own small glass coaster */}
        <group position={[-1.84, 0.02, 0.2]} scale={1.45}>
          <group ref={emblem}>
            <GlassPlate width={0.56} depth={0.56} thickness={0.03} radius={0.27} edge={0.55} opacity={0.5} />
            <group ref={turn} position={[0, 0.02, 0]}>
              <Emblem slug={info.slug} group={info.group} />
            </group>
          </group>
        </group>

        {/* volume: a faint layer of bars on the glass under each candle */}
        {bars.map((b, i) => (
          <group key={`v${i}`} position={[X0 + i * DX, 0.015, 0]} ref={(g) => { vols.current[i] = g; }}>
            <mesh position={[0, b.vol / 2, 0]}>
              <boxGeometry args={[BODY * 0.8, b.vol, BODY * 0.8]} />
              <meshBasicMaterial color={i === event ? hdr(COLORS.gold, 0.7) : "#2F5A47"} toneMapped={false} transparent opacity={ghost ? 0.12 : i === event ? 0.55 : 0.35} depthWrite={false} />
            </mesh>
          </group>
        ))}

        {bars.map((b, i) => (
          <group key={i} ref={(g) => { candles.current[i] = g; }}>
            <Candle3 x={X0 + i * DX} o={py(b.o)} c={py(b.c)} h={py(b.h)} l={py(b.l)} ghost={ghost} />
          </group>
        ))}

        {/* support: found by code, dashed grey, its touches marked */}
        <group position={[-2.12, 0, 0]}>
          <group ref={supRoll}>
            <GlowLine ref={(l: LineHandle | null) => { support.current = l; }} points={[v(0, S, 0), v(4.24, S, 0)]} color="#92A399" intensity={1.1} width={1.2} dashed dashSize={0.1} gapSize={0.07} opacity={ghost ? 0.45 : 0.75} />
          </group>
        </group>
        {touches.map((i, j) => (
          <group key={`t${i}`} position={[X0 + i * DX, S, 0]} ref={(g) => { dots.current[j] = g; }}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.055, 0.006, 6, 28]} />
              <meshBasicMaterial color={hdr(COLORS.ink, 1.1)} toneMapped={false} transparent opacity={ghost ? 0.4 : 0.85} />
            </mesh>
            <mesh>
              <sphereGeometry args={[0.02, 10, 10]} />
              <meshBasicMaterial color={hdr(COLORS.ink, 1.4)} toneMapped={false} transparent opacity={ghost ? 0.4 : 1} />
            </mesh>
          </group>
        ))}

        {/* resistance: the level price is testing, mint, unrolling out of the spark */}
        <group position={[-2.05, 0, 0]}>
          <group ref={resRoll}>
            <GlowLine ref={(l: LineHandle | null) => { halo.current = l; }} points={[v(0, R, 0), v(ALERT_X + 2.05, R, 0)]} color={COLORS.gold} intensity={1} width={7} opacity={0.1} depthWrite={false} />
            <GlowLine ref={(l: LineHandle | null) => { resist.current = l; }} points={[v(0, R, 0), v(ALERT_X + 2.05, R, 0)]} color={COLORS.gold} intensity={1.3} width={1.6} opacity={0.8} />
          </group>
          <group position={[0, R, 0]} rotation={face(0.25, -0.38)}>
            <AiSpark size={0.06} />
          </group>
        </group>

        {/* the event pin rising from the timeline at the candle it moved */}
        <group position={[ex, 0, -0.52]}>
          <group ref={pinBase} position={[0, 0.035, 0]}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.07, 0.006, 6, 28]} />
              <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
            </mesh>
          </group>
          <GlowLine ref={(l: LineHandle | null) => { stem.current = l; }} points={[v(0, 0.04, 0), v(0, R + 0.34, 0)]} color={COLORS.gold} intensity={1.1} width={1.1} opacity={0.8} />
          <group ref={gem} position={[0, R + 0.4, 0]}>
            <mesh>
              <octahedronGeometry args={[0.085, 0]} />
              <meshPhysicalMaterial color="#123826" emissive={COLORS.gold} emissiveIntensity={0.55} metalness={0.4} roughness={0.15} clearcoat={1} flatShading />
            </mesh>
          </group>
        </group>

        {/* the alert: a ring on the level and a bell above it, pulsing when price touches */}
        <group position={[ALERT_X, R, 0]}>
          <group ref={alert}>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <torusGeometry args={[0.1, 0.008, 8, 40]} />
              <meshBasicMaterial color={hdr(COLORS.gold, 1.5)} toneMapped={false} transparent opacity={ghost ? 0.5 : 1} />
            </mesh>
            {Array.from({ length: RING_PULSES }, (_, j) => (
              <mesh key={j} ref={(m) => { rings.current[j] = m; }} rotation={[0, Math.PI / 2, 0]} visible={false}>
                <torusGeometry args={[0.1, 0.005, 6, 40]} />
                <meshBasicMaterial color={hdr(COLORS.gold, 1.4)} toneMapped={false} transparent opacity={0} depthWrite={false} />
              </mesh>
            ))}
            <group position={[0, 0.38, 0]}>
              <group ref={bell}>
                <group position={[0, -0.21, 0]}>
                  <Bell />
                </group>
              </group>
            </group>
          </group>
        </group>
      </Lean>
    </group>
  );
}
