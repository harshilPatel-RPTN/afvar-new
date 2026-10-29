"use client";

// MARKET TERRAIN — the hero film's scene (README: docs/utils/
// AFVAR-Market-Terrain-Green-Red-Black-README.md). A full-bleed landscape of
// solid metal candlesticks: graphite plinths, dark-metal bodies with opaque
// green/red LED inserts, satin wicks, a rolling etched market plane, green
// and red price paths, cluster links and a scanning light. ZERO glass: no
// transmission, no translucent surfaces on the model.
//
// Everything is a pure function of the timeline value `u` (progress ref):
// reverse scroll replays exactly, and in `frozen` mode (implied by `lite`) no
// clock-based motion exists at all. `still` (reduced motion) draws one frame at
// STILL_U; with `lite` nothing invalidates afterwards, so it stays one frame.
//   default export MarketTerrainScene({ progress, active, still, frozen, view, lite, onReady })
//
// `lite` is the live homepage mode: render-on-demand (the owner — HeroLive —
// invalidates only when u changes, so an idle hero costs nothing), frozen (no
// clock motion), no context MSAA (the composer anti-aliases), capped DPR,
// lighter composer MSAA, a smaller environment map and a coarser ground mesh.
// It adapts down (LITE_QUALITY tiers: MSAA off, then DPR 1) if rendered frames
// run slow. Per frame, candle instances re-upload only what actually changed.
import { Environment, Lightformer } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { Bloom, EffectComposer, Vignette } from "@react-three/postprocessing";
import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import type { EffectComposer as EffectComposerImpl } from "postprocessing";
import * as THREE from "three";
import {
  CAMERA_KEYS,
  CAMERA_KEYS_MOBILE,
  COLORS,
  HERO_CANDLE,
  INTRO,
  LITE_QUALITY,
  PATHS,
  REVEAL,
  SCAN,
  SEED,
  STAGES,
  TERRAIN,
  clamp01,
  easeInOut,
  easeOut,
  ramp,
  releaseDim,
  rng,
} from "./marketTerrainConfig";

export interface MarketTerrainSceneProps {
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** No clock-based motion: frames are pure f(u) (always on in `lite`). */
  frozen?: boolean;
  view?: "desktop" | "mobile";
  /** Live homepage mode: on-demand rendering + lighter settings (see header). */
  lite?: boolean;
  /** Called once, after the first frame is on the canvas. */
  onReady?: () => void;
}

/** Reduced motion: one composed frame at the hero establish (poster). */
const STILL_U = 0.2;

type Driven = { progress: RefObject<number>; still: boolean; frozen?: boolean };
const readU = (progress: RefObject<number>, still: boolean) => (still ? STILL_U : clamp01(progress.current ?? 0));

/* ---------------------------------------------------------------- data */

interface Candle {
  lane: number;
  i: number;
  x: number;
  z: number;
  base: number;
  /** Top of the graphite plinth = bottom of the body. */
  lo: number;
  /** Top of the body. */
  hi: number;
  wickTop: number;
  up: boolean;
  /** Empty slot that separates clusters (kept for stable indexing). */
  gap: boolean;
  width: number;
  /** Reveal window start on u. */
  t0: number;
}

/** Deterministic market terrain: per-lane random walk → candle columns. */
function buildTerrain(): Candle[] {
  const rand = rng(SEED);
  const out: Candle[] = [];
  for (let lane = 0; lane < TERRAIN.lanes; lane++) {
    const z = TERRAIN.laneZ0 - lane * TERRAIN.laneGap;
    const amp = TERRAIN.amp(lane);
    // A smooth trending walk per lane, normalised to 0..1.
    let p = 0.5 + (rand() - 0.5) * 0.2;
    const drift = (rand() - 0.45) * 0.03;
    const raw: number[] = [p];
    for (let i = 1; i <= TERRAIN.candlesPerLane; i++) {
      p += drift + (rand() - 0.5) * 0.16;
      raw.push(p);
    }
    const mn = Math.min(...raw);
    const span = Math.max(...raw) - mn || 1;
    const lvl = raw.map((v) => (v - mn) / span);
    for (let i = 0; i < TERRAIN.candlesPerLane; i++) {
      const x = TERRAIN.x0 + i * TERRAIN.pitch + (lane % 2) * TERRAIN.pitch * 0.5;
      const base = TERRAIN.baseY(x, z);
      const o = lvl[i];
      const c = lvl[i + 1];
      const floor = base + 0.22;
      let lo = floor + Math.min(o, c) * amp;
      let hi = floor + Math.max(o, c) * amp;
      const minBody = 0.07 * amp;
      if (hi - lo < minBody) {
        const mid = (hi + lo) / 2;
        lo = mid - minBody / 2;
        hi = mid + minBody / 2;
      }
      let wickTop = hi + (0.05 + rand() * 0.16) * amp;
      const isHero = lane === HERO_CANDLE.lane && i === HERO_CANDLE.index;
      if (isHero) {
        // Beat 2's foreground candle: a clear, tall bullish body + wick.
        lo = floor + 0.32;
        hi = floor + 1.02;
        wickTop = hi + 0.32;
      }
      const t0 = isHero ? REVEAL.hero[0] : REVEAL.start + lane * REVEAL.laneStep + Math.abs(i - HERO_CANDLE.index) * REVEAL.xStep;
      out.push({ lane, i, x, z, base, lo, hi, wickTop, up: isHero ? true : c >= o, gap: !isHero && TERRAIN.gap(lane, i), width: TERRAIN.width(lane), t0 });
    }
  }
  return out;
}

const CANDLES = buildTerrain();
/** Past this u every candle has fully risen: instance matrices are constant. */
const REVEAL_END = CANDLES.reduce((m, cd) => Math.max(m, cd.t0 + revealDur(cd)), 0);
const candleAt = (lane: number, i: number) => CANDLES[lane * TERRAIN.candlesPerLane + i];

/* -------------------------------------------------------------- scene */

export default function MarketTerrainScene({ progress, active, still, frozen = false, view = "desktop", lite = false, onReady }: MarketTerrainSceneProps) {
  const fixed = frozen || lite;
  const tiers = LITE_QUALITY[view];
  const [tier, setTier] = useState(0);
  const q = tiers[tier];
  const composer = useRef<EffectComposerImpl>(null);
  const stepDown = useCallback(() => {
    const next = Math.min(tier + 1, tiers.length - 1);
    // Retune the live composer in place (a prop change would rebuild it and drop a frame).
    if (composer.current) composer.current.multisampling = tiers[next].msaa;
    setTier(next);
  }, [tier, tiers]);
  return (
    <Canvas
      dpr={lite ? [1, q.dpr] : [1, 1.75]}
      frameloop={lite ? "demand" : active && !still ? "always" : "demand"}
      camera={{ position: CAMERA_KEYS[0].pos, fov: 40, near: 0.05, far: 120 }}
      // With a composer the default framebuffer only receives a full-screen copy:
      // context MSAA there is pure fill/memory cost, so lite turns it off.
      gl={{ antialias: !lite, powerPreference: "high-performance" }}
      // No pointer events here, so the canvas never needs its page offset: don't
      // re-measure (and re-render) on every scroll stop.
      resize={lite ? { scroll: false } : undefined}
      aria-hidden="true"
    >
      <color attach="background" args={[COLORS.black]} />
      <fog attach="fog" args={[COLORS.black, 11, 38]} />

      <Lighting progress={progress} still={still} />
      {lite && tier < tiers.length - 1 && <AdaptiveQuality key={tier} onSlow={stepDown} />}
      {onReady && <FirstFrame onReady={onReady} />}
      {/* Neutral studio reflections for the metal — local only, no HDR file. */}
      <Environment resolution={lite ? 128 : 256} frames={1}>
        <Lightformer form="rect" intensity={1.6} position={[0, 8, 4]} rotation-x={Math.PI / 2} scale={[20, 8, 1]} />
        <Lightformer form="rect" intensity={0.9} color="#cfd6da" position={[-10, 3, 6]} rotation-y={Math.PI / 2} scale={[12, 3, 1]} />
        <Lightformer form="rect" intensity={0.55} color={COLORS.green} position={[12, 2, -6]} rotation-y={-Math.PI / 2} scale={[10, 2, 1]} />
        <Lightformer form="rect" intensity={0.45} color={COLORS.red} position={[-12, 2, -14]} rotation-y={Math.PI / 2} scale={[10, 2, 1]} />
      </Environment>

      <CameraRig progress={progress} still={still} frozen={fixed} view={view} />
      <Ground segments={lite ? LITE_QUALITY.groundSegments : 160} />
      <CandleField progress={progress} still={still} />
      <Paths progress={progress} still={still} />

      <EffectComposer ref={composer} multisampling={lite ? tiers[0].msaa : 4}>
        <Bloom mipmapBlur luminanceThreshold={0.9} intensity={0.38} />
        <Vignette darkness={0.48} offset={0.28} />
      </EffectComposer>
    </Canvas>
  );
}

/** Lite mode: watch the interval between back-to-back rendered frames (demand mode
 *  only renders while u moves, so a long gap starts a new burst rather than counting
 *  as slow). If a full window averages slower than LITE_QUALITY.slowFrame, ask the
 *  scene to step down one quality tier. Remounted (keyed) per tier. */
function AdaptiveQuality({ onSlow }: { onSlow: () => void }) {
  const acc = useRef({ n: 0, sum: 0, fired: false });
  useFrame((_, delta) => {
    const a = acc.current;
    if (a.fired) return;
    if (delta <= 0 || delta > LITE_QUALITY.burstGap) {
      a.n = 0;
      a.sum = 0;
      return;
    }
    a.n++;
    a.sum += delta;
    if (a.n < LITE_QUALITY.samples) return;
    if (a.sum / a.n > LITE_QUALITY.slowFrame) {
      a.fired = true;
      onSlow();
    }
    a.n = 0;
    a.sum = 0;
  });
  return null;
}

/** Reports once that a real frame has been drawn (so the poster can hand over). */
function FirstFrame({ onReady }: { onReady: () => void }) {
  const done = useRef(false);
  useFrame(() => {
    if (done.current) return;
    done.current = true;
    requestAnimationFrame(() => onReady());
  });
  return null;
}

/* ----------------------------------------------------------- lighting */

// Broad soft key, neutral fill, green rim on the right/back (rising), red rim
// from the left/back (falling), and the scanning spot. All scale with the
// Chapter F release dim.
function Lighting({ progress, still }: Driven) {
  const key = useRef<THREE.DirectionalLight>(null);
  const fill = useRef<THREE.HemisphereLight>(null);
  const green = useRef<THREE.SpotLight>(null);
  const red = useRef<THREE.SpotLight>(null);
  const scan = useRef<THREE.SpotLight>(null);
  const scanTarget = useMemo(() => new THREE.Object3D(), []);

  useFrame(() => {
    const u = readU(progress, still);
    const dim = releaseDim(u);
    // The metal reads first; colour lighting wakes with the terrain (Beat 3).
    const wake = easeOut(ramp(u, INTRO.signal[0], INTRO.terrain[1]));
    if (key.current) key.current.intensity = (0.22 + 1.4 * wake) * dim;
    if (fill.current) fill.current.intensity = (0.08 + 0.3 * wake) * dim;
    if (green.current) green.current.intensity = 140 * wake * dim;
    if (red.current) red.current.intensity = 110 * wake * dim;
    const s = scanState(u);
    if (scan.current) {
      scan.current.intensity = 260 * s.on * dim;
      scan.current.position.set(s.x, 9, -2);
      scanTarget.position.set(s.x, 0, -9);
    }
  });

  return (
    <group name="LIGHTING">
      <ambientLight intensity={0.06} />
      <hemisphereLight ref={fill} args={["#b9c3c8", COLORS.black, 0.3]} />
      <directionalLight ref={key} position={[-8, 12, 9]} intensity={1.4} color="#eef2f3" />
      <spotLight ref={green} position={[16, 7, -20]} angle={0.6} penumbra={1} distance={60} decay={1.6} color={COLORS.green} intensity={140} />
      <spotLight ref={red} position={[-12, 6, -22]} angle={0.55} penumbra={1} distance={60} decay={1.6} color={COLORS.red} intensity={110} />
      <primitive object={scanTarget} />
      <spotLight ref={scan} target={scanTarget} angle={0.13} penumbra={0.6} distance={40} decay={1.4} color="#dffff0" intensity={0} />
    </group>
  );
}

/** Scanning band: one focal sweep at a time (README §4.3). */
function scanState(u: number) {
  for (const sw of SCAN.sweeps) {
    if (u >= sw.at[0] && u <= sw.at[1]) {
      const k = easeInOut(ramp(u, sw.at[0], sw.at[1]));
      // Fade in/out at the ends of the sweep.
      const on = Math.sin(Math.PI * ramp(u, sw.at[0], sw.at[1]));
      return { x: THREE.MathUtils.lerp(sw.x[0], sw.x[1], k), on };
    }
  }
  return { x: -100, on: 0 };
}

/* --------------------------------------------------------------- camera */

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();

function CameraRig({ progress, still, frozen, view }: Driven & { view: "desktop" | "mobile" }) {
  const KEYS = view === "mobile" ? CAMERA_KEYS_MOBILE : CAMERA_KEYS;
  useFrame((s) => {
    const u = readU(progress, still);
    let i = 0;
    while (i < KEYS.length - 2 && u > KEYS[i + 1].at) i++;
    const a = KEYS[i];
    const b = KEYS[i + 1];
    const t = easeInOut(ramp(u, a.at, b.at));
    camPos.set(...(a.pos.map((v, k) => THREE.MathUtils.lerp(v, b.pos[k], t)) as [number, number, number]));
    camLook.set(...(a.look.map((v, k) => THREE.MathUtils.lerp(v, b.look[k], t)) as [number, number, number]));
    if (!still && !frozen) {
      // Barely-there breathing at rest; dies away as the story settles.
      const k = (1 - u) * 0.025;
      camPos.y += Math.sin(s.clock.elapsedTime * 0.35) * k;
    }
    s.camera.position.copy(camPos);
    s.camera.lookAt(camLook);
  });
  return null;
}

/* --------------------------------------------------------------- ground */

/** Rolling graphite market plane with an etched grid; edges dissolve in fog. */
function Ground({ segments }: { segments: number }) {
  const { geo, tex } = useMemo(() => {
    const g = new THREE.PlaneGeometry(160, 160, segments, segments);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position as THREE.BufferAttribute;
    for (let k = 0; k < pos.count; k++) pos.setY(k, TERRAIN.baseY(pos.getX(k), pos.getZ(k)) - 0.01);
    g.computeVertexNormals();

    const c = document.createElement("canvas");
    c.width = c.height = 256;
    const ctx = c.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0a0d0f";
      ctx.fillRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(160,176,182,0.16)";
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, 256, 256);
      ctx.strokeStyle = "rgba(160,176,182,0.06)";
      ctx.lineWidth = 1;
      for (let k = 64; k < 256; k += 64) {
        ctx.beginPath();
        ctx.moveTo(k, 0);
        ctx.lineTo(k, 256);
        ctx.moveTo(0, k);
        ctx.lineTo(256, k);
        ctx.stroke();
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(160 / (TERRAIN.pitch * 4), 160 / (TERRAIN.laneGap * 2));
    t.anisotropy = 8;
    t.colorSpace = THREE.SRGBColorSpace;
    return { geo: g, tex: t };
  }, [segments]);

  return (
    <mesh geometry={geo} name="GRID_AND_TICKS">
      <meshStandardMaterial map={tex} color="#1f2427" metalness={0.12} roughness={0.96} envMapIntensity={0.1} />
    </mesh>
  );
}

/* -------------------------------------------------------------- candles */

const M = new THREE.Matrix4();
const Q = new THREE.Quaternion();
const P = new THREE.Vector3();
const S = new THREE.Vector3();
const C = new THREE.Color();
const GREEN = new THREE.Color(COLORS.green);
const RED = new THREE.Color(COLORS.red);
const BODY_GREEN = new THREE.Color(COLORS.graphiteLight).lerp(new THREE.Color(COLORS.greenDeep), 0.22);
const BODY_RED = new THREE.Color(COLORS.graphiteLight).lerp(new THREE.Color("#7a1c1c"), 0.3);

function revealDur(cd: Candle) {
  return cd.lane === HERO_CANDLE.lane && cd.i === HERO_CANDLE.index ? REVEAL.hero[1] - REVEAL.hero[0] : REVEAL.dur;
}

/** Reveal 0..1 for a candle at u (near lanes keep a faint stub before rising). */
function revealOf(cd: Candle, u: number) {
  const k = easeOut(ramp(u, cd.t0, cd.t0 + revealDur(cd)));
  const stub = cd.lane === HERO_CANDLE.lane && cd.i === HERO_CANDLE.index ? 0.14 : 0;
  return Math.max(stub, k);
}

function CandleField({ progress, still }: Driven) {
  const plinths = useRef<THREE.InstancedMesh>(null);
  const bodies = useRef<THREE.InstancedMesh>(null);
  const inserts = useRef<THREE.InstancedMesh>(null);
  const caps = useRef<THREE.InstancedMesh>(null);
  const wicks = useRef<THREE.InstancedMesh>(null);
  /** Last u written, and the last LED-colour inputs (glow, dim, scan) written. */
  const last = useRef({ u: -1, glow: -1, dim: -1, scanOn: -1, scanX: 0, bodies: false });
  const n = CANDLES.length;

  const geos = useMemo(
    () => ({
      box: new THREE.BoxGeometry(1, 1, 1),
      wick: new THREE.CylinderGeometry(1, 1, 1, 10),
    }),
    [],
  );

  useFrame(() => {
    const u = readU(progress, still);
    const prev = last.current;
    if (Math.abs(u - prev.u) < 1e-6) return;
    const pl = plinths.current;
    const bo = bodies.current;
    const ins = inserts.current;
    const wi = wicks.current;
    const cp = caps.current;
    if (!pl || !bo || !ins || !wi || !cp) return;

    const dim = releaseDim(u);
    const glowWake = 0.18 + 0.82 * easeOut(ramp(u, INTRO.signal[1], INTRO.terrain[1]));
    const scan = scanState(u);
    // Once every candle has risen (u ≥ REVEAL_END, i.e. the whole scroll range) the
    // geometry is constant: skip ~2000 matrix composes + ~125 KB of uploads per frame.
    const shape = !(u >= REVEAL_END && prev.u >= REVEAL_END);
    // LED colours only move with the wake, the release dim and the scan band.
    const glow = shape || glowWake !== prev.glow || dim !== prev.dim || scan.on !== prev.scanOn || (scan.on > 0 && scan.x !== prev.scanX);
    prev.u = u;
    if (!shape && !glow) return;
    prev.glow = glowWake;
    prev.dim = dim;
    prev.scanOn = scan.on;
    prev.scanX = scan.x;

    // Body tint is per-candle constant: write it once.
    if (!prev.bodies) {
      for (let k = 0; k < n; k++) bo.setColorAt(k, CANDLES[k].up ? BODY_GREEN : BODY_RED);
      if (bo.instanceColor) bo.instanceColor.needsUpdate = true;
      prev.bodies = true;
    }

    for (let k = 0; k < n; k++) {
      const cd = CANDLES[k];
      const w = cd.width;
      const r = cd.gap ? 0 : revealOf(cd, u);
      if (r <= 0.001) {
        if (!shape) continue;
        M.makeScale(0, 0, 0);
        pl.setMatrixAt(k, M);
        bo.setMatrixAt(k, M);
        ins.setMatrixAt(k, M);
        cp.setMatrixAt(k, M);
        wi.setMatrixAt(k, M);
        continue;
      }
      const scanBoost = scan.on * Math.exp(-((cd.x - scan.x) ** 2) / (SCAN.band * SCAN.band));
      // Unrisen stubs stay dark metal — the LEDs only wake once a candle stands.
      const intensity = (glowWake * (cd.lane > 7 ? 0.55 : 0.85) + 1.6 * scanBoost) * dim * (r > 0.08 ? 1 : 0);
      C.copy(cd.up ? GREEN : RED).multiplyScalar(intensity);
      // Opaque LED insert on the camera-facing (+z) face of the body.
      ins.setColorAt(k, C);
      // Opaque LED cap on the top face so the state reads from high angles.
      cp.setColorAt(k, C.multiplyScalar(0.7));
      if (!shape) continue;

      const h = (y: number) => cd.base + (y - cd.base) * r;
      // Graphite plinth: base → lo.
      const pH = Math.max(0.0001, h(cd.lo) - cd.base);
      M.compose(P.set(cd.x, cd.base + pH / 2, cd.z), Q, S.set(w * 0.74, pH, w * 0.74));
      pl.setMatrixAt(k, M);
      // Dark-metal body: lo → hi.
      const bH = Math.max(0.0001, h(cd.hi) - h(cd.lo));
      const bY = h(cd.lo) + bH / 2;
      M.compose(P.set(cd.x, bY, cd.z), Q, S.set(w, bH, w));
      bo.setMatrixAt(k, M);
      M.compose(P.set(cd.x, bY, cd.z + w / 2 + 0.006), Q, S.set(w * 0.56, bH * 0.86, 0.012));
      ins.setMatrixAt(k, M);
      M.compose(P.set(cd.x, h(cd.hi) + 0.004, cd.z), Q, S.set(w * 0.62, 0.008, w * 0.62));
      cp.setMatrixAt(k, M);
      // Satin wick: hi → wickTop (physically sits on the body).
      const wH = Math.max(0.0001, (h(cd.wickTop) - h(cd.hi)) * (r > 0.5 ? 1 : r * 2));
      M.compose(P.set(cd.x, h(cd.hi) + wH / 2, cd.z), Q, S.set(0.022, wH, 0.022));
      wi.setMatrixAt(k, M);
    }
    if (shape) {
      pl.instanceMatrix.needsUpdate = true;
      bo.instanceMatrix.needsUpdate = true;
      ins.instanceMatrix.needsUpdate = true;
      wi.instanceMatrix.needsUpdate = true;
      cp.instanceMatrix.needsUpdate = true;
    }
    if (cp.instanceColor) cp.instanceColor.needsUpdate = true;
    if (ins.instanceColor) ins.instanceColor.needsUpdate = true;
  });

  return (
    <group name="CANDLESTICKS">
      <instancedMesh ref={plinths} args={[geos.box, undefined, n]} frustumCulled={false}>
        <meshStandardMaterial color={COLORS.graphite} metalness={0.72} roughness={0.52} envMapIntensity={0.7} />
      </instancedMesh>
      <instancedMesh ref={bodies} args={[geos.box, undefined, n]} frustumCulled={false}>
        <meshStandardMaterial color="#ffffff" metalness={0.82} roughness={0.32} envMapIntensity={1.0} />
      </instancedMesh>
      <instancedMesh ref={inserts} args={[geos.box, undefined, n]} frustumCulled={false}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={caps} args={[geos.box, undefined, n]} frustumCulled={false}>
        <meshBasicMaterial color="#ffffff" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={wicks} args={[geos.wick, undefined, n]} frustumCulled={false}>
        <meshStandardMaterial color={COLORS.steel} metalness={0.9} roughness={0.3} />
      </instancedMesh>
    </group>
  );
}

/* ---------------------------------------------------------------- paths */

/** Curve over the candle tops of one lane. */
function laneCurve(lane: number, from: number, to: number, lift: number) {
  const pts: THREE.Vector3[] = [];
  for (let i = from; i <= to; i += 2) {
    const cd = candleAt(lane, i);
    pts.push(new THREE.Vector3(cd.x, cd.wickTop + lift, cd.z + 0.05));
  }
  return new THREE.CatmullRomCurve3(pts, false, "catmullrom", 0.4);
}

/** Arc between two cluster tops (Chapter D connections). */
function linkCurve(a: readonly number[], b: readonly number[]) {
  const A = candleAt(a[0], a[1]);
  const B = candleAt(b[0], b[1]);
  const p0 = new THREE.Vector3(A.x, A.wickTop + 0.2, A.z);
  const p2 = new THREE.Vector3(B.x, B.wickTop + 0.2, B.z);
  const p1 = p0.clone().lerp(p2, 0.5);
  p1.y = Math.max(p0.y, p2.y) + 1.6;
  return new THREE.QuadraticBezierCurve3(p0, p1, p2);
}

const setDraw = (mesh: THREE.Mesh | null, f: number) => {
  const g = mesh?.geometry;
  if (!mesh || !g?.index) return;
  const c = Math.floor((g.index.count * clamp01(f)) / 3) * 3;
  g.setDrawRange(0, c);
  mesh.visible = c > 0;
};

function Paths({ progress, still }: Driven) {
  const green = useRef<THREE.Mesh>(null);
  const red = useRef<THREE.Mesh>(null);
  const links = useRef<(THREE.Mesh | null)[]>([]);
  const matG = useRef<THREE.MeshBasicMaterial>(null);
  const matR = useRef<THREE.MeshBasicMaterial>(null);
  const linkMats = useRef<(THREE.MeshBasicMaterial | null)[]>([]);

  const geo = useMemo(() => {
    const tube = (curve: THREE.Curve<THREE.Vector3>, segs: number, r: number) => new THREE.TubeGeometry(curve, segs, r, 8, false);
    return {
      green: tube(laneCurve(PATHS.green.lane, PATHS.green.from, PATHS.green.to, PATHS.green.lift), 260, 0.028),
      red: tube(laneCurve(PATHS.red.lane, PATHS.red.from, PATHS.red.to, PATHS.red.lift), 240, 0.026),
      links: PATHS.links.map((l) => tube(linkCurve(l.a, l.b), 90, 0.02)),
    };
  }, []);

  useFrame(() => {
    const u = readU(progress, still);
    const dim = releaseDim(u);
    setDraw(green.current, easeOut(ramp(u, PATHS.green.draw[0], PATHS.green.draw[1])));
    setDraw(red.current, easeOut(ramp(u, PATHS.red.draw[0], PATHS.red.draw[1])));
    PATHS.links.forEach((l, k) => setDraw(links.current[k], easeInOut(ramp(u, l.draw[0], l.draw[1]))));
    // Restrained emission (README §4.4): bright enough on black, never a cloud.
    if (matG.current) matG.current.color.copy(GREEN).multiplyScalar(1.15 * dim);
    if (matR.current) matR.current.color.copy(RED).multiplyScalar(1.05 * dim);
    linkMats.current.forEach((m, k) => m?.color.copy(PATHS.links[k].color === "green" ? GREEN : RED).multiplyScalar(0.95 * dim));
  });

  return (
    <group name="PRICE_PATHS">
      <mesh ref={green} geometry={geo.green} visible={false}>
        <meshBasicMaterial ref={matG} color={COLORS.green} toneMapped={false} />
      </mesh>
      <mesh ref={red} geometry={geo.red} visible={false}>
        <meshBasicMaterial ref={matR} color={COLORS.red} toneMapped={false} />
      </mesh>
      {geo.links.map((g, k) => (
        <mesh key={k} ref={(el) => void (links.current[k] = el)} geometry={g} visible={false}>
          <meshBasicMaterial ref={(el) => void (linkMats.current[k] = el)} color="#ffffff" toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

/** Chapter windows are referenced for documentation/tuning (README §6). */
export const TERRAIN_STAGES = STAGES;
