"use client";

// The /platform film's WebGL stage. The same AI core as the home film is on
// screen from the first frame: the five capability apps open around it, it
// rests behind the OS screens, a request travels the six stations around it,
// and the five areas return lit by the cores that lead them. Every transform
// is a pure function of (damped progress, clock), so scrolling back replays.
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  AiCore,
  AppGlyph,
  AvatarActor,
  COLORS,
  CoreNodes,
  CorePulses,
  CoreCanvas,
  NearRange,
  SceneLabel,
  coreIndex,
  easeInOut,
  easeOut,
  orbitPlace,
  ramp,
  useCorePositions,
  useStoryFrame,
  window4,
  type AvatarFrame,
  type CoreDrive,
} from "@/modules/afvarOs";
import { MachinedArc, playCue } from "@/modules/homeDemo/kit";
import { APPS, LOOP, RETURN_AT, STATION_AT, STATIONS, STOP, TILES, areaFocus, stationAngle, stopRows, type OverviewAct, type OverviewFilm } from "./overviewFilm";

export interface OverviewSceneProps {
  film: OverviewFilm;
  progress: RefObject<number>;
  active: boolean;
  still: boolean;
  portrait: boolean;
  lite: boolean;
  /** Compact cut: the avatar speaks in the 3D scene during the stop act. */
  avatarHere: boolean;
}

const Ctx = createContext<{ film: OverviewFilm; portrait: boolean; lite: boolean } | null>(null);
function useFilm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFilm outside OverviewScene");
  return c;
}

export default function OverviewScene({ film, progress, active, still, portrait, lite, avatarHere }: OverviewSceneProps) {
  const ctx = useMemo(() => ({ film, portrait, lite }), [film, portrait, lite]);
  const drive = useMemo(() => makeCoreDrive(film), [film]);
  const near = (id: OverviewAct, m = 0.03) => ({ lo: film.story.range[id][0] - m, hi: film.story.range[id][1] + m });
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
      <Ctx.Provider value={ctx}>
        <AiCore drive={drive} />
        <AppTiles />
        <NearRange {...near("areas", 0.05)}>
          <AreaCores />
        </NearRange>
        <NearRange {...near("verify")}>
          <RequestLoop />
        </NearRange>
        {avatarHere ? (
          <NearRange {...near("stop", 0.04)}>
            <SceneAvatar />
          </NearRange>
        ) : null}
      </Ctx.Provider>
    </CoreCanvas>
  );
}

/* ---------------------------------------------------------------- the core */

function makeCoreDrive(film: OverviewFilm) {
  const out: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
  const V = (f: number) => film.at("verify", f);
  return (p: number): CoreDrive => {
    // While a request is being resolved the core thinks; when it is verified it glows.
    const resolving = window4(p, [V(STATION_AT[2] - 0.04), V(STATION_AT[2]), V(STATION_AT[3] - 0.04), V(STATION_AT[3])]);
    const verified = window4(p, [V(STATION_AT[5] - 0.02), V(STATION_AT[5]), V(0.86), V(0.95)]);
    // Compact cut: the core becomes the avatar's heart while it speaks.
    const inAvatar =
      film.kind === "compact"
        ? easeInOut(ramp(p, film.at("stop", 0.04), film.at("stop", 0.1))) * (1 - easeOut(ramp(p, film.at("stop", 0.92), film.at("stop", 1))))
        : 0;
    const areas = film.weight(p, "areas");
    out.glow = 1 + 0.5 * resolving + 0.7 * verified + 0.25 * areas;
    out.think = Math.max(resolving, 0.4 * film.weight(p, "workspace"));
    out.scale = Math.max(0.0001, 1 - inAvatar);
    out.sparks = 1 - inAvatar;
    return out;
  };
}

/* ------------------------------------------------------ five capability apps */

const ringA = new THREE.Vector3();

/** App i on the tile ring (screen-facing ellipse, slow drift). */
function ringPlace(i: number, t: number, drift: number, out: THREE.Vector3) {
  const a = Math.PI / 2 + (i / APPS.length) * Math.PI * 2 - t * drift;
  return out.set(Math.cos(a) * TILES.radius, Math.sin(a) * TILES.radius * 0.8, -Math.sin(a) * 0.45);
}

function AppTiles() {
  const { film } = useFilm();
  const { smoothed, still, labels } = useStoryFrame();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const mats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const icons = useRef<(HTMLDivElement | null)[]>([]);
  const born = useRef<number | null>(null);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    if (born.current === null) born.current = t;
    // The apps open around the core when the page loads (time-based intro), …
    const intro = still ? 1 : easeOut(Math.min(1, (t - born.current - 0.4) / 1.4));
    // … fold into the core when the OS takes over, and return for the five areas.
    const away = easeInOut(ramp(p, film.at("ways", 0.0), film.at("ways", 0.12)));
    const back = easeOut(ramp(p, film.at("areas", 0.02), film.at("areas", 0.16)));
    const present = intro * (1 - away + away * back);
    const focus = areaFocus(film.story.local(p, "areas"));
    const inAreas = p >= film.at("areas", 0.1);
    groups.current.forEach((g, i) => {
      if (!g) return;
      ringPlace(i, t, inAreas ? 0.025 : 0.07, ringA);
      g.position.copy(ringA).multiplyScalar(present);
      const on = inAreas && focus === i;
      const dim = inAreas && focus >= 0 && focus !== i;
      const k = present * (on ? 1.32 : dim ? 0.86 : 1);
      g.scale.setScalar(Math.max(0.0001, k));
      g.visible = k > 0.01;
      const m = mats.current[i];
      if (m) m.emissiveIntensity = on ? 0.3 : dim ? 0.0 : 0.03;
      const el = icons.current[i];
      if (el) {
        el.style.opacity = String(Math.min(1, present * 1.2) * (dim ? 0.55 : 1));
        el.style.color = on ? COLORS.goldHot : COLORS.gold;
      }
    });
  }, -3);

  const labelShow = (p: number) => Math.max(window4(p, [-1, -0.5, film.at("hero", 0.62), film.at("hero", 0.95)]), window4(p, [film.at("areas", 0.08), film.at("areas", 0.16), 2, 3]));
  return (
    <group name="AppTiles">
      {APPS.map((app, i) => (
        <group key={app.slug} ref={(el) => void (groups.current[i] = el)} visible={false}>
          <RoundedBox args={[TILES.size, TILES.size, TILES.depth]} radius={0.1} smoothness={4}>
            <meshStandardMaterial ref={(el) => void (mats.current[i] = el)} color="#0F1214" metalness={0.55} roughness={0.38} emissive={COLORS.gold} emissiveIntensity={0.03} />
          </RoundedBox>
          {/* gold rim, like the OS dock's AI tile */}
          <RoundedBox args={[TILES.size * 1.1, TILES.size * 1.1, TILES.depth * 0.5]} radius={0.12} smoothness={4} position={[0, 0, -TILES.depth * 0.3]}>
            <meshBasicMaterial color={COLORS.gold} transparent opacity={0.35} toneMapped={false} />
          </RoundedBox>
          <Html center position={[0, 0, TILES.depth / 2 + 0.01]} portal={labels as RefObject<HTMLElement>} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
            <div ref={(el) => void (icons.current[i] = el)} style={{ opacity: 0 }} className="[@media(max-height:520px)]:scale-75">
              <AppGlyph name={app.glyph} size={26} />
            </div>
          </Html>
          <SceneLabel position={[0, -TILES.size / 2 - 0.26, 0]} show={labelShow}>
            {app.name}
          </SceneLabel>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------- the cores behind each area */

function AreaCores() {
  const { film } = useFilm();
  const positions = useCorePositions();
  const lead = useMemo(() => APPS.map((a) => a.lead.map(coreIndex)), []);
  const focusAt = (p: number) => areaFocus(film.story.local(p, "areas"));
  const born = (p: number) => easeOut(ramp(p, film.at("areas", 0.04), film.at("areas", 0.16)));
  const isLead = (p: number, i: number) => {
    const f = focusAt(p);
    return f >= 0 && lead[f].includes(i);
  };
  return (
    <>
      <CoreNodes
        positions={positions}
        place={(p, t, i, out) => orbitPlace(i, t, 1.42, out, { tilt: 0.42, speed: 0.1, depth: 0.7 })}
        size={(p, i) => born(p) * (isLead(p, i) ? 1.45 : focusAt(p) >= 0 ? 0.7 : 1)}
        glow={(p, i) => (isLead(p, i) ? 3.2 : focusAt(p) >= 0 ? 0.6 : 1.4)}
        // (no labels: the area list names the lead cores; labels would crowd the tiles)
      />
      <CorePulses positions={positions} weight={(p) => 0.7 * film.weight(p, "areas") * ramp(p, film.at("areas", 0.12), film.at("areas", 0.18))} hot={(p) => (focusAt(p) >= 0 ? lead[focusAt(p)][0] : -1)} />
    </>
  );
}

/* ------------------------------------------------ request → verified loop */

const stationPos = STATIONS.map((_, i) => new THREE.Vector3(Math.cos(stationAngle(i)) * LOOP.radius, Math.sin(stationAngle(i)) * LOOP.radius, 0));
const tmp = new THREE.Vector3();

/** Pulse position at verify-act fraction f: flies in, walks the stations clockwise, then returns along the left. */
function pulseAt(f: number, out: THREE.Vector3): number {
  const a0 = stationAngle(0);
  if (f < STATION_AT[0]) {
    const u = easeOut(ramp(f, 0.02, STATION_AT[0]));
    out.set(Math.cos(a0) * LOOP.radius - 2.2 * (1 - u), Math.sin(a0) * LOOP.radius + 0.6 * (1 - u), 0);
    return u;
  }
  for (let i = 0; i < STATION_AT.length - 1; i++) {
    if (f < STATION_AT[i + 1]) {
      const u = easeInOut(ramp(f, STATION_AT[i] + 0.03, STATION_AT[i + 1]));
      const a = stationAngle(i) + LOOP.step * u;
      out.set(Math.cos(a) * LOOP.radius, Math.sin(a) * LOOP.radius, 0);
      return 1;
    }
  }
  // After Verify: the result returns along the open left side to where the request began.
  const u = easeInOut(ramp(f, RETURN_AT[0], RETURN_AT[1]));
  const from = stationAngle(STATIONS.length - 1) + Math.PI * 2;
  const a = from - (from - a0) * u;
  out.set(Math.cos(a) * LOOP.radius, Math.sin(a) * LOOP.radius, 0);
  return 1 - ramp(f, 0.93, 0.98);
}

function RequestLoop() {
  const { film, portrait } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  const pulse = useRef<THREE.Mesh>(null);
  const trail = useRef<THREE.Mesh>(null);
  const nodes = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const nodeMeshes = useRef<(THREE.Mesh | null)[]>([]);
  const resolveBeam = useRef<THREE.Mesh>(null);
  const ret = useRef<THREE.MeshBasicMaterial>(null);
  const idle = useMemo(() => new THREE.Color("#3A4044"), []);
  const gold = useMemo(() => new THREE.Color(COLORS.gold), []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "verify");
    if (group.current) {
      group.current.visible = w > 0.002;
      group.current.scale.setScalar(0.8 + 0.2 * w);
    }
    if (w <= 0.002) return;
    const f = film.story.local(p, "verify");
    const t = still ? 0 : s.clock.elapsedTime;
    const vis = pulseAt(f, tmp);
    if (pulse.current) {
      pulse.current.position.copy(tmp);
      pulse.current.scale.setScalar(Math.max(0.0001, 0.085 * vis * (1 + 0.15 * Math.sin(t * 8))));
    }
    if (trail.current) {
      trail.current.position.copy(tmp);
      trail.current.scale.setScalar(Math.max(0.0001, 0.2 * vis));
    }
    STATIONS.forEach((_, i) => {
      const reached = f >= STATION_AT[i];
      const current = reached && (i === STATIONS.length - 1 ? f < 0.97 : f < STATION_AT[i + 1]);
      const m = nodes.current[i];
      if (m) {
        m.emissive.copy(reached ? gold : idle);
        m.emissiveIntensity = current ? 3 : reached ? 1.4 : 0.6;
      }
      const mesh = nodeMeshes.current[i];
      if (mesh) mesh.scale.setScalar(current ? 1.35 : 1);
    });
    // "Resolve request": the request dips into the core and back.
    if (resolveBeam.current) {
      const r = window4(f, [STATION_AT[2] - 0.01, STATION_AT[2] + 0.02, STATION_AT[3] - 0.05, STATION_AT[3] - 0.01]);
      resolveBeam.current.visible = r > 0.01;
      resolveBeam.current.scale.set(1, Math.max(0.0001, r), 1);
    }
    if (ret.current) ret.current.opacity = 0.12 + 0.5 * window4(f, [RETURN_AT[0] - 0.02, RETURN_AT[0] + 0.02, 0.94, 0.99]);
  });

  const labelWin = (i: number) => (p: number) => {
    const f = film.story.local(p, "verify");
    return film.weight(p, "verify") * (f >= STATION_AT[i] - 0.06 ? 1 : 0.45);
  };
  const resolve = stationPos[2];
  const beamLen = resolve.length() - 0.7;
  const beamAngle = Math.atan2(resolve.y, resolve.x);
  return (
    <group ref={group} name="RequestLoop" visible={false}>
      {/* the path: stations clockwise, and the return along the open left side */}
      <mesh rotation={[0, 0, stationAngle(STATIONS.length - 1) + Math.PI * 2]}>
        <torusGeometry args={[LOOP.radius, 0.007, 8, 160, -LOOP.step * (STATIONS.length - 1)]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.4} toneMapped={false} />
      </mesh>
      <mesh rotation={[0, 0, stationAngle(0)]}>
        <torusGeometry args={[LOOP.radius, 0.005, 6, 60, Math.PI * 2 + LOOP.step * (STATIONS.length - 1)]} />
        <meshBasicMaterial ref={ret} color={COLORS.goldHot} transparent opacity={0.12} toneMapped={false} />
      </mesh>
      {STATIONS.map((st, i) => {
        const pos = stationPos[i];
        const out = pos.clone().multiplyScalar((LOOP.radius + (portrait ? 0.62 : 0.55)) / LOOP.radius);
        const gate = st.label === "Policy gate";
        const verify = st.label === "Verify";
        return (
          <group key={st.label}>
            {gate ? (
              // the ring faces along the path, so the request passes through it
              <group position={pos} rotation={[0, 0, stationAngle(i) + Math.PI / 2]}>
                <group rotation={[0, Math.PI / 2, 0]}>
                  <MachinedArc radius={0.26} thickness={0.05} ticks={false} segments={64} />
                </group>
              </group>
            ) : null}
            <mesh ref={(el) => void (nodeMeshes.current[i] = el)} position={pos}>
              <sphereGeometry args={[verify ? 0.13 : gate ? 0.07 : 0.09, 24, 24]} />
              <meshStandardMaterial ref={(el) => void (nodes.current[i] = el)} color={COLORS.goldDeep} emissive="#3A4044" emissiveIntensity={0.6} roughness={0.35} toneMapped={false} />
            </mesh>
            <SceneLabel position={[out.x, out.y, 0]} show={labelWin(i)} tone={gate || verify ? "gold" : "neutral"}>
              {st.label}
            </SceneLabel>
          </group>
        );
      })}
      <mesh ref={resolveBeam} position={[Math.cos(beamAngle) * (0.7 + beamLen / 2), Math.sin(beamAngle) * (0.7 + beamLen / 2), 0]} rotation={[0, 0, beamAngle - Math.PI / 2]} visible={false}>
        <cylinderGeometry args={[0.012, 0.012, beamLen, 8]} />
        <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
      </mesh>
      <mesh ref={trail}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshBasicMaterial color={COLORS.gold} transparent opacity={0.18} toneMapped={false} depthWrite={false} />
      </mesh>
      <mesh ref={pulse}>
        <sphereGeometry args={[1, 20, 20]} />
        <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ------------------------------------------- the avatar (compact stop act) */

function SceneAvatar() {
  const { film, lite } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const track = useMemo(() => {
    const S = (f: number) => film.at("stop", f);
    return (p: number, _t: number, out: AvatarFrame): AvatarFrame => {
      out.visible = p >= S(0.02) && p < S(0.97);
      if (!out.visible) return out;
      const grow = easeOut(ramp(p, S(0.02), S(0.07)));
      out.x = 0;
      out.y = -1.05;
      out.z = 0;
      out.scale = 0.44 * Math.max(0.001, grow * (1 - ramp(p, S(0.92), S(0.97))));
      out.explode = 1 - easeInOut(ramp(p, S(0.03), S(0.1)));
      out.turn = 0;
      out.lean = 0;
      out.talk = 0;
      const f = film.story.local(p, "stop");
      const { speaking } = stopRows(f);
      if (p < S(0.1)) {
        out.gesture = "idle";
        out.emotion = "curious";
        out.aura = "connecting";
      } else if (speaking) {
        out.gesture = f < STOP.reset[0] ? "talk" : "explain";
        out.emotion = "happy";
        out.aura = "speaking";
        out.talk = 1;
      } else if (f < STOP.reset[0]) {
        // speech stopped: it keeps working quietly
        out.gesture = "listen";
        out.emotion = "focused";
        out.aura = "idle";
      } else {
        out.gesture = "acknowledge";
        out.emotion = "neutral";
        out.aura = "idle";
      }
      return out;
    };
  }, [film]);
  return <AvatarActor track={track} getP={() => smoothed.current ?? 0} still={still} quality={lite ? "performance" : "balanced"} />;
}

