"use client";

import { useAfvarReducedMotion } from "@/modules/afvarOs";
import {
  motion,
  useAnimationFrame,
  useInView,
  useMotionTemplate,
  useMotionValue,
  useSpring,
  type TargetAndTransition,
  type Transition,
} from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import type { Capability, CapabilitySlug } from "../../types";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";

/** Soft fade on every edge so the model blends into the page with no visible frame. */
const EDGE_FADE = "linear-gradient(to right, transparent, #000 10%, #000 90%, transparent), linear-gradient(to bottom, transparent, #000 10%, #000 85%, transparent)";

type Models = typeof import("./Models3D").Models3D;

// Probed once; the probe context is released at once so it never counts
// toward the browser's live WebGL-context limit.
let webglOk: boolean | null = null;
function hasWebGL() {
  if (webglOk === null) {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
      webglOk = Boolean(gl);
      gl?.getExtension("WEBGL_lose_context")?.loseContext();
    } catch {
      webglOk = false;
    }
  }
  return webglOk;
}

/**
 * WF04 "Supporting preview" as a live 3D scene instead of a still image.
 * Near the viewport it lazy-loads the WebGL models (Models3D, three.js); until
 * then, or without WebGL, a CSS 3D version shows: layered planes that tilt
 * toward the pointer and sway while idle. Schematic shapes only — no prices,
 * names or results (WA-T06).
 */
export function Scene3D({ capability: c }: { capability: Capability }) {
  const still = useAfvarReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.3 });
  const run = visible && !still;
  const hovering = useRef(false);
  const near = useInView(ref, { margin: "400px", once: true });
  const [Models, setModels] = useState<Models | null>(null);

  useEffect(() => {
    if (!near || !hasWebGL()) return;
    let live = true;
    import("./Models3D").then((m) => live && setModels(() => m.Models3D));
    return () => {
      live = false;
    };
  }, [near]);

  const rx = useSpring(8, { stiffness: 110, damping: 18 });
  const ry = useSpring(-12, { stiffness: 110, damping: 18 });
  const gx = useMotionValue(30);
  const gy = useMotionValue(20);
  const glare = useMotionTemplate`radial-gradient(circle at ${gx}% ${gy}%, rgba(255,240,200,0.14), transparent 45%)`;

  useAnimationFrame((t) => {
    if (!run || hovering.current) return;
    ry.set(Math.sin(t / 2600) * 14);
    rx.set(7 + Math.cos(t / 3400) * 4);
    gx.set(50 + Math.sin(t / 2600) * 30);
  });

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (still) return;
    hovering.current = true;
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    ry.set(px * 28);
    rx.set(6 - py * 18);
    gx.set((px + 0.5) * 100);
    gy.set((py + 0.5) * 100);
  }

  const Scene = SCENES[c.slug];

  return (
    <figure className="mt-6">
      <div
        ref={ref}
        role="img"
        aria-label={`3D illustration: ${c.preview.description} Not live data.`}
        onPointerMove={onPointerMove}
        onPointerEnter={() => (hovering.current = true)}
        onPointerLeave={() => (hovering.current = false)}
        className="relative aspect-[16/10] overflow-hidden [perspective:1300px] sm:aspect-[16/9]"
        // No card behind the model: it sits on the page, edges faded so it blends in.
        style={{ maskImage: EDGE_FADE, WebkitMaskImage: EDGE_FADE, maskComposite: "intersect", WebkitMaskComposite: "source-in" }}
      >
        {Models ? (
          <motion.div className="absolute inset-0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.7 }}>
            <Models slug={c.slug} tone={c.tone} run={run} still={still} hover={hovering} />
          </motion.div>
        ) : (
          <>
            <Floor tone={c.tone} run={run} />
            <motion.div
              className="absolute inset-0 [transform-style:preserve-3d]"
              style={{ rotateX: still ? 8 : rx, rotateY: still ? -12 : ry }}
              aria-hidden="true"
            >
              <Scene run={run} still={still} />
            </motion.div>
            <motion.div className="pointer-events-none absolute inset-0" style={{ background: glare }} aria-hidden="true" />
          </>
        )}
      </div>
      <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-[12px] text-(--text-muted)">
        <span>Illustration · not live data</span>
        {!still && <span className="max-sm:hidden">Move your pointer to look around</span>}
      </figcaption>
    </figure>
  );
}

type SceneProps = { run: boolean; still: boolean };

const SCENES: Record<CapabilitySlug, (p: SceneProps) => ReactNode> = {
  charts: ChartsScene,
  research: ResearchScene,
  alerts: AlertsScene,
  "trade-review": ReviewScene,
  community: CommunityScene,
};

const TONE_GLOW: Record<Capability["tone"], string> = {
  gold: "0,230,118",
  cyan: "85,214,255",
  purple: "160,140,255",
  red: "229,72,77",
  green: "4,204,217",
  slate: "120,140,170",
};

/* ------------------------------------------------------------- primitives */

/** A plane at depth `z` (px toward the viewer) that bobs gently while running. */
function Layer({
  z,
  className = "",
  style,
  bob = 6,
  delay = 0,
  run,
  children,
}: {
  z: number;
  className?: string;
  style?: CSSProperties;
  bob?: number;
  delay?: number;
  run: boolean;
  children?: ReactNode;
}) {
  return (
    <motion.div
      className={`absolute [transform-style:preserve-3d] ${className}`}
      style={{ ...style, z }}
      animate={run && bob ? { y: [0, -bob, 0] } : { y: 0 }}
      transition={run ? { duration: 4.2, repeat: Infinity, ease: "easeInOut", delay } : { duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
}

/** Glass card: solid translucent fill (backdrop-filter flattens 3D). */
function Glass({ className = "", glow, children }: { className?: string; glow?: string; children?: ReactNode }) {
  return (
    <div
      className={`h-full w-full rounded-[18px] bg-[linear-gradient(160deg,rgba(50,56,53,0.92),rgba(19,22,20,0.94))] ${className}`}
      style={{
        boxShadow: `0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.12), 0 30px 60px rgba(0,0,0,0.55)${glow ? `, 0 0 40px rgba(${glow},0.18)` : ""}`,
      }}
    >
      {children}
    </div>
  );
}

function Lights() {
  return (
    <div className="flex gap-1.5 px-4 pt-3.5">
      <span className="h-2 w-2 rounded-full bg-(--light-close)" />
      <span className="h-2 w-2 rounded-full bg-(--light-minimize)" />
      <span className="h-2 w-2 rounded-full bg-(--light-zoom)" />
    </div>
  );
}

function Bar({ w, className = "" }: { w: string; className?: string }) {
  return <span className={`block h-1.5 rounded-full bg-white/12 ${className}`} style={{ width: w }} />;
}

function Orb({ x, y, z, size, rgb, run, delay = 0 }: { x: string; y: string; z: number; size: number; rgb: string; run: boolean; delay?: number }) {
  return (
    <Layer z={z} run={run} bob={14} delay={delay} style={{ left: x, top: y }}>
      <span
        className="block rounded-full"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9), rgba(${rgb},0.95) 35%, rgba(${rgb},0.25) 100%)`,
          boxShadow: `0 0 ${size}px rgba(${rgb},0.45)`,
        }}
      />
    </Layer>
  );
}

function Floor({ tone, run }: { tone: Capability["tone"]; run: boolean }) {
  const rgb = TONE_GLOW[tone];
  return (
    <motion.div
      className="absolute bottom-[-18%] left-1/2 h-[46%] w-[80%] -translate-x-1/2 rounded-[50%]"
      style={{ background: `radial-gradient(ellipse at center, rgba(${rgb},0.28), transparent 65%)` }}
      animate={run ? { opacity: [0.6, 1, 0.6] } : { opacity: 0.8 }}
      transition={run ? { duration: 5, repeat: Infinity, ease: "easeInOut" } : undefined}
      aria-hidden="true"
    />
  );
}

/** Loops `to` while running; holds the end state when motion is reduced. */
function loop(run: boolean, still: boolean, to: TargetAndTransition, final: TargetAndTransition, t: Transition) {
  return {
    animate: run ? to : still ? final : undefined,
    transition: run ? { repeat: Infinity, ...t } : { duration: 0 },
  };
}

/* ----------------------------------------------------------------- scenes */

const CANDLES = [0.32, 0.4, 0.36, 0.5, 0.44, 0.58, 0.52, 0.64, 0.6, 0.55, 0.68, 0.74, 0.7, 0.82, 0.9];

function ChartsScene({ run, still }: SceneProps) {
  return (
    <>
      <Layer z={0} run={run} bob={4} className="left-[12%] top-[14%] h-[62%] w-[60%]">
        <Glass glow={TONE_GLOW.gold}>
          <Lights />
          <div className="absolute inset-x-5 bottom-5 top-12 flex items-end gap-[3%]">
            {CANDLES.map((h, i) => {
              const up = i === 0 || h >= CANDLES[i - 1];
              return (
                <motion.span
                  key={i}
                  className="relative flex-1 origin-bottom rounded-[2px]"
                  style={{ height: `${h * 70}%`, background: up ? "var(--positive)" : "var(--negative)", marginBottom: `${h * 18}%` }}
                  {...loop(run, still, { scaleY: [0, 1, 1, 0] }, { scaleY: 1 }, { duration: 6, times: [0, 0.15, 0.9, 1], delay: i * 0.06, repeatDelay: 0.4 })}
                >
                  <span className="absolute -bottom-[14%] -top-[18%] left-1/2 w-px -translate-x-1/2 bg-inherit opacity-80" />
                </motion.span>
              );
            })}
          </div>
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-x-5 bottom-5 top-12 h-[calc(100%-4.25rem)] w-[calc(100%-2.5rem)]">
            <motion.path
              d="M0 42 C 15 38, 22 30, 35 32 S 55 24, 68 18 S 88 8, 100 4"
              fill="none"
              stroke="#00E676"
              strokeWidth="0.9"
              strokeLinecap="round"
              style={{ filter: "drop-shadow(0 0 4px rgba(0,230,118,0.8))" }}
              {...loop(run, still, { pathLength: [0, 1, 1, 0] }, { pathLength: 1 }, { duration: 6, times: [0, 0.3, 0.9, 1], repeatDelay: 0.4 })}
            />
          </svg>
        </Glass>
      </Layer>

      <Layer z={110} run={run} delay={0.6} className="left-[60%] top-[40%] h-[46%] w-[26%]">
        <Glass glow={TONE_GLOW.gold} className="flex flex-col justify-center gap-[9%] px-4">
          {[1, 0, 1, 1, 0].map((up, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-2"
              {...loop(run, still, { x: [12, 0], opacity: [0, 1] }, { x: 0, opacity: 1 }, { duration: 0.5, delay: 0.3 + i * 0.12, repeatDelay: 5.6 })}
            >
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${up ? "bg-(--positive)" : "bg-(--negative)"}`} />
              <Bar w="60%" />
              <PIcon name="star" size={12} weight="fill" className="ms-auto text-(--accent)" />
            </motion.div>
          ))}
        </Glass>
      </Layer>

      <Layer z={170} run={run} bob={10} delay={1.2} className="left-[8%] top-[66%]">
        <span className="rounded-full bg-(--accent) px-3 py-1 text-[12px] font-semibold text-(--text-inverse) shadow-[0_10px_30px_rgba(0,230,118,0.45)]">1D</span>
      </Layer>
      <Orb x="6%" y="18%" z={60} size={22} rgb={TONE_GLOW.gold} run={run} />
      <Orb x="88%" y="20%" z={-60} size={16} rgb={TONE_GLOW.gold} run={run} delay={1} />
      <Orb x="80%" y="82%" z={200} size={12} rgb={TONE_GLOW.gold} run={run} delay={2} />
    </>
  );
}

function ResearchScene({ run, still }: SceneProps) {
  const cards = [
    { z: -80, left: "14%", top: "12%", rot: -6 },
    { z: 0, left: "24%", top: "18%", rot: -2 },
    { z: 80, left: "34%", top: "24%", rot: 3 },
  ];
  return (
    <>
      {cards.map((c, i) => (
        <Layer key={i} z={c.z} run={run} delay={i * 0.4} className="h-[56%] w-[40%]" style={{ left: c.left, top: c.top, rotate: `${c.rot}deg` }}>
          <Glass glow={i === 2 ? TONE_GLOW.cyan : undefined} className="p-5">
            <div className="flex items-center gap-2">
              <AppIcon icon={i === 2 ? "news" : i === 1 ? "calendar" : "book"} tone="cyan" size={26} />
              <Bar w="40%" className="!bg-white/25" />
            </div>
            <div className="mt-5 space-y-2.5">
              <Bar w="92%" />
              <Bar w="80%" />
              <Bar w="86%" />
              <Bar w="52%" />
            </div>
            {i === 2 && (
              <motion.span
                className="mt-5 block h-1.5 rounded-full bg-(--ai)"
                {...loop(run, still, { width: ["0%", "70%", "70%"] }, { width: "70%" }, { duration: 4, times: [0, 0.4, 1] })}
              />
            )}
          </Glass>
        </Layer>
      ))}

      <motion.div
        className="absolute left-[30%] top-[30%] [transform-style:preserve-3d]"
        style={{ z: 170 }}
        {...loop(run, still, { x: [0, 120, 60, 0], y: [0, 30, 90, 0] }, { x: 60, y: 30 }, { duration: 7, ease: "easeInOut" })}
      >
        <span className="grid h-20 w-20 place-items-center rounded-full border-[3px] border-(--ai) bg-[rgba(105,240,174,0.08)] shadow-[0_0_40px_rgba(105,240,174,0.45),inset_0_0_20px_rgba(105,240,174,0.25)]">
          <PIcon name="search" size={30} className="text-(--ai)" />
        </span>
      </motion.div>
      <Orb x="80%" y="16%" z={40} size={18} rgb={TONE_GLOW.cyan} run={run} />
      <Orb x="10%" y="78%" z={140} size={12} rgb={TONE_GLOW.cyan} run={run} delay={1.5} />
    </>
  );
}

function AlertsScene({ run, still }: SceneProps) {
  return (
    <>
      <Layer z={0} run={run} bob={4} className="left-[10%] top-[18%] h-[58%] w-[56%]">
        <Glass className="p-5">
          <Lights />
          <svg viewBox="0 0 100 50" preserveAspectRatio="none" className="absolute inset-x-5 bottom-6 top-12 h-[calc(100%-4.5rem)] w-[calc(100%-2.5rem)]">
            <line x1="0" y1="20" x2="100" y2="20" stroke="#92f9c6" strokeDasharray="3 3" strokeWidth="1" vectorEffect="non-scaling-stroke" />
            <motion.path
              d="M0 40 C 15 38, 25 34, 38 30 S 55 24, 62 20 S 82 10, 100 8"
              fill="none"
              stroke="#00E676"
              strokeWidth="0.9"
              strokeLinecap="round"
              {...loop(run, still, { pathLength: [0, 1, 1] }, { pathLength: 1 }, { duration: 4, times: [0, 0.6, 1] })}
            />
          </svg>
          <motion.span
            className="absolute left-[61%] top-[50%] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#92f9c6] shadow-[0_0_16px_#92f9c6]"
            {...loop(run, still, { scale: [0, 0, 1.4, 1], opacity: [0, 0, 1, 1] }, { scale: 1, opacity: 1 }, { duration: 4, times: [0, 0.4, 0.48, 1] })}
          />
        </Glass>
      </Layer>

      <Layer z={60} run={run} bob={0} className="left-[66%] top-[30%]">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="absolute -left-16 -top-16 h-32 w-32 rounded-full border-2 border-[#92f9c6]"
            {...loop(run, still, { scale: [0.4, 1.6], opacity: [0.7, 0] }, { scale: 1, opacity: 0.25 }, { duration: 2.4, delay: i * 0.8, ease: "easeOut" })}
          />
        ))}
      </Layer>
      <Layer z={140} run={run} bob={10} className="left-[66%] top-[30%]">
        <motion.span
          className="-ml-10 -mt-10 block"
          {...loop(run, still, { rotate: [0, -14, 12, -8, 0, 0] }, { rotate: 0 }, { duration: 2.4, times: [0, 0.1, 0.2, 0.3, 0.4, 1] })}
        >
          <AppIcon icon="bell" tone="purple" size={80} className="shadow-[0_20px_50px_rgba(92,230,161,0.55)]" />
        </motion.span>
      </Layer>

      <Layer z={100} run={run} delay={0.8} className="left-[62%] top-[64%] h-[18%] w-[28%]">
        <Glass className="flex items-center gap-3 px-4">
          <motion.span
            className="relative h-6 w-10 shrink-0 rounded-full"
            {...loop(run, still, { backgroundColor: ["#3a4350", "#00E676", "#00E676"] }, { backgroundColor: "#00E676" }, { duration: 4, times: [0, 0.45, 1] })}
          >
            <motion.span
              className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow"
              {...loop(run, still, { left: ["2px", "18px", "18px"] }, { left: "18px" }, { duration: 4, times: [0, 0.45, 1] })}
            />
          </motion.span>
          <Bar w="70%" />
        </Glass>
      </Layer>
      <Orb x="8%" y="80%" z={120} size={14} rgb={TONE_GLOW.purple} run={run} />
      <Orb x="88%" y="12%" z={-40} size={20} rgb={TONE_GLOW.purple} run={run} delay={1} />
    </>
  );
}

function ReviewScene({ run, still }: SceneProps) {
  const R = 38;
  const C = 2 * Math.PI * R;
  const arcs = [
    { share: 0.42, color: "#00E676" },
    { share: 0.28, color: "#69F0AE" },
    { share: 0.18, color: "#e5484d" },
    { share: 0.12, color: "#00E676" },
  ];
  let acc = 0;
  const segs = arcs.map((a) => {
    const s = { ...a, start: acc };
    acc += a.share;
    return s;
  });

  return (
    <>
      <Layer z={0} run={run} bob={4} className="left-[8%] top-[14%] h-[64%] w-[50%]">
        <Glass className="p-5">
          <div className="flex items-center gap-2">
            <AppIcon icon="journal" tone="red" size={26} />
            <Bar w="34%" className="!bg-white/25" />
          </div>
          <div className="mt-5 space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="flex items-center gap-3 rounded-lg bg-white/[0.04] px-3 py-2"
                {...loop(run, still, { opacity: [0, 1], y: [8, 0] }, { opacity: 1, y: 0 }, { duration: 0.4, delay: i * 0.15, repeatDelay: 5 })}
              >
                <PIcon name="check" size={14} weight="fill" className={i === 2 ? "text-(--text-muted)" : "text-(--positive)"} />
                <Bar w="55%" />
                <Bar w="14%" className="ms-auto" />
              </motion.div>
            ))}
          </div>
        </Glass>
      </Layer>

      <Layer z={120} run={run} delay={0.5} className="left-[56%] top-[20%] h-[50%] w-[30%]">
        <Glass glow={TONE_GLOW.red} className="grid place-items-center">
          <motion.svg
            viewBox="0 0 100 100"
            className="h-[78%] w-[78%] -rotate-90"
            {...loop(run, still, { rotate: [-90, 270] }, { rotate: -90 }, { duration: 24, ease: "linear" })}
          >
            <circle cx="50" cy="50" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="12" />
            {segs.map((s, i) => (
              <motion.circle
                key={i}
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={s.color}
                strokeWidth="12"
                strokeDashoffset={-s.start * C}
                {...loop(
                  run,
                  still,
                  { strokeDasharray: [`0 ${C}`, `${s.share * C - 2} ${C}`] },
                  { strokeDasharray: `${s.share * C - 2} ${C}` },
                  { duration: 0.9, delay: 0.3 + i * 0.2, repeatDelay: 5, ease: "easeOut" },
                )}
              />
            ))}
          </motion.svg>
        </Glass>
      </Layer>

      <Layer z={180} run={run} bob={10} delay={1} className="left-[46%] top-[66%] flex h-[18%] items-end gap-2">
        {[0.5, 0.8, 0.35, 1, 0.65].map((h, i) => (
          <motion.span
            key={i}
            className="w-3 origin-bottom rounded-sm"
            style={{ height: `${h * 100}%`, background: i === 2 ? "var(--negative)" : "var(--positive)", boxShadow: "0 8px 20px rgba(0,0,0,0.5)" }}
            {...loop(run, still, { scaleY: [0, 1, 1] }, { scaleY: 1 }, { duration: 3, times: [0, 0.25, 1], delay: i * 0.1 })}
          />
        ))}
      </Layer>
      <Orb x="88%" y="76%" z={60} size={16} rgb={TONE_GLOW.red} run={run} />
      <Orb x="4%" y="10%" z={-40} size={20} rgb={TONE_GLOW.red} run={run} delay={1.4} />
    </>
  );
}

function CommunityScene({ run, still }: SceneProps) {
  const bubbles = [
    { z: 60, left: "38%", top: "16%", w: "34%", me: false },
    { z: 120, left: "50%", top: "38%", w: "30%", me: true },
    { z: 180, left: "36%", top: "60%", w: "38%", me: false },
  ];
  return (
    <>
      <Layer z={-20} run={run} bob={4} className="left-[8%] top-[14%] h-[66%] w-[26%]">
        <Glass className="p-4">
          {["#", "#", "#", "#"].map((_, i) => (
            <div key={i} className={`mb-2.5 flex items-center gap-2 rounded-md px-2 py-1.5 ${i === 1 ? "bg-[rgba(0,230,118,0.18)]" : ""}`}>
              <span className="text-[12px] font-semibold text-(--text-muted)">#</span>
              <Bar w={`${50 + i * 10}%`} />
            </div>
          ))}
        </Glass>
      </Layer>

      {bubbles.map((b, i) => (
        <Layer key={i} z={b.z} run={run} delay={i * 0.5} className="h-[17%]" style={{ left: b.left, top: b.top, width: b.w }}>
          <motion.div
            className="flex h-full items-center gap-3"
            {...loop(
              run,
              still,
              { opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.9] },
              { opacity: 1, scale: 1 },
              { duration: 6, times: [0, 0.08, 0.85, 1], delay: i * 0.9, repeatDelay: 0.6 },
            )}
            style={{ transformOrigin: b.me ? "100% 100%" : "0% 100%" }}
          >
            {!b.me && <Avatar tone={i === 0 ? "#69F0AE" : "#00E676"} />}
            <div
              className={`flex h-full flex-1 flex-col justify-center gap-2 rounded-2xl px-4 shadow-[0_20px_40px_rgba(0,0,0,0.5)] ${
                b.me ? "rounded-br-sm bg-[linear-gradient(180deg,#5fe3b6,#1fa77c)]" : "rounded-bl-sm bg-[linear-gradient(160deg,#353b38,#1d211f)]"
              }`}
            >
              <Bar w="85%" className={b.me ? "!bg-black/25" : ""} />
              <Bar w="55%" className={b.me ? "!bg-black/25" : ""} />
            </div>
          </motion.div>
        </Layer>
      ))}

      <Layer z={220} run={run} bob={12} delay={1.5} className="left-[78%] top-[66%]">
        <span className="flex items-center gap-1 rounded-full bg-[#262a28] px-3 py-2 shadow-[0_14px_30px_rgba(0,0,0,0.5)]">
          {[0, 1, 2].map((i) => (
            <motion.span
              key={i}
              className="h-1.5 w-1.5 rounded-full bg-(--text-secondary)"
              {...loop(run, still, { y: [0, -3, 0] }, { y: 0 }, { duration: 0.9, delay: i * 0.15 })}
            />
          ))}
        </span>
      </Layer>
      <Orb x="86%" y="14%" z={40} size={18} rgb={TONE_GLOW.green} run={run} />
      <Orb x="30%" y="84%" z={140} size={12} rgb={TONE_GLOW.green} run={run} delay={1} />
    </>
  );
}

function Avatar({ tone }: { tone: string }) {
  return (
    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full" style={{ background: `linear-gradient(180deg, ${tone}, rgba(0,0,0,0.4))` }}>
      <PIcon name="user" size={18} weight="fill" className="text-white/90" />
    </span>
  );
}
