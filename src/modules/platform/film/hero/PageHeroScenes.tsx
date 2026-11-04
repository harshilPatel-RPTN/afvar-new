"use client";

// The 3D heroes of the site pages (About, Pricing, the Markets family, the
// Resources family) — each page's own centrepiece, built from the shared kit.
// No page reuses another's object, and none uses the home's gold core.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { COLORS, useFilmMode, type CameraKey } from "@/modules/afvarOs";
import { AiSpark, CoreCanvas, GlassPlate, GlowLine, GoldDust, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import type { HeroSceneArgs } from "./HeroStage";
import { Candle, Card, clamp01, draw, ease, face, Lean, Lines, pop, tick, v, type LineHandle, type PageSceneProps } from "./pageHeroKit";
import { BriefsScene } from "./scenes/BriefsScene";
import { GroupScene } from "./scenes/GroupScene";
import { InstrumentScene } from "./scenes/InstrumentScene";
import { TIERS_X, tiersFit } from "./tiersFit";

export type PageHeroKind = "about" | "pricing" | "markets" | "group" | "instrument" | "briefs" | "resources" | "start" | "guides" | "help" | "faqs" | "evidence" | "contact";

const CAM: CameraKey[] = [
  { at: 0, pos: [0.2, 0.15, 8.2], look: [-1.45, 0.05, 0] },
  { at: 1, pos: [0.2, 0.15, 8.3], look: [-1.45, 0.05, 0] },
];
const CAM_P: CameraKey[] = [
  { at: 0, pos: [0, -0.4, 11.5], look: [0, -2.1, 0] },
  { at: 1, pos: [0, -0.4, 11.6], look: [0, -2.1, 0] },
];

/**
 * Portrait phones: the Resources- and Markets-family centrepieces are built for
 * the desktop frame (copy left, object right), so on a narrow screen they run
 * large and off the right edge. Each gets a smaller scale and a re-centring shift.
 */
const PORTRAIT_FIT: Partial<Record<PageHeroKind, { s: number; x?: number; y?: number }>> = {
  group: { s: 1.12, x: -0.45, y: -0.45 },
  instrument: { s: 1.2, x: -0.15, y: -0.3 },
  briefs: { s: 0.92, x: -0.5, y: -0.3 },
  resources: { s: 0.78, x: -0.18 },
  start: { s: 0.78, x: 0 },
  guides: { s: 0.68, x: -0.45 },
  help: { s: 0.72, x: -0.45 },
  faqs: { s: 0.72, x: -0.45 },
  evidence: { s: 0.76, x: -0.1 },
};

const SCENES: Record<PageHeroKind, (p: PageSceneProps) => ReactNode> = {
  about: PrinciplesStack,
  pricing: Tiers,
  markets: Islands,
  group: GroupScene,
  instrument: InstrumentScene,
  briefs: BriefsScene,
  resources: HubOrbit,
  start: StepPath,
  guides: OpenGuide,
  help: HelpRing,
  faqs: QaColumn,
  evidence: ProvenanceChain,
  contact: LetterRoutes,
};

export default function PageHeroScene({ kind, variant, a }: { kind: PageHeroKind; variant?: string; a: HeroSceneArgs }) {
  const Scene = SCENES[kind];
  const fit = a.portrait ? PORTRAIT_FIT[kind] : undefined;
  return (
    <CoreCanvas progress={a.progress} active={a.active} still={a.still} settledP={0} camera={a.portrait ? CAM_P : CAM} fov={a.portrait ? 50 : 38} parallax={a.portrait ? 0.04 : 0.12} bloom={a.lite ? 0.55 : 0.75} dpr={a.lite ? [1, 1.4] : [1, 1.75]}>
      <Sway>
        {fit ? (
          <group position={[fit.x ?? 0, fit.y ?? 0, 0]} scale={fit.s}>
            <Scene portrait={a.portrait} variant={variant} />
          </group>
        ) : (
          <Scene portrait={a.portrait} variant={variant} />
        )}
      </Sway>
      <GoldDust count={a.lite ? 140 : 200} box={[10, 6.5, 6]} center={[0, 0, -0.6]} drift={[0.02, 0.03, 0]} opacity={0.38} />
    </CoreCanvas>
  );
}

function Sway({ children }: { children: ReactNode }) {
  const { still } = useStoryFrame();
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (!g.current || still) return;
    const t = s.clock.elapsedTime;
    g.current.rotation.y = 0.06 * Math.sin(t * 0.18);
    g.current.position.y = 0.04 * Math.sin(t * 0.5);
  });
  return <group ref={g}>{children}</group>;
}

/* About: five principles stacked like a monument, a gold spine through them.
 * Idle motion (the hero's progress is fixed, so it runs on the clock): every
 * CHECK_PERIOD s a gold check pulse climbs the spine and each rule's tile lights
 * as it passes (the AI enforcing it), lifts a touch and settles; the tiles also
 * breathe in a slow wave up the stack, the spark swells when the check lands,
 * and the whole stack sways (~6°). Lite: sway + pulse + tile light only.
 * Still: one settled frame — all five rules lit (checked), no pulse, no motion. */
const RULE_GAP = 0.45;
const SPINE_FROM = -0.1;
const SPINE_TO = 2.25;
const CHECK_PERIOD = 5.5;
/** Share of the period the pulse spends climbing (the rest is a pause at the top). */
const CHECK_CLIMB = 0.55;
const BREATHE_PERIOD = 4.8;
const SWAY_PERIOD = 10;
type RuleMats = { edge: (THREE.Material & { opacity: number })[]; edgeBase: number[]; body: THREE.MeshPhysicalMaterial[] };
const RULE_GOLD = new THREE.Color(COLORS.gold);

function collectRuleMats(tile: THREE.Object3D): RuleMats {
  const out: RuleMats = { edge: [], edgeBase: [], body: [] };
  tile.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined;
    if (!m || Array.isArray(m)) return;
    if (m instanceof THREE.MeshPhysicalMaterial) {
      m.emissive.copy(RULE_GOLD);
      m.emissiveIntensity = 0;
      out.body.push(m);
    } else if (m.transparent) {
      out.edge.push(m as THREE.Material & { opacity: number });
      out.edgeBase.push(m.opacity);
    }
  });
  return out;
}

/** 0…1 light of the rule at height fraction `f` up the spine, at check phase `ph` (0…1). */
function ruleLight(ph: number, f: number): number {
  const dt = (((ph - f * CHECK_CLIMB) % 1) + 1) % 1 * CHECK_PERIOD;
  return dt < 0.18 ? dt / 0.18 : Math.exp(-(dt - 0.18) / 1.1);
}

function animateRules(stack: THREE.Group, mats: RuleMats[], pulse: THREE.Object3D | null, spark: THREE.Object3D | null, t: number, still: boolean, lite: boolean) {
  const ph = (t / CHECK_PERIOD) % 1;
  // whole stack: slow visible sway (~6°) and a hint of roll
  stack.rotation.y = still ? 0 : 0.1 * Math.sin((t / SWAY_PERIOD) * Math.PI * 2);
  stack.rotation.z = still || lite ? 0 : 0.02 * Math.sin((t / (SWAY_PERIOD * 1.3)) * Math.PI * 2);
  for (let i = 0; i < mats.length; i++) {
    const tile = stack.children[i];
    const f = (i * RULE_GAP - SPINE_FROM) / (SPINE_TO - SPINE_FROM);
    const k = still ? 0.4 : ruleLight(ph, f);
    const breathe = still || lite ? 0 : 0.035 * Math.sin((t / BREATHE_PERIOD - i / 5) * Math.PI * 2);
    tile.position.y = i * RULE_GAP + breathe + (still || lite ? 0 : 0.05 * k);
    const m = mats[i];
    for (let j = 0; j < m.edge.length; j++) m.edge[j].opacity = Math.min(1, m.edgeBase[j] + (1 - m.edgeBase[j]) * k);
    for (const b of m.body) b.emissiveIntensity = 0.32 * k;
  }
  if (pulse) {
    const u = ph / CHECK_CLIMB;
    const on = !still && u < 1;
    const r = on ? 0.05 * Math.sin(Math.PI * Math.min(1, u * 1.15)) + 0.012 : 0;
    pulse.position.y = SPINE_FROM + (SPINE_TO - SPINE_FROM) * Math.min(1, u);
    pulse.scale.setScalar(Math.max(1e-4, r));
  }
  if (spark) {
    // the spark swells as the check lands at the top, then breathes back
    const land = still || lite ? 0 : ruleLight(ph, 1.08);
    spark.scale.setScalar(1 + 0.35 * land);
  }
}

function PrinciplesStack() {
  const { still } = useStoryFrame();
  // Short portrait phones: the hero (HeroStage) gives the canvas a shorter box between the navbar and
  // the copy, so the stack keeps its own size here and never sits behind the headline.
  const { lite } = useFilmMode();
  const stack = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const spark = useRef<THREE.Group>(null);
  const mats = useRef<RuleMats[] | null>(null);
  useFrame((s) => {
    const g = stack.current;
    if (!g) return;
    if (!mats.current) mats.current = [0, 1, 2, 3, 4].map((i) => collectRuleMats(g.children[i]));
    animateRules(g, mats.current, pulse.current, spark.current, s.clock.elapsedTime, still, lite);
  });
  return (
    <group position={[0.4, -0.9, 0]} rotation={[0.3, -0.45, 0]}>
      <group ref={stack}>
        {[0, 1, 2, 3, 4].map((i) => (
          <group key={i} position={[0, i * RULE_GAP, 0]}>
            <GlassPlate width={2.6 - i * 0.34} depth={1.6 - i * 0.18} thickness={0.05} radius={0.1} edge={i === 4 ? 0.95 : 0.4} tint={i === 4 ? "#0E1F17" : "#06110C"} opacity={0.55} />
          </group>
        ))}
        <GlowLine points={[v(0, SPINE_FROM, 0), v(0, SPINE_TO, 0)]} color={COLORS.gold} intensity={1.3} width={2} />
        <group position={[0, 2.45, 0]} rotation={face(0.3, -0.45)}>
          <group ref={spark}>
            <AiSpark size={0.08} />
          </group>
        </group>
        <mesh ref={pulse} position={[0, SPINE_FROM, 0]} scale={0.0001}>
          <sphereGeometry args={[1, 12, 12]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 2.2)} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

/* Pricing: three glass tiers rising; the middle one carries the gold rim. */
const TIER = [
  { x: -1.15, h: 0.9 },
  { x: 0, h: 1.75 },
  { x: 1.15, h: 1.3 },
];
/** Square outline of a tier's top at height y. */
const rim = (y: number) => [v(-0.475, y, -0.475), v(0.475, y, -0.475), v(0.475, y, 0.475), v(-0.475, y, 0.475), v(-0.475, y, -0.475)];
/** The order the tiers rise in: the outer two first, the gold middle last. */
const RISE = [0.55, 1.05, 0.75];
function Tiers({ portrait }: { portrait: boolean }) {
  const { still } = useStoryFrame();
  // Near-square desktops would crop the right tier: refit against the live camera (tiersFit).
  const g = useRef<THREE.Group>(null);
  const base = useRef<THREE.Group>(null);
  const tiers = useRef<(THREE.Group | null)[]>([]);
  const glow = useRef<THREE.MeshPhysicalMaterial>(null);
  const sweep = useRef<THREE.Group>(null);
  const sweepLine = useRef<LineHandle | null>(null);
  const spark = useRef<THREE.Group>(null);
  // The glass base slides open, the outer tiers grow up out of it, then the gold middle rises last with a spring.
  // Live: the tiers breathe out of step, the gold tier glows and lifts, and a gold rim climbs it now and then like value rising.
  useFrame(({ camera, size, clock }) => {
    if (!g.current) return;
    const cam = camera as THREE.PerspectiveCamera;
    const { fit, x } = portrait ? { fit: 1, x: TIERS_X } : tiersFit({ fov: cam.fov, zoom: cam.zoom, width: size.width, height: size.height, offsetX: cam.view?.enabled ? cam.view.offsetX : 0 });
    g.current.scale.setScalar(fit);
    g.current.position.x = x;
    const t = clock.elapsedTime;
    if (base.current) base.current.scale.x = still ? 1 : Math.max(0.001, ease(t, 0.1, 0.8));
    tiers.current.forEach((m, i) => {
      if (!m) return;
      m.visible = still || t > RISE[i]; // not a flat sliver before its turn
      m.scale.y = still ? 1 : pop(t, RISE[i], i === 1 ? 1.0 : 0.8);
      m.position.y = still ? 0 : 0.03 * Math.sin(t * 0.8 + i * 2.1) + (i === 1 ? 0.06 * (0.5 + 0.5 * Math.sin(t * 0.6)) : 0);
    });
    if (glow.current) glow.current.emissiveIntensity = still ? 0.12 : 0.1 + 0.07 * (0.5 + 0.5 * Math.sin(t * 1.3));
    // The climbing rim: every 4.5 s after the rise, up the gold tier from base to top, fading as it goes.
    const c = (t - 2.2) % 4.5;
    const k = still || t < 2.2 ? 1 : clamp01(c / 1.6);
    if (sweep.current) {
      sweep.current.visible = !still && t > 2.2 && c < 1.6;
      sweep.current.position.y = ease(k, 0, 1) * TIER[1].h;
    }
    if (sweepLine.current) sweepLine.current.material.opacity = Math.sin(Math.PI * k) * 0.9;
    if (spark.current) {
      spark.current.scale.setScalar(still ? 1 : pop(t, 1.7, 0.7));
      spark.current.position.y = 2.15 + (still ? 0 : 0.06 * Math.sin(t * 0.6) + 0.5 * (1 - ease(t, 1.7, 0.9)));
    }
  });
  return (
    <group ref={g} position={[TIERS_X, -1.0, 0]} rotation={[0.28, -0.4, 0]}>
      <Lean yaw={0.14} pitch={0.06}>
        <group ref={base}>
          <GlassPlate width={4.2} depth={1.8} thickness={0.03} radius={0.12} edge={0.3} />
        </group>
        {TIER.map((t, i) => (
          <group key={i} position={[t.x, 0, 0]}>
            <group ref={(m) => { tiers.current[i] = m; }}>
              <mesh position={[0, t.h / 2, 0]}>
                <boxGeometry args={[0.95, t.h, 0.95]} />
                <meshPhysicalMaterial ref={i === 1 ? glow : undefined} color={i === 1 ? "#1A150B" : "#0E1214"} emissive={i === 1 ? COLORS.gold : "#2A3034"} emissiveIntensity={i === 1 ? 0.12 : 0.05} metalness={0.35} roughness={0.25} transparent opacity={0.8} />
              </mesh>
              <GlowLine points={rim(t.h + 0.01)} color={i === 1 ? COLORS.gold : "#92A399"} intensity={i === 1 ? 1.4 : 1} width={i === 1 ? 2 : 1.1} />
            </group>
          </group>
        ))}
        <group ref={sweep} visible={false}>
          <GlowLine ref={(l: LineHandle | null) => { sweepLine.current = l; }} points={rim(0).map((p) => p.multiplyScalar(1.04))} color={COLORS.gold} intensity={1.5} width={1.6} opacity={0} />
        </group>
        <group ref={spark} position={[0, 2.15, 0]} rotation={face(0.28, -0.4)}>
          <AiSpark size={0.075} />
        </group>
      </Lean>
    </group>
  );
}

/* Markets: three islands — metals, currencies, crypto — joined by gold arcs. */
const ISLES = [
  { p: v(-1.4, 0, 0.3), k: [0.3, 0.5, 0.45, 0.7, 0.62] },
  { p: v(0.2, 0.5, -0.5), k: [0.4, 0.35, 0.5, 0.42, 0.55] },
  { p: v(1.6, -0.1, 0.4), k: [0.5, 0.8, 0.6, 0.95, 0.75] },
];
const ARC_SEGS = 30;
/** The gold arc from island a to island b (wherever they are this frame). */
function arcPoints(a: THREE.Vector3, b: THREE.Vector3) {
  return new THREE.QuadraticBezierCurve3(a.clone().setY(a.y + 0.05), a.clone().lerp(b, 0.5).setY(Math.max(a.y, b.y) + 0.9), b.clone().setY(b.y + 0.05)).getPoints(ARC_SEGS);
}
function Islands() {
  const { still } = useStoryFrame();
  const isles = useRef<(THREE.Group | null)[]>([]);
  const bars = useRef<(THREE.Group | null)[]>([]);
  const lines = useRef<(LineHandle | null)[]>([]);
  const arcs = useMemo(() => [arcPoints(ISLES[0].p, ISLES[1].p), arcPoints(ISLES[1].p, ISLES[2].p)], []);
  const buf = useMemo(() => new Float32Array((ARC_SEGS + 1) * 3), []);
  // Islands drop in one by one and their candles spring up; then the gold arcs draw across.
  // After that each island floats and turns on its own beat, every candle ticks live, and the arcs ride along, pulsing.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    const at: THREE.Vector3[] = [];
    isles.current.forEach((g, i) => {
      if (!g) return;
      const k = still ? 1 : ease(t, 0.2 + i * 0.25, 0.9);
      g.position.set(ISLES[i].p.x, ISLES[i].p.y + (still ? 0 : 0.07 * Math.sin(t * 0.9 + i * 2.1) + 0.8 * (1 - k)), ISLES[i].p.z);
      g.scale.setScalar(still ? 1 : Math.max(0.001, pop(t, 0.2 + i * 0.25, 0.9)));
      g.rotation.y = still ? 0 : 0.3 * Math.sin(t * 0.35 + i * 1.7);
      at[i] = g.position;
    });
    bars.current.forEach((g, n) => {
      if (!g) return;
      const i = Math.floor(n / 5);
      const j = n % 5;
      const d = 0.7 + i * 0.25 + j * 0.08;
      g.visible = still || t > d; // not a flat sliver before its turn
      g.scale.y = still ? 1 : pop(t, d, 0.6) * (1 + (j === 4 ? 0.16 : 0.06) * tick(t, n));
    });
    lines.current.forEach((l, i) => {
      if (!l) return;
      if (!still && at[i] && at[i + 1]) {
        arcPoints(at[i], at[i + 1]).forEach((p, k) => p.toArray(buf, k * 3));
        l.geometry.setPositions(buf);
      }
      draw(l, still ? 1 : ease(t, 1.6 + i * 0.45, 0.8), ARC_SEGS);
      l.material.opacity = still ? 0.8 : 0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.4 - i * 1.2));
    });
  });
  return (
    <group position={[0.05, -0.45, 0]} rotation={[0.42, -0.3, 0]} scale={0.82}>
      <Lean>
        {ISLES.map((isle, i) => (
          <group key={i} position={isle.p} ref={(g) => { isles.current[i] = g; }}>
            <mesh rotation={[0, 0, 0]}>
              <cylinderGeometry args={[0.75, 0.75, 0.05, 48]} />
              <meshPhysicalMaterial color="#06110C" emissive="#2A3034" emissiveIntensity={0.05} metalness={0.3} roughness={0.2} transparent opacity={0.7} />
            </mesh>
            {isle.k.map((c, j) => (
              <group key={j} ref={(g) => { bars.current[i * 5 + j] = g; }}>
                <Candle x={-0.36 + j * 0.18} o={j ? isle.k[j - 1] * 0.6 : 0.15} c={c * 0.6} h={c * 0.6 + 0.08} l={0.06} s={0.1} />
              </group>
            ))}
          </group>
        ))}
        {arcs.map((pts, i) => (
          <GlowLine key={i} ref={(l: LineHandle | null) => { lines.current[i] = l; }} points={pts} color={COLORS.gold} intensity={1.15} width={1.3} opacity={0.8} />
        ))}
        <group position={[0.2, 1.25, -0.5]} rotation={face(0.42, -0.3)}>
          <AiSpark size={0.07} />
        </group>
      </Lean>
    </group>
  );
}

/* Resources hub: one index in the middle, five categories orbiting it. */
function HubOrbit() {
  const { still } = useStoryFrame();
  const ring = useRef<THREE.Group>(null);
  const hub = useRef<THREE.Group>(null);
  const sats = useRef<(THREE.Group | null)[]>([]);
  const spokes = useRef<(LineHandle | null)[]>([]);
  // The index springs up first; each category then flies out from it along its own spoke.
  // Live: the orbit keeps turning with a slow tilt, the index breathes, and light pulses out the spokes.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (hub.current) {
      hub.current.scale.setScalar(still ? 1 : pop(t, 0.15, 0.9));
      hub.current.position.y = still ? 0 : 0.05 * Math.sin(t * 0.7);
    }
    if (ring.current) {
      ring.current.rotation.y = still ? 0 : t * 0.12;
      ring.current.rotation.x = still ? 0 : 0.04 * Math.sin(t * 0.4);
    }
    sats.current.forEach((g, i) => {
      if (g) g.scale.setScalar(still ? 1 : pop(t, 0.6 + i * 0.14, 0.8));
      const l = spokes.current[i];
      if (l) l.material.opacity = still ? 0.5 : 0.5 * ease(t, 0.6 + i * 0.14, 0.8) * (0.6 + 0.4 * (0.5 + 0.5 * Math.sin(t * 1.5 - i * 1.3)));
    });
  });
  return (
    <group position={[0.2, -0.05, 0]} rotation={[0.32, -0.2, 0]} scale={0.8}>
      <Lean>
        <group ref={hub}>
          <Card w={1.0} h={1.7} gold>
            <Lines w={0.7} ys={[0.55, 0.35, 0.15, -0.05, -0.25, -0.45]} goldAt={0} />
          </Card>
        </group>
        <group ref={ring}>
          {[0, 1, 2, 3, 4].map((i) => {
            const a = (i / 5) * Math.PI * 2;
            const p = v(Math.cos(a) * 2.0, 0.15 * Math.sin(a * 2), Math.sin(a) * 2.0);
            return (
              <group key={i} ref={(g) => { sats.current[i] = g; }}>
                <GlowLine ref={(l: LineHandle | null) => { spokes.current[i] = l; }} points={[v(0, 0, 0), p]} color={COLORS.gold} intensity={1} width={1} opacity={0.5} />
                <group position={p} rotation={[0, -a + Math.PI / 2, 0]}>
                  <Card w={0.62} h={0.62} edge={0.6}>
                    <Lines w={0.4} ys={[0.12, -0.02, -0.16]} />
                  </Card>
                </group>
              </group>
            );
          })}
        </group>
        <group position={[0, 1.1, 0.2]}>
          <AiSpark size={0.065} />
        </group>
      </Lean>
    </group>
  );
}

/* Getting started: five step tiles climbing, the first steps already lit. */
const PATH_SEGS = 40;
function StepPath() {
  const { still } = useStoryFrame();
  const tiles = useRef<(THREE.Group | null)[]>([]);
  const path = useRef<LineHandle | null>(null);
  const flag = useRef<THREE.Group>(null);
  const steps = useMemo(() => [0, 1, 2, 3, 4].map((i) => v(-1.9 + i * 0.95, -0.9 + i * 0.42, 0.4 - i * 0.2)), []);
  // The tiles land one by one up the climb, the gold path draws itself from step to step,
  // and the finish line rises last. Live: a small lift walks the row, like the next step being taken.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    tiles.current.forEach((g, i) => {
      if (!g) return;
      const k = still ? 1 : ease(t, 0.2 + i * 0.18, 0.8);
      g.scale.setScalar(still ? 1 : pop(t, 0.2 + i * 0.18, 0.8));
      g.position.set(steps[i].x, steps[i].y + (still ? 0 : 0.6 * (1 - k) + 0.07 * Math.max(0, Math.sin(t * 1.1 - i * 0.8)) ** 10), steps[i].z);
    });
    draw(path.current, still ? 1 : ease(t, 1.1, 1.1), PATH_SEGS);
    if (flag.current) flag.current.scale.y = still ? 1 : Math.max(0.001, ease(t, 2.2, 0.7));
  });
  return (
    <group position={[-0.05, -0.45, 0]} rotation={[0.3, -0.35, 0]} scale={0.78}>
      <Lean>
        {steps.map((p, i) => (
          <group key={i} position={p} ref={(g) => { tiles.current[i] = g; }}>
            <GlassPlate width={0.8} depth={0.8} thickness={0.06} radius={0.08} edge={i < 2 ? 0.95 : 0.4} tint={i < 2 ? "#0E1F17" : "#06110C"} opacity={0.6} />
          </group>
        ))}
        <GlowLine ref={(l: LineHandle | null) => { path.current = l; }} points={new THREE.CatmullRomCurve3(steps.map((p) => p.clone().setY(p.y + 0.08))).getPoints(PATH_SEGS)} color={COLORS.gold} intensity={1.2} width={1.6} opacity={0.85} />
        <group ref={flag} position={[steps[4].x, steps[4].y + 0.05, steps[4].z]}>
          <GlowLine points={[v(0, 0, 0), v(0, 0.95, 0)]} color={COLORS.gold} intensity={1.3} width={2} />
        </group>
        <group position={[steps[1].x, steps[1].y + 0.25, steps[1].z]} rotation={face(0.3, -0.35)}>
          <AiSpark size={0.07} />
        </group>
      </Lean>
    </group>
  );
}

/* Guides: an open guide, steps on its pages and a gold ribbon marking the place. */
const RIBBON_SEGS = 24;
function OpenGuide() {
  const { still } = useStoryFrame();
  const pages = useRef<(THREE.Group | null)[]>([]);
  const dots = useRef<(THREE.Mesh | null)[]>([]);
  const ribbon = useRef<LineHandle | null>(null);
  const ribbonPts = useMemo(() => new THREE.CatmullRomCurve3([v(0.15, 0.06, -1.15), v(0.2, 0.06, 0.2), v(0.3, -0.5, 1.3)]).getPoints(RIBBON_SEGS), []);
  // The guide opens from closed, its step marks print down the pages, then the ribbon lays itself across.
  // Live: the pages breathe and the marks glow in turn down the page, as if being read.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    pages.current.forEach((g, pi) => {
      const sgn = pi ? 1 : -1;
      if (g) g.rotation.z = sgn * (still ? 0.22 : 0.22 + 1.1 * (1 - ease(t, 0.2, 1.1)) + 0.015 * Math.sin(t * 0.6 + pi * 2));
    });
    dots.current.forEach((m, n) => {
      if (m) m.scale.setScalar(still ? 1 : pop(t, 1.0 + (n % 5) * 0.12 + Math.floor(n / 5) * 0.06, 0.5) * (1 + 0.25 * Math.max(0, Math.sin(t * 0.9 - (n % 5) * 0.7)) ** 8));
    });
    draw(ribbon.current, still ? 1 : ease(t, 1.9, 0.9), RIBBON_SEGS);
  });
  return (
    <group position={[0.6, -0.45, 0]} rotation={[0.55, -0.3, 0]}>
      <Lean>
        {[-1, 1].map((sv, pi) => (
          <group key={sv} rotation={[0, 0, sv * 0.22]} ref={(g) => { pages.current[pi] = g; }}>
            <group position={[sv * 0.95, 0, 0]}>
              <GlassPlate width={1.8} depth={2.3} thickness={0.03} radius={0.08} edge={0.55} opacity={0.65} />
              {[-0.75, -0.4, -0.05, 0.3, 0.65].map((z, k) => (
                <group key={k}>
                  <mesh position={[-0.65, 0.04, z]} ref={(m) => { dots.current[pi * 5 + k] = m; }}>
                    <circleGeometry args={[0.06, 20]} />
                    <meshBasicMaterial color={hdr(sv < 0 || k < 1 ? COLORS.gold : "#92A399", sv < 0 || k < 1 ? 1.3 : 1)} toneMapped={false} side={THREE.DoubleSide} />
                  </mesh>
                  <GlowLine points={[v(-0.5, 0.04, z), v(0.65, 0.04, z)]} color="#2F4A3D" intensity={1} width={1.1} />
                </group>
              ))}
            </group>
          </group>
        ))}
        <GlowLine ref={(l: LineHandle | null) => { ribbon.current = l; }} points={ribbonPts} color={COLORS.gold} intensity={1.35} width={3} />
        <group position={[0, 0.55, -0.2]} rotation={face(0.55, -0.3)}>
          <AiSpark size={0.07} />
        </group>
      </Lean>
    </group>
  );
}

/* Help: a glass ring around a checklist — the path back to a working state. */
function HelpRing() {
  const { still } = useStoryFrame();
  const ring = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Group>(null);
  const card = useRef<THREE.Group>(null);
  const checks = useRef<(LineHandle | null)[]>([]);
  // The ring rolls up to size and keeps turning; the checklist pops in and its ticks draw themselves one by one.
  // Live: the done ticks flare in turn, as if another check just passed.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    if (halo.current) halo.current.scale.setScalar(still ? 1 : pop(t, 0.15, 0.9));
    if (ring.current) ring.current.rotation.z = still ? 0 : t * 0.15;
    if (card.current) {
      card.current.scale.setScalar(still ? 1 : pop(t, 0.55, 0.8));
      card.current.position.y = still ? 0 : 0.04 * Math.sin(t * 0.7);
    }
    checks.current.forEach((l, i) => {
      if (!l) return;
      draw(l, still ? 1 : ease(t, 1.3 + i * 0.3, 0.5), i < 3 ? 2 : 1);
      l.material.opacity = still || i === 3 ? 1 : 0.7 + 0.3 * Math.max(0, Math.sin(t * 1.1 - i * 1.9)) ** 6;
    });
  });
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.15, -0.35, 0]}>
      <Lean>
        <group ref={halo}>
          <mesh ref={ring} rotation={[0.2, 0, 0]}>
            <torusGeometry args={[1.55, 0.16, 32, 120]} />
            <meshPhysicalMaterial color="#101416" emissive={COLORS.gold} emissiveIntensity={0.08} metalness={0.4} roughness={0.2} transparent opacity={0.75} />
          </mesh>
          <mesh rotation={[0.2, 0, 0]}>
            <torusGeometry args={[1.38, 0.008, 8, 120]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
          </mesh>
        </group>
        <group ref={card}>
          <Card w={1.25} h={1.5} opacity={0.85}>
            {[0.45, 0.15, -0.15, -0.45].map((y, i) => (
              <group key={i}>
                <GlowLine ref={(l: LineHandle | null) => { checks.current[i] = l; }} points={i < 3 ? [v(-0.47, y, 0.035), v(-0.41, y - 0.06, 0.035), v(-0.3, y + 0.06, 0.035)] : [v(-0.47, y, 0.035), v(-0.31, y, 0.035)]} color={i < 3 ? COLORS.gold : "#92A399"} intensity={1.3} width={1.8} />
                <GlowLine points={[v(-0.2, y, 0.03), v(0.48, y, 0.03)]} color="#2F4A3D" intensity={1} width={1.1} />
              </group>
            ))}
          </Card>
        </group>
        <group position={[0.75, 0.95, 0.2]}>
          <AiSpark size={0.065} />
        </group>
      </Lean>
    </group>
  );
}

/* FAQs: questions and their answers, staggered in a column. */
function QaColumn() {
  const { still } = useStoryFrame();
  const rows = useRef<(THREE.Group | null)[]>([]);
  // Question and answer take turns sliding in from their own side, like a conversation landing.
  // Live: each card drifts on its own beat and the answers lean forward now and then.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    rows.current.forEach((g, i) => {
      if (!g) return;
      const q = i % 2 === 0;
      const k = still ? 1 : ease(t, 0.2 + i * 0.28, 0.9);
      g.position.set((q ? -0.45 : 0.45) + (q ? -1.4 : 1.4) * (1 - k), 1.15 - i * 0.78 + (still ? 0 : 0.05 * Math.sin(t * 0.7 + i * 1.6)), i * 0.12 + (still || q ? 0 : 0.12 * Math.max(0, Math.sin(t * 0.45 + i * 2)) ** 4));
      g.rotation.y = still ? 0 : (q ? -0.6 : 0.6) * (1 - k) + 0.035 * Math.sin(t * 0.55 + i);
      g.scale.setScalar(still ? 1 : Math.max(0.001, k));
    });
  });
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.08, -0.35, 0]}>
      <Lean>
        {[0, 1, 2, 3].map((i) => {
          const q = i % 2 === 0;
          const y = 1.15 - i * 0.78;
          const x = q ? -0.45 : 0.45;
          return (
            <group key={i} ref={(g) => { rows.current[i] = g; }} position={[x, y, i * 0.12]}>
              <Card w={q ? 1.7 : 2.0} h={0.55} gold={!q} opacity={0.8}>
                <GlowLine points={[v(q ? -0.55 : -0.85, 0.06, 0.03), v(q ? 0.45 : 0.75, 0.06, 0.03)]} color={q ? COLORS.ink : COLORS.gold} intensity={1.15} width={1.4} />
                {!q ? <GlowLine points={[v(-0.85, -0.1, 0.03), v(0.35, -0.1, 0.03)]} color="#92A399" intensity={1} width={1.1} /> : null}
                <GlowLine points={q ? [v(-0.85, -0.2, 0.02), v(-0.95, -0.4, 0.02), v(-0.65, -0.27, 0.02)] : [v(1.0, -0.2, 0.02), v(1.1, -0.4, 0.02), v(0.8, -0.27, 0.02)]} color={q ? "#92A399" : COLORS.gold} intensity={1} width={1.2} />
              </Card>
            </group>
          );
        })}
        <group position={[1.6, 0.95, 0.3]}>
          <AiSpark size={0.065} />
        </group>
      </Lean>
    </group>
  );
}

/* Sources & evidence: five fields chained into one seal — source, venue, time, delay, cache. */
function ProvenanceChain() {
  const { still } = useStoryFrame();
  const cards = useRef<(THREE.Group | null)[]>([]);
  const chain = useRef<LineHandle | null>(null);
  const drops = useRef<(LineHandle | null)[]>([]);
  const seal = useRef<THREE.Group>(null);
  const links = useMemo(() => [0, 1, 2, 3, 4].map((i) => v(-1.9 + i * 0.95, 0.85 + (i % 2) * 0.2, 0)), []);
  const buf = useMemo(() => new Float32Array(links.length * 3), [links]);
  // The five fields pop in left to right and the gold chain threads through them (riding their float);
  // the funnel lines then fade in and the seal lands with a spring. Live: pulses run down to the seal.
  useFrame((s) => {
    const t = s.clock.elapsedTime;
    cards.current.forEach((g, i) => {
      if (!g) return;
      g.scale.setScalar(still ? 1 : pop(t, 0.15 + i * 0.14, 0.7));
      g.position.set(links[i].x, links[i].y + (still ? 0 : 0.05 * Math.sin(t * 0.8 + i * 1.4)), links[i].z);
    });
    if (chain.current && !still) {
      cards.current.forEach((g, i) => (g ? g.position : links[i]).toArray(buf, i * 3));
      chain.current.geometry.setPositions(buf);
    }
    draw(chain.current, still ? 1 : ease(t, 0.8, 0.9), links.length - 1);
    drops.current.forEach((l, i) => {
      if (l) l.material.opacity = still ? 0.55 : 0.55 * ease(t, 1.5 + i * 0.08, 0.6) * (0.55 + 0.45 * (0.5 + 0.5 * Math.sin(t * 1.7 - i * 1.1)));
    });
    if (seal.current) {
      seal.current.scale.setScalar(still ? 1 : pop(t, 1.8, 0.8));
      seal.current.position.y = -0.95 + (still ? 0 : 0.04 * Math.sin(t * 0.65));
    }
  });
  return (
    <group position={[0.1, 0, 0]} rotation={[0.18, -0.35, 0]} scale={0.85}>
      <Lean>
        {links.map((p, i) => (
          <group key={i} position={p} ref={(g) => { cards.current[i] = g; }}>
            <Card w={0.7} h={0.48} edge={0.7}>
              <GlowLine points={[v(-0.22, 0.06, 0.03), v(0.22, 0.06, 0.03)]} color={COLORS.ink} intensity={1.1} width={1.3} />
              <GlowLine points={[v(-0.22, -0.08, 0.03), v(0.1, -0.08, 0.03)]} color="#92A399" intensity={1} width={1} />
            </Card>
          </group>
        ))}
        <GlowLine ref={(l: LineHandle | null) => { chain.current = l; }} points={links} color={COLORS.gold} intensity={1.2} width={1.4} />
        {links.map((p, i) => (
          <GlowLine key={i} ref={(l: LineHandle | null) => { drops.current[i] = l; }} points={[p.clone().setY(p.y - 0.24), v(0, -0.45, 0.2)]} color={COLORS.gold} intensity={1} width={1} opacity={0.55} />
        ))}
        <group ref={seal} position={[0, -0.95, 0.2]}>
          <Card w={2.0} h={1.0} gold opacity={0.85}>
            <GlowLine points={[v(-0.75, 0.22, 0.03), v(0.5, 0.22, 0.03)]} color={COLORS.gold} intensity={1.3} width={2.2} />
            <Lines w={1.5} ys={[0, -0.18]} />
          </Card>
        </group>
        <group position={[0, -0.42, 0.25]}>
          <AiSpark size={0.07} />
        </group>
      </Lean>
    </group>
  );
}

/* Contact: letters travel along gold routes to one desk; product problems branch off to Help. */
const ROUTE_FROM = [v(-2.2, 1.1, 0.3), v(-2.4, -0.1, -0.2), v(-1.9, -1.2, 0.4)];
const ROUTE_SEGS = 32;
const HELP_SEGS = 24;
/** When the letters set off, and how much of a route they cover per second. */
const POST = 1.3;
const PACE = 0.14;
function LetterRoutes() {
  const { still } = useStoryFrame();
  const letters = useRef<(THREE.Group | null)[]>([]);
  const routes = useRef<(LineHandle | null)[]>([]);
  const stray = useRef<THREE.Group>(null);
  const helpLine = useRef<LineHandle | null>(null);
  const desk = useRef<THREE.Group>(null);
  const tray = useRef<THREE.Group>(null);
  const curves = useMemo(() => ROUTE_FROM.map((a) => new THREE.QuadraticBezierCurve3(a, v(-0.6, a.y * 0.4 + 0.3, 0.6), v(0.9, 0.05, 0))), []);
  const pts = useMemo(() => curves.map((c) => c.getPoints(ROUTE_SEGS)), [curves]);
  const helpCurve = useMemo(() => new THREE.QuadraticBezierCurve3(v(-0.6, -0.4, 0.4), v(0.2, -1.2, 0.6), v(1.4, -1.35, 0.2)), []);
  const help = useMemo(() => helpCurve.getPoints(HELP_SEGS), [helpCurve]);
  const tan = useMemo(() => new THREE.Vector3(), []);
  // The desk and the Help tray pop in, then the gold routes draw from their origins and the Help branch dashes off.
  // Live: letters fly the routes, banking with the curve and swelling mid-flight; each one is filed into the desk with a
  // little knock, its route glowing while it is in the air. Now and then a letter takes the Help branch to the tray.
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    const fly = (g: THREE.Group, c: THREE.Curve<THREE.Vector3>, k: number, i: number, shown: number) => {
      g.position.copy(c.getPoint(k));
      c.getTangent(k, tan);
      g.rotation.set(still ? 0 : 0.18 * Math.sin(t * 3.1 + i * 1.9), 0, still ? 0 : 0.5 * Math.atan2(tan.y, Math.abs(tan.x) + 1e-3));
      g.scale.setScalar(still ? 1 : Math.max(0.001, shown * Math.sin(Math.PI * k) ** 0.35));
    };
    let hit = 0;
    curves.forEach((c, i) => {
      const run = (t - POST) * PACE + i / 3;
      const k = still ? 0.55 : run - Math.floor(run);
      const g = letters.current[i];
      if (g) {
        g.visible = still || t > POST;
        fly(g, c, k, i, still ? 1 : pop(t, POST + i * 0.15, 0.6));
      }
      if (!still && run >= 1) hit = Math.max(hit, Math.exp(-k / 0.05)); // just filed (not a letter's first appearance)
      const l = routes.current[i];
      draw(l, still ? 1 : ease(t, 0.5 + i * 0.22, 0.9), ROUTE_SEGS);
      if (l) l.material.opacity = still ? 0.55 : 0.3 + 0.45 * Math.sin(Math.PI * k) * clamp01(t - POST);
    });
    const sRun = (t - POST - 2.2) * 0.1;
    const sk = sRun - Math.floor(sRun);
    if (stray.current) {
      stray.current.visible = !still && sRun > 0;
      if (sRun > 0) fly(stray.current, helpCurve, sk, 3, 0.8);
    }
    const sHit = !still && sRun >= 1 ? Math.exp(-sk / 0.05) : 0;
    draw(helpLine.current, still ? 1 : ease(t, 1.2, 0.8), HELP_SEGS);
    if (helpLine.current) helpLine.current.material.dashOffset = still ? 0 : -t * 0.2;
    if (desk.current) {
      desk.current.scale.setScalar(still ? 1 : pop(t, 0.15, 0.9) * (1 + 0.05 * hit));
      desk.current.rotation.y = still ? 0 : -0.7 * (1 - ease(t, 0.15, 1.1)) + 0.04 * Math.sin(t * 0.6);
      desk.current.position.set(1.35, 0.05 + (still ? 0 : 0.04 * Math.sin(t * 0.8)), still ? 0 : 0.12 * hit);
    }
    if (tray.current) {
      const k = still ? 1 : ease(t, 0.7, 0.8);
      tray.current.position.set(1.6 + 0.8 * (1 - k), -1.35, 0.2 + (still ? 0 : 0.1 * sHit));
      tray.current.scale.setScalar(still ? 1 : Math.max(0.001, k) * (1 + 0.06 * sHit));
    }
  });
  return (
    <group position={[0.35, 0.05, 0]} rotation={[0.12, -0.3, 0]} scale={0.9}>
      <Lean yaw={0.16} pitch={0.08}>
        {pts.map((p, i) => (
          <GlowLine key={i} ref={(l: LineHandle | null) => { routes.current[i] = l; }} points={p} color={COLORS.gold} intensity={1.05} width={1.1} opacity={0.55} />
        ))}
        <GlowLine ref={(l: LineHandle | null) => { helpLine.current = l; }} points={help} color="#92A399" intensity={1} width={1} dashed dashSize={0.08} gapSize={0.06} />
        {curves.map((_c, i) => (
          <group key={i} ref={(g) => { letters.current[i] = g; }}>
            <Card w={0.5} h={0.34} edge={0.8} opacity={0.85}>
              <GlowLine points={[v(-0.22, 0.14, 0.03), v(0, -0.02, 0.03), v(0.22, 0.14, 0.03)]} color={COLORS.gold} intensity={1.2} width={1.4} />
            </Card>
          </group>
        ))}
        <group ref={stray} visible={false}>
          <Card w={0.5} h={0.34} edge={0.5} opacity={0.8}>
            <GlowLine points={[v(-0.22, 0.14, 0.03), v(0, -0.02, 0.03), v(0.22, 0.14, 0.03)]} color="#92A399" intensity={1.1} width={1.3} />
          </Card>
        </group>
        <group ref={desk} position={[1.35, 0.05, 0]}>
          <Card w={1.15} h={1.45} gold opacity={0.85}>
            <Lines w={0.8} ys={[0.45, 0.25, 0.05, -0.15, -0.35]} goldAt={0} />
          </Card>
        </group>
        <group ref={tray} position={[1.6, -1.35, 0.2]}>
          <Card w={0.8} h={0.42} edge={0.5} opacity={0.7}>
            <Lines w={0.5} ys={[0.06, -0.08]} />
          </Card>
        </group>
        <group position={[1.35, 0.95, 0.2]}>
          <AiSpark size={0.065} />
        </group>
      </Lean>
    </group>
  );
}
