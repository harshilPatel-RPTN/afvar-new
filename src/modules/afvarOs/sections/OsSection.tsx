"use client";

// One page section after a hero: the AFVAR OS doing what the section says.
// Desktop (≥1024px): the section pins for `vh` of scroll; the caption sits on
// top, the OS screen below, and windows / asks / toasts appear in order as the
// section's own scroll progress `p` passes their `at`. Phones, tablets and
// reduced motion: the same windows, stacked as cards in normal flow.
//
//   <OsSection n={2} label="Sources" title="Every quote arrives labelled." soft="Live, delayed or stored." body="…">
//     <Win at={0.1} x={40} y={60} w={560} h={240} title="Data sources" glyph="chart">…</Win>
//     <Ask at={0.3} x={620} y={40} w={520} text="Add Bitcoin to my watchlist" />
//   </OsSection>
import { motion, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext, useEffect, useRef, type ReactNode } from "react";
import { EYEBROW, MONO } from "../theme";
import { ramp } from "../story/timeline";
import { useAfvarReducedMotion } from "../story/useStory";
import { useMedia } from "../film/hooks";
import { AiOrb, Dock, MenuBar, OsScreen, type AppGlyphName, type DockItem } from "../os/chrome";
import { OsWindow } from "../os/window";

type Mode = "desk" | "stack";
const Ctx = createContext<{ p: MotionValue<number>; mode: Mode } | null>(null);
export function useSection() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSection outside <OsSection>");
  return c;
}

const DOCK: DockItem[] = [
  { id: "charts", label: "Market data", glyph: "chart" },
  { id: "research", label: "Research", glyph: "research" },
  { id: "alerts", label: "Alerts", glyph: "alerts" },
  { id: "risk", label: "Risk review", glyph: "risk" },
  { id: "community", label: "Community", glyph: "community" },
];

export function OsSection({
  n,
  label,
  title,
  soft,
  body,
  vh = 240,
  app = "Workspace",
  active,
  children,
}: {
  /** Section number on the page (the hero is 1). */
  n: number;
  label: string;
  title: string;
  soft?: string;
  body?: string;
  /** Scroll length on desktop. */
  vh?: number;
  /** App name in the OS menu bar. */
  app?: string;
  /** Dock item marked as running. */
  active?: string;
  children: ReactNode;
}) {
  const wide = useMedia("(min-width: 1024px)");
  const reduced = useAfvarReducedMotion();
  const mode: Mode = wide && !reduced ? "desk" : "stack";
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: mode === "desk" ? ["start start", "end end"] : ["start 0.9", "end 0.6"] });
  const id = `s${String(n).padStart(2, "0")}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const caption = (
    <header className={mode === "desk" ? "max-w-[46rem]" : ""}>
      <p className={EYEBROW}>
        {String(n).padStart(2, "0")} · {label}
      </p>
      <h2 id={`${id}-t`} className="mt-3 text-[clamp(1.7rem,2.6vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F2F5F2]">
        {title} {soft ? <span className="text-[#B7C5BC]">{soft}</span> : null}
      </h2>
      {body ? <p className="mt-3 max-w-[40rem] text-[15px] leading-relaxed text-[#B7C5BC]">{body}</p> : null}
    </header>
  );
  return (
    <Ctx.Provider value={{ p: scrollYProgress, mode }}>
      <section ref={ref} id={id} aria-labelledby={`${id}-t`} className="relative bg-transparent" style={mode === "desk" ? { height: `${vh}vh` } : undefined}>
        {mode === "desk" ? (
          <div className="sticky top-0 h-svh overflow-hidden">
            <div className="absolute left-[4vw] right-[4vw] top-[96px]">{caption}</div>
            <div className="absolute inset-x-[4vw] bottom-[2.5vh] top-[288px]">
              <OsScreen className="h-full w-full" label={`AFVAR OS — ${label}, illustration`}>
                <MenuBar menus={[app, "File", "View", "Window"]} space="Space 1" />
                <div className="absolute inset-x-0 bottom-[72px] top-[30px]">{children}</div>
                <Dock items={DOCK.map((d) => ({ ...d, running: d.id === active }))} />
              </OsScreen>
            </div>
          </div>
        ) : (
          <div className="px-5 py-10 sm:px-8 sm:py-14">
            {caption}
            <div className="mt-6 flex flex-col gap-3">{children}</div>
          </div>
        )}
      </section>
    </Ctx.Provider>
  );
}

/** Opacity / rise for something that appears at section progress `at` (and leaves at `out`). */
export function useAppear(at: number, out?: number) {
  const { p } = useSection();
  const opacity = useTransform(p, (v) => ramp(v, at, at + 0.07) * (out === undefined ? 1 : 1 - ramp(v, out, out + 0.07)));
  const y = useTransform(p, (v) => 18 * (1 - ramp(v, at, at + 0.07)));
  return { opacity, y };
}

/** 0→1 between `a` and `b` of the section's progress (e.g. to draw AI lines). */
export function useSectionRamp(a: number, b: number) {
  const { p } = useSection();
  return useTransform(p, (v) => ramp(v, a, b));
}

/** A window on the OS desktop (design px inside a 1200×558 desktop); a card on phones. */
export function Win({
  at = 0,
  out,
  x,
  y,
  w,
  h,
  title,
  glyph = "chart",
  ai = false,
  z,
  children,
}: {
  at?: number;
  out?: number;
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  glyph?: AppGlyphName;
  ai?: boolean;
  z?: number;
  children: ReactNode;
}) {
  const { mode } = useSection();
  const { opacity, y: rise } = useAppear(at, out);
  if (mode === "stack") {
    return (
      // Cards size to their content on phones and tablets: no empty bottoms, nothing cut off.
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.4 }} className="relative">
        <OsWindow title={title} glyph={glyph} aiOwned={ai} style={{ position: "relative", inset: "auto" }}>
          <div className="p-3">{children}</div>
        </OsWindow>
      </motion.div>
    );
  }
  return (
    <OsWindow title={title} glyph={glyph} aiOwned={ai} z={z} style={{ left: x, top: y, width: w, height: h, opacity, y: rise }}>
      <div className="h-full overflow-hidden p-3.5">{children}</div>
    </OsWindow>
  );
}

/** A Spotlight-style request that types itself in. */
export function Ask({ at = 0, x = 40, y = 16, w = 560, text, voice = false }: { at?: number; x?: number; y?: number; w?: number; text: string; voice?: boolean }) {
  const { p, mode } = useSection();
  const { opacity, y: rise } = useAppear(at);
  const span = useRef<HTMLSpanElement>(null);
  const write = (v: number) => {
    if (span.current) span.current.textContent = mode === "stack" ? text : text.slice(0, Math.round(text.length * ramp(v, at + 0.02, at + 0.12)));
  };
  useEffect(() => write(p.get()));
  useMotionValueEvent(p, "change", write);
  const inner = (
    <>
      <AiOrb size={10} />
      <span ref={span} className="truncate">
        {mode === "stack" ? text : ""}
      </span>
      <span className="afv-caret" aria-hidden="true" />
      <span className="ml-auto font-mono text-[10px] tracking-[0.1em] text-[#92A399]">{voice ? "VOICE" : "↵"}</span>
    </>
  );
  const cls = "flex items-center gap-2.5 rounded-xl border border-[rgba(168,222,194,0.55)] bg-[rgba(15,18,20,0.97)] px-3.5 py-2.5 text-[14px] text-[#F2F5F2] shadow-[0_10px_30px_rgba(0,0,0,0.5)]";
  if (mode === "stack") return <div className={cls}>{inner}</div>;
  return (
    <motion.div className={`absolute z-30 ${cls}`} style={{ left: x, top: y, width: w, opacity, y: rise }}>
      {inner}
    </motion.div>
  );
}

/** A notification toast. */
export function Note({ at = 0, x = 820, y = 20, w = 340, title, sub }: { at?: number; x?: number; y?: number; w?: number; title: string; sub?: string }) {
  const { mode } = useSection();
  const { opacity, y: rise } = useAppear(at);
  const inner = (
    <>
      <b className="block text-[13px] font-semibold text-[#F2F5F2]">{title}</b>
      {sub ? <span className="mt-0.5 block font-mono text-[10px] tracking-[0.06em] text-[#B7C5BC]">{sub}</span> : null}
    </>
  );
  const cls = "rounded-[10px] border border-[rgba(168,222,194,0.5)] bg-[#10231B] px-3 py-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.5)]";
  if (mode === "stack") return <div className={cls}>{inner}</div>;
  return (
    <motion.div className={`absolute z-30 ${cls}`} style={{ left: x, top: y, width: w, opacity, y: rise }}>
      {inner}
    </motion.div>
  );
}

/** The AFVAR avatar speaking once in this section (its portrait + a speech line). */
export function AvatarLine({ at = 0, x = 760, y = 400, text }: { at?: number; x?: number; y?: number; text: string }) {
  const { mode } = useSection();
  const { opacity, y: rise } = useAppear(at);
  const inner = (
    <>
      <span className="max-w-[260px] rounded-[12px_12px_2px_12px] border border-[rgba(168,222,194,0.5)] bg-[#10231B] px-3 py-2 text-[13px] text-[#F2F5F2]">{text}</span>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/avatar/launcher.png" alt="AFVAR avatar" width={60} height={60} className="h-[60px] w-[60px] rounded-full border border-[rgba(0,230,118,0.35)] bg-[#10231B]" />
    </>
  );
  if (mode === "stack") return <div className="flex items-end justify-end gap-2">{inner}</div>;
  return (
    <motion.div className="absolute z-30 flex items-end gap-2" style={{ left: x, top: y, opacity, y: rise }}>
      {inner}
    </motion.div>
  );
}

/** A small mono label (e.g. "By hand") on the desktop. */
export function DeskLabel({ at = 0, x, y, children }: { at?: number; x: number; y: number; children: ReactNode }) {
  const { mode } = useSection();
  const { opacity } = useAppear(at);
  if (mode === "stack") return <p className={`${MONO} text-[#A8DEC2]`}>{children}</p>;
  return (
    <motion.span className={`${MONO} absolute text-[#A8DEC2]`} style={{ left: x, top: y, opacity }}>
      {children}
    </motion.span>
  );
}
