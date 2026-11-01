"use client";

// The Market Data film's WebGL stage. The home's core is not here: this page
// shows what the AI reads — the chart itself, as a glass wall of Gold's real
// hourly closes, the spark on the newest price, the other markets behind. Core
// names appear only in the acts after the hero. On phones the avatar speaks in
// the chart act and the eight markets turn into heat tiles in the watch act.
// Every transform is a pure function of (damped progress, clock), so
// scrolling back replays.
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useMemo, useRef, type ReactNode, type RefObject } from "react";
import * as THREE from "three";
import { AvatarActor, COLORS, CoreCanvas, GoldDust, NearRange, easeInOut, easeOut, ramp, useStoryFrame, window4, type AvatarFrame } from "@/modules/afvarOs";
import { LANE_KEYS, playCue, type Quotes } from "@/modules/homeDemo/kit";
import type { CapFilm } from "../capability/factory";
import type { CapSceneProps } from "../capability/FilmShell";
import { signedPct } from "./analysis";
import { CHART, WATCH, type MarketAct } from "./marketFilm";
import { PriceWall } from "./PriceWall";

type Film = CapFilm<MarketAct>;
const Ctx = createContext<{ film: Film; portrait: boolean; lite: boolean; compact: boolean } | null>(null);
function useFilm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFilm outside MarketScene");
  return c;
}

export default function MarketScene({ film, progress, active, still, portrait, lite, avatarHere, quotes }: CapSceneProps<MarketAct>) {
  const compact = film.kind === "compact";
  const ctx = useMemo(() => ({ film, portrait, lite, compact }), [film, portrait, lite, compact]);
  const near = (id: MarketAct, m = 0.03) => ({ lo: film.story.range[id][0] - m, hi: film.story.range[id][1] + m });
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
        <WallStage>
          <PriceWall quotes={quotes} compact={portrait} yaw={portrait ? -0.3 : -0.4} pitch={portrait ? 0.14 : 0.12} x={portrait ? -0.2 : -0.3} />
        </WallStage>
        <GoldDust count={lite ? 150 : 220} box={[11, 6, 6]} center={[0, 0, -0.8]} drift={[0.05, 0.006, 0]} opacity={0.38} />
        {avatarHere ? (
          <NearRange {...near("chart", 0.04)}>
            <SceneAvatar />
          </NearRange>
        ) : null}
        {compact ? (
          <NearRange {...near("watch")}>
            <HeatTiles quotes={quotes} />
          </NearRange>
        ) : null}
      </Ctx.Provider>
    </CoreCanvas>
  );
}

/** Phones: the wall steps back while the avatar speaks (chart) and the heat tiles show (watch). */
function WallStage({ children }: { children: ReactNode }) {
  const { film, compact } = useFilm();
  const { smoothed } = useStoryFrame();
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (!group.current) return;
    const p = smoothed.current ?? 0;
    const away = compact ? window4(p, [film.at("chart", 0.0), film.at("chart", 0.06), film.at("insight", 0.0), film.at("insight", 0.08)]) : 0;
    const k = 1 - 0.999 * easeInOut(away);
    group.current.scale.setScalar(k);
    group.current.visible = k > 0.01;
  });
  return (
    <group ref={group} name="WallStage">
      {children}
    </group>
  );
}

/* --------------------------------------------- phones: the heatmap ring */

const ringV = new THREE.Vector3();
const SHORT3: Record<string, string> = { XAUUSD: "AU", XAGUSD: "AG", WTI: "OIL", EURUSD: "EUR", USDJPY: "JPY", GBPUSD: "GBP", NZDUSD: "NZD", "BTC-USD": "BTC" };

/** The eight lanes as tiles around the core, lit green or red by today's move. */
function HeatTiles({ quotes }: { quotes: Quotes }) {
  const { film } = useFilm();
  const { smoothed, still, labels } = useStoryFrame();
  const groups = useRef<(THREE.Group | null)[]>([]);
  const icons = useRef<(HTMLDivElement | null)[]>([]);
  const big = useMemo(() => {
    let at = -1;
    LANE_KEYS.forEach(([key], i) => {
      const q = quotes[key];
      if (q && (at < 0 || Math.abs(q.changePct) > Math.abs(quotes[LANE_KEYS[at][0]]!.changePct))) at = i;
    });
    return at;
  }, [quotes]);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const t = still ? 0 : s.clock.elapsedTime;
    const present = easeOut(ramp(p, film.at("watch", 0.04), film.at("watch", 0.2))) * (1 - easeInOut(ramp(p, film.at("watch", 0.92), film.at("insight", 0.04))));
    const moverOn = p >= film.at("watch", WATCH.mover);
    groups.current.forEach((g, i) => {
      if (!g) return;
      const a = Math.PI / 2 + (i / LANE_KEYS.length) * Math.PI * 2 - t * 0.05;
      ringV.set(Math.cos(a) * 2.25, Math.sin(a) * 2.25 * 0.82, -Math.sin(a) * 0.4);
      g.position.copy(ringV).multiplyScalar(present);
      const k = present * (moverOn && i === big ? 1.3 : 1);
      g.scale.setScalar(Math.max(0.0001, k));
      g.visible = k > 0.01;
      const el = icons.current[i];
      if (el) el.style.opacity = String(Math.min(1, present * 1.2) * (moverOn && i !== big ? 0.6 : 1));
    });
  }, -3);

  return (
    <group name="HeatTiles">
      {LANE_KEYS.map(([key], i) => {
        const q = quotes[key];
        const up = (q?.changePct ?? 0) >= 0;
        const heat = Math.min(1, Math.abs(q?.changePct ?? 0) / 3);
        return (
          <group key={key} ref={(el) => void (groups.current[i] = el)} visible={false}>
            <RoundedBox args={[0.5, 0.5, 0.08]} radius={0.08} smoothness={4}>
              <meshStandardMaterial color="#0F1214" metalness={0.5} roughness={0.4} emissive={up ? COLORS.up : COLORS.down} emissiveIntensity={0.12 + 0.55 * heat} />
            </RoundedBox>
            <Html center position={[0, 0, 0.06]} portal={labels as RefObject<HTMLElement>} zIndexRange={[19, 0]} style={{ pointerEvents: "none" }}>
              <div ref={(el) => void (icons.current[i] = el)} style={{ opacity: 0 }} className="text-center font-mono leading-tight text-[#F5F7F7]">
                <span className="block text-[9.5px] tracking-[0.08em]">{SHORT3[key]}</span>
                <span className="block text-[8.5px] text-[#C9CFD1]">{q ? signedPct(q.changePct, 1) : ""}</span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

/* ------------------------------------------- the avatar (phones, chart act) */

function SceneAvatar() {
  const { film, lite } = useFilm();
  const { smoothed, still } = useStoryFrame();
  const track = useMemo(() => {
    const S = (f: number) => film.at("chart", f);
    return (p: number, _t: number, out: AvatarFrame): AvatarFrame => {
      out.visible = p >= S(0.02) && p < S(0.97);
      if (!out.visible) return out;
      const grow = easeOut(ramp(p, S(0.02), S(0.07)));
      out.x = 0;
      out.y = -1.05;
      out.z = 0;
      // a touch smaller than the overview's: short phones keep its head clear of the ticker
      out.scale = 0.4 * Math.max(0.001, grow * (1 - ramp(p, S(0.92), S(0.97))));
      out.explode = 1 - easeInOut(ramp(p, S(0.03), S(0.1)));
      out.turn = 0;
      out.lean = 0;
      out.talk = 0;
      if (p >= S(CHART.speak[0]) && p < S(CHART.speak[1])) {
        out.gesture = "explain";
        out.emotion = "happy";
        out.aura = "speaking";
        out.talk = 1;
      } else if (p >= S(CHART.high[0]) && p < S(CHART.speak[0])) {
        out.gesture = "think";
        out.emotion = "focused";
        out.aura = "thinking";
      } else if (p >= S(CHART.speak[1])) {
        out.gesture = "acknowledge";
        out.emotion = "happy";
        out.aura = "idle";
      } else {
        out.gesture = "listen";
        out.emotion = "curious";
        out.aura = "listening";
      }
      return out;
    };
  }, [film]);
  return <AvatarActor track={track} getP={() => smoothed.current ?? 0} still={still} quality={lite ? "performance" : "balanced"} />;
}
