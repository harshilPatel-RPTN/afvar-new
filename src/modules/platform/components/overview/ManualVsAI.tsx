"use client";

import { AnimatePresence, motion, useInView, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { getCapability } from "../../content";
import { AppIcon } from "../mac/AppIcon";
import { PIcon } from "../mac/icons";
import { Reveal } from "../mac/Reveal";
import { SectionHeading } from "../shared";

const CHARTS = getCapability("charts")!;
const COMMAND = "Open Gold chart 1D";
// 0 idle · 1 reach · 2 window opens · 3 pick 1D · 4 receipt · 5 hold
const BEATS = [900, 1000, 900, 900, 2200, 600];

/**
 * "Two ways. One result." — the same action done with manual controls and
 * with the AI, side by side, ending in the same verified receipt (board D.0:
 * both paths share actions and state; F.01 shell.window.open).
 */
export function ManualVsAI() {
  const still = useReducedMotion() ?? false;
  const ref = useRef<HTMLDivElement>(null);
  const visible = useInView(ref, { amount: 0.4 });
  const [beat, setBeat] = useState(still ? 4 : 0);
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (still || !visible) return;
    const t = setTimeout(() => setBeat((b) => (b + 1) % BEATS.length), BEATS[beat]);
    return () => clearTimeout(t);
  }, [beat, still, visible]);

  useEffect(() => {
    if (still || beat !== 1) return;
    const timers = Array.from(COMMAND, (_, i) => setTimeout(() => setTyped(COMMAND.slice(0, i + 1)), i * 38));
    return () => timers.forEach(clearTimeout);
  }, [beat, still]);

  return (
    <section aria-labelledby="two-ways-title" className="px-4 py-20 sm:px-6 sm:py-28">
      <SectionHeading id="two-ways-title" title="Two ways. One result." summary="Click it yourself or just ask. Both reach the same action and the same verified result." />
      <div ref={ref} className="mx-auto mt-16 grid max-w-6xl gap-5 lg:grid-cols-2" aria-hidden="true">
        <Reveal>
          <Pane label="Manual controls" icon="sliders">
            <MiniDesktop beat={beat} way="manual" typed="" />
          </Pane>
        </Reveal>
        <Reveal delay={0.08}>
          <Pane label="Ask AFVAR" icon="sparkle">
            <MiniDesktop beat={beat} way="ai" typed={beat >= 1 ? (still ? COMMAND : typed) : ""} />
          </Pane>
        </Reveal>
      </div>
      <p className="sr-only">
        On the left a trader opens the Gold chart from the Dock and picks the 1D timeframe; on the right the trader types “{COMMAND}”. Both end with the same verified window.
      </p>
    </section>
  );
}

function Pane({ label, icon, children }: { label: string; icon: "sliders" | "sparkle"; children: React.ReactNode }) {
  return (
    <div className="pf-tile p-6 sm:p-8">
      <p className="flex items-center gap-2 text-[15px] font-semibold">
        <PIcon name={icon} size={18} weight="duotone" className="text-(--accent)" /> {label}
      </p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function MiniDesktop({ beat, way, typed }: { beat: number; way: "manual" | "ai"; typed: string }) {
  const opened = beat >= 2 && beat <= 5;
  const tf = way === "ai" ? (opened ? "1D" : null) : beat >= 3 ? "1D" : opened ? "1H" : null;
  const receipt = beat >= 4;
  const cursor =
    way === "manual"
      ? beat === 1 || beat === 2
        ? { x: 36, y: 88 }
        : beat === 3
          ? { x: 28, y: 30 }
          : { x: 70, y: 60 }
      : null;

  return (
    <div className="pf-wall-night relative aspect-[16/10] overflow-hidden rounded-xl">
      <div className="pf-menubar absolute inset-x-0 top-0 z-20 !h-5 !text-[10px]">
        <span className="font-bold">AFVAR</span>
      </div>

      <AnimatePresence>
        {way === "ai" && beat === 1 && (
          <motion.div
            className="pf-vibrant absolute left-1/2 top-[22%] z-30 w-[78%] -translate-x-1/2 rounded-[10px] px-3 py-2.5"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.15 }}
          >
            <span className="flex items-center gap-2 text-[13px] font-light">
              <PIcon name="search" size={14} className="text-(--text-secondary)" />
              {typed}
              <span className="pf-caret" />
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {opened && (
          <motion.div
            className="pf-window absolute left-[8%] top-[14%] z-10 flex h-[58%] w-[64%] flex-col"
            style={{ transformOrigin: "30% 130%" }}
            initial={{ opacity: 0, scale: 0.1 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 28 }}
          >
            <div className="flex h-5 items-center gap-1 px-2">
              <span className="h-1.5 w-1.5 rounded-full bg-(--light-close)" />
              <span className="h-1.5 w-1.5 rounded-full bg-(--light-minimize)" />
              <span className="h-1.5 w-1.5 rounded-full bg-(--light-zoom)" />
              <span className="ms-2 text-[9px] text-(--text-muted)">Gold — Sample</span>
            </div>
            <div className="flex gap-1 px-2">
              {["1H", "1D"].map((t) => (
                <span key={t} className={`rounded px-1.5 text-[9px] ${tf === t ? "bg-(--accent) text-(--text-inverse)" : "text-(--text-muted)"}`}>
                  {t}
                </span>
              ))}
            </div>
            <svg viewBox="0 0 120 40" preserveAspectRatio="none" className="mt-1 h-full w-full px-2 pb-2">
              <path d="M0 32 C 15 30, 22 18, 35 21 S 55 34, 70 24 S 95 8, 120 12" fill="none" stroke="#00E676" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
            </svg>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {receipt && (
          <motion.div
            className="pf-vibrant absolute bottom-[16%] right-[4%] z-30 rounded-[10px] px-3 py-2 font-mono text-[10px]"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <p className="text-(--text-secondary)">shell.window.open</p>
            <p className="text-(--text-primary)">Gold · 1D</p>
            <p className="flex items-center gap-1 text-(--positive)">
              <PIcon name="check" size={10} weight="fill" /> verified
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pf-dock pf-vibrant absolute bottom-1.5 left-1/2 z-20 !gap-1 !rounded-[10px] !p-1 -translate-x-1/2">
        {["charts", "research", "alerts"].map((slug) => {
          const c = getCapability(slug)!;
          return <AppIcon key={slug} icon={c.icon} tone={c.tone} size={c.slug === CHARTS.slug && way === "manual" && beat === 2 ? 26 : 20} />;
        })}
      </div>

      {cursor && (
        <motion.svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          className="absolute z-40"
          animate={{ left: `${cursor.x}%`, top: `${cursor.y}%` }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          style={{ filter: "drop-shadow(0 1px 2px rgba(0,0,0,0.7))" }}
        >
          <path d="M4 2.5v17.2l4.6-4.4 3 6.6 3.1-1.4-3-6.4h6.3z" fill="#fff" stroke="#000" strokeWidth="1.2" />
        </motion.svg>
      )}
    </div>
  );
}
