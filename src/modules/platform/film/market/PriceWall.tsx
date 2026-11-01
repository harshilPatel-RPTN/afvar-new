"use client";

// Market Data's centrepiece — the chart itself, built in glass. Gold's real
// hourly closes stand as a wall (the chart's area fill, extruded); the newest
// price is at the front, where the spark (the AI) reads it, with its label:
// price, change, freshness, source and time. The other seven markets run as
// faint lines behind. Closes only — the feeds give no open / high / low, so
// there are no invented candles.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlowLine, useStoryFrame } from "@/modules/afvarOs/gl";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { LANE_KEYS, type Quotes } from "@/modules/homeDemo/kit";
import { closesPoints, dirColor } from "../parts/closes";
import { STATUS_LABEL, asOfText, signedPct } from "./analysis";

/** The wall in its own space: x along time, y up from the floor. */
export const WALL = { length: 4.6, base: -1.2, low: 0.4, high: 2.1, depth: 1.2 } as const;
const LEAD = "XAUUSD";

function wallFace(pts: THREE.Vector3[], base: number, color: string): THREE.BufferGeometry {
  // Three rows per close (under the line, a third of the way down, the floor):
  // the chart's area fill — a hint of colour under the line, clear glass below.
  const n = pts.length;
  const pos = new Float32Array(n * 9);
  const col = new Float32Array(n * 12);
  const c = new THREE.Color(color);
  const top = c.clone().lerp(new THREE.Color(COLORS.ink), 0.3);
  pts.forEach((p, i) => {
    const mid = p.y - (p.y - base) * 0.34;
    pos.set([p.x, p.y, p.z, p.x, mid, p.z, p.x, base, p.z], i * 9);
    col.set([top.r, top.g, top.b, 0.2, c.r, c.g, c.b, 0.06, c.r, c.g, c.b, 0], i * 12);
  });
  const index: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    const a = i * 3;
    const b = a + 3;
    index.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
  g.setAttribute("color", new THREE.BufferAttribute(col, 4));
  g.setIndex(index);
  return g;
}

function segments(pairs: [THREE.Vector3, THREE.Vector3][]): THREE.BufferGeometry {
  const a = new Float32Array(pairs.length * 6);
  pairs.forEach(([p, q], i) => a.set([p.x, p.y, p.z, q.x, q.y, q.z], i * 6));
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.BufferAttribute(a, 3));
  return g;
}

export function PriceWall({ quotes, compact, yaw, pitch, x = 0 }: { quotes: Quotes; compact: boolean; yaw: number; pitch: number; x?: number }) {
  const { still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const lead = quotes[LEAD];
  const closes = useMemo(() => lead?.closes ?? [], [lead]);
  const L = compact ? WALL.length * 0.8 : WALL.length;
  const B = WALL.base;

  const wall = useMemo(() => {
    if (closes.length < 2) return null;
    const color = dirColor(closes);
    const pts = closesPoints(closes, { x0: -L / 2, x1: L / 2, y0: B + WALL.low, y1: B + WALL.high });
    const ribs = segments(pts.map((p) => [new THREE.Vector3(p.x, B, p.z), p]));
    const mirror = pts.map((p) => new THREE.Vector3(p.x, B - (p.y - B) * 0.22, p.z));
    return { color, pts, face: wallFace(pts, B, color), ribs, mirror, last: pts[pts.length - 1] };
  }, [closes, L, B]);

  const floor = useMemo(() => {
    const pairs: [THREE.Vector3, THREE.Vector3][] = [];
    const x0 = -L / 2 - 0.3;
    const x1 = L / 2 + 0.3;
    for (let z = -WALL.depth; z <= WALL.depth + 1e-6; z += 0.4) pairs.push([new THREE.Vector3(x0, B, z), new THREE.Vector3(x1, B, z)]);
    for (let x = -L / 2; x <= L / 2 + 1e-6; x += L / 8) pairs.push([new THREE.Vector3(x, B, -WALL.depth), new THREE.Vector3(x, B, WALL.depth)]);
    return segments(pairs);
  }, [L, B]);

  // The other seven markets: faint lines behind the wall, receding.
  const others = useMemo(
    () =>
      LANE_KEYS.filter(([k]) => k !== LEAD).flatMap(([key, sym], k) => {
        const cl = quotes[key]?.closes ?? [];
        if (cl.length < 2) return [];
        const z = -0.6 - k * 0.32;
        const y0 = B + 0.5 + (k % 3) * 0.14;
        const pts = closesPoints(cl, { x0: -L / 2 + 0.3, x1: L / 2 - 0.3, y0, y1: y0 + 0.45, z });
        return [{ key, sym, pts, color: dirColor(cl) }];
      }),
    [quotes, L, B],
  );

  useFrame((s) => {
    if (!group.current) return;
    const t = still ? 0 : s.clock.elapsedTime;
    group.current.rotation.y = yaw + 0.04 * Math.sin(t * 0.18);
  });

  // Inside the wall: turn a child back to face the camera.
  const face: [number, number, number, THREE.EulerOrder] = [-pitch, -yaw, 0, "YXZ"];
  return (
    <group ref={group} name="PriceWall" position={[x, 0, 0]} rotation={[pitch, yaw, 0]}>
      <lineSegments geometry={floor}>
        <lineBasicMaterial color={COLORS.ink} transparent opacity={0.07} depthWrite={false} />
      </lineSegments>
      {others.map((o) => (
        <group key={o.key}>
          <GlowLine points={o.pts} color={o.color} intensity={0.75} width={0.9} opacity={0.15} />
          <mesh position={o.pts[o.pts.length - 1]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshBasicMaterial color={o.color} transparent opacity={0.35} toneMapped={false} />
          </mesh>
        </group>
      ))}
      {wall ? (
        <>
          <mesh geometry={wall.face} renderOrder={1}>
            <meshBasicMaterial vertexColors transparent side={THREE.DoubleSide} depthWrite={false} toneMapped={false} />
          </mesh>
          <lineSegments geometry={wall.ribs} renderOrder={2}>
            <lineBasicMaterial color={wall.color} transparent opacity={0.16} depthWrite={false} toneMapped={false} />
          </lineSegments>
          <GlowLine points={wall.mirror} color={wall.color} intensity={0.7} width={1} opacity={0.16} />
          <GlowLine points={wall.pts} color={wall.color} intensity={1.35} width={compact ? 1.8 : 2.2} />
          <group position={[wall.last.x, wall.last.y, wall.last.z + 0.01]} rotation={face}>
            <AiSpark size={0.062} />
          </group>
          <PriceLabel q={lead!} at={wall.last} compact={compact} />
        </>
      ) : null}
    </group>
  );
}

/** The newest price, with everything that makes it checkable. */
function PriceLabel({ q, at, compact }: { q: HomeQuote; at: THREE.Vector3; compact: boolean }) {
  const { labels } = useStoryFrame();
  const up = q.changePct >= 0;
  const fresh = q.status === "snapshot" ? "Stored values · not live" : `${STATUS_LABEL[q.status]} · ${q.source ?? "provider"} · ${asOfText(q.asOf)}`;
  const dot = q.status === "live" ? "bg-[#00E676]" : q.status === "delayed" ? "bg-[#F6B94A]" : "bg-[#6D7578]";
  return (
    <Html position={[at.x, at.y + (compact ? 0.42 : 0.5), at.z]} center portal={labels as RefObject<HTMLElement>} zIndexRange={[20, 0]} style={{ pointerEvents: "none" }}>
      <div className={`whitespace-nowrap rounded-lg border border-[rgba(255,255,255,0.14)] bg-[rgba(15,18,20,0.88)] font-mono ${compact ? "-translate-x-[34%] px-2 py-1" : "px-3 py-2"}`}>
        <p className={`${compact ? "text-[8.5px]" : "text-[9.5px]"} uppercase tracking-[0.16em] text-[#8A9295]`}>XAU/USD · 1H closes</p>
        <p className="mt-0.5 flex items-baseline gap-2">
          <span className={`font-sans font-semibold tabular-nums text-[#F5F7F7] ${compact ? "text-[13px]" : "text-[17px]"}`}>{fmtPrice(q.last, q.decimals)}</span>
          <span className={`${compact ? "text-[9.5px]" : "text-[11px]"} ${up ? "text-[#00E676]" : "text-[#FF6B6B]"}`}>{signedPct(q.changePct)}</span>
        </p>
        <p className={`mt-0.5 flex items-center gap-1.5 ${compact ? "text-[8px]" : "text-[9px]"} uppercase tracking-[0.12em] text-[#8A9295]`}>
          <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
          {fresh}
        </p>
      </div>
    </Html>
  );
}

