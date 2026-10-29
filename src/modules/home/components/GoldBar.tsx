"use client";

import { animate, motion, useMotionValue, useMotionValueEvent, useReducedMotion, useScroll, type AnimationPlaybackControls, type ValueAnimationTransition } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { haptic, playSfx } from "./sfx";

/* ── INGOT DROP — a low-poly gold (or silver) bar falls onto its commodity row
 * when the row scrolls into view (row top crosses `at` of the
 * ["start end", "start start"] range, scrolling down): gravity fall → squash +
 * bounce + sparkle ticks + the row price dips 3px + `clink`. It then rests,
 * scaled down and tilted, in the free gap left of the price (measured; never
 * over the price/pill). No gap (phones) → it fades out after landing.
 * Once per downward crossing; re-armed when the row is back below the fold.
 * Reduced motion: resting bar, no drop, no sound. Must sit in a `relative` row. */

type Metal = "gold" | "silver";

const ART: Record<Metal, { w: number; top: [string, string]; front: [string, string, string]; base: string; edge: string; line: string; spark: string }> = {
  gold: { w: 46, top: ["#F3DA86", "#E8C65A"], front: ["#C99E38", "#B8902F", "#9A7726"], base: "#5e4715", edge: "#FFF3C4", line: "#7A5D1C", spark: "#FFE38A" },
  silver: { w: 36, top: ["#EEF1F2", "#D2D8DB"], front: ["#B8C0C4", "#A9B1B6", "#8A9297"], base: "#4f565a", edge: "#FFFFFF", line: "#6B7378", spark: "#F5F7F7" },
};

const REST_SCALE = 0.84;
const REST_TILT = -7;
const SPARKS = [
  [-160, 0],
  [-128, 0.03],
  [-95, 0.01],
  [-58, 0.04],
  [-22, 0.02],
] as const;

const GOLD_CSS = [
  "@keyframes ing-spark{0%{opacity:1;transform:rotate(var(--r)) translateX(3px) scaleX(.2)}35%{opacity:1;transform:rotate(var(--r)) translateX(8px) scaleX(1)}100%{opacity:0;transform:rotate(var(--r)) translateX(22px) scaleX(.2)}}",
  ".ing-spark{position:absolute;left:0;top:0;height:2.5px;width:12px;border-radius:2px;transform-origin:0 50%;opacity:0;animation:ing-spark .8s cubic-bezier(.2,.8,.2,1) var(--d) both}",
  "@media (prefers-reduced-motion:reduce){.ing-spark{display:none}}",
].join("");

function reducedNow() {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

export function GoldBar({ metal = "gold", at = 0.12 }: { metal?: Metal; at?: number }) {
  const art = ART[metal];
  const h = art.w / 2;
  const rootRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: rootRef, offset: ["start end", "start start"] });

  // Landing spot (row-relative, transform-free offsets). rest=false → no room.
  const [spot, setSpot] = useState<{ x: number; y: number; rest: boolean } | null>(null);
  useEffect(() => {
    const root = rootRef.current;
    const row = root?.parentElement;
    if (!root || !row || typeof ResizeObserver === "undefined") return;
    const measure = () => {
      const button = row.querySelector<HTMLElement>("button");
      const price = button?.querySelector<HTMLElement>(".tabular-nums");
      const name = button?.children[1] as HTMLElement | undefined;
      if (!button || !price || !name || price.offsetParent !== row || name.offsetParent !== row) return;
      const gapL = name.offsetLeft + name.offsetWidth;
      const gapR = price.offsetLeft;
      const rest = gapR - gapL >= art.w + 28 && window.innerWidth >= 640;
      // No room: touch down on the row's top edge above the change pill, then fade.
      const pill = button.lastElementChild as HTMLElement | null;
      const pillMid = pill && pill.offsetParent === row ? pill.offsetLeft + pill.offsetWidth / 2 : gapR;
      const x = rest ? gapR - 12 - art.w : pillMid - art.w / 2;
      const y = rest ? button.offsetTop + button.offsetHeight / 2 + h / 2 - 2 : button.offsetTop + 5;
      setSpot({ x: Math.round(x), y: Math.round(y), rest });
    };
    const ro = new ResizeObserver(measure);
    ro.observe(row);
    return () => ro.disconnect();
  }, [art.w, h]);

  const y = useMotionValue(-170);
  const rot = useMotionValue(-16);
  const sx = useMotionValue(1);
  const sy = useMotionValue(1);
  const sc = useMotionValue(1);
  const op = useMotionValue(0);
  const [burst, setBurst] = useState(0);
  const armed = useRef(true);
  const last = useRef<number | null>(null);
  const runs = useRef<AnimationPlaybackControls[]>([]);
  const timer = useRef<number | undefined>(undefined);
  const spotRef = useRef(spot);
  useEffect(() => {
    spotRef.current = spot;
  }, [spot]);

  useEffect(
    () => () => {
      runs.current.forEach((r) => r.stop());
      window.clearTimeout(timer.current);
    },
    [],
  );

  const settle = () => {
    y.set(0);
    rot.set(REST_TILT);
    sx.set(1);
    sy.set(1);
    sc.set(REST_SCALE);
    op.set(spotRef.current?.rest === false ? 0 : 1);
  };

  // Reduced motion: the bar simply rests (only where there is room for it).
  useEffect(() => {
    if (!reduce) return;
    y.set(0);
    rot.set(REST_TILT);
    sc.set(REST_SCALE);
    op.set(spot?.rest ? 1 : 0);
  }, [reduce, spot, y, rot, sc, op]);

  const go = (mv: typeof y, to: number | number[], t: ValueAnimationTransition<number>) => {
    runs.current.push(animate(mv, to, t));
  };

  const land = () => {
    playSfx("clink");
    haptic(12);
    setBurst((b) => b + 1);
    const k = { duration: 0.42, times: [0, 0.18, 0.55, 1], ease: "easeOut" as const };
    go(y, [0, 0, -9, 0], k);
    go(sy, [1, 0.7, 1.07, 1], k);
    go(sx, [1, 1.2, 0.95, 1], k);
    go(rot, [-3, 0, -4, REST_TILT], k);
    const price = rootRef.current?.parentElement?.querySelector<HTMLElement>("button .tabular-nums");
    price?.animate([{ transform: "translateY(0)" }, { transform: "translateY(3px)", offset: 0.3 }, { transform: "translateY(0)" }], { duration: 380, easing: "cubic-bezier(.2,.8,.2,1)" });
    timer.current = window.setTimeout(() => {
      go(sc, REST_SCALE, { duration: 0.45, ease: "easeInOut" });
      if (spotRef.current?.rest === false) go(op, 0, { duration: 0.5, delay: 0.5 });
    }, 460);
  };

  const fire = () => {
    runs.current.forEach((r) => r.stop());
    window.clearTimeout(timer.current);
    sx.set(1);
    sy.set(1);
    sc.set(1);
    op.set(1);
    y.set(-170);
    rot.set(-16);
    go(rot, -3, { duration: 0.44, ease: "easeIn" });
    const fall = animate(y, 0, { duration: 0.44, ease: [0.55, 0, 1, 0.45] });
    runs.current.push(fall);
    fall.then(land);
  };

  useMotionValueEvent(scrollYProgress, "change", (v) => {
    const prev = last.current;
    last.current = v;
    if (reduce || reducedNow()) return;
    if (v <= 0) {
      if (!armed.current) {
        armed.current = true;
        runs.current.forEach((r) => r.stop());
        op.set(0);
      }
      return;
    }
    if (prev === null) {
      // Mounted already past the moment (reload / jump): just rest.
      if (v >= at) {
        armed.current = false;
        settle();
      }
      return;
    }
    if (armed.current && prev < at && v >= at) {
      armed.current = false;
      fire();
    }
  });

  return (
    <div ref={rootRef} aria-hidden="true" data-ingot={metal} className="pointer-events-none absolute inset-0">
      <style href="afvar-ingot" precedence="default">
        {GOLD_CSS}
      </style>
      {spot && (
        <div className={`absolute ${spot.rest ? "max-sm:hidden" : ""}`} style={{ left: spot.x, top: spot.y - h, width: art.w, height: h }}>
          <motion.div className="absolute inset-0" style={{ y, rotate: rot, scale: sc, opacity: op, transformOrigin: "50% 100%" }}>
            <motion.div className="absolute inset-0" style={{ scaleX: sx, scaleY: sy, transformOrigin: "50% 100%" }}>
              <IngotArt metal={metal} />
            </motion.div>
          </motion.div>
          {burst > 0 && (
            <div key={burst} className="absolute" style={{ left: art.w / 2, top: h - 1 }}>
              {SPARKS.map(([r, d], i) => (
                <span
                  key={i}
                  className="ing-spark"
                  style={{ background: art.spark, boxShadow: `0 0 6px ${art.spark}`, ["--r" as string]: `${r}deg`, ["--d" as string]: `${d}s`, translate: `${r < -100 ? -art.w * 0.42 : r > -80 ? art.w * 0.42 : 0}px ${r === -95 ? -h : 0}px` }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Trapezoid ingot, 3/4 from above: top face + sloped front face + base lip. */
function IngotArt({ metal }: { metal: Metal }) {
  const a = ART[metal];
  return (
    <svg viewBox="0 0 60 30" className="block h-full w-full overflow-visible">
      <ellipse cx="30" cy="29.4" rx="27" ry="1.6" fill="#000" opacity=".55" />
      {/* front face facets */}
      <polygon points="7,12 53,12 58,26 2,26" fill={a.front[1]} />
      <polygon points="7,12 30,12 2,26" fill={a.front[0]} />
      <polygon points="53,12 58,26 40,26" fill={a.front[2]} />
      <polygon points="30,12 53,12 40,26" fill={a.front[1]} opacity=".85" />
      {/* base lip */}
      <polygon points="2,26 58,26 57,28.2 3,28.2" fill={a.base} />
      {/* top face facets */}
      <polygon points="13,3 47,3 53,12 7,12" fill={a.top[1]} />
      <polygon points="13,3 30,3 24,12 7,12" fill={a.top[0]} />
      <polygon points="36,3 47,3 53,12" fill={a.top[0]} opacity=".55" />
      {/* stamp */}
      <rect x="23" y="5.2" width="14" height="4.6" rx=".6" fill="none" stroke={a.line} strokeWidth=".6" opacity=".7" />
      <line x1="25.5" y1="7.5" x2="34.5" y2="7.5" stroke={a.line} strokeWidth=".5" opacity=".55" />
      {/* bright edges */}
      <polyline points="7,12 53,12" fill="none" stroke={a.edge} strokeWidth="1.1" strokeLinecap="round" />
      <polyline points="13,3 47,3" fill="none" stroke={a.edge} strokeWidth=".8" opacity=".85" />
      <polyline points="7,12 13,3" fill="none" stroke={a.edge} strokeWidth=".6" opacity=".7" />
      <polyline points="2,26 58,26" fill="none" stroke={a.line} strokeWidth=".8" />
    </svg>
  );
}
