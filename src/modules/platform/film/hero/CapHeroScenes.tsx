"use client";

// The 3D heroes of Research, Alerts, Risk Review and Community — each page's
// own centrepiece, built from the shared kit (glass, gold lines, the spark,
// gold dust). Only the hero shows 3D; the sections after it are OS windows.
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { AiSpark, COLORS, CoreCanvas, GlassPlate, GlowLine, GoldDust, hdr, useStoryFrame, type CameraKey } from "@/modules/afvarOs";
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
        {kind === "research" ? <ResearchFan /> : kind === "alerts" ? <AlertLevels /> : kind === "risk" ? <RiskTimeline /> : <CommunityRooms />}
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
    g.current.rotation.y = 0.05 * Math.sin(t * 0.2);
    g.current.position.y = 0.04 * Math.sin(t * 0.5);
  });
  return <group ref={g}>{children}</group>;
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
/** Inside a group turned by `rot`, face a child back to the camera. */
const face = (x: number, y: number): [number, number, number, THREE.EulerOrder] => [-x, -y, 0, "YXZ"];

/* Research: source pages fan out; gold threads pull their lines into one brief. */
const PAGES = [-0.5, -0.2, 0.1];
function ResearchFan() {
  const pages = PAGES;
  const threads = useMemo(() => PAGES.map((_r, i) => [v(-1.2 + i * 0.25, 0.4 - i * 0.35, 0.1), v(-0.2, 0.3 - i * 0.2, 0.4), v(0.9, 0.35 - i * 0.35, 0.25)]), []);
  return (
    <group position={[0.1, 0, 0]} rotation={[0.12, -0.35, 0]} scale={1.12}>
      {pages.map((r, i) => (
        <group key={i} position={[-1.4 + i * 0.22, -0.1 - i * 0.05, -0.3 + i * 0.12]} rotation={[Math.PI / 2, 0, r]}>
          <GlassPlate width={1.3} depth={1.7} thickness={0.03} radius={0.06} edge={0.45} />
          {[0.5, 0.3, 0.1, -0.1, -0.3].map((y, k) => (
            <GlowLine key={k} points={[v(-0.45, 0.03, -y), v(k === 2 - (i % 3) ? 0.45 : 0.3, 0.03, -y)]} color={k === 2 - (i % 3) ? COLORS.gold : "#3A4044"} intensity={k === 2 - (i % 3) ? 1.3 : 1} width={k === 2 - (i % 3) ? 1.6 : 1} />
          ))}
        </group>
      ))}
      <group position={[1.35, 0, 0.3]} rotation={[Math.PI / 2, 0, 0]}>
        <GlassPlate width={1.5} depth={1.9} thickness={0.04} radius={0.08} edge={0.85} tint="#141109" opacity={0.75} />
        <GlowLine points={[v(-0.5, 0.03, -0.7), v(0.5, 0.03, -0.7)]} color={COLORS.gold} intensity={1.2} width={3} />
        {[-0.35, -0.1, 0.15, 0.4].map((y, k) => (
          <GlowLine key={k} points={[v(-0.5, 0.03, y), v(0.45, 0.03, y)]} color="#4A5155" intensity={1} width={1.2} />
        ))}
      </group>
      {threads.map((p, i) => (
        <GlowLine key={i} points={new THREE.CatmullRomCurve3(p).getPoints(24)} color={COLORS.gold} intensity={1.15} width={1.2} opacity={0.8} />
      ))}
      <group position={[-0.2, 0.25, 0.45]} rotation={face(0.12, -0.35)}>
        <AiSpark size={0.07} />
      </group>
    </group>
  );
}

/* Alerts: glass planes at your levels; the price line crosses one and it rings. */
function AlertLevels() {
  const { still } = useStoryFrame();
  const ring = useRef<THREE.Mesh>(null);
  const line = useMemo(() => {
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) {
      const x = -2.4 + (i / 40) * 4.8;
      pts.push(v(x, -1.0 + (i / 40) * 1.6 + 0.18 * Math.sin(i * 0.9) + 0.08 * Math.sin(i * 2.3), 0));
    }
    return pts;
  }, []);
  useFrame((s) => {
    if (!ring.current) return;
    const t = still ? 0.4 : (s.clock.elapsedTime * 0.6) % 1;
    ring.current.scale.setScalar(0.3 + t * 1.6);
    (ring.current.material as THREE.MeshBasicMaterial).opacity = 0.7 * (1 - t);
  });
  return (
    <group position={[0.3, -0.1, 0]} rotation={[0.35, -0.3, 0]} scale={0.82}>
      {[-0.9, 0, 0.9].map((y, i) => (
        <group key={y} position={[0, y, 0]}>
          <GlassPlate width={5} depth={1.6} thickness={0.03} radius={0.08} edge={i === 1 ? 0.95 : 0.3} edgeColor={i === 1 ? COLORS.gold : "#6D7578"} tint={i === 1 ? "#141109" : "#0A0D0F"} opacity={i === 1 ? 0.55 : 0.35} />
        </group>
      ))}
      <GlowLine points={line} color={COLORS.ink} intensity={1.2} width={2} />
      <group position={[0.35, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh ref={ring}>
          <ringGeometry args={[0.28, 0.31, 64]} />
          <meshBasicMaterial color={hdr(COLORS.gold, 1.6)} transparent opacity={0.6} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      </group>
      <group position={[0.35, 0.05, 0]} rotation={face(0.35, -0.3)}>
        <AiSpark size={0.07} />
      </group>
      <group position={[1.3, 1.4, 0.2]} rotation={[Math.PI / 2 + 0.35, 0, 0]}>
        <GlassPlate width={1.3} depth={0.45} thickness={0.03} radius={0.1} edge={0.9} tint="#0B0E10" opacity={0.85} />
        <GlowLine points={[v(-0.45, 0.03, -0.08), v(0.35, 0.03, -0.08)]} color={COLORS.gold} intensity={1.2} width={2.4} />
      </group>
    </group>
  );
}

/* Risk review: past trades as glass bars above your daily-limit line. */
const TRADES = [0.9, -0.5, 1.3, 0.5, -0.8, -1.0, 0.7, 1.5, -0.4, 1.1, -0.6, 0.8];
function RiskTimeline() {
  return (
    <group position={[0.5, -0.25, 0]} rotation={[0.25, -0.4, 0]} scale={0.7}>
      <GlowLine points={[v(-2.6, 0, 0), v(2.6, 0, 0)]} color="#6D7578" intensity={1} width={1.2} />
      {TRADES.map((r, i) => {
        const h = Math.abs(r);
        const up = r >= 0;
        return (
          <mesh key={i} position={[-2.3 + i * 0.42, up ? h / 2 : -h / 2, 0]}>
            <boxGeometry args={[0.24, h, 0.24]} />
            <meshPhysicalMaterial color={up ? "#0E2A1B" : "#2A0E0E"} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={0.25} metalness={0.3} roughness={0.35} transparent opacity={0.85} />
          </mesh>
        );
      })}
      <GlowLine points={[v(-2.6, -1.35, 0), v(2.6, -1.35, 0)]} color={COLORS.gold} intensity={1.2} width={1.4} dashed dashSize={0.12} gapSize={0.08} />
      <group position={[0.85, 2.15, 0]} rotation={[Math.PI / 2 + 0.25, 0, 0]}>
        <GlassPlate width={1.4} depth={0.6} thickness={0.03} radius={0.08} edge={0.6} tint="#0B0E10" opacity={0.85} />
        <GlowLine points={[v(-0.5, 0.03, -0.12), v(0.4, 0.03, -0.12)]} color={COLORS.gold} intensity={1.1} width={2} />
      </group>
      <group position={[0.64, 1.8, 0.1]} rotation={face(0.25, -0.4)}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}

/* Community: rooms on a wide plane, traders as lights, shared charts rising as cards. */
const NODES = [v(-1.8, 0, 0.5), v(-0.9, 0, -0.4), v(0, 0, 0.6), v(0.9, 0, -0.3), v(1.8, 0, 0.4), v(-0.3, 0, -1.0), v(1.2, 0, 0.9)];
const EDGES = [[0, 1], [1, 2], [2, 3], [3, 4], [1, 5], [5, 3], [2, 6], [6, 4], [0, 2]];
function CommunityRooms() {
  return (
    <group position={[0.2, -0.6, 0]} rotation={[0.45, -0.3, 0]}>
      <GlassPlate width={5.2} depth={3} thickness={0.04} radius={0.12} edge={0.45} />
      {EDGES.map(([a, b], i) => (
        <GlowLine key={i} points={[NODES[a].clone().setY(0.06), NODES[b].clone().setY(0.06)]} color={COLORS.gold} intensity={1.05} width={1.1} opacity={0.7} />
      ))}
      {NODES.map((n, i) => (
        <mesh key={i} position={[n.x, 0.14, n.z]}>
          <sphereGeometry args={[i === 2 || i === 4 ? 0.13 : 0.1, 24, 24]} />
          <meshStandardMaterial color="#1B2023" emissive={COLORS.gold} emissiveIntensity={i === 2 || i === 4 ? 0.9 : 0.35} metalness={0.4} roughness={0.35} />
        </mesh>
      ))}
      {[1, 3].map((k, i) => (
        <group key={k} position={[NODES[k].x, 1.0 + i * 0.25, NODES[k].z]} rotation={face(0.45, -0.3)}>
          <group rotation={[Math.PI / 2, 0, 0]}>
            <GlassPlate width={1.1} depth={0.65} thickness={0.03} radius={0.08} edge={0.85} tint="#0B0E10" opacity={0.85} />
          </group>
          <GlowLine points={[v(-0.4, -0.15, 0.03), v(-0.2, -0.02, 0.03), v(0, -0.08, 0.03), v(0.2, 0.1, 0.03), v(0.4, 0.05, 0.03)]} color={COLORS.gold} intensity={1.2} width={1.6} />
        </group>
      ))}
      <group position={[0.45, 0.35, 0.15]} rotation={face(0.45, -0.3)}>
        <AiSpark size={0.065} />
      </group>
    </group>
  );
}
