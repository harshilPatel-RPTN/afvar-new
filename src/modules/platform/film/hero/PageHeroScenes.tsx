"use client";

// The 3D heroes of the site pages (About, Pricing, the Markets family, the
// Resources family) — each page's own centrepiece, built from the shared kit.
// No page reuses another's object, and none uses the home's gold core.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { COLORS, type CameraKey } from "@/modules/afvarOs";
import { AiSpark, CoreCanvas, GlassPlate, GlowLine, GoldDust, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import type { HeroSceneArgs } from "./HeroStage";

export type PageHeroKind = "about" | "pricing" | "markets" | "group" | "instrument" | "briefs" | "resources" | "start" | "guides" | "help" | "faqs" | "evidence" | "contact";

const CAM: CameraKey[] = [
  { at: 0, pos: [0.2, 0.15, 8.2], look: [-1.45, 0.05, 0] },
  { at: 1, pos: [0.2, 0.15, 8.3], look: [-1.45, 0.05, 0] },
];
const CAM_P: CameraKey[] = [
  { at: 0, pos: [0, -0.4, 11.5], look: [0, -2.1, 0] },
  { at: 1, pos: [0, -0.4, 11.6], look: [0, -2.1, 0] },
];

const SCENES: Record<PageHeroKind, () => ReactNode> = {
  about: PrinciplesStack,
  pricing: Tiers,
  markets: Islands,
  group: CardArc,
  instrument: BigCandles,
  briefs: BriefDial,
  resources: HubOrbit,
  start: StepPath,
  guides: OpenGuide,
  help: HelpRing,
  faqs: QaColumn,
  evidence: ProvenanceChain,
  contact: LetterRoutes,
};

export default function PageHeroScene({ kind, a }: { kind: PageHeroKind; a: HeroSceneArgs }) {
  const Scene = SCENES[kind];
  return (
    <CoreCanvas progress={a.progress} active={a.active} still={a.still} settledP={0} camera={a.portrait ? CAM_P : CAM} fov={a.portrait ? 50 : 38} parallax={a.portrait ? 0.04 : 0.12} bloom={a.lite ? 0.55 : 0.75} dpr={a.lite ? [1, 1.4] : [1, 1.75]}>
      <Sway>
        <Scene />
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

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const face = (x: number, y: number): [number, number, number, THREE.EulerOrder] => [-x, -y, 0, "YXZ"];
/** A vertical glass card facing the camera (GlassPlate lies flat by default). */
function Card({ w, h, edge = 0.5, gold = false, opacity = 0.7, children }: { w: number; h: number; edge?: number; gold?: boolean; opacity?: number; children?: ReactNode }) {
  return (
    <group>
      <group rotation={[Math.PI / 2, 0, 0]}>
        <GlassPlate width={w} depth={h} thickness={0.03} radius={0.07} edge={gold ? 0.95 : edge} edgeColor={gold ? COLORS.gold : "#92A399"} tint={gold ? "#0E1F17" : "#06110C"} opacity={opacity} />
      </group>
      {children}
    </group>
  );
}
/** Text-like lines on a card (in the card's own x/y). */
function Lines({ w, ys, goldAt = -1 }: { w: number; ys: number[]; goldAt?: number }) {
  return (
    <>
      {ys.map((y, i) => (
        <GlowLine key={i} points={[v(-w / 2, y, 0.03), v(i === goldAt ? w / 2 : w / 2 - 0.2, y, 0.03)]} color={i === goldAt ? COLORS.gold : "#2F4A3D"} intensity={i === goldAt ? 1.25 : 1} width={i === goldAt ? 1.8 : 1.1} />
      ))}
    </>
  );
}
function Candle({ x, z = 0, o, c, h, l, s = 0.16 }: { x: number; z?: number; o: number; c: number; h: number; l: number; s?: number }) {
  const up = c >= o;
  const body = Math.max(0.04, Math.abs(c - o));
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, (h + l) / 2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, h - l, 6]} />
        <meshBasicMaterial color={hdr(up ? COLORS.up : COLORS.down, 0.9)} toneMapped={false} />
      </mesh>
      <mesh position={[0, (o + c) / 2, 0]}>
        <boxGeometry args={[s, body, s]} />
        <meshPhysicalMaterial color={up ? "#0E2A1B" : "#2A0E0E"} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={0.35} metalness={0.3} roughness={0.35} transparent opacity={0.9} />
      </mesh>
    </group>
  );
}

/* About: five principles stacked like a monument, a gold spine through them. */
function PrinciplesStack() {
  return (
    <group position={[0.4, -0.9, 0]} rotation={[0.3, -0.45, 0]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group key={i} position={[0, i * 0.45, 0]}>
          <GlassPlate width={2.6 - i * 0.34} depth={1.6 - i * 0.18} thickness={0.05} radius={0.1} edge={i === 4 ? 0.95 : 0.4} tint={i === 4 ? "#0E1F17" : "#06110C"} opacity={0.55} />
        </group>
      ))}
      <GlowLine points={[v(0, -0.1, 0), v(0, 2.25, 0)]} color={COLORS.gold} intensity={1.3} width={2} />
      <group position={[0, 2.45, 0]} rotation={face(0.3, -0.45)}>
        <AiSpark size={0.08} />
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
function Tiers() {
  return (
    <group position={[0.45, -1.0, 0]} rotation={[0.28, -0.4, 0]}>
      <GlassPlate width={4.2} depth={1.8} thickness={0.03} radius={0.12} edge={0.3} />
      {TIER.map((t, i) => (
        <group key={i} position={[t.x, t.h / 2, 0]}>
          <mesh>
            <boxGeometry args={[0.95, t.h, 0.95]} />
            <meshPhysicalMaterial color={i === 1 ? "#1A150B" : "#0E1214"} emissive={i === 1 ? COLORS.gold : "#2A3034"} emissiveIntensity={i === 1 ? 0.12 : 0.05} metalness={0.35} roughness={0.25} transparent opacity={0.8} />
          </mesh>
          <GlowLine points={[v(-0.475, t.h / 2 + 0.01, -0.475), v(0.475, t.h / 2 + 0.01, -0.475), v(0.475, t.h / 2 + 0.01, 0.475), v(-0.475, t.h / 2 + 0.01, 0.475), v(-0.475, t.h / 2 + 0.01, -0.475)]} color={i === 1 ? COLORS.gold : "#92A399"} intensity={i === 1 ? 1.4 : 1} width={i === 1 ? 2 : 1.1} />
        </group>
      ))}
      <group position={[0, 2.15, 0]} rotation={face(0.28, -0.4)}>
        <AiSpark size={0.075} />
      </group>
    </group>
  );
}

/* Markets: three islands — metals, currencies, crypto — joined by gold arcs. */
const ISLES = [
  { p: v(-1.4, 0, 0.3), k: [0.3, 0.5, 0.45, 0.7, 0.62] },
  { p: v(0.2, 0.5, -0.5), k: [0.4, 0.35, 0.5, 0.42, 0.55] },
  { p: v(1.6, -0.1, 0.4), k: [0.5, 0.8, 0.6, 0.95, 0.75] },
];
function Islands() {
  const arcs = useMemo(
    () => [
      [ISLES[0].p, ISLES[1].p],
      [ISLES[1].p, ISLES[2].p],
    ].map(([a, b]) => new THREE.QuadraticBezierCurve3(a.clone().setY(a.y + 0.05), a.clone().lerp(b, 0.5).setY(Math.max(a.y, b.y) + 0.9), b.clone().setY(b.y + 0.05)).getPoints(30)),
    [],
  );
  return (
    <group position={[0.05, -0.45, 0]} rotation={[0.42, -0.3, 0]} scale={0.82}>
      {ISLES.map((isle, i) => (
        <group key={i} position={isle.p}>
          <mesh rotation={[0, 0, 0]}>
            <cylinderGeometry args={[0.75, 0.75, 0.05, 48]} />
            <meshPhysicalMaterial color="#06110C" emissive="#2A3034" emissiveIntensity={0.05} metalness={0.3} roughness={0.2} transparent opacity={0.7} />
          </mesh>
          {isle.k.map((c, j) => (
            <Candle key={j} x={-0.36 + j * 0.18} o={j ? isle.k[j - 1] * 0.6 : 0.15} c={c * 0.6} h={c * 0.6 + 0.08} l={0.06} s={0.1} />
          ))}
        </group>
      ))}
      {arcs.map((pts, i) => (
        <GlowLine key={i} points={pts} color={COLORS.gold} intensity={1.15} width={1.3} opacity={0.8} />
      ))}
      <group position={[0.2, 1.25, -0.5]} rotation={face(0.42, -0.3)}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Market group: one card per instrument, fanned in an arc, each with its own trace. */
function CardArc() {
  const traces = useMemo(() => [0, 1, 2, 3, 4].map((i) => Array.from({ length: 9 }, (_, k) => v(-0.42 + k * 0.105, -0.25 + 0.3 * Math.sin(k * 0.8 + i) * 0.5 + (k / 9) * 0.25 * (i % 2 ? -1 : 1), 0.03))), []);
  return (
    <group position={[0.5, -0.1, 0]} rotation={[0.12, -0.3, 0]}>
      {traces.map((pts, i) => {
        const ang = (i - 2) * 0.32;
        return (
          <group key={i} position={[Math.sin(ang) * 2.4, (i % 2) * 0.12, -Math.cos(ang) * 2.4 + 2.2]} rotation={[0, ang, 0]}>
            <Card w={1.05} h={1.4} gold={i === 2}>
              <GlowLine points={pts} color={i === 2 ? COLORS.gold : COLORS.ink} intensity={1.2} width={1.6} />
              <Lines w={0.85} ys={[0.5, 0.38]} />
            </Card>
          </group>
        );
      })}
      <group position={[0, 0.95, 0.3]}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}

/* Instrument: its own candles in 3D on a glass base, a gold level across them. */
const BIG = [
  [0.4, 0.7, 0.85, 0.3],
  [0.7, 0.55, 0.8, 0.45],
  [0.55, 0.95, 1.05, 0.5],
  [0.95, 1.2, 1.3, 0.85],
  [1.2, 1.05, 1.35, 0.95],
  [1.05, 1.4, 1.5, 1.0],
  [1.4, 1.25, 1.55, 1.15],
  [1.25, 1.6, 1.7, 1.2],
  [1.6, 1.75, 1.9, 1.5],
] as const;
function BigCandles() {
  return (
    <group position={[0.1, -0.95, 0]} rotation={[0.25, -0.38, 0]} scale={0.78}>
      <GlassPlate width={4.4} depth={1.6} thickness={0.03} radius={0.1} edge={0.35} />
      {BIG.map(([o, c, h, l], i) => (
        <Candle key={i} x={-1.9 + i * 0.47} o={o} c={c} h={h} l={l} s={0.26} />
      ))}
      <GlowLine points={[v(-2.2, 1.45, 0), v(2.2, 1.45, 0)]} color={COLORS.gold} intensity={1.25} width={1.4} dashed dashSize={0.12} gapSize={0.08} />
      <group position={[1.86, 1.95, 0]} rotation={face(0.25, -0.38)}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Briefs: a schedule dial behind three editions — morning, evening, weekly. */
function BriefDial() {
  const ticks = useMemo(() => [0.25, 0.77, 0.95].map((f) => f * Math.PI * 2), []);
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.1, -0.35, 0]}>
      <group position={[0.5, 0.2, -0.9]}>
        <mesh>
          <torusGeometry args={[1.55, 0.02, 12, 120]} />
          <meshBasicMaterial color={hdr(COLORS.gold, 1.2)} toneMapped={false} transparent opacity={0.8} />
        </mesh>
        {ticks.map((t, i) => (
          <mesh key={i} position={[Math.sin(t) * 1.55, Math.cos(t) * 1.55, 0]}>
            <sphereGeometry args={[0.06, 16, 16]} />
            <meshBasicMaterial color={hdr(COLORS.gold, 1.6)} toneMapped={false} />
          </mesh>
        ))}
        <GlowLine points={[v(0, 0, 0), v(Math.sin(ticks[0]) * 1.2, Math.cos(ticks[0]) * 1.2, 0)]} color={COLORS.gold} intensity={1.2} width={1.6} />
      </group>
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-0.5 + i * 0.5, -0.3 + i * 0.12, i * 0.3]}>
          <Card w={1.2} h={1.6} gold={i === 2} opacity={0.8}>
            <GlowLine points={[v(-0.45, 0.6, 0.03), v(0.1, 0.6, 0.03)]} color={COLORS.gold} intensity={1.2} width={2.2} />
            <Lines w={0.9} ys={[0.35, 0.18, 0.01, -0.16, -0.33]} goldAt={i === 2 ? 2 : -1} />
          </Card>
        </group>
      ))}
    </group>
  );
}

/* Resources hub: one index in the middle, five categories orbiting it. */
function HubOrbit() {
  const { still } = useStoryFrame();
  const ring = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (ring.current && !still) ring.current.rotation.y = s.clock.elapsedTime * 0.12;
  });
  return (
    <group position={[0.2, -0.05, 0]} rotation={[0.32, -0.2, 0]} scale={0.8}>
      <Card w={1.0} h={1.7} gold>
        <Lines w={0.7} ys={[0.55, 0.35, 0.15, -0.05, -0.25, -0.45]} goldAt={0} />
      </Card>
      <group ref={ring}>
        {[0, 1, 2, 3, 4].map((i) => {
          const a = (i / 5) * Math.PI * 2;
          const p = v(Math.cos(a) * 2.0, 0.15 * Math.sin(a * 2), Math.sin(a) * 2.0);
          return (
            <group key={i}>
              <GlowLine points={[v(0, 0, 0), p]} color={COLORS.gold} intensity={1} width={1} opacity={0.5} />
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
    </group>
  );
}

/* Getting started: five step tiles climbing, the first steps already lit. */
function StepPath() {
  const steps = useMemo(() => [0, 1, 2, 3, 4].map((i) => v(-1.9 + i * 0.95, -0.9 + i * 0.42, 0.4 - i * 0.2)), []);
  return (
    <group position={[-0.05, -0.45, 0]} rotation={[0.3, -0.35, 0]} scale={0.78}>
      {steps.map((p, i) => (
        <group key={i} position={p}>
          <GlassPlate width={0.8} depth={0.8} thickness={0.06} radius={0.08} edge={i < 2 ? 0.95 : 0.4} tint={i < 2 ? "#0E1F17" : "#06110C"} opacity={0.6} />
        </group>
      ))}
      <GlowLine points={new THREE.CatmullRomCurve3(steps.map((p) => p.clone().setY(p.y + 0.08))).getPoints(40)} color={COLORS.gold} intensity={1.2} width={1.6} opacity={0.85} />
      <GlowLine points={[steps[4].clone().setY(steps[4].y + 0.05), steps[4].clone().setY(steps[4].y + 1.0)]} color={COLORS.gold} intensity={1.3} width={2} />
      <group position={[steps[1].x, steps[1].y + 0.25, steps[1].z]} rotation={face(0.3, -0.35)}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Guides: an open guide, steps on its pages and a gold ribbon marking the place. */
function OpenGuide() {
  return (
    <group position={[0.6, -0.45, 0]} rotation={[0.55, -0.3, 0]}>
      {[-1, 1].map((s) => (
        <group key={s} rotation={[0, 0, s * 0.22]}>
          <group position={[s * 0.95, 0, 0]}>
            <GlassPlate width={1.8} depth={2.3} thickness={0.03} radius={0.08} edge={0.55} opacity={0.65} />
            {[-0.75, -0.4, -0.05, 0.3, 0.65].map((z, k) => (
              <group key={k}>
                <mesh position={[-0.65, 0.04, z]}>
                  <circleGeometry args={[0.06, 20]} />
                  <meshBasicMaterial color={hdr(s < 0 || k < 1 ? COLORS.gold : "#92A399", s < 0 || k < 1 ? 1.3 : 1)} toneMapped={false} side={THREE.DoubleSide} />
                </mesh>
                <GlowLine points={[v(-0.5, 0.04, z), v(0.65, 0.04, z)]} color="#2F4A3D" intensity={1} width={1.1} />
              </group>
            ))}
          </group>
        </group>
      ))}
      <GlowLine points={[v(0.15, 0.06, -1.15), v(0.2, 0.06, 0.2), v(0.3, -0.5, 1.3)]} color={COLORS.gold} intensity={1.35} width={3} />
      <group position={[0, 0.55, -0.2]} rotation={face(0.55, -0.3)}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Help: a glass ring around a checklist — the path back to a working state. */
function HelpRing() {
  const { still } = useStoryFrame();
  const ring = useRef<THREE.Mesh>(null);
  useFrame((s) => {
    if (ring.current && !still) ring.current.rotation.z = s.clock.elapsedTime * 0.15;
  });
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.15, -0.35, 0]}>
      <mesh ref={ring} rotation={[0.2, 0, 0]}>
        <torusGeometry args={[1.55, 0.16, 32, 120]} />
        <meshPhysicalMaterial color="#101416" emissive={COLORS.gold} emissiveIntensity={0.08} metalness={0.4} roughness={0.2} transparent opacity={0.75} />
      </mesh>
      <mesh rotation={[0.2, 0, 0]}>
        <torusGeometry args={[1.38, 0.008, 8, 120]} />
        <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
      </mesh>
      <Card w={1.25} h={1.5} opacity={0.85}>
        {[0.45, 0.15, -0.15, -0.45].map((y, i) => (
          <group key={i}>
            <GlowLine points={i < 3 ? [v(-0.47, y, 0.035), v(-0.41, y - 0.06, 0.035), v(-0.3, y + 0.06, 0.035)] : [v(-0.47, y, 0.035), v(-0.31, y, 0.035)]} color={i < 3 ? COLORS.gold : "#92A399"} intensity={1.3} width={1.8} />
            <GlowLine points={[v(-0.2, y, 0.03), v(0.48, y, 0.03)]} color="#2F4A3D" intensity={1} width={1.1} />
          </group>
        ))}
      </Card>
      <group position={[0.75, 0.95, 0.2]}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}

/* FAQs: questions and their answers, staggered in a column. */
function QaColumn() {
  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.08, -0.35, 0]}>
      {[0, 1, 2, 3].map((i) => {
        const q = i % 2 === 0;
        const y = 1.15 - i * 0.78;
        const x = q ? -0.45 : 0.45;
        return (
          <group key={i} position={[x, y, i * 0.12]}>
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
    </group>
  );
}

/* Sources & evidence: five fields chained into one seal — source, venue, time, delay, cache. */
function ProvenanceChain() {
  const links = useMemo(() => [0, 1, 2, 3, 4].map((i) => v(-1.9 + i * 0.95, 0.85 + (i % 2) * 0.2, 0)), []);
  return (
    <group position={[0.1, 0, 0]} rotation={[0.18, -0.35, 0]} scale={0.85}>
      {links.map((p, i) => (
        <group key={i} position={p}>
          <Card w={0.7} h={0.48} edge={0.7}>
            <GlowLine points={[v(-0.22, 0.06, 0.03), v(0.22, 0.06, 0.03)]} color={COLORS.ink} intensity={1.1} width={1.3} />
            <GlowLine points={[v(-0.22, -0.08, 0.03), v(0.1, -0.08, 0.03)]} color="#92A399" intensity={1} width={1} />
          </Card>
        </group>
      ))}
      <GlowLine points={links} color={COLORS.gold} intensity={1.2} width={1.4} />
      {links.map((p, i) => (
        <GlowLine key={i} points={[p.clone().setY(p.y - 0.24), v(0, -0.45, 0.2)]} color={COLORS.gold} intensity={1} width={1} opacity={0.55} />
      ))}
      <group position={[0, -0.95, 0.2]}>
        <Card w={2.0} h={1.0} gold opacity={0.85}>
          <GlowLine points={[v(-0.75, 0.22, 0.03), v(0.5, 0.22, 0.03)]} color={COLORS.gold} intensity={1.3} width={2.2} />
          <Lines w={1.5} ys={[0, -0.18]} />
        </Card>
      </group>
      <group position={[0, -0.42, 0.25]}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Contact: letters travel along gold routes to one desk; product problems branch off to Help. */
const ROUTE_FROM = [v(-2.2, 1.1, 0.3), v(-2.4, -0.1, -0.2), v(-1.9, -1.2, 0.4)];
function LetterRoutes() {
  const { still } = useStoryFrame();
  const letters = useRef<(THREE.Group | null)[]>([]);
  const curves = useMemo(() => ROUTE_FROM.map((a) => new THREE.QuadraticBezierCurve3(a, v(-0.6, a.y * 0.4 + 0.3, 0.6), v(0.9, 0.05, 0))), []);
  const pts = useMemo(() => curves.map((c) => c.getPoints(32)), [curves]);
  const help = useMemo(() => new THREE.QuadraticBezierCurve3(v(-0.6, -0.4, 0.4), v(0.2, -1.2, 0.6), v(1.4, -1.35, 0.2)).getPoints(24), []);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    curves.forEach((c, i) => {
      const g = letters.current[i];
      if (!g) return;
      const k = still ? 0.55 : ((t * 0.12 + i / 3) % 1);
      g.position.copy(c.getPoint(k));
      g.scale.setScalar(0.6 + 0.4 * Math.sin(Math.PI * k));
    });
  });
  return (
    <group position={[0.35, 0.05, 0]} rotation={[0.12, -0.3, 0]} scale={0.9}>
      {pts.map((p, i) => (
        <GlowLine key={i} points={p} color={COLORS.gold} intensity={1.05} width={1.1} opacity={0.55} />
      ))}
      <GlowLine points={help} color="#92A399" intensity={1} width={1} dashed dashSize={0.08} gapSize={0.06} />
      {curves.map((_c, i) => (
        <group key={i} ref={(g) => { letters.current[i] = g; }}>
          <Card w={0.5} h={0.34} edge={0.8} opacity={0.85}>
            <GlowLine points={[v(-0.22, 0.14, 0.03), v(0, -0.02, 0.03), v(0.22, 0.14, 0.03)]} color={COLORS.gold} intensity={1.2} width={1.4} />
          </Card>
        </group>
      ))}
      <group position={[1.35, 0.05, 0]}>
        <Card w={1.15} h={1.45} gold opacity={0.85}>
          <Lines w={0.8} ys={[0.45, 0.25, 0.05, -0.15, -0.35]} goldAt={0} />
        </Card>
      </group>
      <group position={[1.6, -1.35, 0.2]}>
        <Card w={0.8} h={0.42} edge={0.5} opacity={0.7}>
          <Lines w={0.5} ys={[0.06, -0.08]} />
        </Card>
      </group>
      <group position={[1.35, 0.95, 0.2]}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}
