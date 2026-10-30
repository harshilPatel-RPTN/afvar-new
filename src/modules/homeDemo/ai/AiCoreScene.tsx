"use client";

// The home film's WebGL stage. The AI core persists from the first frame to
// the last; around it the seven cores open, receive labelled data packets
// from five sources, reason in turn (each lighting up as it speaks), ride the
// 24-hour ring, listen, fold away while the OS is on screen, and escort
// requests through the policy gate. Every transform is a pure function of
// (damped progress, clock), so scrolling back replays cleanly.
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import {
  AiCore,
  AvatarActor,
  COLORS,
  CoreCanvas,
  SceneLabel,
  easeInOut,
  easeOut,
  ramp,
  useStoryFrame,
  window4,
  type AvatarFrame,
  type CoreDrive,
  type Window4,
} from "@/modules/afvarOs";
import { playCue } from "../audio";
import { MachinedArc } from "../MachinedArc";
import { AVATAR, GATE, ORBIT, RING, SATELLITES, SOURCES, THINK, THINK_OUT, columnPos, type ActId, type Film, type Layout } from "./aiConfig";

export interface AiCoreSceneProps {
  film: Film;
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  /** Portrait framing (phones, tablets upright). */
  portrait: boolean;
  /** Lighter scene for small / mobile GPUs. */
  lite: boolean;
  /** The avatar is on stage here (false while the OS overlay owns it). */
  avatarHere: boolean;
  /** Real price chips for the price source, e.g. "XAU/USD 4,012.10 ▼0.41%". */
  priceTexts: readonly string[];
}

const FilmCtx = createContext<{ film: Film; lite: boolean; portrait: boolean } | null>(null);
function useFilm() {
  const ctx = useContext(FilmCtx);
  if (!ctx) throw new Error("useFilm outside AiCoreScene");
  return ctx;
}
const win = (film: Film, id: ActId, w: Window4): Window4 => [film.at(id, w[0]), film.at(id, w[1]), film.at(id, w[2]), film.at(id, w[3])];

export default function AiCoreScene({ film, progress, active, still, portrait, lite, avatarHere, priceTexts }: AiCoreSceneProps) {
  const ctx = useMemo(() => ({ film, lite, portrait }), [film, lite, portrait]);
  const drive = useMemo(() => makeCoreDrive(film), [film]);
  return (
    <CoreCanvas
      progress={progress}
      active={active}
      still={still}
      settledP={film.settledP}
      camera={portrait ? film.cameraPortrait : film.camera}
      fov={portrait ? 50 : 38}
      parallax={portrait ? 0.04 : 0.12}
      bloom={lite ? 0.55 : 0.75}
      dpr={lite ? [1, 1.4] : [1, 1.75]}
      cues={film.sound}
      onCue={playCue}
    >
      <FilmCtx.Provider value={ctx}>
        <AiCore drive={drive} />
        <Satellites />
        <Near acts={["stream"]}>
          <Streams priceTexts={priceTexts} />
        </Near>
        <Reasoning />
        <Near acts={["always"]}>
          <ClockRing />
        </Near>
        <Near acts={["trust"]}>
          <PolicyGate />
        </Near>
        {avatarHere ? <SceneAvatar /> : null}
      </FilmCtx.Provider>
    </CoreCanvas>
  );
}

function makeCoreDrive(film: Film) {
  const out: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
  const A = (f: number) => film.at("avatar", f);
  return (p: number): CoreDrive => {
    const stream = film.weight(p, "stream");
    const think = film.weight(p, "think");
    const verdict = window4(p, [film.at("think", THINK_OUT - 0.04), film.at("think", THINK_OUT), film.at("think", 0.92), film.at("think", 1)]);
    // The core becomes the avatar's heart: it shrinks inside the assembling body and returns for trust.
    const inside = easeInOut(ramp(p, A(0.18), A(0.32))) * (1 - easeOut(ramp(p, film.at("trust", 0.0), film.at("trust", 0.15))));
    out.glow = 0.95 + 0.35 * stream + 0.3 * think + 0.6 * verdict + 0.35 * ramp(p, film.at("finale", 0.3), film.at("finale", 0.9));
    out.think = Math.max(think, window4(p, [A(0.56), A(0.6), A(0.64), A(0.68)]));
    out.scale = Math.max(0.0001, 1 - inside);
    out.sparks = 1 - inside;
    return out;
  };
}

/* --------------------------------------------------------- mount gating */

/**
 * Mount a part of the scene only while the film is near its acts. Each mounted
 * label is its own React root, so far-away acts stay unmounted until needed.
 */
function useNear(acts: ActId[], margin = 0.04): boolean {
  const { film } = useFilm();
  const { smoothed } = useStoryFrame();
  const present = acts.filter((a) => film.has(a));
  const lo = present.length ? Math.min(...present.map((a) => film.story.range[a][0])) - margin : 2;
  const hi = present.length ? Math.max(...present.map((a) => film.story.range[a][1])) + margin : -1;
  const [near, setNear] = useState(() => {
    const p = smoothed.current ?? 0;
    return p >= lo && p <= hi;
  });
  useFrame(() => {
    const p = smoothed.current ?? 0;
    const n = p >= lo && p <= hi;
    if (n !== near) setNear(n);
  });
  return near;
}

function Near({ acts, margin, children }: { acts: ActId[]; margin?: number; children: ReactNode }) {
  return useNear(acts, margin) ? <>{children}</> : null;
}

/* ----------------------------------------------------------- the avatar */

function SceneAvatar() {
  const { film, portrait, lite } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const track = useMemo(() => makeAvatarTrack(film, portrait), [film, portrait]);
  return <AvatarActor track={track} getP={() => smoothed.current ?? 0} still={still} quality={lite ? "performance" : "balanced"} />;
}

function makeAvatarTrack(film: Film, portrait: boolean) {
  const A = (f: number) => film.at("avatar", f);
  const actEnd = film.has("os") ? film.at("os", 0.06) : film.at("trust", 0.04);
  const fin = (f: number) => film.at("finale", f);
  const P = AVATAR.place;
  return (p: number, _t: number, out: AvatarFrame): AvatarFrame => {
    const inAct = p >= A(AVATAR.assemble[0]) && p < actEnd;
    const inFinale = p >= fin(0.12);
    out.visible = inAct || inFinale;
    if (!out.visible) return out;
    out.talk = 0;
    out.turn = portrait ? 0 : 0.18;
    out.lean = 0;
    out.z = 0;
    if (inFinale) {
      const k = easeOut(ramp(p, fin(0.12), fin(0.45)));
      out.x = portrait ? 1.05 : 1.45;
      out.y = -1.05;
      out.scale = 0.42 * Math.max(0.001, k);
      out.explode = 1 - k;
      out.gesture = "wave";
      out.emotion = "happy";
      out.aura = "idle";
      out.turn = portrait ? -0.15 : -0.25;
      return out;
    }
    const grow = easeOut(ramp(p, A(0.08), A(0.16)));
    out.x = P.x;
    out.y = P.y;
    out.scale = P.scale * Math.max(0.001, grow);
    out.explode = 1 - easeInOut(ramp(p, A(0.1), A(AVATAR.assemble[1])));
    if (p < A(AVATAR.wave[0])) {
      out.gesture = "idle";
      out.emotion = "curious";
      out.aura = "connecting";
    } else if (p < A(AVATAR.listen[0])) {
      out.gesture = "wave";
      out.emotion = "happy";
      out.aura = "idle";
    } else if (p < A(AVATAR.think[0])) {
      out.gesture = "listen";
      out.emotion = "focused";
      out.aura = "listening";
    } else if (p < A(AVATAR.answer[0])) {
      out.gesture = "think";
      out.emotion = "thinking";
      out.aura = "thinking";
    } else if (p < A(AVATAR.answer[1])) {
      out.gesture = "explain";
      out.emotion = "confident";
      out.aura = "speaking";
      out.talk = 1;
    } else {
      out.gesture = "acknowledge";
      out.emotion = "happy";
      out.aura = "idle";
    }
    return out;
  };
}

/* ------------------------------------------------------- seven satellites */

/** Live satellite positions, written by <Satellites/> before anyone reads them. */
const satPos = SATELLITES.map(() => new THREE.Vector3());
const scratchA = new THREE.Vector3();
const scratchB = new THREE.Vector3();

function place(layout: Layout, i: number, t: number, out: THREE.Vector3) {
  const n = SATELLITES.length;
  switch (layout) {
    case "inside":
      return out.set(0, 0, 0);
    case "orbit":
    case "tight": {
      const r = layout === "tight" ? ORBIT.tight : ORBIT.radius;
      const a = (i / n) * Math.PI * 2 + t * ORBIT.speed;
      return out.set(Math.cos(a) * r, Math.sin(a) * r * ORBIT.tilt, Math.sin(a) * r * 0.9);
    }
    case "column": {
      const c = columnPos(i);
      return out.set(c[0], c[1], c[2]);
    }
    case "ring": {
      const a = Math.PI / 2 - (i / n) * Math.PI * 2;
      return out.set(Math.cos(a) * RING.radius, Math.sin(a) * RING.radius, 0);
    }
  }
}

/** Index of the core speaking in the think act, or −1. */
function speakingCore(film: Film, p: number): number {
  if (p < film.at("think", THINK[0].at) || p > film.at("think", THINK_OUT)) return -1;
  let k = 0;
  for (let i = 0; i < THINK.length; i++) if (p >= film.at("think", THINK[i].at)) k = i;
  return THINK[k].core;
}

function Satellites() {
  const { film, portrait } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const nodes = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    const seg = film.plan.find((x) => p >= x.a && p < x.b) ?? film.plan[film.plan.length - 1];
    const k = easeInOut(ramp(p, seg.a, seg.b));
    const speaking = speakingCore(film, p);
    const quiet = 1 - 0.35 * film.weight(p, "trust") - 0.2 * film.weight(p, "avatar");
    nodes.current.forEach((g, i) => {
      place(seg.from, i, t, scratchA);
      place(seg.to, i, t, scratchB);
      satPos[i].copy(scratchA.lerp(scratchB, seg.from === seg.to ? 0 : k));
      if (!g) return;
      g.position.copy(satPos[i]);
      const born = easeOut(ramp(p, film.at("cores", 0.1) + i * 0.002, film.at("cores", 0.3) + i * 0.002));
      const merged = 1 - easeOut(ramp(p, film.at("avatar", 0.0), film.at("avatar", 0.1))) * (1 - ramp(p, film.at("trust", 0.0), film.at("trust", 0.15)));
      const back = 1 - easeOut(ramp(p, film.at("finale", 0.15), film.at("finale", 0.6)));
      const pop = speaking === i ? 1.55 : 1;
      const size = born * merged * back * quiet * pop;
      g.scale.setScalar(Math.max(0.0001, size));
      g.visible = size > 0.002;
      const m = mats.current[i];
      if (m) m.emissiveIntensity = speaking === i ? 3.2 : speaking >= 0 ? 0.7 : 1.4;
    });
  }, -4);

  const labelsNear = useNear(["cores", "stream", "think"]);
  const labelShow = (p: number) =>
    Math.max(
      window4(p, [film.at("cores", 0.3), film.at("cores", 0.42), film.at("cores", 0.9), film.at("cores", 1)]),
      // in the pipeline only once the cores have settled into their column; on portrait
      // screens and the phone cut the think card (which names every core) sits under the column, so they go first
      ramp(p, film.at("stream", 0.2), film.at("stream", 0.26)) *
        (1 - (portrait || film.kind === "compact" ? ramp(p, film.at("think", 0.0), film.at("think", 0.08)) : ramp(p, film.at("think", 0.9), film.at("think", 1)))),
    );

  return (
    <group name="Satellites">
      {SATELLITES.map((sat, i) => (
        <group key={sat.id} ref={(el) => void (nodes.current[i] = el)} visible={false}>
          <mesh>
            <sphereGeometry args={[ORBIT.size, 28, 28]} />
            <meshStandardMaterial
              ref={(el) => void (mats.current[i] = el)}
              color={COLORS.goldDeep}
              emissive={sat.id === "verify" ? COLORS.goldHot : COLORS.gold}
              emissiveIntensity={1.4}
              roughness={0.3}
              toneMapped={false}
            />
          </mesh>
          <mesh>
            <torusGeometry args={[ORBIT.size * 1.7, 0.006, 8, 48]} />
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.5} toneMapped={false} />
          </mesh>
          {labelsNear ? (
            <SceneLabel position={[0, ORBIT.size + 0.3, 0]} show={labelShow} tone="gold">
              {sat.label}
            </SceneLabel>
          ) : null}
        </group>
      ))}
    </group>
  );
}

/* ---------------------------------------------- data sources → their cores */

/** Five sources; labelled packets travel along each line into the core that reads them. */
function Streams({ priceTexts }: { priceTexts: readonly string[] }) {
  const { film, lite } = useFilm();
  const { labels } = useStoryFrame();
  const CHIPS = lite ? 2 : 3;
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const chips = useRef<(THREE.Group | null)[]>([]);
  const chipEls = useRef<(HTMLDivElement | null)[]>([]);
  const lastText = useRef<number[]>(SOURCES.flatMap(() => Array(CHIPS).fill(-1)));
  const priceRef = useRef(priceTexts);
  useEffect(() => {
    priceRef.current = priceTexts;
  }, [priceTexts]);
  const origins = useMemo(() => SOURCES.map((src) => new THREE.Vector3(...src.pos)), []);
  const lines = useMemo(
    () =>
      SOURCES.map(() => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array(6), 3));
        return g;
      }),
    [],
  );
  const lineMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "stream", 0.1) * ramp(p, film.at("stream", 0.18), film.at("stream", 0.25));
    if (group.current) group.current.visible = w > 0.002;
    if (w <= 0.002) {
      // Html chips live in the DOM: a hidden group does not hide them.
      chipEls.current.forEach((el) => {
        if (el && el.style.opacity !== "0") el.style.opacity = "0";
      });
      return;
    }
    const t = still ? 1.3 : s.clock.elapsedTime;

    SOURCES.forEach((src, j) => {
      const target = satPos[src.core];
      const attr = lines[j].getAttribute("position") as THREE.BufferAttribute;
      attr.setXYZ(0, origins[j].x, origins[j].y, origins[j].z);
      attr.setXYZ(1, target.x, target.y, target.z);
      attr.needsUpdate = true;
      lines[j].computeBoundingSphere();
      const lm = lineMats.current[j];
      if (lm) lm.opacity = 0.42 * w;

      const texts = src.id === "price" ? priceRef.current : src.samples;
      for (let k = 0; k < CHIPS; k++) {
        const idx = j * CHIPS + k;
        const g = chips.current[idx];
        const el = chipEls.current[idx];
        if (!g || !el) continue;
        const speed = 0.16 + j * 0.012;
        const phase = t * speed + k / CHIPS + j * 0.13;
        const u = phase % 1;
        g.position.copy(origins[j]).lerp(target, easeInOut(u));
        const edge = ramp(u, 0, 0.12) * (1 - ramp(u, 0.82, 0.97));
        el.style.opacity = String(edge * w);
        const lap = Math.floor(phase) + k;
        const ti = texts.length ? ((lap % texts.length) + texts.length) % texts.length : -1;
        if (ti !== lastText.current[idx]) {
          lastText.current[idx] = ti;
          el.textContent = ti >= 0 ? texts[ti] : "";
        }
      }
    });
  });

  const showSources = (p: number) => film.weight(p, "stream", 0.1) * ramp(p, film.at("stream", 0.18), film.at("stream", 0.25));
  return (
    <group ref={group} name="Streams" visible={false}>
      {SOURCES.map((src, j) => (
        <group key={src.id}>
          <lineSegments geometry={lines[j]}>
            <lineBasicMaterial ref={(el) => void (lineMats.current[j] = el)} color={src.id === "price" ? COLORS.up : COLORS.gold} transparent opacity={0} toneMapped={false} />
          </lineSegments>
          <mesh position={[...src.pos]}>
            <sphereGeometry args={[0.07, 16, 16]} />
            <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
          </mesh>
          <SceneLabel position={[src.pos[0] + 0.55, src.pos[1] + 0.3, src.pos[2]]} show={showSources} tone="neutral">
            {src.label}
          </SceneLabel>
          {Array.from({ length: CHIPS }, (_, k) => {
            const idx = j * CHIPS + k;
            return (
              <group key={k} ref={(el) => void (chips.current[idx] = el)}>
                <Html center portal={labels as RefObject<HTMLElement>} zIndexRange={[18, 0]} style={{ pointerEvents: "none" }}>
                  <div
                    ref={(el) => void (chipEls.current[idx] = el)}
                    style={{ opacity: 0 }}
                    className={`whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10.5px] tracking-[0.04em] ${
                      src.id === "price" ? "border-[rgba(0,230,118,0.45)] bg-[#07130D] text-[#C9F5DD]" : "border-[rgba(233,180,76,0.4)] bg-[#141006] text-[#F3DFAF]"
                    }`}
                  />
                </Html>
              </group>
            );
          })}
        </group>
      ))}
    </group>
  );
}

/* --------------------------------------------- cores → the core (pulses) */

const PULSES_PER = 3;

/** Gold pulses from every core into the centre while it streams and thinks; the speaking core burns brightest. */
function Reasoning() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const mesh = useRef<THREE.InstancedMesh>(null);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const pos = useMemo(() => new THREE.Vector3(), []);
  const gold = useMemo(() => new THREE.Color(COLORS.gold), []);
  const hot = useMemo(() => new THREE.Color(COLORS.goldHot), []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = Math.max(film.weight(p, "stream") * 0.55, film.weight(p, "think"));
    const im = mesh.current;
    if (!im) return;
    im.visible = w > 0.002;
    if (!im.visible) return;
    const t = still ? 0.6 : s.clock.elapsedTime;
    const speaking = speakingCore(film, p);
    let n = 0;
    for (let i = 0; i < SATELLITES.length; i++) {
      for (let k = 0; k < PULSES_PER; k++) {
        const u = (t * 0.55 + k / PULSES_PER + i * 0.17) % 1;
        pos.copy(satPos[i]).multiplyScalar(1 - easeInOut(u));
        const on = speaking === i;
        const size = (on ? 0.06 : 0.035) * w * (1 - u * 0.5);
        m4.makeScale(size, size, size).setPosition(pos);
        im.setMatrixAt(n, m4);
        im.setColorAt(n, col.copy(on ? hot : gold).multiplyScalar(on ? 3 : speaking >= 0 ? 0.6 : 1.4));
        n++;
      }
    }
    im.instanceMatrix.needsUpdate = true;
    if (im.instanceColor) im.instanceColor.needsUpdate = true;
  });

  return (
    <instancedMesh ref={mesh} args={[undefined, undefined, SATELLITES.length * PULSES_PER]} visible={false}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial toneMapped={false} />
    </instancedMesh>
  );
}

/* --------------------------------------------------------- 24-hour ring */

const SESSIONS = [
  { name: "Sydney", from: 22, to: 7 },
  { name: "Tokyo", from: 0, to: 9 },
  { name: "London", from: 8, to: 17 },
  { name: "New York", from: 13, to: 22 },
] as const;
const hourAngle = (h: number) => Math.PI / 2 - (h / 24) * Math.PI * 2;

function ClockRing() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const hand = useRef<THREE.Group>(null);
  const arcs = useMemo(
    () =>
      SESSIONS.map((sess, i) => {
        const len = (sess.to - sess.from + 24) % 24;
        return { span: (len / 24) * Math.PI * 2, start: hourAngle(sess.to), r: RING.radius + 0.16 + i * 0.09, name: sess.name, mid: hourAngle((sess.from + len / 2) % 24) };
      }),
    [],
  );

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "always");
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.85 + 0.15 * w);
    }
    const day = ramp(p, film.at("always", 0.15), film.at("always", 0.95)) * Math.PI * 2 + (still ? 0 : s.clock.elapsedTime * 0.05);
    if (hand.current) hand.current.rotation.z = -day;
  });

  const labelWindow = win(film, "always", [0.25, 0.35, 0.85, 0.95]);
  return (
    <group ref={group} name="ClockRing" visible={false}>
      <mesh>
        <torusGeometry args={[RING.radius, RING.tube, 8, 200]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.7} toneMapped={false} />
      </mesh>
      {Array.from({ length: 24 }, (_, h) => {
        const a = hourAngle(h);
        const len = h % 6 === 0 ? 0.22 : 0.1;
        return (
          <mesh key={h} position={[Math.cos(a) * (RING.radius - len / 2), Math.sin(a) * (RING.radius - len / 2), 0]} rotation={[0, 0, a]}>
            <boxGeometry args={[len, 0.012, 0.012]} />
            <meshBasicMaterial color={h % 6 === 0 ? COLORS.goldHot : "#6D7578"} toneMapped={false} />
          </mesh>
        );
      })}
      {arcs.map((a, i) => (
        <mesh key={a.name} rotation={[0, 0, a.start]}>
          <torusGeometry args={[a.r, 0.035, 8, 120, a.span]} />
          <meshBasicMaterial color={["#2E6B52", "#3E8E6B", "#00B862", COLORS.up][i]} transparent opacity={0.85} toneMapped={false} />
        </mesh>
      ))}
      {arcs.map((a) => (
        <SceneLabel key={`l-${a.name}`} position={[Math.cos(a.mid) * (a.r + 0.45), Math.sin(a.mid) * (a.r + 0.45), 0]} show={labelWindow}>
          {a.name}
        </SceneLabel>
      ))}
      {["00", "06", "12", "18"].map((h, i) => {
        const a = hourAngle(i * 6);
        return (
          <SceneLabel key={h} position={[Math.cos(a) * (RING.radius - 0.42), Math.sin(a) * (RING.radius - 0.42), 0]} show={labelWindow}>
            {h}:00
          </SceneLabel>
        );
      })}
      <group ref={hand}>
        <mesh position={[0, (RING.radius + 0.6) / 2, 0]}>
          <boxGeometry args={[0.018, RING.radius - 0.4, 0.018]} />
          <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
        </mesh>
      </group>
      <SceneLabel position={[0, RING.radius + 0.95, 0]} show={labelWindow} tone="gold">
        Crypto · 24/7/365
      </SceneLabel>
    </group>
  );
}

/* --------------------------------------------------------- policy gate */

function PolicyGate() {
  const { film } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const packets = useRef<(THREE.Mesh | null)[]>([]);
  const refused = useRef<THREE.Mesh>(null);
  const PASS = 5;

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "trust");
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.6 + 0.4 * w);
    }
    if (w <= 0.002) return;
    const t = still ? 0.4 : s.clock.elapsedTime;
    packets.current.forEach((m, i) => {
      if (!m) return;
      const u = (t * 0.28 + i / PASS) % 1;
      m.position.set(0.9 + u * 4.4, Math.sin(i * 1.7) * 0.35, Math.cos(i * 2.3) * 0.3);
      m.scale.setScalar(0.07 * w * (u < 0.92 ? 1 : (1 - u) / 0.08));
    });
    if (refused.current) {
      const u = ramp(p, film.at("trust", 0.3), film.at("trust", 0.45));
      const fade = 1 - ramp(p, film.at("trust", 0.75), film.at("trust", 0.88));
      refused.current.position.set(0.9 + u * (GATE.x - 1.25), -0.05, 0);
      const flash = u >= 1 && !still ? 0.6 + 0.4 * Math.abs(Math.sin(t * 6)) : 1;
      refused.current.scale.setScalar(Math.max(0.0001, 0.11 * fade * flash * ramp(p, film.at("trust", 0.22), film.at("trust", 0.3))));
    }
  });

  const gateLabel = win(film, "trust", [0.15, 0.25, 0.85, 0.95]);
  const refuseLabel = win(film, "trust", [0.42, 0.48, 0.75, 0.86]);
  return (
    <group ref={group} name="PolicyGate" visible={false}>
      <group position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <MachinedArc radius={GATE.radius} thickness={0.12} />
        <mesh>
          <torusGeometry args={[GATE.radius - 0.1, 0.012, 8, 120]} />
          <meshBasicMaterial color={COLORS.gold} toneMapped={false} />
        </mesh>
      </group>
      <mesh position={[GATE.x, 0, 0]} rotation={[0, Math.PI / 2 - GATE.tilt, 0]}>
        <circleGeometry args={[GATE.radius - 0.08, 48]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.06} toneMapped={false} depthWrite={false} side={THREE.DoubleSide} />
      </mesh>
      {Array.from({ length: PASS }, (_, i) => (
        <mesh key={i} ref={(el) => void (packets.current[i] = el)}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
        </mesh>
      ))}
      <mesh ref={refused}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={COLORS.down} toneMapped={false} />
      </mesh>
      <SceneLabel position={[GATE.x, GATE.radius + 0.35, 0]} show={gateLabel} tone="gold">
        Policy gate
      </SceneLabel>
      <SceneLabel position={[GATE.x - 0.4, -0.55, 0]} show={refuseLabel} tone="down">
        Place trade · refused
      </SceneLabel>
    </group>
  );
}
