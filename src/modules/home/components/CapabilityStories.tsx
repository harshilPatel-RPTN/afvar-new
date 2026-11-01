"use client";

// Five scripted micro-stories for the Capabilities cards. Each plays ONCE when the
// card grid enters view (variants propagate from the grid: hidden → visible), using
// transform / opacity / clip-path / stroke-dashoffset only. Reduced motion → every
// transition has zero duration, so the settled final frame renders immediately.
// Honesty (README §10): card 01 uses only REAL quotes from useLiveMarket; every
// invented element elsewhere carries a visible "Sample" tag and no fake prices.
import { motion, useReducedMotion, type Variants } from "framer-motion";
import { useState, type ReactNode } from "react";
import { MARKET_GROUPS } from "../content";
import { DOWN_HEX, DOWN_TEXT, DUR, EASE, FlashPrice, Icon, LiveChip, UP_HEX, UP_TEXT, usePauseOffscreen } from "./bits";
import { RollNumber, softTick } from "./marketMotion";
import { StopGuard } from "./StopGuard";
import { fmtPrice, type HomeQuote } from "./useLiveMarket";

/** Shared visual frame — one fixed height so every card in a row matches. */
export const VIS = "relative mt-5 h-[184px] overflow-hidden rounded-xl border border-white/[.08] bg-(--afvar-charcoal) px-3 py-2.5";

type Extra = Record<string, unknown>;
/** hidden → visible variant pair, starting at `t` seconds; zero-duration under reduced motion
 *  (keyframe arrays then jump straight to their final value). */
function V(reduce: boolean | null, hidden: Extra, visible: Extra, t: number, duration: number = DUR.section, extra: Extra = {}): Variants {
  return {
    hidden,
    visible: { ...visible, transition: reduce ? { duration: 0 } : { duration, delay: t, ease: EASE, ...extra } },
  } as Variants;
}

/** Typewriter easing: n discrete steps (used with clip-path / translate — no layout). */
const steps = (n: number) => (p: number) => Math.min(1, Math.floor(p * n) / n);

export function SampleTag({ children = "Sample" }: { children?: ReactNode }) {
  return <span className="shrink-0 font-mono text-[9.5px] uppercase tracking-[.1em] text-(--mk-faint)">{children}</span>;
}

function Chip({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <span className={`whitespace-nowrap rounded-full border border-white/[.1] bg-[#171B1D] px-1.5 py-[3px] font-mono text-[9px] leading-none text-(--mk-dim) ${className}`}>{children}</span>;
}

/** Typed-on text: a stepped clip-path reveal with a caret riding the edge. */
function Typed({ text, t, duration, className = "" }: { text: string; t: number; duration: number; className?: string }) {
  const reduce = useReducedMotion();
  const n = text.length;
  return (
    <span className={`relative inline-block whitespace-nowrap ${className}`}>
      <motion.span
        className="inline-block"
        variants={V(reduce, { clipPath: "inset(0 100% 0 0)" }, { clipPath: "inset(0 0% 0 0)", transitionEnd: { clipPath: "none" } }, t, duration, { ease: steps(n) })}
      >
        {text}
      </motion.span>
      <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 left-0 right-0">
        <motion.span
          className="absolute inset-y-[1px] left-0 w-full"
          variants={V(reduce, { x: "0%", opacity: 0 }, { x: ["0%", "100%", "100%"], opacity: [1, 1, 0] }, t, duration + 0.5, { ease: steps(n), times: [0, duration / (duration + 0.5), 1] })}
        >
          <span className="absolute inset-y-0 left-0 w-px bg-[#F5F7F7]" />
        </motion.span>
      </span>
    </span>
  );
}

/* ─────────────────────────── 01 · Follow markets (REAL) ─────────────────────────── */

const LANES = [...MARKET_GROUPS.flatMap((group) => group.symbols), "BTC-USD"];
const SPARK_W = 84;
const SPARK_H = 18;

function sparkPoints(closes: number[]) {
  const min = Math.min(...closes);
  const span = Math.max(...closes) - min || 1;
  return closes.map((v, i) => [(i / (closes.length - 1)) * SPARK_W, SPARK_H - 2 - ((v - min) / span) * (SPARK_H - 5)] as const);
}

export function FollowStory({ quotes, live, t, symbols }: { quotes: Record<string, HomeQuote>; live: boolean; t: number; symbols: readonly string[] }) {
  const reduce = useReducedMotion();
  const [hover, setHover] = useState<{ symbol: string; i: number } | null>(null);
  return (
    <div className={`${VIS} flex flex-col`}>
      <div className="flex items-center justify-between pb-1">
        <span className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">Watchlist</span>
        <LiveChip live={live} />
      </div>
      <div className="relative">
        <ul>
          {symbols.map((symbol, row) => {
            const quote = quotes[symbol];
            if (!quote || quote.closes.length < 2) return null;
            const up = quote.changePct >= 0;
            const closes = quote.closes.slice(-24);
            const pts = sparkPoints(closes);
            const d = pts.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ");
            const active = hover?.symbol === symbol ? hover.i : null;
            return (
              <motion.li
                key={symbol}
                variants={V(reduce, { opacity: 0, y: 6 }, { opacity: 1, y: 0 }, t + row * 0.1)}
                className="flex items-center gap-2.5 border-t border-white/[.06] py-[7px] font-mono text-[12px]"
              >
                <span className="w-[54px] font-semibold text-(--mk-text)">{symbol}</span>
                {/* Pointer crosshair: the dot follows the REAL series and shows that close. */}
                <span
                  className="relative cursor-crosshair touch-none"
                  onPointerMove={(event) => {
                    const box = event.currentTarget.getBoundingClientRect();
                    const i = Math.round(Math.min(1, Math.max(0, (event.clientX - box.left) / box.width)) * (closes.length - 1));
                    setHover({ symbol, i });
                  }}
                  onPointerLeave={() => setHover(null)}
                >
                  <svg viewBox={`0 0 ${SPARK_W} ${SPARK_H}`} height={SPARK_H} preserveAspectRatio="none" aria-hidden="true" className="block w-[52px] overflow-visible min-[400px]:w-[84px]">
                    <motion.path
                      d={d}
                      fill="none"
                      stroke={up ? UP_HEX : DOWN_HEX}
                      strokeWidth={1.5}
                      vectorEffect="non-scaling-stroke"
                      strokeLinejoin="round"
                      strokeDasharray="300 300"
                      variants={V(reduce, { strokeDashoffset: 300 }, { strokeDashoffset: 0 }, t + 0.15 + row * 0.12, 0.8)}
                    />
                    {active !== null && (
                      <>
                        <line x1={pts[active][0]} x2={pts[active][0]} y1={0} y2={SPARK_H} stroke="rgba(245,247,247,.25)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                        <circle cx={pts[active][0]} cy={pts[active][1]} r={2.2} fill="#F5F7F7" />
                      </>
                    )}
                  </svg>
                  {active !== null && (
                    <span
                      className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/[.14] bg-[#171B1D] px-1.5 py-[2px] text-[9.5px] tabular-nums text-(--mk-text)"
                      style={{ left: `${(pts[active][0] / SPARK_W) * 100}%` }}
                    >
                      {fmtPrice(closes[active], quote.decimals)}
                    </span>
                  )}
                </span>
                <FlashPrice value={quote.last} live={quote.live} className="ml-auto shrink-0 whitespace-nowrap tabular-nums text-(--mk-dim)">
                  <RollNumber value={fmtPrice(quote.last, quote.decimals)} />
                </FlashPrice>
                <span className={`w-[52px] shrink-0 text-right tabular-nums ${up ? UP_TEXT : DOWN_TEXT}`}>
                  {up ? "+" : ""}
                  {quote.changePct.toFixed(2)}%
                </span>
              </motion.li>
            );
          })}
        </ul>
        {/* Scan cursor sweeps once across both rows after the lines draw. */}
        <motion.span
          aria-hidden="true"
          className="pointer-events-none absolute inset-y-0 left-0 w-full"
          variants={V(reduce, { x: "0%", opacity: 0 }, { x: ["0%", "100%"], opacity: [0, 1, 1, 0] }, t + 0.95, 1.1, { ease: "easeInOut" })}
        >
          <span className="absolute inset-y-0 left-0 w-px bg-[linear-gradient(180deg,transparent,rgba(245,247,247,.55),transparent)]" />
        </motion.span>
      </div>
      {/* 4×2 lane heatmap — tint = REAL change sign, intensity ∝ |%|. */}
      <div className="mt-auto grid grid-cols-4 gap-1">
        {LANES.map((symbol, i) => {
          const quote = quotes[symbol];
          if (!quote) return null;
          const up = quote.changePct >= 0;
          const strength = Math.min(0.55, 0.12 + (Math.abs(quote.changePct) / 2.5) * 0.43);
          return (
            <motion.span
              key={symbol}
              title={`${symbol} ${up ? "+" : ""}${quote.changePct.toFixed(2)}%`}
              variants={V(reduce, { opacity: 0, scale: 0.85 }, { opacity: 1, scale: 1 }, t + 1.5 + i * 0.07, DUR.panel)}
              className="relative overflow-hidden rounded-[5px] border border-white/[.06] bg-[#171B1D] px-1.5 py-[3px] text-center"
            >
              <span aria-hidden="true" className="absolute inset-0" style={{ background: up ? UP_HEX : DOWN_HEX, opacity: strength }} />
              <span className="relative font-mono text-[9px] font-semibold text-(--mk-text)">{symbol}</span>
            </motion.span>
          );
        })}
      </div>
    </div>
  );
}

/* ─────────────────────────── 02 · Understand context ─────────────────────────── */

const ROW_H = 27;
const FEED = [
  { w: "w-[88%]", w2: "w-[52%]", tag: "XAUUSD", age: "2m" },
  { w: "w-[76%]", w2: "w-[60%]", tag: "EURUSD", age: "9m" },
  { w: "w-[82%]", w2: "w-[42%]", tag: "WTI", age: "14m" },
];
const ARRIVE = 0.62; // seconds between headlines

/** y keyframes for a feed row: lands in the top slot, then is pushed down one slot per newer arrival. */
function feedTrack(k: number) {
  const a = FEED.length - 1 - k; // arrival order (oldest first)
  const total = (FEED.length - 1) * ARRIVE + 0.35;
  const pts: [number, number, number][] = [[0, -k * ROW_H - 14, 0]];
  if (a > 0) pts.push([a * ARRIVE, -k * ROW_H - 14, 0]);
  let y = -k * ROW_H;
  pts.push([a * ARRIVE + 0.35, y, 1]);
  for (let j = a + 1; j < FEED.length; j++) {
    pts.push([j * ARRIVE, y, 1]);
    y += ROW_H;
    pts.push([j * ARRIVE + 0.3, y, 1]);
  }
  return { y: pts.map((p) => p[1]), opacity: pts.map((p) => p[2]), times: pts.map((p) => p[0] / total), total, landed: a * ARRIVE + 0.35 };
}

export function ContextStory({ t }: { t: number }) {
  const reduce = useReducedMotion();
  return (
    <div className={`${VIS} flex flex-col`}>
      <div className="flex items-center justify-between pb-1.5">
        <span className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">Briefs · feed</span>
        <SampleTag />
      </div>
      <div className="relative overflow-hidden" style={{ height: FEED.length * ROW_H }}>
        {FEED.map((row, k) => {
          const track = feedTrack(k);
          const land = t + track.landed;
          return (
            <motion.div
              key={row.tag}
              className="flex items-center gap-2"
              style={{ height: ROW_H }}
              variants={V(reduce, { y: track.y[0], opacity: 0 }, { y: track.y, opacity: track.opacity }, t, track.total, { times: track.times, ease: "easeOut" })}
            >
              <div className="min-w-0 flex-1 space-y-1.5" aria-hidden="true">
                <span className={`block h-[6px] rounded-full bg-white/[.13] ${row.w}`} />
                <span className={`block h-[6px] rounded-full bg-white/[.06] ${row.w2}`} />
              </div>
              {/* Connector draws from the headline to the instrument it moves. */}
              <svg viewBox="0 0 22 8" width={22} height={8} aria-hidden="true" className="shrink-0 overflow-visible">
                <motion.path
                  d="M0 4 C8 4 10 1 22 4"
                  fill="none"
                  stroke="rgba(245,247,247,.45)"
                  strokeWidth={1}
                  strokeDasharray="40 40"
                  variants={V(reduce, { strokeDashoffset: 40 }, { strokeDashoffset: 0 }, land + 0.05, 0.4)}
                />
              </svg>
              <motion.span className="shrink-0" variants={V(reduce, { opacity: 0, x: -4 }, { opacity: 1, x: 0 }, land + 0.3, DUR.panel)}>
                <Chip className="text-(--mk-text)">{row.tag}</Chip>
              </motion.span>
              <motion.span className="shrink-0" variants={V(reduce, { scale: 1 }, { scale: [1, 1.18, 1] }, land + 0.5, 0.35)}>
                <Chip>{row.age} · Sample</Chip>
              </motion.span>
            </motion.div>
          );
        })}
      </div>
      {/* Mini week strip: a calendar pin drops onto the event day. */}
      <div className="mt-auto flex items-center gap-2 border-t border-white/[.06] pt-2">
        <span className="text-[9.5px] uppercase tracking-[.12em] text-(--mk-faint)">Calendar</span>
        <div className="relative flex flex-1 gap-1">
          {["Mon", "Tue", "Wed", "Thu", "Fri"].map((day, i) => (
            <span key={day} className={`relative flex-1 rounded-[4px] border py-[3px] text-center font-mono text-[8.5px] ${i === 2 ? "border-white/[.2] text-(--mk-text)" : "border-white/[.07] text-(--mk-faint)"}`}>
              {day}
              {i === 2 && (
                <motion.span
                  aria-hidden="true"
                  className="absolute -top-[7px] left-1/2 -ml-[3px] h-[6px] w-[6px] rounded-full bg-[#F5F7F7]"
                  variants={V(reduce, { y: -14, opacity: 0 }, { y: [-14, 0, -2, 0], opacity: 1 }, t + 1.75, 0.45, { times: [0, 0.6, 0.8, 1] })}
                />
              )}
            </span>
          ))}
        </div>
        <motion.span variants={V(reduce, { opacity: 0 }, { opacity: 1 }, t + 2.05, DUR.panel)}>
          <Chip>Event · Sample</Chip>
        </motion.span>
      </div>
    </div>
  );
}

/* ─────────────────────────── 03 · Evaluate ideas ─────────────────────────── */

export function RuleStory({ t }: { t: number }) {
  const reduce = useReducedMotion();
  const confirm = t + 1.55;
  const arm = t + 1.95;
  const cross = t + 2.15 + 0.62; // line crosses the threshold ~62% through its draw
  return (
    <div className={`${VIS} flex flex-col gap-2`}>
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 text-[12.5px] leading-snug text-(--mk-text)">
          <Typed text="“When XAUUSD crosses above —”" t={t} duration={0.85} />
        </p>
        <SampleTag />
      </div>
      {/* Speak-back bubble: the rule is repeated in plain words before anything arms. */}
      <motion.p
        variants={V(reduce, { opacity: 0, x: 14 }, { opacity: 1, x: 0 }, t + 1.0, DUR.section)}
        className="self-end rounded-xl rounded-tr-sm border border-white/[.08] bg-[#171B1D] px-2.5 py-1.5 text-[11px] leading-snug text-(--mk-dim)"
      >
        Repeat: alert when XAUUSD crosses above your level — confirm? <SampleTag />
      </motion.p>
      <div className="flex items-center justify-between border-t border-white/[.06] pt-2">
        <motion.span
          variants={V(reduce, { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, confirm - 0.25, DUR.panel)}
          className="inline-flex items-center gap-1.5 rounded-full border border-white/[.16] px-2 py-[3px] text-[10.5px] text-(--mk-text)"
        >
          <svg viewBox="0 0 20 20" className="h-3 w-3" aria-hidden="true">
            <motion.path
              d="M4 10.5l4 4 8-9"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="30 30"
              variants={V(reduce, { strokeDashoffset: 30 }, { strokeDashoffset: 0 }, confirm, 0.35)}
            />
          </svg>
          Confirm
        </motion.span>
        <span className="flex items-center gap-2">
          <span className="relative h-4 w-[46px] text-right font-mono text-[10.5px] uppercase tracking-[.1em]">
            <motion.span
              variants={{ hidden: { opacity: 1, visibility: "visible" }, visible: { opacity: 0, transition: reduce ? { duration: 0 } : { duration: DUR.normal, delay: arm }, transitionEnd: { visibility: "hidden" } } }}
              className="absolute inset-0 text-(--mk-faint)"
            >
              Off
            </motion.span>
            <motion.span variants={V(reduce, { opacity: 0 }, { opacity: 1 }, arm, DUR.normal)} className="absolute inset-0 text-[#00E676]">
              Armed
            </motion.span>
          </span>
          <span aria-hidden="true" className="relative h-[18px] w-[32px] rounded-full border border-white/[.14] bg-[#171B1D]">
            <motion.span variants={V(reduce, { opacity: 0 }, { opacity: 1 }, arm, DUR.panel)} className="absolute inset-0 rounded-full" style={{ background: "rgba(0,168,90,.35)" }} />
            <motion.span variants={V(reduce, { x: 0 }, { x: 14 }, arm, DUR.panel)} className="absolute left-[2px] top-[2px] h-3 w-3 rounded-full bg-[#F5F7F7]" />
          </span>
        </span>
      </div>
      {/* Sample price line rises into the dashed threshold; on the cross the bell rings. */}
      <div className="mt-auto flex items-center gap-2">
        <div className="relative h-[34px] flex-1">
          <svg viewBox="0 0 200 34" preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" aria-hidden="true">
            <line x1={0} x2={200} y1={11} y2={11} stroke="rgba(245,247,247,.32)" strokeWidth={1} strokeDasharray="4 3" vectorEffect="non-scaling-stroke" />
            <motion.line
              x1={0}
              x2={200}
              y1={11}
              y2={11}
              stroke={UP_HEX}
              strokeWidth={1.2}
              strokeDasharray="4 3"
              vectorEffect="non-scaling-stroke"
              variants={V(reduce, { opacity: 0 }, { opacity: [0, 1, 0.45] }, cross, 0.5)}
            />
            <motion.path
              d="M0 30 L22 27 L40 29 L62 22 L80 24 L102 18 L120 20 L138 13 L150 9 L166 11 L184 6 L200 4"
              fill="none"
              stroke="#A3AAAC"
              strokeWidth={1.4}
              strokeLinejoin="round"
              vectorEffect="non-scaling-stroke"
              strokeDasharray="1200 1200"
              variants={V(reduce, { strokeDashoffset: 1200 }, { strokeDashoffset: 0 }, t + 2.15, 1, { ease: "linear" })}
            />
          </svg>
          <span className="absolute -bottom-[2px] right-0 font-mono text-[9px] text-(--mk-faint)">threshold · Sample</span>
        </div>
        <motion.span
          className="grid h-7 w-7 shrink-0 origin-top place-items-center rounded-lg border border-white/[.11] bg-[#171B1D] text-(--mk-dim)"
          variants={V(reduce, { rotate: 0 }, { rotate: [0, -16, 13, -8, 4, 0] }, cross, 0.4, { ease: "easeOut" })}
          onAnimationComplete={(definition) => {
            if (definition === "visible") softTick();
          }}
        >
          <Icon name="bell" className="h-3.5 w-3.5" />
        </motion.span>
      </div>
    </div>
  );
}

/* ─────────────────────────── 04 · Review your trading ─────────────────────────── */

export function RiskStory({ t }: { t: number }) {
  const reduce = useReducedMotion();
  const LIMIT = 0.72;
  const bars = [
    { label: "Metals", value: 0.46 },
    { label: "FX", value: 0.6 },
    { label: "Crypto", value: 0.88 },
  ];
  const warn = t + 0.35 + 0.2 + 0.42; // the Crypto bar passes the limit
  return (
    <div className={`${VIS} flex flex-col`}>
      <div className="flex items-center justify-between">
        <span className="text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">Exposure</span>
        <SampleTag />
      </div>
      <div className="my-auto flex items-center gap-3">
        <div className="relative flex flex-1 flex-col gap-3 pl-[50px]">
          <motion.span
            variants={V(reduce, { opacity: 0 }, { opacity: 1 }, t + 0.1, DUR.panel)}
            aria-hidden="true"
            className="absolute -bottom-1 -top-1 border-l border-dashed border-white/[.32]"
            style={{ left: `calc(50px + (100% - 50px) * ${LIMIT})` }}
          />
          {bars.map((bar, index) => {
            const over = bar.value > LIMIT;
            return (
              <div key={bar.label} className="relative flex items-center">
                <span className="absolute -left-[50px] w-[46px] font-mono text-[10px] text-(--mk-dim)">{bar.label}</span>
                <span className="relative block h-[7px] w-full rounded-full bg-white/[.05]">
                  <motion.span
                    variants={V(reduce, { scaleX: 0 }, { scaleX: 1 }, t + 0.15 + index * 0.1, 0.75)}
                    className="absolute inset-y-0 left-0 origin-left rounded-full"
                    style={{ width: `${bar.value * 100}%`, background: over ? DOWN_HEX : "rgba(163,170,172,.45)" }}
                  />
                </span>
              </div>
            );
          })}
          {/* Stop-loss guard: steps in as Crypto crosses the limit and raises its shield — warns, never acts. */}
          <StopGuard at={warn - 0.1} reduce={reduce} left={`calc(50px + (100% - 50px) * ${bars[2].value} - 5px)`} />
        </div>
        {/* Semicircle risk gauge: needle swings from low into the limit zone and settles. */}
        <div className="relative h-[34px] w-[60px] shrink-0" aria-hidden="true">
          <svg viewBox="0 0 60 34" className="absolute inset-0 h-full w-full">
            <path d="M6 30 A24 24 0 0 1 54 30" fill="none" stroke="rgba(255,255,255,.1)" strokeWidth={4} strokeLinecap="round" />
            <path d="M46.6 13.4 A24 24 0 0 1 54 30" fill="none" stroke={DOWN_HEX} strokeOpacity={0.7} strokeWidth={4} strokeLinecap="round" />
          </svg>
          <motion.span
            className="absolute bottom-[4px] left-[29px] h-[21px] w-[2px] origin-bottom rounded-full bg-[#F5F7F7]"
            variants={V(reduce, { rotate: -78 }, { rotate: [-78, 66, 52, 56] }, t + 0.25, 1.1, { times: [0, 0.55, 0.8, 1] })}
          />
          <span className="absolute bottom-[2px] left-[27px] h-[6px] w-[6px] rounded-full bg-[#F5F7F7]" />
        </div>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1.5 border-t border-white/[.06] pt-2">
        <span className="flex items-center gap-2">
          <motion.span
            className="relative grid h-6 w-6 shrink-0 place-items-center rounded-full border border-[#FF3B3B]/50 bg-[#FF3B3B]/[.12] text-[#FF6464]"
            variants={V(reduce, { scale: 0, opacity: 0 }, { scale: [0, 1.25, 1], opacity: 1 }, warn, 0.4)}
          >
            <Icon name="shield" className="h-3.5 w-3.5" strokeWidth={2} />
            <motion.span
              aria-hidden="true"
              className="absolute inset-0 rounded-full border border-[#FF3B3B]"
              variants={V(reduce, { scale: 1, opacity: 0 }, { scale: [1, 1.9], opacity: [0.8, 0] }, warn + 0.2, 0.7, { repeat: reduce ? 0 : 1, ease: "easeOut" })}
            />
          </motion.span>
          <span className="text-[11px] text-(--mk-text)">
            <Typed text="Warns — never acts" t={warn + 0.35} duration={0.6} />
          </span>
        </span>
        <motion.span variants={V(reduce, { opacity: 0, y: 4 }, { opacity: 1, y: 0 }, warn + 0.9, DUR.panel)} className="flex shrink-0 items-center gap-1.5">
          <span className="rounded-full border border-dashed border-white/[.14] px-2 py-[2px] text-[10px] text-(--mk-faint) line-through decoration-[#FF6464]/70">Close position</span>
          <Chip>0 order buttons</Chip>
        </motion.span>
      </div>
    </div>
  );
}

/* ─────────────────────────── 05 · Connect with traders ─────────────────────────── */

const ROOMS = ["Gold", "Silver", "Crude", "EURUSD", "USDJPY", "GBPUSD", "NZDUSD", "Crypto"];
const THUMB = [5, 8, 6, 11, 9, 14];

export function RoomStory({ t }: { t: number }) {
  const reduce = useReducedMotion();
  const pauseRef = usePauseOffscreen<HTMLDivElement>();
  const msg1 = t + 0.85;
  const stamp = t + 2.25;
  return (
    <div ref={pauseRef} className={`${VIS} flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[10.5px] uppercase tracking-[.12em] text-(--mk-faint)">
          <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-[#00E676] motion-safe:animate-pulse" />
          Metals room
        </span>
        <motion.span
          variants={V(reduce, { opacity: 0, scale: 1.4 }, { opacity: 1, scale: 1 }, stamp, 0.3)}
          className="relative inline-flex items-center gap-1 rounded-full border border-white/[.16] bg-[#171B1D] px-2 py-[3px] font-mono text-[9.5px] text-(--mk-text)"
        >
          <Icon name="check" className="h-2.5 w-2.5" strokeWidth={2.4} />
          Verified record · Sample
          <motion.span
            aria-hidden="true"
            className="absolute inset-0 rounded-full border border-[#00E676]"
            variants={V(reduce, { opacity: 0, scale: 1 }, { opacity: [0.9, 0], scale: [1, 1.35] }, stamp + 0.2, 0.5)}
          />
        </motion.span>
      </div>
      <div className="relative flex flex-col gap-2">
        {/* Typing indicator, then the first message lands in its place. */}
        <motion.span
          aria-hidden="true"
          className="absolute left-7 top-1 inline-flex gap-1 rounded-xl rounded-bl-sm border border-white/[.08] bg-[#171B1D] px-2.5 py-2"
          variants={V(reduce, { opacity: 0 }, { opacity: [0, 1, 1, 0] }, t, msg1 - t, { times: [0, 0.12, 0.85, 1] })}
        >
          {[0, 1, 2].map((dot) => (
            <motion.span
              key={dot}
              className="h-1 w-1 rounded-full bg-[#A3AAAC]"
              variants={V(reduce, { y: 0 }, { y: [0, -3, 0] }, t + 0.1 + dot * 0.12, 0.36, { repeat: reduce ? 0 : 1 })}
            />
          ))}
        </motion.span>
        <motion.div variants={V(reduce, { opacity: 0, y: 8 }, { opacity: 1, y: 0 }, msg1)} className="flex items-end gap-2">
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[#171B1D] font-mono text-[8.5px] text-(--mk-dim)">
            AK
          </span>
          <span className="max-w-[86%] rounded-xl rounded-bl-sm border border-white/[.08] bg-[#171B1D] px-2.5 py-1.5 text-[11.5px] leading-snug text-(--mk-text)">
            Shared my gold chart for the London open. <SampleTag />
            {/* Shared-chart thumbnail: candles grow in (sample — no prices). */}
            <span className="mt-1.5 flex h-[22px] w-[86px] items-end gap-[5px] rounded-md border border-white/[.08] bg-(--afvar-charcoal) px-1.5 pb-1" aria-hidden="true">
              {THUMB.map((h, i) => (
                <motion.span
                  key={i}
                  className="w-[6px] origin-bottom rounded-[1px]"
                  style={{ height: h, background: i === 2 || i === 4 ? DOWN_HEX : UP_HEX }}
                  variants={V(reduce, { scaleY: 0 }, { scaleY: 1 }, msg1 + 0.4 + i * 0.07, DUR.panel)}
                />
              ))}
            </span>
          </span>
        </motion.div>
        <motion.div variants={V(reduce, { opacity: 0, y: 8 }, { opacity: 1, y: 0 }, t + 1.75)} className="flex items-end justify-end gap-2">
          <span className="max-w-[80%] rounded-xl rounded-br-sm border border-white/[.08] bg-(--afvar-panel) px-2.5 py-1.5 text-[11.5px] leading-snug text-(--mk-dim)">
            Matches my journal — thanks. <SampleTag />
          </span>
          <span aria-hidden="true" className="grid h-5 w-5 shrink-0 place-items-center rounded-full font-mono text-[8.5px] text-[#030405]" style={{ background: "#A3AAAC" }}>
            R
          </span>
        </motion.div>
      </div>
      {/* Eight official rooms, one per lane — a slow strip (CSS loop, paused off-screen). */}
      <div className="relative mt-auto overflow-hidden" aria-label="Official rooms">
        <div className="flex w-max animate-[home-tape_26s_linear_infinite] motion-reduce:animate-none">
          {[false, true].map((dup) =>
            ROOMS.map((room) => (
              <span
                key={`${room}${dup ? "-dup" : ""}`}
                aria-hidden={dup || undefined}
                className="mr-1.5 shrink-0 rounded-full border border-white/[.08] bg-(--afvar-panel) px-2 py-[2px] font-mono text-[9px] text-(--mk-dim)"
              >
                # {room}
              </span>
            )),
          )}
        </div>
        <span aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-[linear-gradient(270deg,#080A0B,transparent)]" />
      </div>
    </div>
  );
}
