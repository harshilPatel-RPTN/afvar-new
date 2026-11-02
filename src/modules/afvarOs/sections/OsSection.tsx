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
//
// Motion layer (docs/PLATFORM-SCROLL-MOTION-PLAN.md, behind PLATFORM_MOTION; reduced
// motion = finished state): desk B1 caption word-light, B2 window open/close, B4
// hand-off, B5 chart reveal, B6 Ask send, B8 dock bounce; stack C1 header, C2 card
// order, C3 Ask typing, C5 chart reveal, C6 toast, C7 avatar, C8 sticky eyebrow.
import { animate, motion, useMotionValue, useMotionValueEvent, useScroll, useTransform, type MotionValue } from "framer-motion";
import { createContext, useContext, useEffect, useRef, type ReactNode, type RefObject } from "react";
import { EYEBROW, MONO } from "../theme";
import { ramp } from "../story/timeline";
import { useAfvarReducedMotion } from "../story/useStory";
import { useMedia } from "../film/hooks";
import { AiOrb, Dock, MenuBar, OsScreen, type AppGlyphName, type DockItem } from "../os/chrome";
import { OsWindow } from "../os/window";
import { PLATFORM_MOTION } from "../motion/flag";
import { PLATFORM_READING_FOCUS, useEnterQueue, useMotionOn, useOnEnter, useSettle, type EnterQueue } from "../motion/enter";

type Mode = "desk" | "stack";
const Ctx = createContext<{ p: MotionValue<number>; mode: Mode; on: boolean; queue: EnterQueue } | null>(null);
export function useSection() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useSection outside <OsSection>");
  return c;
}

/** The window / card a piece of content sits in: its `at`, and (stacked) 1 once it has entered. */
const CardCtx = createContext<{ at: number; entered: MotionValue<number> } | null>(null);

const EASE = [0.22, 1, 0.36, 1] as const;
/** 0 → 1 → 0 across [a, b]. */
const bump = (v: number, a: number, b: number) => (v <= a || v >= b ? 0 : Math.sin(((v - a) / (b - a)) * Math.PI));

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
  const on = useMotionOn();
  const mode: Mode = wide && !reduced ? "desk" : "stack";
  const ref = useRef<HTMLElement>(null);
  const capRef = useRef<HTMLElement>(null);
  const queue = useEnterQueue(130);
  const { scrollYProgress } = useScroll({ target: ref, offset: mode === "desk" ? ["start start", "end end"] : ["start 0.9", "end 0.6"] });
  const id = `s${String(n).padStart(2, "0")}-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const eyebrow = `${String(n).padStart(2, "0")} · ${label}`;
  return (
    <Ctx.Provider value={{ p: scrollYProgress, mode, on, queue }}>
      <section ref={ref} id={id} aria-labelledby={`${id}-t`} className={`relative bg-transparent ${mode === "stack" ? "overflow-x-clip" : ""}`} style={mode === "desk" ? { height: `${vh}vh` } : undefined}>
        {mode === "desk" ? (
          <DeskStage p={scrollYProgress} on={on} label={label} app={app} active={active} caption={<DeskCaption id={id} eyebrow={eyebrow} title={title} soft={soft} body={body} />}>
            {children}
          </DeskStage>
        ) : (
          <>
            {on ? <StickyEyebrow section={ref} caption={capRef} text={eyebrow} /> : null}
            <div className="px-5 py-10 sm:px-8 sm:py-14">
              <StackCaption capRef={capRef} id={id} eyebrow={eyebrow} title={title} soft={soft} body={body} />
              <div className="mt-6 flex flex-col gap-3">{children}</div>
            </div>
          </>
        )}
      </section>
    </Ctx.Provider>
  );
}

const H2_CLS = "mt-3 text-[clamp(1.7rem,2.6vw,2.6rem)] font-semibold leading-[1.08] tracking-[-0.03em] text-[#F2F5F2]";
const BODY_CLS = "mt-3 max-w-[40rem] text-[15px] leading-relaxed text-[#B7C5BC]";

/* ------------------------------------------------------------------ desk */

function DeskStage({ p, on, label, app, active, caption, children }: { p: MotionValue<number>; on: boolean; label: string; app: string; active?: string; caption: ReactNode; children: ReactNode }) {
  // B4: the OS screen steps back as the section hands over to the next one.
  const scale = useTransform(p, (v) => 1 - 0.03 * ramp(v, 0.9, 1));
  const dim = useTransform(p, (v) => 1 - 0.4 * ramp(v, 0.9, 1));
  // B8: the running dock app bounces once as the section begins.
  const bounce = useMotionValue(0);
  const bounced = useRef(false);
  useMotionValueEvent(p, "change", (v) => {
    if (!on || bounced.current || v < 0.004) return;
    bounced.current = true;
    animate(bounce, [0, -14, 0, -5, 0], { duration: 0.95, ease: "easeOut" });
  });
  return (
    <div className="sticky top-0 h-svh overflow-hidden">
      {/* Caption on top, the OS screen in the rest (from 288 px down; lower if a long caption needs it). */}
      <div className="absolute inset-x-[4vw] bottom-[2.5vh] top-[96px] flex flex-col">
        <div className="min-h-[168px] shrink-0">{caption}</div>
        <motion.div className="relative mt-6 min-h-0 flex-1 origin-top" style={on ? { scale, opacity: dim } : { scale: 1, opacity: 1 }}>
          <OsScreen className="h-full w-full" label={`AFVAR OS — ${label}, illustration`}>
            <MenuBar menus={[app, "File", "View", "Window"]} space="Space 1" />
            <div className="absolute inset-x-0 bottom-[72px] top-[30px]">{children}</div>
            <Dock items={DOCK.map((d) => ({ ...d, running: d.id === active }))} bounce={on ? bounce : undefined} />
          </OsScreen>
        </motion.div>
      </div>
    </div>
  );
}

/** B1: the title's words brighten over the first 15 % of the section; the body follows. */
function DeskCaption({ id, eyebrow, title, soft, body }: { id: string; eyebrow: string; title: string; soft?: string; body?: string }) {
  const { p, on } = useSection();
  const tw = title.split(" ");
  const sw = soft ? soft.split(" ") : [];
  const total = tw.length + sw.length;
  const bodyO = useTransform(p, (v) => 0.35 + 0.65 * ramp(v, 0.12, 0.2));
  const word = (w: string, i: number) => (on ? <Word key={i} p={p} i={i} n={total} text={w} /> : w);
  const join = (ws: string[], from: number) => ws.flatMap((w, i) => (i ? [" ", word(w, from + i)] : [word(w, from + i)]));
  return (
    <header className="max-w-[46rem]">
      <p className={EYEBROW}>{eyebrow}</p>
      <h2 id={`${id}-t`} className={H2_CLS}>
        {join(tw, 0)} {soft ? <span className="text-[#B7C5BC]">{join(sw, tw.length)}</span> : null}
      </h2>
      {body ? (
        <motion.p className={BODY_CLS} style={{ opacity: on ? bodyO : 1 }}>
          {body}
        </motion.p>
      ) : null}
    </header>
  );
}

function Word({ p, i, n, text }: { p: MotionValue<number>; i: number; n: number; text: string }) {
  const a = (0.15 * i) / n;
  const opacity = useTransform(p, (v) => 0.35 + 0.65 * ramp(v, a, a + 0.15 / n + 0.02));
  return <motion.span style={{ opacity }}>{text}</motion.span>;
}

/* ----------------------------------------------------------------- stack */

/** C1: the eyebrow types itself, then the title wipes in, once in view. */
function StackCaption({ capRef: ref, id, eyebrow, title, soft, body }: { capRef: RefObject<HTMLElement | null>; id: string; eyebrow: string; title: string; soft?: string; body?: string }) {
  const { on } = useSection();
  const type = useMotionValue(on ? 0 : 1);
  const wipe = useMotionValue(on ? 0 : 1);
  const chars = eyebrow.length;
  useOnEnter(ref, on, () => {
    animate(type, 1, { duration: 0.6, ease: (t: number) => Math.floor(t * chars) / chars });
    animate(wipe, 1, { delay: 0.35, duration: 0.9, ease: EASE });
  });
  useSettle(on, type, wipe);
  const eyeClip = useTransform(type, (v) => (v >= 1 ? "none" : `inset(0 ${(1 - v) * 100}% 0 0)`));
  const titleClip = useTransform(wipe, (v) => (v >= 1 ? "none" : `inset(-0.2em ${(1 - v) * 100}% -0.2em 0)`));
  const bodyO = useTransform(wipe, [0.4, 1], [0, 1]);
  return (
    <header ref={ref}>
      <p className={EYEBROW}>
        <motion.span className="inline-block" style={{ clipPath: eyeClip }}>
          {eyebrow}
        </motion.span>
      </p>
      <motion.h2 id={`${id}-t`} className={H2_CLS} style={{ clipPath: titleClip }}>
        {title} {soft ? <span className="text-[#B7C5BC]">{soft}</span> : null}
      </motion.h2>
      {body ? (
        <motion.p className={BODY_CLS} style={{ opacity: bodyO }}>
          {body}
        </motion.p>
      ) : null}
    </header>
  );
}

/**
 * C8: "02 · Two ways" pinned under the navbar (72 px, never hides) while this
 * section's cards scroll — after its caption has gone, before the section ends.
 * Text comes from a data attribute (no second copy of the words in the DOM);
 * it ignores the pointer, so it never blocks a tap.
 */
function StickyEyebrow({ section, caption, text }: { section: RefObject<HTMLElement | null>; caption: RefObject<HTMLElement | null>; text: string }) {
  const { scrollYProgress: inP } = useScroll({ target: caption, offset: ["end 120px", "end 72px"] });
  const { scrollYProgress: outP } = useScroll({ target: section, offset: ["end 190px", "end 130px"] });
  const opacity = useTransform([inP, outP], ([a, b]: number[]) => a * (1 - b));
  // The scrim holds for the whole time the section passes under the navbar (from its top edge to its
  // last 40 px), so adjacent sections hand it over without a gap in which cards show through the logo.
  const { scrollYProgress: scrimIn } = useScroll({ target: section, offset: ["start start", "start -40px"] });
  const { scrollYProgress: scrimOut } = useScroll({ target: section, offset: ["end 40px", "end 0px"] });
  const scrim = useTransform([scrimIn, scrimOut], ([a, b]: number[]) => a * (1 - b));
  return (
    <div aria-hidden="true" className="pointer-events-none sticky top-0 z-20 h-0">
      {/* Scrim behind the (transparent) navbar and the label: cards scrolling up pass under it instead of through the logo. */}
      <motion.span style={{ opacity: scrim }} className="absolute inset-x-0 top-0 block h-[116px] bg-[linear-gradient(to_bottom,#050607_0%,#050607_66%,rgba(5,6,7,0)_100%)]" />
      <motion.span
        data-label={text}
        style={{ opacity }}
        className={`${MONO} absolute left-5 top-[80px] rounded-full border border-[rgba(255,255,255,0.12)] bg-[rgba(5,6,7,0.92)] px-2.5 py-1 text-[10px] text-[#A8DEC2] before:content-[attr(data-label)] sm:left-8`}
      />
    </div>
  );
}

type EnterKind = "card" | "toast" | "plain";

/** C2: a stacked card that enters in order (scale .97 → 1, ~130 ms apart, 0.9 s), once. */
function StackCard({ kind = "card", hold, at, className, children, onEnter }: { kind?: EnterKind; hold?: number; at: number; className?: string; children: ReactNode; onEnter?: (delay: number) => void }) {
  const { on, queue } = useSection();
  const ref = useRef<HTMLDivElement>(null);
  const t = useMotionValue(on ? 0 : 1);
  const entered = useMotionValue(on ? 0 : 1);
  useOnEnter(ref, on, () => {
    const d = queue.claim(hold) / 1000;
    animate(t, 1, { delay: d, duration: 0.9, ease: EASE });
    window.setTimeout(() => entered.set(1), d * 1000);
    onEnter?.(d);
  });
  const scale = useTransform(t, [0, 1], [0.97, 1]);
  const x = useTransform(t, [0, 1], [24, 0]);
  useSettle(on, t, entered);
  const style = kind === "toast" ? { opacity: t, x } : kind === "card" ? { opacity: t, scale, transformOrigin: "50% 0%" } : { opacity: t };
  const inner = <CardCtx.Provider value={{ at, entered }}>{children}</CardCtx.Provider>;
  if (!PLATFORM_MOTION) {
    // Motion layer off: the earlier one-shot fade.
    return (
      <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-10%" }} transition={{ duration: 0.4 }} className={className}>
        {inner}
      </motion.div>
    );
  }
  const body = (
    <motion.div ref={ref} className={className} style={style}>
      {inner}
    </motion.div>
  );
  return PLATFORM_READING_FOCUS && on && kind === "card" ? <ReadingFocus>{body}</ReadingFocus> : body;
}

/** C2 reading focus (behind PLATFORM_READING_FOCUS): off-centre cards recede slightly. */
function ReadingFocus({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const off = useTransform(scrollYProgress, (v) => Math.min(1, Math.abs(v - 0.5) * 2.6));
  const opacity = useTransform(off, [0, 1], [1, 0.82]);
  const scale = useTransform(off, [0, 1], [1, 0.985]);
  return (
    <motion.div ref={ref} style={{ opacity, scale }}>
      {children}
    </motion.div>
  );
}

/* --------------------------------------------------------------- content */

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

/**
 * B5 / C5: how much of the window's content to reveal (0 → 1). Desk: tied to the
 * window's `at` (over `span` of the section). Stacked: plays for `ms` once the card
 * enters. Undefined when the motion layer is off (show everything).
 */
export function useWinReveal(span = 0.15, ms = 1200): MotionValue<number> | undefined {
  const { p, mode, on } = useSection();
  const card = useContext(CardCtx);
  const at = card?.at ?? 0;
  const desk = useTransform(p, (v) => ramp(v, at, at + span));
  const stack = useMotionValue(card && card.entered.get() < 1 ? 0 : 1);
  const fallback = useMotionValue(1);
  useMotionValueEvent(card?.entered ?? fallback, "change", (v) => {
    if (v >= 1) animate(stack, 1, { duration: ms / 1000, ease: [0.4, 0, 0.2, 1] });
  });
  if (!on) return undefined;
  return mode === "desk" ? desk : stack;
}

/** Stacked: calls `cb` when the card around the caller enters (motion layer on only). */
export function useCardEntered(cb: () => void) {
  const card = useContext(CardCtx);
  const fallback = useMotionValue(0);
  useMotionValueEvent(card?.entered ?? fallback, "change", (v) => {
    if (v >= 1) cb();
  });
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
  const { p, mode, on } = useSection();
  const { opacity, y: rise } = useAppear(at, out);
  // B2: windows open from .96 (top-left) with a brief mint edge; `out` closes to .98.
  const scale = useTransform(p, (v) => 0.96 + 0.04 * ramp(v, at, at + 0.07) - (out === undefined ? 0 : 0.02 * ramp(v, out, out + 0.07)));
  const flash = useTransform(p, (v) => 0.9 * bump(v, at + 0.03, at + 0.11));
  const still = useMotionValue(1);
  if (mode === "stack") {
    return (
      // Cards size to their content on phones and tablets: no empty bottoms, nothing cut off.
      <StackCard at={at} className="afv-stack relative">
        <OsWindow title={title} glyph={glyph} aiOwned={ai} style={{ position: "relative", inset: "auto" }}>
          <div className="p-3">{children}</div>
        </OsWindow>
      </StackCard>
    );
  }
  return (
    <OsWindow
      title={title}
      glyph={glyph}
      aiOwned={ai}
      z={z}
      flash={on ? flash : undefined}
      style={{ left: x, top: y, width: w, height: h, opacity, y: rise, ...(on ? { scale, transformOrigin: "0% 0%" } : { scale: 1 }) }}
    >
      <CardCtx.Provider value={{ at, entered: still }}>
        <div className="h-full overflow-hidden p-3.5">{children}</div>
      </CardCtx.Provider>
    </OsWindow>
  );
}

/** A Spotlight-style request that types itself in (desk: with the scroll; stacked: once, on enter). */
export function Ask({ at = 0, x = 40, y = 16, w = 560, text, voice = false }: { at?: number; x?: number; y?: number; w?: number; text: string; voice?: boolean }) {
  const { p, mode, on } = useSection();
  const { opacity, y: rise } = useAppear(at);
  const span = useRef<HTMLSpanElement>(null);
  const sent = useMotionValue(0);
  const write = (v: number) => {
    if (mode === "stack" || !span.current) return;
    span.current.textContent = text.slice(0, Math.round(text.length * ramp(v, at + 0.02, at + 0.12)));
    // B6: the request is sent when typing completes.
    if (on) sent.set(bump(v, at + 0.12, at + 0.17));
  };
  useEffect(() => write(p.get()));
  useMotionValueEvent(p, "change", write);
  const sendScale = useTransform(sent, [0, 1], [1, 1.45]);
  const orbScale = useTransform(sent, [0, 1], [1, 1.6]);
  const TYPE_MS = 1300;
  // C3: stacked, the request types itself once the card is in; the next card waits for it.
  const typeIn = (delay: number) => {
    const el = span.current;
    if (!el) return;
    el.textContent = "";
    const start = performance.now() + delay * 1000 + 300;
    const tick = (now: number) => {
      const k = Math.max(0, Math.min(1, (now - start) / TYPE_MS));
      el.textContent = text.slice(0, Math.round(text.length * k));
      if (k < 1) requestAnimationFrame(tick);
      else animate(sent, [0, 1, 0], { duration: 0.6, ease: "easeInOut" });
    };
    requestAnimationFrame(tick);
  };
  const inner = (
    <>
      <motion.span className="inline-flex shrink-0" style={{ scale: on ? orbScale : 1 }}>
        <AiOrb size={10} />
      </motion.span>
      {mode === "stack" ? (
        // Stacked: wraps instead of cutting; the full text reserves its height while it types.
        <span data-text={text} className="grid min-w-0 flex-1 break-words before:invisible before:col-start-1 before:row-start-1 before:content-[attr(data-text)]">
          <span ref={span} className="col-start-1 row-start-1">
            {text}
          </span>
        </span>
      ) : (
        <span ref={span} className="truncate" />
      )}
      <span className="afv-caret" aria-hidden="true" />
      <motion.span className="ml-auto shrink-0 font-mono text-[10px] tracking-[0.1em] text-[#92A399]" style={{ scale: on ? sendScale : 1 }}>
        {voice ? "VOICE" : "↵"}
      </motion.span>
    </>
  );
  const cls = "flex items-center gap-2.5 rounded-xl border border-[rgba(168,222,194,0.55)] bg-[rgba(15,18,20,0.97)] px-3.5 py-2.5 text-[14px] text-[#F2F5F2] shadow-[0_10px_30px_rgba(0,0,0,0.5)]";
  if (mode === "stack")
    return (
      <StackCard at={at} hold={on ? 300 + TYPE_MS + 130 : undefined} onEnter={typeIn}>
        <div className={cls}>{inner}</div>
      </StackCard>
    );
  return (
    <motion.div className={`absolute z-30 ${cls}`} style={{ left: x, top: y, width: w, opacity, y: rise }}>
      {inner}
    </motion.div>
  );
}

/** A notification toast (C6: stacked, it slides in from the right like a system notification). */
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
  if (mode === "stack")
    return (
      <StackCard at={at} kind="toast" className={cls}>
        {inner}
      </StackCard>
    );
  return (
    <motion.div className={`absolute z-30 ${cls}`} style={{ left: x, top: y, width: w, opacity, y: rise }}>
      {inner}
    </motion.div>
  );
}

/** The AFVAR avatar speaking once in this section (its portrait + a speech line). C7: portrait first, bubble 150 ms later. */
export function AvatarLine({ at = 0, x = 760, y = 400, text }: { at?: number; x?: number; y?: number; text: string }) {
  const { mode, on } = useSection();
  const { opacity, y: rise } = useAppear(at);
  const pop = useMotionValue(on ? 0 : 1);
  useSettle(on, pop);
  const bubbleScale = useTransform(pop, [0, 1], [0.9, 1]);
  const bubble = <span className="max-w-[260px] rounded-[12px_12px_2px_12px] border border-[rgba(168,222,194,0.5)] bg-[#10231B] px-3 py-2 text-[13px] text-[#F2F5F2]">{text}</span>;
  const portrait = (
    // eslint-disable-next-line @next/next/no-img-element
    <img src="/avatar/launcher.png" alt="AFVAR avatar" width={60} height={60} className="h-[60px] w-[60px] shrink-0 rounded-full border border-[rgba(0,230,118,0.35)] bg-[#10231B]" />
  );
  if (mode === "stack")
    return (
      <StackCard at={at} kind="plain" className="flex items-end justify-end gap-2" onEnter={(d) => void animate(pop, 1, { delay: d + 0.15, duration: 0.8, ease: EASE })}>
        <motion.span className="flex min-w-0" style={{ opacity: pop, scale: bubbleScale, transformOrigin: "100% 100%" }}>
          {bubble}
        </motion.span>
        {portrait}
      </StackCard>
    );
  return (
    <motion.div className="absolute z-30 flex items-end gap-2" style={{ left: x, top: y, opacity, y: rise }}>
      {bubble}
      {portrait}
    </motion.div>
  );
}

/** A small mono label (e.g. "By hand") on the desktop. */
export function DeskLabel({ at = 0, x, y, children }: { at?: number; x: number; y: number; children: ReactNode }) {
  const { mode } = useSection();
  const { opacity } = useAppear(at);
  if (mode === "stack")
    return (
      <StackCard at={at} kind="plain">
        <p className={`${MONO} text-[#A8DEC2]`}>{children}</p>
      </StackCard>
    );
  return (
    <motion.span className={`${MONO} absolute text-[#A8DEC2]`} style={{ left: x, top: y, opacity }}>
      {children}
    </motion.span>
  );
}
