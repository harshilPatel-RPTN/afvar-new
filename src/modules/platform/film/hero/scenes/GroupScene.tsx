"use client";

// Market group hero (/market/[category]): one model per category, each showing what the page covers.
//   commodities — a vault floor with a stacked gold/silver ingot pyramid, a glass oil barrel whose fill is the price,
//                 and a candle card behind with its price level.
//   forex       — two interlinked rings (a currency pair) floating over a 24h session dial; a hand sweeps the day
//                 and lights the sessions (Sydney, Tokyo, London, New York) it passes through.
//   crypto      — a chain of glass blocks joined by hash links, a coin turning above it inside a 24h ring;
//                 a pulse runs the chain and confirms each new head block, around the clock.
import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { Candle, Card, clamp01, draw, ease, face, Lean, pop, tick, v, type LineHandle, type PageSceneProps } from "../pageHeroKit";

export function GroupScene({ variant }: PageSceneProps) {
  if (variant === "forex") return <ForexPair />;
  if (variant === "crypto") return <CryptoChain />;
  return <CommodityVault />;
}

/* ------------------------------------------------------------------ helpers */

/** A circle of radius r, flat (XZ plane) at height y. */
const ringXZ = (r: number, segs: number, y = 0, a0 = 0, a1 = Math.PI * 2) =>
  Array.from({ length: segs + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / segs;
    return v(Math.cos(a) * r, y, Math.sin(a) * r);
  });
/** A circle of radius r, upright (XY plane) at depth z. */
const ringXY = (r: number, segs: number, z = 0, a0 = 0, a1 = Math.PI * 2) =>
  Array.from({ length: segs + 1 }, (_, k) => {
    const a = a0 + ((a1 - a0) * k) / segs;
    return v(Math.cos(a) * r, Math.sin(a) * r, z);
  });
/** The 12 edges (as point pairs, for a segmented GlowLine) of a box / frustum standing on y = 0. */
function frustumEdges(bw: number, bd: number, tw: number, td: number, h: number) {
  const b = [v(-bw / 2, 0, -bd / 2), v(bw / 2, 0, -bd / 2), v(bw / 2, 0, bd / 2), v(-bw / 2, 0, bd / 2)];
  const t = [v(-tw / 2, h, -td / 2), v(tw / 2, h, -td / 2), v(tw / 2, h, td / 2), v(-tw / 2, h, td / 2)];
  const out: THREE.Vector3[] = [];
  for (let k = 0; k < 4; k++) out.push(b[k], b[(k + 1) % 4], t[k], t[(k + 1) % 4], b[k], t[k]);
  return out;
}
/** A straight line from a to b in `segs` pieces, so it can draw itself on. */
const span = (a: THREE.Vector3, b: THREE.Vector3, segs: number) => Array.from({ length: segs + 1 }, (_, k) => a.clone().lerp(b, k / segs));

/* ------------------------------------------------------------- commodities */

const GOLD_TINT = "#E2C886";
const SILVER_TINT = "#D3DADB";
const ING = { bw: 0.8, bd: 0.34, k: 0.78, h: 0.2 };
/** Bottom row of three, two on top, one crowning — gold and silver mixed. */
const INGOTS = [
  { y: 0, z: -0.38, gold: true },
  { y: 0, z: 0, gold: false },
  { y: 0, z: 0.38, gold: true },
  { y: ING.h, z: -0.19, gold: false },
  { y: ING.h, z: 0.19, gold: true },
  { y: ING.h * 2, z: 0, gold: true },
];
const BARREL = { r: 0.36, h: 0.95 };
const FILL = 0.62;
const C_CANDLES = [0.22, 0.3, 0.26, 0.4, 0.36, 0.5, 0.58];
const PRICE_Y = 0.42;

function CommodityVault() {
  const { still } = useStoryFrame();
  const floor = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Group | null)[]>([]);
  const barMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const barEdges = useRef<(LineHandle | null)[]>([]);
  const barrel = useRef<THREE.Group>(null);
  const fill = useRef<THREE.Mesh>(null);
  const level = useRef<THREE.Group>(null);
  const card = useRef<THREE.Group>(null);
  const candles = useRef<(THREE.Group | null)[]>([]);
  const priceLine = useRef<LineHandle | null>(null);
  const spark = useRef<THREE.Group>(null);
  const ingot = useMemo(() => {
    const g = new THREE.CylinderGeometry(Math.SQRT1_2 * ING.k, Math.SQRT1_2, ING.h, 4, 1);
    g.rotateY(Math.PI / 4);
    g.scale(ING.bw, 1, ING.bd);
    g.translate(0, ING.h / 2, 0);
    return g;
  }, []);
  const edges = useMemo(() => frustumEdges(ING.bw, ING.bd, ING.bw * ING.k, ING.bd * ING.k, ING.h), []);
  const fillGeo = useMemo(() => new THREE.CylinderGeometry(BARREL.r - 0.025, BARREL.r - 0.025, 1, 24, 1).translate(0, 0.5, 0), []);
  // Built outside JSX, so R3F won't free them: release the GPU buffers on unmount.
  useEffect(
    () => () => {
      ingot.dispose();
      fillGeo.dispose();
    },
    [ingot, fillGeo],
  );
  const rims = useMemo(() => [0, 0.3, 0.65, BARREL.h].map((y) => ringXZ(BARREL.r + 0.006, 28, y)), []);
  const levelRing = useMemo(() => ringXZ(BARREL.r - 0.02, 28), []);
  const pricePts = useMemo(() => span(v(-0.92, PRICE_Y - 0.48, 0.05), v(0.92, PRICE_Y - 0.48, 0.05), 12), []);
  // The vault floor slides open; the ingots drop onto it bottom row first, the barrel springs up and fills,
  // then the card flips up behind, its candles rise and the price level draws across.
  // Live: a glint runs over the bars every few seconds, the oil level rides the price, candles tick.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (floor.current) floor.current.scale.x = still ? 1 : Math.max(0.001, ease(t, 0.1, 0.8));
    const glintPh = (t - 2.6) % 5.5;
    bars.current.forEach((g, i) => {
      if (!g) return;
      const d = 0.35 + i * 0.13;
      g.visible = still || t > d;
      g.position.y = INGOTS[i].y + (still ? 0 : 0.7 * (1 - ease(t, d, 0.55)));
      const local = glintPh - i * 0.14;
      const glint = still || t < 2.6 || local < 0 || local > 0.7 ? 0 : Math.sin((Math.PI * local) / 0.7);
      const m = barMats.current[i];
      if (m) m.emissiveIntensity = (INGOTS[i].gold ? 0.16 : 0.1) + 0.22 * glint;
      const e = barEdges.current[i];
      if (e) e.material.opacity = 0.55 + 0.45 * glint;
    });
    if (barrel.current) barrel.current.scale.setScalar(still ? 1 : pop(t, 0.7, 0.8));
    const k = still ? FILL : FILL * ease(t, 1.1, 1.3) + (t > 2.4 ? 0.035 * tick(t * 0.5, 3) : 0);
    if (fill.current) fill.current.scale.y = Math.max(0.001, k);
    if (level.current) level.current.position.y = k;
    if (card.current) {
      const f = still ? 1 : pop(t, 1.15, 0.9);
      card.current.rotation.x = (Math.PI / 2) * (1 - f);
      card.current.position.y = 1.02 + (still ? 0 : 0.04 * Math.sin(t * 0.8));
    }
    candles.current.forEach((g, j) => {
      if (!g) return;
      const d = 1.55 + j * 0.08;
      g.visible = still || t > d;
      g.scale.y = still ? 1 : pop(t, d, 0.6) * (1 + (j === C_CANDLES.length - 1 ? 0.14 : 0.05) * tick(t, j));
    });
    draw(priceLine.current, still ? 1 : ease(t, 2.1, 0.8), 12);
    if (spark.current) spark.current.scale.setScalar(still ? 1 : pop(t, 2.0, 0.7));
  });
  return (
    <group position={[0.55, -0.55, 0]} rotation={[0.26, -0.32, 0]}>
      <Lean>
        <group ref={floor}>
          <GlassPlate width={3.5} depth={1.7} thickness={0.03} radius={0.12} edge={0.3} />
        </group>
        {/* the ingot pyramid */}
        <group position={[-0.8, 0.02, 0.15]} rotation={[0, 1.05, 0]}>
          {INGOTS.map((b, i) => (
            <group key={i} position={[0, b.y, b.z]} ref={(g) => { bars.current[i] = g; }}>
              <mesh geometry={ingot}>
                <meshPhysicalMaterial ref={(m) => { barMats.current[i] = m; }} color={b.gold ? "#3B2F15" : "#262C30"} emissive={b.gold ? GOLD_TINT : SILVER_TINT} emissiveIntensity={b.gold ? 0.16 : 0.1} metalness={0.75} roughness={0.28} flatShading transparent opacity={0.92} />
              </mesh>
              <GlowLine ref={(l: LineHandle | null) => { barEdges.current[i] = l; }} points={edges} segments color={b.gold ? GOLD_TINT : SILVER_TINT} intensity={1.05} width={1.1} opacity={0.55} />
            </group>
          ))}
        </group>
        {/* the oil barrel, its fill the price */}
        <group position={[1.0, 0.02, 0.15]}>
          <group ref={barrel}>
            <mesh position={[0, BARREL.h / 2, 0]} renderOrder={-1}>
              <cylinderGeometry args={[BARREL.r, BARREL.r, BARREL.h, 24, 1]} />
              <meshPhysicalMaterial color="#06110C" metalness={0.4} roughness={0.5} transparent opacity={0.4} depthWrite={false} envMapIntensity={0.4} />
            </mesh>
            <mesh ref={fill} geometry={fillGeo} scale={[1, FILL, 1]}>
              <meshPhysicalMaterial color="#08130E" emissive={COLORS.gold} emissiveIntensity={0.14} metalness={0.2} roughness={0.15} transparent opacity={0.8} />
            </mesh>
            {rims.map((pts, i) => (
              <GlowLine key={i} points={pts} color={i === 0 || i === 3 ? COLORS.mute : "#5E7268"} intensity={1} width={i === 0 || i === 3 ? 1.3 : 1} opacity={0.8} />
            ))}
            <group ref={level} position={[0, FILL, 0]}>
              <GlowLine points={levelRing} color={COLORS.gold} intensity={1.4} width={1.8} />
            </group>
          </group>
        </group>
        {/* the price card behind */}
        <group position={[0.1, 1.02, -0.72]}>
          <group ref={card}>
            <Card w={2.1} h={1.1}>
              <group position={[0, -0.48, 0.04]}>
                {C_CANDLES.map((c, j) => (
                  <group key={j} ref={(g) => { candles.current[j] = g; }}>
                    <Candle x={-0.78 + j * 0.26} o={j ? C_CANDLES[j - 1] : 0.14} c={c} h={c + 0.07} l={Math.min(c, j ? C_CANDLES[j - 1] : 0.14) - 0.06} s={0.08} />
                  </group>
                ))}
              </group>
              <GlowLine ref={(l: LineHandle | null) => { priceLine.current = l; }} points={pricePts} color={COLORS.gold} intensity={1.25} width={1.3} dashed dashSize={0.06} gapSize={0.05} />
            </Card>
          </group>
        </group>
        <group position={[1.35, 1.95, -0.72]} rotation={face(0.26, -0.32)}>
          <group ref={spark}>
            <AiSpark size={0.065} />
          </group>
        </group>
      </Lean>
    </group>
  );
}

/* ------------------------------------------------------------------- forex */

const PAIR_R = 0.52;
const DIAL_R = 1.4;
/** The four trading sessions in UTC hours [open, close], each on its own track of the dial. */
const SESSIONS: [number, number][] = [
  [21, 30], // Sydney (to 06:00 next day)
  [0, 9], // Tokyo
  [7, 16], // London
  [12, 21], // New York
];
const hourAngle = (h: number) => (h / 24) * Math.PI * 2 - Math.PI / 2;
/** One simulated day per DAY seconds; still frames sit in the London / New York overlap. */
const DAY = 18;
const STILL_HOUR = 14;
const inSession = (h: number, [a, b]: [number, number]) => (h >= a && h <= b) || (h + 24 >= a && h + 24 <= b);

function ForexPair() {
  const { still } = useStoryFrame();
  const dial = useRef<THREE.Group>(null);
  const tracks = useRef<(LineHandle | null)[]>([]);
  const lit = useRef<number[]>(SESSIONS.map(() => 0));
  const hand = useRef<THREE.Group>(null);
  const handLine = useRef<LineHandle | null>(null);
  const pair = useRef<THREE.Group>(null);
  const ringA = useRef<THREE.Group>(null);
  const ringB = useRef<THREE.Group>(null);
  const beadA = useRef<THREE.Mesh>(null);
  const beadB = useRef<THREE.Mesh>(null);
  const tether = useRef<LineHandle | null>(null);
  const spark = useRef<THREE.Group>(null);
  const dialEdge = useMemo(() => ringXZ(DIAL_R, 64, 0.035), []);
  const trackPts = useMemo(() => SESSIONS.map(([a, b], i) => ringXZ(0.72 + i * 0.15, 18, 0.035, hourAngle(a), hourAngle(b))), []);
  const ticks = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let h = 0; h < 24; h++) {
      const a = hourAngle(h);
      const r0 = h % 6 ? DIAL_R - 0.07 : DIAL_R - 0.15;
      out.push(v(Math.cos(a) * r0, 0.035, Math.sin(a) * r0), v(Math.cos(a) * (DIAL_R - 0.02), 0.035, Math.sin(a) * (DIAL_R - 0.02)));
    }
    return out;
  }, []);
  const handPts = useMemo(() => span(v(0.12, 0.04, 0), v(DIAL_R - 0.04, 0.04, 0), 8), []);
  const tetherPts = useMemo(() => span(v(0, 0.04, 0), v(0, 1.1 - PAIR_R - 0.08, 0), 6), []);
  // The dial slides open and its session tracks draw on; the hand sweeps in; the first ring springs up,
  // the second swings in from the side and locks through it. Live: the pair turns slowly about its link,
  // a bead runs each ring the opposite way (the cross rate), and the hand keeps time — each session's
  // track lights while it's open, two at once in the overlaps.
  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    if (dial.current) dial.current.scale.setScalar(still ? 1 : Math.max(0.001, ease(t, 0.1, 0.9)));
    const h = still ? STILL_HOUR : (STILL_HOUR - 4 + (t * 24) / DAY) % 24;
    tracks.current.forEach((l, i) => {
      if (!l) return;
      const on = inSession(h, SESSIONS[i]) ? 1 : 0;
      lit.current[i] = still ? on : THREE.MathUtils.damp(lit.current[i], on, 4, dt);
      draw(l, still ? 1 : ease(t, 0.45 + i * 0.15, 0.8), 18);
      l.material.opacity = 0.22 + 0.78 * lit.current[i];
    });
    if (hand.current) hand.current.rotation.y = -hourAngle(h);
    draw(handLine.current, still ? 1 : ease(t, 0.9, 0.6), 8);
    if (pair.current) {
      pair.current.position.y = 1.1 + (still ? 0 : 0.05 * Math.sin(t * 0.7));
      pair.current.rotation.x = still ? 0.5 : 0.5 + t * 0.22;
    }
    if (ringA.current) ringA.current.scale.setScalar(still ? 1 : pop(t, 0.9, 0.9));
    if (ringB.current) {
      const k = still ? 1 : ease(t, 1.25, 0.9);
      ringB.current.position.x = PAIR_R / 2 + 0.9 * (1 - k);
      ringB.current.scale.setScalar(still ? 1 : pop(t, 1.25, 0.9));
    }
    const a = still ? 0.6 : t * 1.1;
    const showBeads = still || t > 2.1;
    if (beadA.current) {
      beadA.current.visible = showBeads;
      beadA.current.position.set(Math.cos(a) * PAIR_R, Math.sin(a) * PAIR_R, 0);
    }
    if (beadB.current) {
      beadB.current.visible = showBeads;
      beadB.current.position.set(Math.cos(Math.PI - a) * PAIR_R, Math.sin(Math.PI - a) * PAIR_R, 0);
    }
    draw(tether.current, still ? 1 : ease(t, 1.9, 0.6), 6);
    if (spark.current) spark.current.scale.setScalar(still ? 1 : pop(t, 2.0, 0.7));
  });
  return (
    <group position={[0.55, -0.75, 0]} rotation={[0.3, -0.3, 0]}>
      <Lean>
        <group ref={dial}>
          <mesh>
            <cylinderGeometry args={[DIAL_R, DIAL_R, 0.05, 48]} />
            <meshPhysicalMaterial color="#040B08" metalness={0.2} roughness={0.7} transparent opacity={0.5} depthWrite={false} envMapIntensity={0.12} />
          </mesh>
          <GlowLine points={dialEdge} color={COLORS.mute} intensity={1} width={1.2} opacity={0.6} />
          <GlowLine points={ticks} segments color={COLORS.mute} intensity={1} width={1} opacity={0.55} />
          {trackPts.map((pts, i) => (
            <GlowLine key={i} ref={(l: LineHandle | null) => { tracks.current[i] = l; }} points={pts} color={COLORS.gold} intensity={1.3} width={2} opacity={0.22} />
          ))}
          <group ref={hand}>
            <GlowLine ref={(l: LineHandle | null) => { handLine.current = l; }} points={handPts} color={COLORS.ink} intensity={1.15} width={1.4} />
          </group>
          <GlowLine ref={(l: LineHandle | null) => { tether.current = l; }} points={tetherPts} color={COLORS.gold} intensity={1} width={1} opacity={0.45} dashed dashSize={0.05} gapSize={0.05} />
        </group>
        {/* the pair: two rings locked through each other */}
        <group ref={pair} position={[0, 1.1, 0]}>
          <group ref={ringA} position={[-PAIR_R / 2, 0, 0]}>
            <mesh>
              <torusGeometry args={[PAIR_R, 0.055, 10, 48]} />
              <meshPhysicalMaterial color="#0E1F17" emissive={COLORS.gold} emissiveIntensity={0.32} metalness={0.6} roughness={0.22} />
            </mesh>
            <mesh ref={beadA}>
              <sphereGeometry args={[0.05, 10, 10]} />
              <meshBasicMaterial color={hdr(COLORS.goldHot, 2.2)} toneMapped={false} />
            </mesh>
          </group>
          <group ref={ringB} position={[PAIR_R / 2, 0, 0]}>
            <group rotation={[Math.PI / 2, 0, 0]}>
              <mesh>
                <torusGeometry args={[PAIR_R, 0.055, 10, 48]} />
                <meshPhysicalMaterial color="#1A2024" emissive={COLORS.ink2} emissiveIntensity={0.14} metalness={0.75} roughness={0.2} />
              </mesh>
              <mesh ref={beadB}>
                <sphereGeometry args={[0.05, 10, 10]} />
                <meshBasicMaterial color={hdr(COLORS.ink, 2)} toneMapped={false} />
              </mesh>
            </group>
          </group>
        </group>
        <group position={[0.15, 2.05, 0]} rotation={face(0.3, -0.3)}>
          <group ref={spark}>
            <AiSpark size={0.065} />
          </group>
        </group>
      </Lean>
    </group>
  );
}

/* ------------------------------------------------------------------ crypto */

const BLOCK_N = 5;
const blockSize = (i: number) => (i === BLOCK_N - 1 ? 0.56 : 0.46);
const BLOCKS = Array.from({ length: BLOCK_N }, (_, i) => v(-1.65 + i * 0.78, i * 0.1, 0.18 * Math.sin(i * 1.3)));
const LINK_SEGS = 6;
/** A pulse runs the chain every RUN seconds (the first RUN_TRAVEL of it travelling), then the head confirms. */
const RUN = 4.2;
const RUN_TRAVEL = 2.2;
const COIN = { p: v(0.75, 1.42, -0.1), r: 0.4 };
/** The coin's face mark: a hexagon with the three inner edges of a cube — a block, seen corner-on. */
function cubeMark(r: number, z: number) {
  const hex = Array.from({ length: 7 }, (_, k) => {
    const a = Math.PI / 2 + (k * Math.PI) / 3;
    return v(Math.cos(a) * r, Math.sin(a) * r, z);
  });
  const c = v(0, 0, z);
  return { hex, inner: [c, hex[2], c, hex[4], c, hex[0]] };
}

function CryptoChain() {
  const { still } = useStoryFrame();
  const blocks = useRef<(THREE.Group | null)[]>([]);
  const cores = useRef<(THREE.Mesh | null)[]>([]);
  const coreMats = useRef<(THREE.MeshPhysicalMaterial | null)[]>([]);
  const blockEdges = useRef<(LineHandle | null)[]>([]);
  const links = useRef<(LineHandle | null)[]>([]);
  const bead = useRef<THREE.Mesh>(null);
  const coin = useRef<THREE.Group>(null);
  const clock = useRef<THREE.Group>(null);
  const sweep = useRef<THREE.Group>(null);
  const sweepLine = useRef<LineHandle | null>(null);
  const spark = useRef<THREE.Group>(null);
  const edges = useMemo(() => Array.from({ length: BLOCK_N }, (_, i) => {
    const s = blockSize(i);
    return frustumEdges(s, s, s, s, s).map((p) => p.clone().setY(p.y - s / 2));
  }), []);
  const linkPts = useMemo(() => BLOCKS.slice(0, -1).flatMap((a, i) => {
    const b = BLOCKS[i + 1];
    const from = a.clone().setX(a.x + blockSize(i) / 2);
    const to = b.clone().setX(b.x - blockSize(i + 1) / 2);
    return [-0.07, 0.07].map((dy) => span(from.clone().setY(from.y + dy), to.clone().setY(to.y + dy), LINK_SEGS));
  }), []);
  const mark = useMemo(() => [cubeMark(0.2, 0.04), cubeMark(0.2, -0.04)], []);
  const rim = useMemo(() => ringXY(COIN.r + 0.004, 40, 0), []);
  const dayRing = useMemo(() => ringXY(0.62, 64), []);
  const dayTicks = useMemo(() => {
    const out: THREE.Vector3[] = [];
    for (let h = 0; h < 24; h++) {
      const a = (h / 24) * Math.PI * 2;
      const r0 = h % 6 ? 0.66 : 0.69;
      out.push(v(Math.cos(a) * 0.63, Math.sin(a) * 0.63, 0), v(Math.cos(a) * r0, Math.sin(a) * r0, 0));
    }
    return out;
  }, []);
  const sweepPts = useMemo(() => ringXY(0.62, 12, 0, 0, Math.PI / 3), []);
  // Blocks drop into line one after another and their hash links draw across; then the coin springs up
  // turning and its 24h ring draws round it. Live: a pulse runs the chain end to end, the head block
  // lights as it lands (confirmed), the cores turn, the coin keeps spinning and a bright arc sweeps the
  // ring — the market that never closes.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const run = t - 2.4;
    const ph = run < 0 ? -1 : run % RUN;
    const confirm = still ? 0.5 : run < RUN_TRAVEL ? 0 : Math.exp(-((run - RUN_TRAVEL) % RUN) / 0.5);
    blocks.current.forEach((g, i) => {
      if (!g) return;
      const d = 0.2 + i * 0.17;
      g.visible = still || t > d;
      g.scale.setScalar(still ? 1 : pop(t, d, 0.7));
      g.position.y = BLOCKS[i].y + (still ? 0 : 0.5 * (1 - ease(t, d, 0.6)) + 0.03 * Math.sin(t * 0.9 + i * 1.1));
      const c = cores.current[i];
      if (c) c.rotation.set(still ? 0.6 : t * 0.5 + i, still ? 0.8 : t * 0.7 + i * 0.6, 0);
      const head = i === BLOCK_N - 1;
      const m = coreMats.current[i];
      if (m) m.emissiveIntensity = head ? 0.5 + 1.2 * confirm : 0.35;
      const e = blockEdges.current[i];
      if (e) e.material.opacity = head ? 0.75 + 0.25 * confirm : 0.5;
    });
    links.current.forEach((l, n) => {
      const i = Math.floor(n / 2);
      draw(l, still ? 1 : ease(t, 0.45 + i * 0.17, 0.5), LINK_SEGS);
    });
    if (bead.current) {
      const on = !still && ph >= 0 && ph < RUN_TRAVEL;
      bead.current.visible = on;
      if (on) {
        const u = (ph / RUN_TRAVEL) * (BLOCK_N - 1);
        const i = Math.min(BLOCK_N - 2, Math.floor(u));
        bead.current.position.lerpVectors(BLOCKS[i], BLOCKS[i + 1], u - i);
        bead.current.position.y = BLOCKS[i].y + (BLOCKS[i + 1].y - BLOCKS[i].y) * (u - i) + 0.03 * Math.sin(t * 0.9);
      }
    }
    if (coin.current) {
      coin.current.scale.setScalar(still ? 1 : pop(t, 1.3, 0.9));
      coin.current.rotation.y = still ? -0.35 : -0.35 + Math.max(0, t - 1.3) * 0.7;
      coin.current.position.y = still ? 0 : 0.05 * Math.sin(t * 0.8);
    }
    if (clock.current) clock.current.scale.setScalar(still ? 1 : Math.max(0.001, ease(t, 1.6, 0.8)) * (1 + 0.04 * confirm));
    if (sweep.current) sweep.current.rotation.z = still ? 0.9 : -t * 0.9;
    if (sweepLine.current) sweepLine.current.material.opacity = still ? 0.9 : clamp01(t - 1.9);
    if (spark.current) spark.current.scale.setScalar(still ? 1 : pop(t, 2.0, 0.7) * (1 + 0.3 * confirm));
  });
  return (
    <group position={[0.25, -0.35, 0]} rotation={[0.2, -0.38, 0]}>
      <Lean>
        {BLOCKS.map((p, i) => {
          const s = blockSize(i);
          const head = i === BLOCK_N - 1;
          return (
            <group key={i} position={p} ref={(g) => { blocks.current[i] = g; }}>
              <mesh renderOrder={-1}>
                <boxGeometry args={[s, s, s]} />
                <meshPhysicalMaterial color={head ? "#0E1F17" : "#06110C"} metalness={0.4} roughness={0.45} transparent opacity={0.55} depthWrite={false} envMapIntensity={0.4} />
              </mesh>
              <mesh ref={(m) => { cores.current[i] = m; }}>
                <boxGeometry args={[s * 0.32, s * 0.32, s * 0.32]} />
                <meshPhysicalMaterial ref={(m) => { coreMats.current[i] = m; }} color="#0E2A1B" emissive={COLORS.gold} emissiveIntensity={0.35} metalness={0.3} roughness={0.3} />
              </mesh>
              <GlowLine ref={(l: LineHandle | null) => { blockEdges.current[i] = l; }} points={edges[i]} segments color={head ? COLORS.gold : "#92A399"} intensity={head ? 1.3 : 1} width={head ? 1.6 : 1.1} opacity={head ? 0.75 : 0.5} />
            </group>
          );
        })}
        {linkPts.map((pts, n) => (
          <GlowLine key={n} ref={(l: LineHandle | null) => { links.current[n] = l; }} points={pts} color={COLORS.gold} intensity={1.1} width={1.2} opacity={0.7} />
        ))}
        <mesh ref={bead} visible={false}>
          <sphereGeometry args={[0.045, 10, 10]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 2.2)} toneMapped={false} />
        </mesh>
        {/* the coin, inside its around-the-clock ring */}
        <group position={COIN.p}>
          <group ref={coin}>
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[COIN.r, COIN.r, 0.07, 40, 1]} />
              <meshPhysicalMaterial color="#0E1F17" emissive={COLORS.gold} emissiveIntensity={0.14} metalness={0.65} roughness={0.25} transparent opacity={0.92} />
            </mesh>
            <group position={[0, 0, 0.036]}>
              <GlowLine points={rim} color={COLORS.gold} intensity={1.3} width={1.6} />
            </group>
            <group position={[0, 0, -0.036]}>
              <GlowLine points={rim} color={COLORS.gold} intensity={1.3} width={1.6} />
            </group>
            {mark.map((m, i) => (
              <group key={i}>
                <GlowLine points={m.hex} color={COLORS.goldHot} intensity={1.2} width={1.4} />
                <GlowLine points={m.inner} segments color={COLORS.goldHot} intensity={1.1} width={1.2} />
              </group>
            ))}
          </group>
          <group rotation={face(0.2, -0.38)}>
            <group ref={clock}>
              <GlowLine points={dayRing} color={COLORS.mute} intensity={1} width={1} opacity={0.45} />
              <GlowLine points={dayTicks} segments color={COLORS.mute} intensity={1} width={1} opacity={0.6} />
              <group ref={sweep}>
                <GlowLine ref={(l: LineHandle | null) => { sweepLine.current = l; }} points={sweepPts} color={COLORS.gold} intensity={1.5} width={2} opacity={0} />
              </group>
            </group>
          </group>
        </group>
        <group position={[1.5, 1.2, 0]} rotation={face(0.2, -0.38)}>
          <group ref={spark}>
            <AiSpark size={0.065} />
          </group>
        </group>
      </Lean>
    </group>
  );
}
