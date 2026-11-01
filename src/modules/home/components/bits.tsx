"use client";

import { motion, useInView, useReducedMotion, useScroll, useTransform, type Variants } from "framer-motion";
import { Fragment, useEffect, useRef, useState, type CSSProperties, type ReactNode, type SVGProps } from "react";
import { SYMBOL_META } from "../content";
import { CandleWords, ScrubText } from "./marketMotion";
import { CurrencyLetters, useCurrencyScramble } from "./CurrencyText";
import { fmtPrice, useLiveMarket } from "./useLiveMarket";

/** DESIGN-GUIDE §10.1 motion tokens — `enter` ease, section/panel durations. */
export const EASE = [0.16, 1, 0.3, 1] as const;
export const DUR = { fast: 0.14, normal: 0.2, panel: 0.24, section: 0.45 } as const;

/* ── Section motion system (README §8.3, DESIGN-GUIDE §10) ──
 * Everything below the hero animates ONCE per view with transform/opacity only.
 * Reduced motion never changes the SSR'd styles (hydration-safe); it only zeroes
 * the transition so the final state renders instantly. */
export const VIEW_ONCE = { once: true, margin: "0px 0px -8% 0px" } as const;

/** Transition with the `enter` ease — instant under reduced motion. */
export function tr(reduce: boolean | null, duration: number = DUR.section, delay = 0) {
  return reduce ? { duration: 0, delay: 0 } : { duration, delay, ease: EASE };
}
/** Opacity + lift (heroMetric variant). */
export function rise(reduce: boolean | null, delay = 0, y = 12): Variants {
  return { hidden: { opacity: 0, y }, visible: { opacity: 1, y: 0, transition: tr(reduce, DUR.section, delay) } };
}
/** Opacity only. */
export function fade(reduce: boolean | null, delay = 0, duration: number = DUR.section): Variants {
  return { hidden: { opacity: 0 }, visible: { opacity: 1, transition: tr(reduce, duration, delay) } };
}
/** A line drawing along X (pair with `origin-left`). */
export function drawX(reduce: boolean | null, delay = 0, duration: number = DUR.section): Variants {
  return { hidden: { scaleX: 0 }, visible: { scaleX: 1, transition: tr(reduce, duration, delay) } };
}

/** One shared in-view trigger: `ref` + a once-only boolean. Consumers drive
 *  `animate={inView ? "visible" : "hidden"}` and `data-inview` (CSS line draws). */
export function useOnce<T extends Element>() {
  const ref = useRef<T | null>(null);
  const inView = useInView(ref, VIEW_ONCE);
  return [ref, inView] as const;
}

/** On-view reveal (DESIGN-GUIDE §10.2 heroMetric): opacity + 12px lift, once. No scale, no blur. */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={VIEW_ONCE}
      transition={tr(reduce, DUR.section, delay)}
    >
      {children}
    </motion.div>
  );
}

/** Split copy into phrases at sentence ends / em-dashes ("Five jobs." · "One connected desk."). */
export function phrases(text: string) {
  return text.split(/(?<=[.—])\s+/).filter(Boolean);
}

/** Line-mask reveal: each phrase slides up out of its own overflow-hidden mask
 *  (.45s, 0.06 stagger). Must sit inside a motion parent that switches
 *  `hidden` → `visible`. Inline-block masks keep the natural line wrapping. */
export function MaskLines({ text, delay = 0 }: { text: ReactNode; delay?: number }) {
  const reduce = useReducedMotion();
  const parts = typeof text === "string" ? phrases(text) : [text];
  return parts.map((part, index) => (
    <Fragment key={index}>
      {index > 0 && " "}
      <span className="-mb-[.14em] inline-block overflow-hidden pb-[.14em] align-top">
        <motion.span
          className="inline-block"
          variants={{ hidden: { y: "110%" }, visible: { y: "0%", transition: tr(reduce, DUR.section, delay + index * 0.06) } }}
        >
          {part}
        </motion.span>
      </span>
    </Fragment>
  ));
}

/** Shared section heading: eyebrow fades first, the title line-masks up, copy follows. */
export function AnimatedHeading({ kicker, title, sub, className = "", titleClassName, subClassName, center = false, wrapTitle, currency = false, tape = false }: {
  kicker: string;
  title: ReactNode;
  sub?: ReactNode;
  className?: string;
  titleClassName?: string;
  subClassName?: string;
  center?: boolean;
  /** Optional wrapper around the <h2> (e.g. <BullCharge>) — the heading stays real HTML. */
  wrapTitle?: (node: ReactNode) => ReactNode;
  /** Opt-in: letters briefly slot through currency glyphs and settle (CurrencyText). String titles only. */
  currency?: boolean;
  /** Opt-in: a faint, slowly scrolling tape of the 8 REAL quotes behind the title (aria-hidden). */
  tape?: boolean;
}) {
  const reduce = useReducedMotion();
  const wrapFn = wrapTitle ?? ((node: ReactNode) => node);
  // The tape sits OUTSIDE the wrapped title so wrappers that measure the title text
  // (BullCharge) never see it; the title layer stacks above it.
  const wrap = tape
    ? (node: ReactNode) => (
        <div className="relative isolate">
          <HeadingTape />
          <div className="relative z-[1]">{wrapFn(node)}</div>
        </div>
      )
    : wrapFn;
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleIn = useInView(titleRef, VIEW_ONCE);
  useCurrencyScramble(titleRef, currency && titleIn, { tick: true });
  return (
    <div className={className}>
      <motion.p variants={fade(reduce, 0, DUR.panel)} className="mk-eyebrow">
        {kicker}
      </motion.p>
      {wrap(
        <h2 ref={titleRef} aria-label={currency && typeof title === "string" ? title : undefined} className={titleClassName ?? "mt-3 text-[30px] font-semibold leading-[1.08] tracking-[-.02em] text-(--mk-text) sm:text-[40px]"}>
          {typeof title === "string" ? (
            <CandleWords text={title} delay={0.08} renderWord={currency ? (word) => <CurrencyLetters text={word} /> : undefined} />
          ) : (
            <MaskLines text={title} delay={0.08} />
          )}
        </h2>,
      )}
      {sub &&
        (typeof sub === "string" ? (
          // Body copy lights word-by-word with scroll (reverses on scroll up).
          <ScrubText text={sub} className={subClassName ?? `mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-(--mk-dim) ${center ? "mx-auto" : ""}`} />
        ) : (
          <motion.p variants={rise(reduce, 0.24, 8)} className={subClassName ?? `mt-4 max-w-[620px] text-[15.5px] leading-relaxed text-(--mk-dim) ${center ? "mx-auto" : ""}`}>
            {sub}
          </motion.p>
        ))}
    </div>
  );
}

/** Faint one-line quote tape behind a heading title: the 8 REAL symbols with their real last
 *  price and signed % (useLiveMarket), prefixed "SNAPSHOT ·" until real data arrives. Decorative
 *  (aria-hidden), ~.18 opacity, edge-masked, pauses off-screen, static under reduced motion. */
function HeadingTape() {
  const { quotes, live, mix } = useLiveMarket();
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const status = !live ? "SNAPSHOT" : mix.delayed + mix.snapshot > 0 ? "LIVE + DELAYED" : "LIVE";
  const entries = Object.entries(quotes);
  const half = (dup: boolean) => (
    <span className="flex shrink-0 items-center" key={dup ? "b" : "a"}>
      <span className="pl-6 pr-3 text-[#A3AAAC]">{status} ·</span>
      {entries.map(([symbol, quote]) => {
        const up = quote.changePct >= 0;
        return (
          <span key={symbol} className="flex items-center gap-1.5 pr-6">
            <span className="text-(--afvar-text)">{symbol}</span>
            <span className="text-[#A3AAAC]">{fmtPrice(quote.last, quote.decimals)}</span>
            <span style={{ color: up ? UP_HEX : DOWN_HEX }}>
              {up ? "+" : ""}
              {quote.changePct.toFixed(2)}%
            </span>
          </span>
        );
      })}
    </span>
  );
  return (
    <div
      ref={pauseRef}
      aria-hidden="true"
      data-heading-tape=""
      className="pointer-events-none absolute inset-x-0 bottom-[9px] z-0 h-4 select-none overflow-hidden opacity-[.18] [mask-image:linear-gradient(90deg,transparent,#000_14%,#000_86%,transparent)] sm:bottom-[13px]"
    >
      <div className="flex w-max animate-[home-tape_80s_linear_infinite] whitespace-nowrap font-mono text-[11px] leading-4 tabular-nums motion-reduce:animate-none">
        {half(false)}
        {half(true)}
      </div>
    </div>
  );
}

/** Full-width page gutter used by every section. */
export const GUTTER = "mx-auto w-full max-w-[1440px] px-5 sm:px-10";

/** Section header: dim uppercase eyebrow, left-aligned title, optional right action. */
export function SectionHead({ kicker, title, sub, action, wrapTitle, currency, tape }: { kicker: string; title: ReactNode; sub?: string; action?: ReactNode; wrapTitle?: (node: ReactNode) => ReactNode; currency?: boolean; tape?: boolean }) {
  const reduce = useReducedMotion();
  return (
    <motion.div className="relative flex flex-wrap items-end justify-between gap-x-10 gap-y-6" initial="hidden" whileInView="visible" viewport={VIEW_ONCE}>
      <AnimatedHeading kicker={kicker} title={title} sub={sub} className="max-w-[680px]" wrapTitle={wrapTitle} currency={currency} tape={tape} />
      {action && (
        <motion.div variants={rise(reduce, 0.3, 8)} className="shrink-0 pb-1">
          {action}
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Scroll-linked terrain ridge: the hero's candle landscape as a quiet
 * continuity motif behind section heads. Deterministic (seeded), two layers,
 * transform-only parallax from ONE useScroll per section. No rAF loops. */
function seeded(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}
type RidgeLayer = { bodies: string; wicks: string; up: string; down: string };
const RIDGE_W = 1440;
const RIDGE_H = 260;
function buildRidge(seed: number, step: number, barW: number, lift: number, amp: number): RidgeLayer {
  const rnd = seeded(seed);
  let bodies = "";
  let wicks = "";
  let up = "";
  let down = "";
  for (let x = step / 2; x < RIDGE_W; x += step) {
    const u = x / RIDGE_W;
    // Envelope: low on the left (behind the copy), rising to a ridge on the right.
    const ramp = Math.min(1, Math.max(0, (u - 0.36) / 0.56)) ** 1.3;
    const env = lift + amp * ramp + (0.03 + 0.06 * ramp) * Math.sin(u * 13 + seed) + 0.05 * rnd();
    const top = Math.round(RIDGE_H * (1 - Math.min(0.94, Math.max(0.05, env))));
    const left = Math.round(x - barW / 2);
    bodies += `M${left} ${RIDGE_H}V${top}h${barW}V${RIDGE_H}z`;
    const wick = Math.round(6 + rnd() * 16);
    wicks += `M${Math.round(x)}.5 ${top}v-${wick}`;
    const roll = rnd();
    if (roll < 0.09) up += `M${left} ${top}.5h${barW}`;
    else if (roll < 0.13) down += `M${left} ${top}.5h${barW}`;
  }
  return { bodies, wicks, up, down };
}
const RIDGES = new Map<number, [RidgeLayer, RidgeLayer]>();
function ridgeFor(seed: number) {
  let layers = RIDGES.get(seed);
  if (!layers) {
    layers = [buildRidge(seed, 18, 8, 0.06, 0.74), buildRidge(seed + 7, 30, 14, 0.02, 0.48)];
    RIDGES.set(seed, layers);
  }
  return layers;
}

function RidgeSvg({ layer, className }: { layer: RidgeLayer; className: string }) {
  return (
    <svg viewBox={`0 0 ${RIDGE_W} ${RIDGE_H}`} preserveAspectRatio="xMaxYMax slice" className={className}>
      <path d={layer.wicks} stroke="#1E2427" strokeWidth={1} fill="none" />
      <path d={layer.bodies} fill="#111416" stroke="#1A1F22" strokeWidth={1} />
      <path d={layer.up} stroke={UP_HEX} strokeWidth={1} fill="none" />
      <path d={layer.down} stroke={DOWN_HEX} strokeWidth={1} fill="none" />
    </svg>
  );
}

/** Full-bleed candle silhouette behind a section head. The parent section must be
 *  `relative overflow-hidden` and full-width; content sits above it (`relative`). */
export function TerrainRidge({ seed, className = "top-[96px] h-[300px] md:top-[120px]" }: { seed: number; className?: string }) {
  const reduce = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const yBack = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -20]);
  const yFront = useTransform(scrollYProgress, [0, 1], [0, reduce ? 0 : -40]);
  const [back, front] = ridgeFor(seed);
  return (
    <div
      ref={ref}
      aria-hidden="true"
      className={`pointer-events-none absolute inset-x-0 opacity-30 md:opacity-50 [mask-image:linear-gradient(180deg,transparent,#000_18%,#000_62%,transparent)] ${className}`}
    >
      <motion.div className="absolute inset-0 opacity-60" style={{ y: yBack }}>
        <RidgeSvg layer={back} className="h-full w-full" />
      </motion.div>
      <motion.div className="absolute inset-x-0 bottom-0 top-[22%]" style={{ y: yFront }}>
        <RidgeSvg layer={front} className="h-full w-full" />
      </motion.div>
    </div>
  );
}

const PATHS: Record<string, string> = {
  chart: "M3 16V7m0 9h14M6 12.5l3-4 3 2 4-6",
  arrow: "M4 10h11M11 6l4 4-4 4",
  chev: "M7.5 4.5 13 10l-5.5 5.5",
  chevL: "M12.5 4.5 7 10l5.5 5.5",
  down: "M6 8l4 4 4-4",
  play: "M7 5.5v9l8-4.5z",
  check: "M4 10.5l4 4 8-9",
  shield: "M10 3l6 2.5V10c0 3.8-2.6 6.4-6 7-3.4-.6-6-3.2-6-7V5.5z",
  menu: "M3 6h14M3 10h14M3 14h14",
  x: "M5 5l10 10M15 5L5 15",
  news: "M5 4h8v12H5zM13 7h2v9h-9M7 7h4M7 10h4",
  bell: "M10 4a4 4 0 0 1 4 4v3l1.5 2h-11L6 11V8a4 4 0 0 1 4-4zm-1.5 11a1.5 1.5 0 0 0 3 0",
  users: "M7.5 9a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm5 0a2 2 0 1 0 0-4M3 16c0-2.2 2-3.5 4.5-3.5S12 13.8 12 16m1-3.3c1.8.3 3 1.4 3 3.3",
  spark: "M10 3l1.6 4.4L16 9l-4.4 1.6L10 15l-1.6-4.4L4 9l4.4-1.6z",
  globe: "M10 3a7 7 0 1 0 0 14 7 7 0 0 0 0-14zm-7 7h14M10 3c-2.6 2-2.6 12 0 14 2.6-2 2.6-12 0-14z",
  search: "M9 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm7.5 12.5L13 13",
  doc: "M6 3h5l3 3v11H6zM11 3v3h3M8 10h4M8 13h4",
  calendar: "M4 5.5h12V16H4zM4 9h12M7 3.5v3M13 3.5v3",
  book: "M4 4.5A1.5 1.5 0 0 1 5.5 3H16v12.5H5.5A1.5 1.5 0 0 0 4 17zM4 15V4.5M16 15.5H5.5a1.5 1.5 0 0 0 0 1.5",
  bulb: "M7 14.5h6M8.2 17h3.6M10 3.5a4.5 4.5 0 0 1 2.6 8.1c-.5.4-.6 1-.6 1.4H8c0-.4-.1-1-.6-1.4A4.5 4.5 0 0 1 10 3.5z",
  bank: "M4 8l6-4 6 4M5 8v6m3.3-6v6m3.4-6v6M15 8v6M4 14.5h12M3 17h14",
  layers: "M10 3l7 4-7 4-7-4zM3 11l7 4 7-4M3 14.5l7 4 7-4",
  lock: "M6 9V7a4 4 0 0 1 8 0v2m-9 0h10v8H5zM10 12.5v2",
  mail: "M3 5h14v10H3zM3 6l7 5 7-5",
  sun: "M10 6.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM10 2v1.8m0 12.4V18m8-8h-1.8M3.8 10H2m13.66-5.66-1.27 1.27M5.61 14.39l-1.27 1.27m0-11.32 1.27 1.27m8.78 8.78 1.27 1.27",
  moon: "M16 12.3A6.8 6.8 0 0 1 7.7 4a6.8 6.8 0 1 0 8.3 8.3z",
};

export function Icon({ name, className = "h-4 w-4", strokeWidth = 1.6, draw = false, ...rest }: { name: string; className?: string; strokeWidth?: number; draw?: boolean } & SVGProps<SVGSVGElement>) {
  const filled = name === "play" || name === "spark";
  return (
    <svg viewBox="0 0 20 20" className={`${className} ${draw && !filled ? "mkc-glyph" : ""}`} aria-hidden="true" {...rest}>
      <path
        d={PATHS[name] ?? PATHS.chart}
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeLinejoin="round"
        {...(draw && !filled ? { pathLength: 1 } : {})}
      />
    </svg>
  );
}

/* ── MARKET TERRAIN palette (README §3) ──
 * Green / red are market semantics ONLY (DESIGN-GUIDE §2.5): price movement,
 * live data state, semantic offer accents. Actions and chrome stay neutral. */
export const UP_HEX = "#00E676";
export const DOWN_HEX = "#FF3B3B";
/** Signed-change text colours on dark (always paired with a +/− sign). */
export const UP_TEXT = "text-[#00E676]";
export const DOWN_TEXT = "text-[#FF6464]";

export const BTN_PRIMARY =
  "afvar-glass-button afvar-glass-primary inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14.5px] font-semibold";

export const BTN_OUTLINE =
  "afvar-glass-button inline-flex h-11 items-center justify-center gap-2 rounded-full px-6 text-[14.5px] font-medium";

/** Card surface: solid raised panel + hairline border (README §0.3 — no glass). */
export const CARD = "rounded-2xl border border-white/[.11] bg-(--afvar-panel)";

/** Solid raised panel — the section surface language (README §3.2). */
export const PANEL = "rounded-2xl border border-white/[.11] bg-(--afvar-panel)";

/** Neutral icon tile: opaque graphite, hairline, neutral glyph. `tone` only for semantic market icons. */
/** The glyph draws in (stroke-dashoffset) once the tile is revealed and bobs on hover (CSS in marketMotion). */
export function EngineTile({ glyph, className = "h-11 w-11", tone = "neutral" }: { glyph: string; className?: string; tone?: "neutral" | "up" | "down" }) {
  const glyphColor = tone === "up" ? "text-[#00E676]" : tone === "down" ? "text-[#FF6464]" : "text-[#A3AAAC]";
  const ref = useRef<HTMLSpanElement>(null);
  const seen = useInView(ref, VIEW_ONCE);
  return (
    <span ref={ref} data-drawn={seen || undefined} className={`mkc-tile grid place-items-center rounded-xl border border-white/[.11] bg-[#171B1D] ${className}`}>
      <Icon name={glyph} className={`h-[46%] w-[46%] ${glyphColor}`} strokeWidth={1.7} draw />
    </span>
  );
}

/** Thin green→red hairline — the evidence/launch accent line (README §9.7). */
export function CoreHairline({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`block h-px bg-[linear-gradient(90deg,transparent,#00A85A_30%,#FF3B3B_70%,transparent)] ${className}`} />;
}

/* ── Off-screen pause (perf): ONE shared IntersectionObserver toggles
 * `data-offscreen` on registered elements; SiteShell CSS pauses every CSS
 * animation inside them (`animation-play-state: paused`). Infinite loops —
 * ticker tape, topic marquee, LIVE pulses — therefore only run in view. */
let pauseObserver: IntersectionObserver | null = null;
function getPauseObserver() {
  pauseObserver ??= new IntersectionObserver(
    (entries) => {
      for (const entry of entries) entry.target.toggleAttribute("data-offscreen", !entry.isIntersecting);
    },
    { rootMargin: "120px 0px" },
  );
  return pauseObserver;
}
export function usePauseOffscreen<T extends Element>() {
  const ref = useRef<T | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const observer = getPauseObserver();
    observer.observe(el);
    return () => {
      observer.unobserve(el);
      el.removeAttribute("data-offscreen");
    };
  }, []);
  return ref;
}

/** LIVE / SNAPSHOT state chip — LIVE only when the data layer reports live (README §10).
 *  The pulse pauses off-screen; `pulse={false}` for chips inside hidden overlays. */
export function LiveChip({ live, pulse = true }: { live: boolean; pulse?: boolean }) {
  const ref = usePauseOffscreen<HTMLSpanElement>();
  return (
    <span ref={ref} className="inline-flex items-center gap-1.5 rounded-full border border-white/[.11] bg-[#171B1D] px-2.5 py-1 font-mono text-[9.5px] font-semibold uppercase tracking-wide text-(--mk-dim)">
      <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${live ? `bg-[#00E676] ${pulse ? "motion-safe:animate-pulse" : ""}` : "bg-[#6D7578]"}`} />
      {live ? "Live" : "Snapshot"}
    </span>
  );
}

/** Rounded-square gradient icon tile (pricing page). */
export function IconTile({ from, to, glyph, className = "h-11 w-11" }: { from: string; to: string; glyph: string; className?: string }) {
  return (
    <span className={`grid place-items-center rounded-xl shadow-[0_8px_20px_-8px_rgba(0,0,0,.8),inset_0_1px_0_rgba(255,255,255,.25)] ${className}`} style={{ background: `linear-gradient(145deg, ${from}, ${to})` }}>
      <Icon name={glyph} className="h-[48%] w-[48%] text-white" strokeWidth={1.8} />
    </span>
  );
}

/** Round instrument icon for market rows: flag emoji or tinted monogram disc. */
export function SymbolDisc({ symbol, className = "h-9 w-9" }: { symbol: string; className?: string }) {
  const meta = SYMBOL_META[symbol] ?? {};
  if (meta.flag) {
    return (
      <span className={`grid place-items-center rounded-full border border-white/[.12] bg-white/[.06] text-[18px] leading-none ${className}`} aria-hidden="true">
        {meta.flag}
      </span>
    );
  }
  return (
    <span
      className={`grid place-items-center rounded-full text-[11px] font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,.35)] ${className}`}
      style={{ background: `linear-gradient(145deg, ${meta.from ?? "#2e3436"}, ${meta.to ?? "#111416"})` }}
      aria-hidden="true"
    >
      {meta.mono ?? symbol.slice(0, 2)}
    </span>
  );
}

/** Change pill: tinted green up / red down, always with the sign (README §3.1). */
export function ChangePill({ pct }: { pct: number }) {
  const up = pct >= 0;
  return (
    <span
      className={`inline-block min-w-[68px] rounded-[8px] border px-2 py-1 text-center font-mono text-[12px] font-semibold tabular-nums ${
        up ? "border-[#00A85A]/40 bg-[#00E676]/[.1] text-[#00E676]" : "border-[#FF3B3B]/40 bg-[#FF3B3B]/[.1] text-[#FF6464]"
      }`}
    >
      {up ? "+" : ""}{pct.toFixed(2)}%
    </span>
  );
}

/** Tiny sparkline, green up / red down. `draw` = the line draws in (CSS, once) when an
 *  ancestor carries `data-inview`; `delay` staggers it. */
export function Spark({ closes, up, w = 64, h = 22, draw = false, delay = 0 }: { closes: number[]; up: boolean; w?: number; h?: number; draw?: boolean; delay?: number }) {
  if (closes.length < 2) return null;
  const min = Math.min(...closes);
  const span = Math.max(...closes) - min || 1;
  const d = closes.map((v, i) => `${i ? "L" : "M"}${((i / (closes.length - 1)) * w).toFixed(1)} ${(h - 2 - ((v - min) / span) * (h - 5)).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: w, height: h }} aria-hidden="true" className="shrink-0">
      <path
        d={d}
        fill="none"
        stroke={up ? UP_HEX : DOWN_HEX}
        strokeWidth={1.6}
        strokeLinejoin="round"
        {...(draw ? { pathLength: 1, className: "mk-draw", style: { animationDelay: `${delay}s` } } : {})}
      />
    </svg>
  );
}

/** Filled area chart. `draw` = line draws in and the fill fades after it (CSS, once
 *  per mount — key it by symbol to replay on selection change). */
export function AreaChart({ closes, up, className = "h-[150px] w-full", draw = false }: { closes: number[]; up: boolean; className?: string; draw?: boolean }) {
  if (closes.length < 2) return null;
  const w = 320;
  const h = 110;
  const min = Math.min(...closes);
  const span = Math.max(...closes) - min || 1;
  const pt = (v: number, i: number) => `${((i / (closes.length - 1)) * w).toFixed(1)} ${(6 + (1 - (v - min) / span) * (h - 14)).toFixed(1)}`;
  const line = closes.map((v, i) => `${i ? "L" : "M"}${pt(v, i)}`).join(" ");
  const color = up ? UP_HEX : DOWN_HEX;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={`area-${up}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity=".32" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`M0 ${h} L${line.slice(1)} L${w} ${h}Z`} fill={`url(#area-${up})`} stroke="none" className={draw ? "mk-fadein" : undefined} />
      <path d={line} fill="none" stroke={color} strokeWidth="1.8" strokeLinejoin="round" {...(draw ? { pathLength: 1, className: "mk-draw mk-draw-slow" } : {})} />
    </svg>
  );
}

/** Price text that tints green/red for 300ms ONLY when a real poll changes the value
 *  (previous AND current value both real). Snapshot → first live never flashes,
 *  and nothing here ever invents a tick (README §10).
 *  Volatility shake: a real change bigger than 0.15% also jitters the text
 *  horizontally (0→-a→a→-⅔a→0 over 280ms, a = 1.5px growing with the move,
 *  capped at 3px). Transform only; none under reduced motion. */
const SHAKE_MIN_PCT = 0.15;
const SHAKE_CSS = [
  "@keyframes mk-vol-shake{0%{transform:translateX(0)}25%{transform:translateX(calc(var(--mk-shake) * -1))}50%{transform:translateX(var(--mk-shake))}75%{transform:translateX(calc(var(--mk-shake) * -.67))}100%{transform:translateX(0)}}",
  ".mk-vol-shake{display:inline-block;animation:mk-vol-shake 280ms ease-out}",
  "@media (prefers-reduced-motion:reduce){.mk-vol-shake{animation:none!important}}",
].join("");

export function FlashPrice({ value, live, children, className = "" }: { value: number; live: boolean; children: ReactNode; className?: string }) {
  const [seen, setSeen] = useState({ value, live, n: 0, dir: 0, shake: 0 });
  if (seen.value !== value || seen.live !== live) {
    const real = seen.live && live && seen.value !== value;
    const movePct = real && seen.value > 0 ? (Math.abs(value - seen.value) / seen.value) * 100 : 0;
    const shake = movePct > SHAKE_MIN_PCT ? Math.min(3, 1.5 + (movePct - SHAKE_MIN_PCT) * 1.5) : 0;
    setSeen({ value, live, n: real ? seen.n + 1 : seen.n, dir: real ? (value > seen.value ? 1 : -1) : seen.dir, shake: real ? shake : seen.shake });
  }
  const shaking = seen.n > 0 && seen.shake > 0;
  return (
    <span key={seen.n} className={`${className} ${seen.n ? (seen.dir > 0 ? "mk-flash-up" : "mk-flash-down") : ""}`}>
      {shaking ? (
        <span data-shake={seen.shake.toFixed(2)} className="mk-vol-shake" style={{ "--mk-shake": `${seen.shake.toFixed(2)}px` } as CSSProperties}>
          <style href="afvar-vol-shake" precedence="default">
            {SHAKE_CSS}
          </style>
          {children}
        </span>
      ) : (
        children
      )}
    </span>
  );
}
