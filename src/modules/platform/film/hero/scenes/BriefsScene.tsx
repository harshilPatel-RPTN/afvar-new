"use client";

// Market briefs hero (/market/briefs).
import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { COLORS } from "@/modules/afvarOs";
import { AiSpark, GlassPlate, GlowLine, hdr, useStoryFrame } from "@/modules/afvarOs/gl";
import { Candle, Card, clamp01, draw, ease, Lean, pop, tick, v, type LineHandle } from "../pageHeroKit";

/* Briefs: one glass edition sheet that writes itself, under a day arc that sets its clock.
 *
 * The sheet reads like an edition: a mint headline with the three-edition indicator
 * (morning · evening · weekly), two overview lines, a market block (candles + a key
 * level), then three bullet lines, each ending in a numbered source chip that threads
 * out to a small source tile holding the data point it came from.
 *
 * Above it a sun-arc carries three marks — morning, evening and (ringed) weekly. A bead
 * travels the arc; each time it reaches a mark that mark flares, a beam drops to its
 * dot on the sheet, the indicator switches edition and the sheet re-composes: lines retract and
 * the AI spark writes them back on, chips pop, threads run out to their sources.
 * Still: one settled frame — the morning edition fully written, no motion. */

const ROW_SEGS = 14;
const THREAD_SEGS = 18;
const ARC_SEGS = 72;
/** The day arc: centre, radius and its span (from low-left, over the top, to low-right). */
const ARC_C = [0, 0.3, -0.75] as const;
const ARC_R = 1.8;
const ARC_FROM = (196 / 180) * Math.PI;
const ARC_TO = (-16 / 180) * Math.PI;
/** Where on the arc (0–1) the morning, evening and weekly editions go out. */
const MARKS = [0.2, 0.6, 0.86];
/** One day on the arc, in seconds. */
const PERIOD = 15;
/** The first (morning) edition lands here, so the entrance is itself the first edition. */
const FIRST = 1.8;
const T0 = FIRST - MARKS[0] * PERIOD;
/** How long the old edition takes to retract before the new one writes on. */
const RETRACT = 0.3;

const arcAt = (u: number, out: THREE.Vector3) => {
  const a = ARC_FROM + (ARC_TO - ARC_FROM) * u;
  return out.set(ARC_C[0] + Math.cos(a) * ARC_R, ARC_C[1] + Math.sin(a) * ARC_R, ARC_C[2]);
};
/** A straight row split into segments, so it can draw itself on. */
const row = (x0: number, x1: number, y: number, z = 0.035) => Array.from({ length: ROW_SEGS + 1 }, (_, i) => v(x0 + ((x1 - x0) * i) / ROW_SEGS, y, z));

/** The sheet's text rows, in writing order: headline, two overview lines, then three bullets. */
const ROWS = [
  { x0: -0.66, x1: 0.22, y: 1.0, kind: "head" },
  { x0: -0.8, x1: 0.62, y: 0.7, kind: "body" },
  { x0: -0.8, x1: 0.18, y: 0.57, kind: "body" },
  { x0: -0.7, x1: 0.46, y: -0.5, kind: "bullet" },
  { x0: -0.7, x1: 0.24, y: -0.7, kind: "bullet" },
  { x0: -0.7, x1: 0.52, y: -0.9, kind: "bullet" },
] as const;
/** When (s after an edition lands) each row starts writing, and for how long. */
const ROW_AT = [0.35, 0.75, 0.95, 1.95, 2.3, 2.65];
const ROW_DUR = [0.45, 0.4, 0.3, 0.35, 0.3, 0.35];
const CHIP_X = 0.72;
/** Source tiles to the right of the sheet, one per bullet. */
const SRC = [
  { x: 1.42, y: -0.12, z: 0.32 },
  { x: 1.5, y: -0.66, z: 0.4 },
  { x: 1.42, y: -1.2, z: 0.32 },
];
/** The market block's candles (open, close, high, low — in the block's own units). */
const CANDLES = [
  [0.12, 0.2, 0.25, 0.06],
  [0.2, 0.15, 0.27, 0.1],
  [0.15, 0.27, 0.31, 0.12],
  [0.27, 0.36, 0.4, 0.22],
  [0.36, 0.3, 0.41, 0.25],
  [0.3, 0.42, 0.47, 0.27],
  [0.42, 0.38, 0.5, 0.33],
  [0.38, 0.49, 0.53, 0.35],
] as const;
const LEVEL_Y = 0.44;

const DOT_ON = hdr(COLORS.gold, 1.9);
const DOT_OFF = new THREE.Color("#2F4A3D");

/** Which edition last went out, and how long ago (−1: none yet). */
function edition(t: number) {
  if (t < FIRST) return { ed: 0, since: -1, first: true };
  const c = (t - T0) / PERIOD;
  const n = Math.floor(c);
  const f = c - n;
  for (let j = MARKS.length - 1; j >= 0; j--) {
    if (MARKS[j] <= f) return { ed: j, since: t - (T0 + (n + MARKS[j]) * PERIOD), first: n === 0 && j === 0 };
  }
  return { ed: 2, since: t - (T0 + (n - 1 + MARKS[2]) * PERIOD), first: false };
}

export function BriefsScene() {
  const { still } = useStoryFrame();
  const sheet = useRef<THREE.Group>(null);
  const backs = useRef<(THREE.Group | null)[]>([]);
  const arc = useRef<LineHandle | null>(null);
  const marks = useRef<(THREE.Group | null)[]>([]);
  const bead = useRef<THREE.Mesh>(null);
  const beams = useRef<(LineHandle | null)[]>([]);
  const rows = useRef<(LineHandle | null)[]>([]);
  const bullets = useRef<(THREE.Mesh | null)[]>([]);
  const chips = useRef<(THREE.Group | null)[]>([]);
  const threads = useRef<(LineHandle | null)[]>([]);
  const srcs = useRef<(THREE.Group | null)[]>([]);
  const srcDots = useRef<(THREE.Mesh | null)[]>([]);
  const edDots = useRef<(THREE.Mesh | null)[]>([]);
  const edMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  const panel = useRef<THREE.Group>(null);
  const bars = useRef<(THREE.Group | null)[]>([]);
  const level = useRef<THREE.Group>(null);
  const levelLine = useRef<LineHandle | null>(null);
  const spark = useRef<THREE.Group>(null);

  const arcPts = useMemo(() => Array.from({ length: ARC_SEGS + 1 }, (_, i) => arcAt(i / ARC_SEGS, new THREE.Vector3())), []);
  const markPos = useMemo(() => MARKS.map((u) => arcAt(u, new THREE.Vector3())), []);
  const threadPts = useMemo(
    () =>
      ROWS.slice(3).map((r, i) => {
        const a = v(CHIP_X + 0.07, r.y, 0.04);
        const b = v(SRC[i].x - 0.23, SRC[i].y, SRC[i].z);
        return new THREE.CubicBezierCurve3(a, v(a.x + 0.22, a.y, a.z + 0.05), v(b.x - 0.22, b.y, b.z), b).getPoints(THREAD_SEGS);
      }),
    [],
  );

  useFrame((s, dt) => {
    const t = s.clock.elapsedTime;
    const { ed, since, first } = still ? { ed: 0, since: 99, first: true } : edition(t);
    const pre = since < 0;
    /** A part of the edition writing on: 0 before / while the last edition retracts, then eased in. */
    const k = (at: number, dur: number) => (still ? 1 : pre ? 0 : !first && since < RETRACT ? 1 - since / RETRACT : ease(since, at, dur));

    // The sheet springs in and turns to face; the two older editions slide out behind it.
    if (sheet.current) {
      sheet.current.scale.setScalar(still ? 1 : pop(t, 0.1, 0.9));
      sheet.current.rotation.y = still ? 0 : -0.7 * (1 - ease(t, 0.1, 1.1)) + 0.04 * Math.sin(t * 0.5);
      sheet.current.position.y = still ? 0 : 0.035 * Math.sin(t * 0.7);
    }
    backs.current.forEach((g, i) => {
      if (!g) return;
      const e = still ? 1 : ease(t, 0.45 + i * 0.15, 0.9);
      g.position.set((0.22 + i * 0.2) * e, (0.08 + i * 0.08) * e, -0.25 - i * 0.22);
    });

    // The day arc draws on, its marks pop; the bead runs the arc and each mark flares as it lands.
    draw(arc.current, still ? 1 : ease(t, 0.35, 1.2), ARC_SEGS);
    marks.current.forEach((g, i) => {
      if (!g) return;
      const flare = still || pre || i !== ed ? 0 : Math.exp(-since / 0.6);
      g.scale.setScalar((still ? 1 : pop(t, 0.8 + i * 0.15, 0.6)) * (1 + 0.9 * flare + (i === ed ? 0.25 : 0)));
    });
    const u = still ? MARKS[0] : (((t - T0) / PERIOD) % 1 + 1) % 1;
    if (bead.current) {
      arcAt(u, bead.current.position);
      bead.current.scale.setScalar(still ? 1 : Math.max(0.001, ease(t, 0.9, 0.5)));
    }
    // The beam: from the edition's mark down to its dot on the sheet, flashing as it goes out.
    beams.current.forEach((l, i) => {
      if (l) l.material.opacity = still || pre || i !== ed ? 0 : 0.85 * Math.exp(-since / 0.5) * clamp01(since / 0.08);
    });
    // The edition indicator on the sheet follows the clock.
    edDots.current.forEach((m, i) => {
      if (!m) return;
      const on = i === ed;
      m.scale.setScalar(on ? 1 : 0.6);
      edMats.current[i]?.color.copy(on ? DOT_ON : DOT_OFF);
    });

    // Rows write on in order; the spark rides whichever row is being written.
    let wx = 0.96;
    let wy = 1.3;
    let writing = false;
    ROWS.forEach((r, i) => {
      const kk = k(ROW_AT[i], ROW_DUR[i]);
      draw(rows.current[i], kk, ROW_SEGS);
      if (!writing && kk > 0.01 && kk < 0.99 && (first || since > RETRACT)) {
        wx = r.x0 + (r.x1 - r.x0) * kk;
        wy = r.y + 0.07;
        writing = true;
      }
    });
    if (spark.current) {
      const p = spark.current.position;
      if (still) p.set(0.96, 1.3, 0.12);
      else {
        p.x = THREE.MathUtils.damp(p.x, wx, writing ? 14 : 4, dt);
        p.y = THREE.MathUtils.damp(p.y, wy, writing ? 14 : 4, dt);
        p.z = 0.12;
      }
      spark.current.scale.setScalar(still ? 1 : pop(t, 1.5, 0.6));
    }
    bullets.current.forEach((m, i) => {
      if (m) m.scale.setScalar(Math.max(0.001, k(ROW_AT[3 + i] - 0.1, 0.25)));
    });
    // Each bullet's source chip pops at its line's end; its thread runs out to the source, which lights.
    chips.current.forEach((g, i) => {
      if (!g) return;
      const at = ROW_AT[3 + i] + ROW_DUR[3 + i];
      g.scale.setScalar(still ? 1 : pre || (!first && since < RETRACT) ? Math.max(0.001, k(0, 1)) : pop(since, at, 0.45));
      const th = k(at + 0.15, 0.45);
      draw(threads.current[i], th, THREAD_SEGS);
      const hit = still || pre ? 0 : Math.exp(-Math.max(0, since - at - 0.6) / 0.5) * (since > at + 0.5 ? 1 : 0);
      const sg = srcs.current[i];
      if (sg) {
        sg.scale.setScalar(still ? 1 : pop(t, 0.9 + i * 0.12, 0.7) * (1 + 0.08 * hit));
        sg.position.y = SRC[i].y + (still ? 0 : 0.025 * Math.sin(t * 0.8 + i * 1.7));
      }
      srcDots.current[i]?.scale.setScalar(1 + 1.2 * hit);
    });

    // The market block: candles spring up with the edition, then tick; the key level unrolls and its dashes march.
    if (panel.current) panel.current.scale.setScalar(still ? 1 : pop(t, 0.6, 0.8));
    bars.current.forEach((g, i) => {
      if (!g) return;
      const at = 1.1 + i * 0.06;
      const grow = still ? 1 : pre ? 0.001 : first ? pop(since, at, 0.5) : 1 + 0.18 * Math.max(0, Math.sin(clamp01((since - at) / 0.45) * Math.PI));
      g.visible = still || !pre;
      g.scale.y = Math.max(0.001, grow) * (still ? 1 : 1 + 0.05 * tick(t, i));
    });
    if (level.current) level.current.scale.x = Math.max(0.001, k(1.6, 0.5));
    if (levelLine.current) levelLine.current.material.dashOffset = still ? 0 : -t * 0.2;
  });

  return (
    <group position={[0.55, 0.05, 0]} rotation={[0.1, -0.35, 0]}>
      <Lean>
        {/* The day arc with its three edition marks and the travelling bead. */}
        <GlowLine ref={(l: LineHandle | null) => { arc.current = l; }} points={arcPts} color={COLORS.gold} intensity={0.9} width={1.3} opacity={0.6} />
        {markPos.map((p, i) => (
          <group key={i} ref={(g) => { marks.current[i] = g; }} position={p}>
            <mesh>
              <sphereGeometry args={[0.045, 14, 14]} />
              <meshBasicMaterial color={hdr(COLORS.gold, 1.6)} toneMapped={false} />
            </mesh>
            {i === 2 ? (
              <mesh>
                <torusGeometry args={[0.095, 0.008, 8, 40]} />
                <meshBasicMaterial color={hdr(COLORS.gold, 1.3)} toneMapped={false} />
              </mesh>
            ) : null}
          </group>
        ))}
        <mesh ref={bead} scale={0.001}>
          <sphereGeometry args={[0.03, 12, 12]} />
          <meshBasicMaterial color={hdr(COLORS.goldHot, 2.4)} toneMapped={false} />
        </mesh>
        {markPos.map((p, i) => (
          <GlowLine key={i} ref={(l: LineHandle | null) => { beams.current[i] = l; }} points={[p, v(0.5 + i * 0.14, 1.0, 0.04)]} color={COLORS.gold} intensity={1.4} width={1.2} opacity={0} />
        ))}

        {/* The two earlier editions, behind. */}
        {[0, 1].map((i) => (
          <group key={i} ref={(g) => { backs.current[i] = g; }} position={[0, 0, -0.25 - i * 0.22]}>
            <Card w={1.9} h={2.5} opacity={0.35 - i * 0.1} edge={0.3} />
          </group>
        ))}

        {/* The edition sheet. */}
        <group ref={sheet}>
          <Card w={1.9} h={2.5} gold opacity={0.8}>
            {/* headline: edition dot, title bar, meta line and the morning · evening · weekly indicator */}
            <mesh position={[-0.8, 1.0, 0.04]}>
              <sphereGeometry args={[0.035, 12, 12]} />
              <meshBasicMaterial color={hdr(COLORS.gold, 1.8)} toneMapped={false} />
            </mesh>
            <GlowLine ref={(l: LineHandle | null) => { rows.current[0] = l; }} points={row(ROWS[0].x0, ROWS[0].x1, ROWS[0].y)} color={COLORS.gold} intensity={1.3} width={3.2} />
            <GlowLine points={row(-0.66, -0.12, 0.87)} color="#2F4A3D" width={1} />
            {[0, 1, 2].map((i) => (
              <mesh key={i} ref={(m) => { edDots.current[i] = m; }} position={[0.5 + i * 0.14, 1.0, 0.04]}>
                <sphereGeometry args={[0.032, 12, 12]} />
                <meshBasicMaterial ref={(m) => { edMats.current[i] = m; }} color={DOT_OFF} toneMapped={false} />
              </mesh>
            ))}
            {/* overview */}
            {[1, 2].map((i) => (
              <GlowLine key={i} ref={(l: LineHandle | null) => { rows.current[i] = l; }} points={row(ROWS[i].x0, ROWS[i].x1, ROWS[i].y)} color="#3E5E4E" width={1.3} />
            ))}
            {/* market block: inset glass, candles, the key level */}
            <group ref={panel} position={[0, 0.03, 0.05]}>
              <group rotation={[Math.PI / 2, 0, 0]}>
                <GlassPlate width={1.62} depth={0.74} thickness={0.02} radius={0.05} edge={0.25} edgeColor="#92A399" tint="#040C08" opacity={0.6} />
              </group>
              <group position={[-0.63, -0.3, 0.03]}>
                {CANDLES.map(([o, c, h, l], i) => (
                  <group key={i} ref={(g) => { bars.current[i] = g; }}>
                    <Candle x={i * 0.18} o={o} c={c} h={h} l={l} s={0.065} />
                  </group>
                ))}
                <group position={[-0.1, 0, 0.04]}>
                  <group ref={level}>
                    <GlowLine ref={(l: LineHandle | null) => { levelLine.current = l; }} points={[v(0, LEVEL_Y, 0), v(1.46, LEVEL_Y, 0)]} color={COLORS.gold} intensity={1.3} width={1.3} dashed dashSize={0.06} gapSize={0.04} />
                    <mesh position={[1.46, LEVEL_Y, 0]}>
                      <sphereGeometry args={[0.026, 10, 10]} />
                      <meshBasicMaterial color={hdr(COLORS.gold, 2)} toneMapped={false} />
                    </mesh>
                  </group>
                </group>
              </group>
            </group>
            {/* bullets, each numbered to a source chip */}
            {[0, 1, 2].map((i) => {
              const r = ROWS[3 + i];
              const c = [v(CHIP_X - 0.06, r.y - 0.05, 0.04), v(CHIP_X + 0.06, r.y - 0.05, 0.04), v(CHIP_X + 0.06, r.y + 0.05, 0.04), v(CHIP_X - 0.06, r.y + 0.05, 0.04), v(CHIP_X - 0.06, r.y - 0.05, 0.04)];
              return (
                <group key={i}>
                  <mesh ref={(m) => { bullets.current[i] = m; }} position={[-0.8, r.y, 0.04]}>
                    <sphereGeometry args={[0.022, 10, 10]} />
                    <meshBasicMaterial color={hdr(i === 0 ? COLORS.gold : "#92A399", 1.2)} toneMapped={false} />
                  </mesh>
                  <GlowLine ref={(l: LineHandle | null) => { rows.current[3 + i] = l; }} points={row(r.x0, r.x1, r.y)} color={i === 0 ? COLORS.gold : "#3E5E4E"} intensity={i === 0 ? 1.15 : 1} width={i === 0 ? 1.7 : 1.3} />
                  <group ref={(g) => { chips.current[i] = g; }} position={[CHIP_X, r.y, 0]} scale={0.001}>
                    <group position={[-CHIP_X, -r.y, 0]}>
                      <GlowLine points={c} color={COLORS.gold} intensity={1.2} width={1.2} />
                      <mesh position={[CHIP_X, r.y, 0.04]}>
                        <sphereGeometry args={[0.016, 8, 8]} />
                        <meshBasicMaterial color={hdr(COLORS.gold, 1.8)} toneMapped={false} />
                      </mesh>
                    </group>
                  </group>
                </group>
              );
            })}
            <GlowLine points={row(-0.8, -0.3, -1.1)} color="#22372D" width={1} />
            {/* threads from each chip out to its source */}
            {threadPts.map((pts, i) => (
              <GlowLine key={i} ref={(l: LineHandle | null) => { threads.current[i] = l; }} points={pts} color={COLORS.gold} intensity={1} width={1} opacity={0.7} />
            ))}
            <group ref={spark} position={[0.96, 1.3, 0.12]}>
              <AiSpark size={0.045} />
            </group>
          </Card>
          {/* Source tiles: the data point each bullet was written from. */}
          {SRC.map((p, i) => (
            <group key={i} ref={(g) => { srcs.current[i] = g; }} position={[p.x, p.y, p.z]}>
              <Card w={0.46} h={0.28} opacity={0.75} edge={0.55} />
              <GlowLine points={[v(-0.16, -0.05 + 0.02 * i, 0.035), v(-0.07, 0.02, 0.035), v(0.02, -0.02 - 0.02 * i, 0.035), v(0.12, 0.06 - 0.03 * i, 0.035)]} color="#92A399" intensity={1} width={1.1} />
              <mesh ref={(m) => { srcDots.current[i] = m; }} position={[0.12, 0.06 - 0.03 * i, 0.04]}>
                <sphereGeometry args={[0.02, 10, 10]} />
                <meshBasicMaterial color={hdr(COLORS.gold, 2)} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>

      </Lean>
    </group>
  );
}
