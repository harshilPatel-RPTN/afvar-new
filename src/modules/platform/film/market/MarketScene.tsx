"use client";

// The Market Data film's WebGL stage: the same gold AI core as the home film,
// led by its Market and Verify cores. Real, labelled quotes stream from four
// feeds into the Market core and on through the Verify core; on phones the
// avatar speaks in the chart act and the eight lanes ring the core as a
// heatmap. Every transform is a pure function of (damped progress, clock), so
// scrolling back replays.
import { Html, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { createContext, useContext, useEffect, useMemo, useRef, type RefObject } from "react";
import * as THREE from "three";
import {
  AiCore,
  AvatarActor,
  COLORS,
  CoreCanvas,
  CoreNodes,
  CorePulses,
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
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { LANE_KEYS, playCue, type Quotes } from "@/modules/homeDemo/kit";
import type { CapFilm } from "../capability/factory";
import type { CapSceneProps } from "../capability/FilmShell";
import { STATUS_LABEL, signedPct } from "./analysis";
import { CHART, FEEDS, FEED_LAYOUT, INSIGHT_AT, INSIGHT_CHECKED, WATCH, type MarketAct } from "./marketFilm";

type Film = CapFilm<MarketAct>;
const Ctx = createContext<{ film: Film; portrait: boolean; lite: boolean; compact: boolean } | null>(null);
function useFilm() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useFilm outside MarketScene");
  return c;
}

const MARKET = coreIndex("market");
const VERIFY = coreIndex("verify");
const isLead = (i: number) => i === MARKET || i === VERIFY;

export default function MarketScene({ film, progress, active, still, portrait, lite, avatarHere, quotes }: CapSceneProps<MarketAct>) {
  const compact = film.kind === "compact";
  const ctx = useMemo(() => ({ film, portrait, lite, compact }), [film, portrait, lite, compact]);
  const drive = useMemo(() => makeCoreDrive(film), [film]);
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
        <AiCore drive={drive} />
        <LeadCores />
        <NearRange {...near("feed")}>
          <Feeds quotes={quotes} />
        </NearRange>
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

/* ---------------------------------------------------------------- the core */

function makeCoreDrive(film: Film) {
  const out: CoreDrive = { glow: 1, scale: 1, think: 0, sparks: 1 };
  const I = (f: number) => film.at("insight", f);
  return (p: number): CoreDrive => {
    // It reads while the feeds stream in, works while the insight is written, glows once it is checked.
    const reading = 0.45 * film.weight(p, "feed") * ramp(p, film.at("feed", 0.16), film.at("feed", 0.3));
    const writing = window4(p, [I(INSIGHT_AT[0] - 0.04), I(INSIGHT_AT[0]), I(INSIGHT_CHECKED - 0.04), I(INSIGHT_CHECKED)]);
    const checked = window4(p, [I(INSIGHT_CHECKED - 0.01), I(INSIGHT_CHECKED + 0.03), 2, 3]);
    // Phones: the core becomes the avatar's heart while it speaks in the chart act.
    const inAvatar =
      film.kind === "compact" ? easeInOut(ramp(p, film.at("chart", 0.04), film.at("chart", 0.1))) * (1 - easeOut(ramp(p, film.at("chart", 0.92), film.at("chart", 1)))) : 0;
    out.glow = 1 + 0.35 * reading + 0.4 * writing + 0.7 * checked;
    out.think = Math.max(reading, writing);
    out.scale = Math.max(0.0001, 1 - inAvatar);
    out.sparks = 1 - inAvatar;
    return out;
  };
}

/* ------------------------------------------------------- the lead cores */

const pA = new THREE.Vector3();
const pB = new THREE.Vector3();
const FEED_POS = [new THREE.Vector3(...FEED_LAYOUT.market), new THREE.Vector3(...FEED_LAYOUT.verify)];

/**
 * The seven cores of the home film. The hero shows all seven with this page's
 * two lead cores large; the feed lines the two up between the feeds and the
 * AI; the insight sends them on a tight orbit, pulsing into the core.
 */
function LeadCores() {
  const { film, compact } = useFilm();
  const positions = useCorePositions();
  const F = (f: number) => film.at("feed", f);
  const I = (f: number) => film.at("insight", f);

  const place = (p: number, t: number, i: number, out: THREE.Vector3) => {
    // hero orbit → feed pipeline → (held) → tight insight orbit
    orbitPlace(i, t, 1.85, pA, { tilt: 0.38, speed: 0.12, depth: 0.9 });
    const toFeed = easeInOut(ramp(p, F(0.02), F(0.16)));
    if (isLead(i)) pB.copy(FEED_POS[i === MARKET ? 0 : 1]);
    else pB.set(0, 0, 0);
    out.copy(pA).lerp(pB, toFeed);
    const toTight = easeInOut(ramp(p, I(0.0), I(0.12)));
    if (toTight > 0) {
      orbitPlace(i === MARKET ? 0 : 3.5, t, 1.5, pA, { tilt: 0.42, speed: 0.1, depth: 0.7 });
      out.lerp(isLead(i) ? pA : pB.set(0, 0, 0), toTight);
    }
  };
  const size = (p: number, i: number) => {
    const fold = easeInOut(ramp(p, F(0.02), F(0.12)));
    if (!isLead(i)) return 0.5 * (1 - fold);
    // Phones: the chart act belongs to the avatar, the watch act to the heatmap ring.
    const away = compact ? window4(p, [film.at("chart", 0.0), film.at("chart", 0.06), film.at("insight", 0.0), film.at("insight", 0.08)]) : 0;
    const speaking = speakingCore(film, p) === i ? 0.25 : 0;
    return (1.05 + speaking) * (1 - away);
  };
  const glow = (p: number, i: number) => (isLead(i) ? (speakingCore(film, p) === i ? 3.0 : 1.6) : 0.7);
  const labelShow = (p: number, i: number) =>
    isLead(i) ? Math.max(window4(p, [-1, -0.5, film.at("hero", 0.6), film.at("hero", 0.92)]), window4(p, [F(0.12), F(0.2), F(0.9), F(0.98)]), window4(p, [I(0.08), I(0.16), 2, 3])) : 0;

  return (
    <>
      <CoreNodes positions={positions} place={place} size={size} glow={glow} labelShow={labelShow} />
      <CorePulses positions={positions} weight={(p) => 0.8 * film.weight(p, "insight") * ramp(p, I(0.1), I(0.18))} hot={(p) => speakingCore(film, p)} />
    </>
  );
}

/** Which lead core is "speaking": the Market core reads the feed and writes the first lines; the Verify core checks. */
function speakingCore(film: Film, p: number): number {
  const fl = film.story.local(p, "feed");
  if (p >= film.story.range.feed[0] && p < film.story.range.feed[1]) return fl < 0.8 ? MARKET : VERIFY;
  const il = film.story.local(p, "insight");
  if (p >= film.story.range.insight[0]) return il < INSIGHT_AT[2] + 0.06 ? MARKET : VERIFY;
  return -1;
}

/* ------------------------------------------------ feeds → Market → Verify */

const chipText = (q: HomeQuote | undefined, sym: string) => (q ? `${sym} ${fmtPrice(q.last, q.decimals)} · ${STATUS_LABEL[q.status].toUpperCase()}` : sym);
const CHIP_TONE: Record<HomeQuote["status"], string> = {
  live: "border-[rgba(0,230,118,0.45)] bg-[#07130D] text-[#C9F5DD]",
  delayed: "border-[rgba(246,185,74,0.5)] bg-[#141006] text-[#F3DFAF]",
  snapshot: "border-[rgba(255,255,255,0.18)] bg-[#0F1214] text-[#A3AAAC]",
};

/** Four feeds stream labelled real quotes into the Market core; the Verify core passes them to the AI. */
function Feeds({ quotes }: { quotes: Quotes }) {
  const { film, lite, compact } = useFilm();
  const { smoothed, still, labels } = useStoryFrame();
  // Phones and tablets show one packet per feed, gone before the core labels, and no feed
  // labels (the lane card under the scene carries every status): small screens stay readable.
  const CHIPS = compact ? 1 : lite ? 2 : 3;
  const fadeAt = compact ? 0.42 : 0.6;
  const group = useRef<THREE.Group>(null);
  const chips = useRef<(THREE.Group | null)[]>([]);
  const chipEls = useRef<(HTMLDivElement | null)[]>([]);
  const lastText = useRef<string[]>(FEEDS.flatMap(() => Array<string>(CHIPS).fill("")));
  const lineMats = useRef<(THREE.LineBasicMaterial | null)[]>([]);
  const hop = useRef<THREE.Mesh>(null);
  const hop2 = useRef<THREE.Mesh>(null);
  const quotesRef = useRef(quotes);
  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  const origins = useMemo(() => FEEDS.map((f) => new THREE.Vector3(FEED_LAYOUT.sourceX, f.y, 0)), []);
  const market = useMemo(() => new THREE.Vector3(...FEED_LAYOUT.market), []);
  const verify = useMemo(() => new THREE.Vector3(...FEED_LAYOUT.verify), []);
  const lines = useMemo(
    () =>
      [...FEEDS.map((_, j) => [origins[j], market] as const), [market, verify] as const, [verify, new THREE.Vector3(0.62, -0.25, 0.1)] as const].map(([a, b]) => {
        const g = new THREE.BufferGeometry();
        g.setAttribute("position", new THREE.BufferAttribute(new Float32Array([a.x, a.y, a.z, b.x, b.y, b.z]), 3));
        return g;
      }),
    [origins, market, verify],
  );
  const symOf = useMemo(() => new Map(LANE_KEYS.map(([k, s]) => [k as string, s as string])), []);
  const tmp = useMemo(() => new THREE.Vector3(), []);

  useFrame((s) => {
    const p = smoothed.current ?? 0;
    const w = film.weight(p, "feed", 0.1) * ramp(p, film.at("feed", 0.1), film.at("feed", 0.2));
    if (group.current) group.current.visible = w > 0.002;
    if (w <= 0.002) {
      // Html chips live in the DOM: a hidden group does not hide them.
      chipEls.current.forEach((el) => {
        if (el && el.style.opacity !== "0") el.style.opacity = "0";
      });
      return;
    }
    const t = still ? 1.3 : s.clock.elapsedTime;
    lineMats.current.forEach((m, j) => {
      if (m) m.opacity = (j < FEEDS.length ? 0.4 : 0.7) * w;
    });
    FEEDS.forEach((feed, j) => {
      for (let k = 0; k < CHIPS; k++) {
        const idx = j * CHIPS + k;
        const g = chips.current[idx];
        const el = chipEls.current[idx];
        if (!g || !el) continue;
        const phase = t * (0.15 + j * 0.013) + k / CHIPS + j * 0.17;
        const u = phase % 1;
        g.position.copy(origins[j]).lerp(market, easeInOut(u));
        // each packet fades before it reaches the core, so packets never pile up on it
        el.style.opacity = String(ramp(u, 0, 0.12) * (1 - ramp(u, fadeAt, fadeAt + 0.16)) * w);
        const keys = feed.keys;
        const key = keys[(Math.floor(phase) + k) % keys.length];
        const q = quotesRef.current[key];
        const text = chipText(q, symOf.get(key) ?? key);
        if (text !== lastText.current[idx]) {
          lastText.current[idx] = text;
          el.textContent = text;
          el.className = `${CHIP_BASE} ${CHIP_TONE[q?.status ?? "snapshot"]}`;
        }
      }
    });
    // what the Market core read travels on: through the Verify core into the AI
    const u = (t * 0.5) % 1;
    if (hop.current) {
      hop.current.position.copy(market).lerp(verify, easeInOut(u));
      hop.current.scale.setScalar(0.05 * w);
    }
    if (hop2.current) {
      const u2 = (t * 0.5 + 0.5) % 1;
      tmp.set(0.62, -0.25, 0.1);
      hop2.current.position.copy(verify).lerp(tmp, easeInOut(u2));
      hop2.current.scale.setScalar(0.045 * w);
    }
  });

  const showSources = (p: number) => film.weight(p, "feed", 0.1) * ramp(p, film.at("feed", 0.12), film.at("feed", 0.22)) * (compact ? 0 : 1);
  return (
    <group ref={group} name="Feeds" visible={false}>
      {lines.map((g, j) => (
        <lineSegments key={j} geometry={g}>
          <lineBasicMaterial ref={(el) => void (lineMats.current[j] = el)} color={j < FEEDS.length ? COLORS.up : COLORS.gold} transparent opacity={0} toneMapped={false} />
        </lineSegments>
      ))}
      {FEEDS.map((feed, j) => {
        const q = quotes[feed.keys[0]];
        return (
          <group key={feed.id}>
            <mesh position={origins[j]}>
              <sphereGeometry args={[0.07, 16, 16]} />
              <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
            </mesh>
            <SceneLabel position={[FEED_LAYOUT.sourceX, feed.y + 0.3, 0]} show={showSources} tone="neutral">
              {feed.label}
              {q ? ` · ${STATUS_LABEL[q.status]}` : ""}
            </SceneLabel>
            {Array.from({ length: CHIPS }, (_, k) => {
              const idx = j * CHIPS + k;
              return (
                <group key={k} ref={(el) => void (chips.current[idx] = el)}>
                  <Html center portal={labels as RefObject<HTMLElement>} zIndexRange={[18, 0]} style={{ pointerEvents: "none" }}>
                    <div ref={(el) => void (chipEls.current[idx] = el)} style={{ opacity: 0 }} className={CHIP_BASE} />
                  </Html>
                </group>
              );
            })}
          </group>
        );
      })}
      <mesh ref={hop}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
      </mesh>
      <mesh ref={hop2}>
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color={COLORS.goldHot} toneMapped={false} />
      </mesh>
    </group>
  );
}
const CHIP_BASE =
  "whitespace-nowrap rounded-md border px-2 py-0.5 font-mono text-[10.5px] tracking-[0.04em] [@media(max-height:520px)]:px-1 [@media(max-height:520px)]:text-[8px] [@media(max-height:520px)]:tracking-normal";

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
