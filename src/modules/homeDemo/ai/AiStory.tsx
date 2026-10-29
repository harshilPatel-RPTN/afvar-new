"use client";

// The AFVAR home story: ONE sticky stage, ONE master scroll progress, ONE AI.
// The WebGL core stays on screen from the first frame to the last and changes
// with the scroll (AiCoreScene); the copy and product cards for each act fade
// in and out over it from the same numbers (aiConfig) — so the page reads as
// one continuous film, never as separate sections.
//
// Mobile / reduced motion: the same acts stacked as normal sections, with the
// settled scene once under the hero. No WebGL: a CSS poster of the core.
import { MotionConfig, motion, useTransform, type MotionValue } from "framer-motion";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react";
import { fmtPrice, useLiveMarket, type HomeQuote } from "@/modules/home/kit";
import { useChapterStage } from "../chapterStage";
import { useInertWhileHidden } from "../reveal";
import { HAIR, MONO, REGISTER_HREF } from "../ui";
import { ACTS, COPY, LANES, SATELLITES, SETTLED_P, TRACK_VH, ramp, window4, type ActId } from "./aiConfig";

const AiCoreScene = dynamic(() => import("./AiCoreScene"), { ssr: false });

const ORDER: ActId[] = ["hero", "cores", "stream", "always", "ask", "os", "trust", "finale"];
const ACT_NAME: Record<ActId, string> = {
  hero: "AFVAR AI",
  cores: "Multicore",
  stream: "Every tick",
  always: "Always on",
  ask: "Ask",
  os: "The OS",
  trust: "Trust",
  finale: "Join",
};

export const GOLD_CTA =
  "afv-cta afv-gold inline-block rounded-full bg-[#E9B44C] px-6 py-3 text-sm font-semibold text-[#1A1206] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#FFD98A]";
const GHOST_LINK = "afv-link text-sm font-medium text-[#A3AAAC] transition-colors hover:text-[#F5F7F7]";
const CARD = "rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#0F1214]";
const EYEBROW = `${MONO} text-[#E9B44C]`;
const H2 = "text-[clamp(2rem,3.4vw,3.25rem)] font-semibold leading-[1.06] tracking-[-0.03em] text-[#F5F7F7]";
const BODY = "text-base leading-relaxed text-[#A3AAAC] xl:text-[17px]";

/* ===================================================================== story */

export function AiStory() {
  const { trackRef, progressRef, scrollYProgress, cinematic, active, mounted, webgl, reduced, revealRef } = useChapterStage(SETTLED_P);
  const { quotes } = useLiveMarket();
  const marketUp = useMemo(() => LANES.map((l) => (quotes[l.key]?.changePct ?? (l.up ? 1 : -1)) >= 0), [quotes]);

  return (
    <MotionConfig reducedMotion="user">
      <section
        ref={trackRef}
        id="afvar-ai"
        aria-label="AFVAR AI — the trading operating system that never stops thinking"
        className="relative bg-[#050607] text-[#F5F7F7]"
        style={cinematic ? { height: `${TRACK_VH}vh` } : undefined}
      >
        {cinematic ? (
          <div className="sticky top-0 h-svh overflow-hidden">
            <div className="absolute inset-0">
              <Poster />
              {webgl !== false && mounted ? (
                <div className="absolute inset-0">
                  <AiCoreScene progress={progressRef} active={active} still={false} marketUp={marketUp} />
                </div>
              ) : null}
            </div>
            <Stage mv={scrollYProgress} trackRef={trackRef} quotes={quotes} />
          </div>
        ) : (
          <Stacked revealRef={revealRef} scene={webgl !== false && mounted ? <AiCoreScene progress={progressRef} active={active} still={reduced} marketUp={marketUp} /> : null} quotes={quotes} />
        )}
      </section>
    </MotionConfig>
  );
}

/* ============================================================ cinematic stage */

function Stage({ mv, trackRef, quotes }: { mv: MotionValue<number>; trackRef: React.RefObject<HTMLElement | null>; quotes: Record<string, HomeQuote> }) {
  const hint = useTransform(mv, (p) => 1 - ramp(p, 0.004, 0.03));
  const label = useTransform(mv, (p) => ramp(p, 0.06, 0.1) * (1 - ramp(p, 0.93, 0.96)));
  const scrim = useTransform(mv, (p) => 0.75 + 0.25 * ramp(p, 0.62, 0.66) * (1 - ramp(p, 0.78, 0.8)));

  return (
    <div className="pointer-events-none absolute inset-0">
      {/* flat gradient so copy never sits on bright geometry */}
      <motion.div aria-hidden="true" className="absolute inset-y-0 left-0 w-[52%] bg-gradient-to-r from-[#050607] from-25% via-[rgba(5,6,7,0.7)] via-60% to-transparent" style={{ opacity: scrim }} />

      <Act mv={mv} act="hero" className="absolute left-10 top-1/2 w-[min(36rem,44vw)] -translate-y-[44%] xl:left-16">
        <HeroCopy />
      </Act>

      <Act mv={mv} act="cores" className="absolute left-10 top-1/2 w-[min(34rem,42vw)] -translate-y-1/2 xl:left-16">
        <CoresCopy />
      </Act>

      <Act mv={mv} act="stream" className="absolute left-10 top-1/2 w-[min(32rem,40vw)] -translate-y-1/2 xl:left-16">
        <StreamCopy />
      </Act>
      <Act mv={mv} act="stream" className="absolute bottom-10 right-[7.5rem] w-[25rem]" delay={0.01}>
        <FeedCard quotes={quotes} />
      </Act>

      <Act mv={mv} act="always" className="absolute left-10 top-1/2 w-[min(32rem,40vw)] -translate-y-1/2 xl:left-16">
        <AlwaysCopy />
      </Act>
      <Act mv={mv} act="always" className="absolute bottom-10 right-[7.5rem] w-[22rem]" delay={0.01}>
        <SessionCard />
      </Act>

      <Act mv={mv} act="ask" className="absolute left-10 top-1/2 w-[min(32rem,38vw)] -translate-y-1/2 xl:left-16">
        <AskCopy />
      </Act>
      <Act mv={mv} act="ask" className="absolute bottom-8 right-[7.5rem] w-[min(30rem,36vw)]" delay={0.012}>
        <AnswerCard />
      </Act>

      <Act mv={mv} act="os" className="absolute left-10 top-28 w-[min(30rem,36vw)] xl:left-16">
        <OsCopy />
      </Act>
      <Act mv={mv} act="os" className="absolute right-10 top-28 w-[22rem]" delay={0.014}>
        <SpotlightCard />
      </Act>

      <Act mv={mv} act="trust" className="absolute left-10 top-1/2 w-[min(32rem,38vw)] -translate-y-1/2 xl:left-16">
        <TrustCopy />
      </Act>
      <Act mv={mv} act="trust" className="absolute bottom-10 right-[7.5rem] w-[22rem]" delay={0.012}>
        <PermissionsCard />
      </Act>

      <Act mv={mv} act="finale" className="absolute left-10 top-1/2 w-[min(34rem,42vw)] -translate-y-1/2 xl:left-16">
        <FinaleCopy />
      </Act>

      <Rail mv={mv} trackRef={trackRef} />

      <motion.p className={`${MONO} absolute bottom-4 left-1/2 -translate-x-1/2 text-[10px] text-[#5E6669]`} style={{ opacity: label }}>
        Illustrative 3D · not market data
      </motion.p>

      <motion.div className="absolute bottom-8 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2" style={{ opacity: hint }}>
        <p className={`${MONO} text-[#6D7578]`}>Scroll to meet the AI</p>
        <div className="h-8 w-px bg-gradient-to-b from-[#E9B44C] to-transparent" />
      </motion.div>
    </div>
  );
}

/** One act's overlay: fades over its copy window, rises in, never focusable while hidden. */
function Act({ mv, act, className, delay = 0, children }: { mv: MotionValue<number>; act: ActId; className: string; delay?: number; children: ReactNode }) {
  const w = COPY[act];
  const at = [w[0] + delay, w[1] + delay, w[2], w[3]] as const;
  const opacity = useTransform(mv, (p) => window4(p, at));
  const y = useTransform(mv, (p) => (p < at[2] ? (1 - ramp(p, at[0], at[1])) * 28 : -ramp(p, at[2], at[3]) * 18));
  const { ref } = useInertWhileHidden(opacity);
  return (
    <motion.div ref={ref} className={className} style={{ opacity, y }} inert={window4(mv.get(), at) < 0.05}>
      <div className="pointer-events-auto">{children}</div>
    </motion.div>
  );
}

/** Right-edge act index: shows where you are and jumps to any act. */
function Rail({ mv, trackRef }: { mv: MotionValue<number>; trackRef: React.RefObject<HTMLElement | null> }) {
  const [current, setCurrent] = useState<ActId>("hero");
  useEffect(
    () =>
      mv.on("change", (p) => {
        const found = ORDER.find((a) => p >= ACTS[a][0] && p < ACTS[a][1]) ?? "finale";
        setCurrent((c) => (c === found ? c : found));
      }),
    [mv],
  );
  const opacity = useTransform(mv, (p) => ramp(p, 0.03, 0.07));

  const go = (act: ActId) => {
    const el = trackRef.current;
    if (!el) return;
    const span = el.offsetHeight - window.innerHeight;
    const target = act === "hero" ? 0 : (COPY[act][1] + COPY[act][2]) / 2;
    const top = el.getBoundingClientRect().top + window.scrollY + span * target;
    const reduce = document.documentElement.dataset.reduceMotion === "true" || window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <motion.nav aria-label="Story chapters" className="pointer-events-auto absolute right-6 top-1/2 -translate-y-1/2" style={{ opacity }}>
      <ol className="flex flex-col items-end gap-3">
        {ORDER.map((a, i) => {
          const on = a === current;
          return (
            <li key={a}>
              <button
                type="button"
                onClick={() => go(a)}
                aria-current={on ? "step" : undefined}
                className="group flex items-center gap-3 py-0.5 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#E9B44C]"
              >
                <span className={`${MONO} text-[10px] transition-opacity ${on ? "text-[#E9B44C] opacity-100" : "text-[#8A9295] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"}`}>
                  {String(i + 1).padStart(2, "0")} {ACT_NAME[a]}
                </span>
                <span className={`block h-px transition-all ${on ? "w-8 bg-[#E9B44C]" : "w-4 bg-[#4A5256] group-hover:bg-[#A3AAAC]"}`} />
              </button>
            </li>
          );
        })}
      </ol>
    </motion.nav>
  );
}

/* ================================================================ act copy */

function HeroCopy() {
  return (
    <div>
      <p className={EYEBROW}>Pre-launch · AFVAR AI</p>
      <h1 className="mt-5 text-[clamp(2.6rem,4.6vw,4.4rem)] font-semibold leading-[1.02] tracking-[-0.035em] text-[#F5F7F7]">
        The trading OS <span className="text-[#E9B44C]">that never stops thinking.</span>
      </h1>
      <p className={`mt-6 max-w-[30rem] ${BODY}`}>
        AFVAR is an operating system for traders, built around one AI. A multicore mind that reads commodities, forex and crypto every millisecond, around the
        clock, and explains what it sees in plain words. It never places a trade.
      </p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link href={REGISTER_HREF} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <Link href="/platform" className={GHOST_LINK}>
          Explore the platform
        </Link>
      </div>
      <div className={`mt-10 flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR} pt-5`}>
        <LiveClock />
        <span className={`${MONO} text-[#6D7578]`}>24 / 7 / 365</span>
        <span className={`${MONO} text-[#6D7578]`}>8 markets</span>
        <span className={`${MONO} text-[#6D7578]`}>0 order buttons</span>
      </div>
    </div>
  );
}

const CORE_LINES: Record<(typeof SATELLITES)[number]["id"], string> = {
  market: "Reads price, structure and volume on every chart.",
  macro: "Tracks rates, inflation and the economic calendar.",
  news: "Reads headlines and filings the moment they land.",
  risk: "Watches your exposure and your daily limits.",
  memory: "Remembers your plans, notes and past trades.",
  voice: "Listens and speaks, in English and हिन्दी.",
  verify: "Checks every answer against its sources before you see it.",
};

function CoresCopy() {
  return (
    <div>
      <p className={EYEBROW}>01 · Multicore AI</p>
      <h2 className={`mt-4 ${H2}`}>
        One AI. <span className="text-[#A3AAAC]">Seven cores thinking at once.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>Each core is a specialist. They work in parallel and reach one answer together.</p>
      <ul className={`mt-7 grid gap-x-6 gap-y-3 border-t ${HAIR} pt-5 sm:grid-cols-2`}>
        {SATELLITES.map((s) => (
          <li key={s.id} className="flex gap-3">
            <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${s.id === "verify" ? "bg-[#FFD98A]" : "bg-[#E9B44C]"}`} />
            <span>
              <span className="block text-sm font-semibold text-[#F5F7F7]">{s.label}</span>
              <span className="block text-[13px] leading-snug text-[#8A9295]">{CORE_LINES[s.id]}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function StreamCopy() {
  return (
    <div>
      <p className={EYEBROW}>02 · Every tick</p>
      <h2 className={`mt-4 ${H2}`}>
        Every tick. <span className="text-[#A3AAAC]">Every market. Every millisecond.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>
        Gold, silver, oil, the major currencies and Bitcoin stream into the cores as they move. Nothing is sampled once an hour. Nothing waits for you to open a
        chart.
      </p>
    </div>
  );
}

function AlwaysCopy() {
  return (
    <div>
      <p className={EYEBROW}>03 · Always on</p>
      <h2 className={`mt-4 ${H2}`}>
        It never sleeps. <span className="text-[#A3AAAC]">24 hours, 7 days, every week of every year.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>
        Sydney hands over to Tokyo, Tokyo to London, London to New York, and crypto never closes. The AI follows each session, so the brief is ready when you
        are.
      </p>
    </div>
  );
}

function AskCopy() {
  return (
    <div>
      <p className={EYEBROW}>04 · Ask</p>
      <h2 className={`mt-4 ${H2}`}>
        Ask in your words. <span className="text-[#A3AAAC]">Get an answer you can check.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>
        Type it or say it, in English or हिन्दी. You get a clear view, bullish, bearish or wait, with the level that proves it wrong and every source attached.
      </p>
      <div className="mt-6 flex flex-wrap gap-2">
        {["What's moving gold?", "Am I near my daily limit?", "Open my London layout"].map((q) => (
          <span key={q} className="rounded-full border border-[rgba(255,255,255,0.14)] px-3.5 py-1.5 text-[13px] text-[#C9CFD1]">
            “{q}”
          </span>
        ))}
      </div>
    </div>
  );
}

const OS_FEATURES = ["AI Spotlight", "Notifications", "Focus modes", "Spaces", "Widgets", "Saved layouts", "Notes & files", "Desktop ↔ phone"] as const;

function OsCopy() {
  return (
    <div>
      <p className={EYEBROW}>05 · The OS</p>
      <h2 className={`mt-4 ${H2}`}>
        Not a charting tool. <span className="text-[#A3AAAC]">An operating system for trading.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>Charts are one app. Around them, everything a modern OS gives you, driven by the AI.</p>
      <ul className="mt-6 grid grid-cols-2 gap-2">
        {OS_FEATURES.map((f) => (
          <li key={f} className={`${CARD} rounded-xl px-3 py-2 text-[13px] text-[#C9CFD1]`}>
            {f}
          </li>
        ))}
      </ul>
    </div>
  );
}

const STEPS = [
  ["You ask", "Text, voice or a click."],
  ["AI understands", "The core plans the work."],
  ["Policy gate", "Trades are always refused here."],
  ["It acts in the OS", "Opens, arranges, explains."],
  ["Verified, then shown", "No silent success."],
] as const;

function TrustCopy() {
  return (
    <div>
      <p className={EYEBROW}>06 · Trust</p>
      <h2 className={`mt-4 ${H2}`}>
        It warns. <span className="text-[#A3AAAC]">It never acts.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>Every request passes a policy gate before anything happens. AFVAR can open, explain and warn. It cannot place, change or close a trade.</p>
      <ol className={`mt-6 border-t ${HAIR}`}>
        {STEPS.map(([t, d], i) => (
          <li key={t} className={`flex items-baseline gap-4 border-b ${HAIR} py-2.5`}>
            <span className={`${MONO} w-6 text-[10px] ${i === 2 ? "text-[#E9B44C]" : "text-[#6D7578]"}`}>{String(i + 1).padStart(2, "0")}</span>
            <span className={`text-sm font-semibold ${i === 2 ? "text-[#E9B44C]" : "text-[#F5F7F7]"}`}>{t}</span>
            <span className="ml-auto text-[13px] text-[#8A9295]">{d}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

function FinaleCopy() {
  return (
    <div>
      <p className={EYEBROW}>Launching soon</p>
      <h2 className="mt-4 text-[clamp(2.4rem,4.2vw,4rem)] font-semibold leading-[1.03] tracking-[-0.035em] text-[#F5F7F7]">
        One mind. Always on. <span className="text-[#E9B44C]">On your side.</span>
      </h2>
      <p className={`mt-6 max-w-[30rem] ${BODY}`}>Register now to be first in line when the AFVAR OS opens, with your place in the launch queue.</p>
      <div className="mt-8 flex flex-wrap items-center gap-5">
        <Link href={REGISTER_HREF} prefetch={false} className={GOLD_CTA}>
          Register Now
        </Link>
        <a href="#launch-queue" className={GHOST_LINK}>
          See the launch queue
        </a>
      </div>
    </div>
  );
}

/* ================================================================== cards */

function FeedCard({ quotes }: { quotes: Record<string, HomeQuote> }) {
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#8A9295]`}>Market feed · into the cores</p>
        <span className="flex items-center gap-1.5 text-[11px] text-[#8A9295]">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00E676]" />
          polls every 15 s
        </span>
      </div>
      <ul className="mt-3 divide-y divide-[rgba(255,255,255,0.06)]">
        {LANES.map((l) => {
          const q = quotes[l.key];
          if (!q) return null;
          const up = q.changePct >= 0;
          return (
            <li key={l.key} className="flex items-center gap-3 py-1.5 font-mono text-[12px]">
              <span className="w-16 text-[#C9CFD1]">{l.sym}</span>
              <span className="ml-auto tabular-nums text-[#F5F7F7]">{fmtPrice(q.last, q.decimals)}</span>
              <span className={`w-14 text-right tabular-nums ${up ? "text-[#00E676]" : "text-[#FF6B6B]"}`}>
                {up ? "+" : "−"}
                {Math.abs(q.changePct).toFixed(2)}%
              </span>
              <span className="w-14 text-right text-[10px] uppercase tracking-wider text-[#6D7578]">{q.status}</span>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-[11px] leading-snug text-[#6D7578]">Real prices with their own freshness label. Live = spot feed, delayed = up to ~10 min, snapshot = stored.</p>
    </div>
  );
}

/** Approximate main session hours in UTC (standard time). */
const SESSION_HOURS = [
  { name: "Sydney", from: 22, to: 7 },
  { name: "Tokyo", from: 0, to: 9 },
  { name: "London", from: 8, to: 17 },
  { name: "New York", from: 13, to: 22 },
] as const;

function fxOpen(d: Date) {
  const day = d.getUTCDay();
  const h = d.getUTCHours();
  if (day === 6) return false;
  if (day === 5 && h >= 22) return false;
  if (day === 0 && h < 22) return false;
  return true;
}

/** Minute clock shared by the session board (null on the server render). */
function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
}
let minuteSnap = 0;
function readMinute() {
  const m = Math.floor(Date.now() / 60_000);
  if (m !== minuteSnap) minuteSnap = m;
  return minuteSnap;
}
function useNow(): Date | null {
  const m = useSyncExternalStore(subscribeMinute, readMinute, () => 0);
  return m ? new Date(m * 60_000) : null;
}

function SessionCard() {
  const now = useNow();
  const h = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : -1;
  const weekOpen = now ? fxOpen(now) : true;
  const rows = [
    ...SESSION_HOURS.map((s) => ({ name: s.name, open: now ? weekOpen && (s.from < s.to ? h >= s.from && h < s.to : h >= s.from || h < s.to) : null })),
    { name: "Crypto", open: now ? true : null },
  ];
  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#8A9295]`}>Sessions right now</p>
        <span className="font-mono text-[11px] text-[#8A9295]">{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "—"}</span>
      </div>
      <ul className="mt-3 space-y-1.5">
        {rows.map((r) => (
          <li key={r.name} className="flex items-center justify-between text-[13px]">
            <span className="text-[#C9CFD1]">{r.name}</span>
            <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${r.open ? "text-[#00E676]" : "text-[#6D7578]"}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${r.open ? "bg-[#00E676]" : "bg-[#3A4044]"}`} />
              {r.open === null ? "—" : r.open ? "Open" : "Closed"}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-2.5 text-[11px] text-[#6D7578]">
        <span>Approx. hours, UTC</span>
        <span className="text-[#E9B44C]">AI coverage: all of them</span>
      </p>
    </div>
  );
}

function AnswerCard() {
  return (
    <article className="rounded-3xl border border-[rgba(233,180,76,0.3)] bg-[#0F1214] p-5" aria-label="Sample answer from AFVAR AI">
      <div className="mb-4 ml-auto flex w-max items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#171A1C] px-4 py-2.5">
        <VoiceBars />
        <span className="text-[15px]" lang="hi">
          सोने में आज क्या चल रहा है?
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span aria-hidden="true" className="h-5 w-5 rounded-full bg-[radial-gradient(circle_at_35%_35%,#FFD98A,#E9B44C_45%,#7A4E10)]" />
          <span className="text-sm font-semibold">AFVAR AI</span>
          <span className={`${MONO} text-[10px] text-[#6D7578]`}>XAU/USD · 1H · Sample</span>
        </div>
        <span className="rounded-full border border-[rgba(233,180,76,0.5)] bg-[rgba(233,180,76,0.12)] px-3 py-1 font-mono text-[11px] tracking-[0.14em] text-[#E9B44C]">WAIT</span>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[#E6E9EB]">
        Gold is holding last week&apos;s high, but US payrolls land in 3 hours and usually move it. A close above 4,040 would turn the view bullish; below 3,985 it
        turns bearish.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Wrong if below", "3,985", "text-[#FF6B6B]"],
          ["Bullish above", "4,040", "text-[#00E676]"],
          ["Graded in public", "in 4 h", "text-[#F5F7F7]"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C0D] p-2.5">
            <p className={`${MONO} text-[9px] text-[#6D7578]`}>{k}</p>
            <p className={`mt-1 text-base font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6D7578]">
        <span className="flex gap-1.5 font-mono tracking-wider">
          <span>MARKET</span>·<span>MACRO</span>·<span>NEWS</span>·<span className="text-[#E9B44C]">VERIFIED</span>
        </span>
        <span>Sample · not investment advice</span>
      </div>
    </article>
  );
}

function VoiceBars() {
  return (
    <span aria-hidden="true" className="afv-voice flex h-5 items-center gap-[3px]">
      {[8, 14, 10, 18, 12, 16, 7, 12].map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-[#E9B44C]" style={{ height: h, animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

function SpotlightCard() {
  return (
    <div className="rounded-2xl border border-[rgba(233,180,76,0.45)] bg-[rgba(18,21,23,0.96)] p-3.5">
      <div className="flex items-center gap-2.5">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#E9B44C" strokeWidth="2" strokeLinecap="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M20 20l-4-4" />
        </svg>
        <span className="text-[14px]">Show my London layout and today&apos;s events</span>
        <span className="ml-auto font-mono text-[10px] text-[#6D7578]">⌘K</span>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-[11px]">
        <span className="rounded-md bg-[rgba(233,180,76,0.16)] px-2 py-1 text-[#E9B44C]">AI · opening 3 windows</span>
        <span className="rounded-md bg-[#15191B] px-2 py-1 text-[#C9CFD1]">Calendar</span>
        <span className="rounded-md bg-[#15191B] px-2 py-1 text-[#C9CFD1]">Layout: London</span>
      </div>
      <div className="mt-3 space-y-1.5">
        <p className="rounded-lg border border-[rgba(255,255,255,0.08)] bg-[#111416] px-3 py-2 text-[12px] text-[#C9CFD1]">
          <span className="font-semibold text-[#E9B44C]">Alert · EUR/USD</span> closed above the weekly high.
        </p>
        <p className="rounded-lg border border-[rgba(255,107,107,0.35)] bg-[#111416] px-3 py-2 text-[12px] text-[#C9CFD1]">
          <span className="font-semibold text-[#FF6B6B]">Risk Guardian</span> 80% of today&apos;s loss limit.
        </p>
      </div>
      <p className={`${MONO} mt-2.5 text-[9px] text-[#5E6669]`}>Sample notifications</p>
    </div>
  );
}

function PermissionsCard() {
  const rows = [
    ["Broker account", "Read-only", "text-[#00E676]"],
    ["Place or change orders", "Never", "text-[#FF6B6B]"],
    ["Your journal & notes", "Private to you", "text-[#C9CFD1]"],
    ["Every number", "Source + time shown", "text-[#C9CFD1]"],
  ] as const;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <p className={`border-b border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-[13px] font-semibold`}>Privacy & permissions</p>
      {rows.map(([k, v, c]) => (
        <div key={k} className="flex justify-between border-b border-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[13px] last:border-b-0">
          <span className="text-[#C9CFD1]">{k}</span>
          <span className={c}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/** UTC wall clock to the millisecond — the AI's heartbeat, written straight to the DOM. */
function LiveClock() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let raf = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    const write = () => {
      const d = new Date();
      const pad = (n: number, l = 2) => String(n).padStart(l, "0");
      const ms = reduce ? "" : `.${pad(d.getUTCMilliseconds(), 3)}`;
      if (ref.current) ref.current.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${ms} UTC`;
    };
    const loop = () => {
      write();
      raf = requestAnimationFrame(loop);
    };
    if (reduce) {
      write();
      iv = setInterval(write, 1000);
    } else loop();
    return () => {
      cancelAnimationFrame(raf);
      if (iv) clearInterval(iv);
    };
  }, []);
  return (
    <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#E9B44C]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E9B44C] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E9B44C]" />
      </span>
      <span ref={ref} className="tabular-nums" suppressHydrationWarning>
        --:--:--.--- UTC
      </span>
    </span>
  );
}

/* ================================================== stacked (mobile / reduced) */

function Stacked({ revealRef, scene, quotes }: { revealRef: React.RefObject<HTMLDivElement | null>; scene: ReactNode; quotes: Record<string, HomeQuote> }) {
  const block = "px-5 py-16 sm:px-8 border-t border-[rgba(255,255,255,0.06)]";
  return (
    <div>
      <div className="px-5 pb-12 pt-36 sm:px-8">
        <HeroCopy />
        <div ref={revealRef} className="relative mt-10 h-[52svh] min-h-[320px] overflow-hidden rounded-2xl border border-[rgba(255,255,255,0.08)]">
          <Poster />
          {scene ? <div className="absolute inset-0">{scene}</div> : null}
          <p className={`${MONO} absolute bottom-3 right-4 text-[10px] text-[#5E6669]`}>Illustrative · not market data</p>
        </div>
      </div>
      <div className={block}>
        <CoresCopy />
      </div>
      <div className={block}>
        <StreamCopy />
        <div className="mt-8 max-w-md">
          <FeedCard quotes={quotes} />
        </div>
      </div>
      <div className={block}>
        <AlwaysCopy />
        <div className="mt-8 max-w-sm">
          <SessionCard />
        </div>
      </div>
      <div className={block}>
        <AskCopy />
        <div className="mt-8 max-w-lg">
          <AnswerCard />
        </div>
      </div>
      <div className={block}>
        <OsCopy />
        <div className="mt-8 max-w-sm">
          <SpotlightCard />
        </div>
      </div>
      <div className={block}>
        <TrustCopy />
        <div className="mt-8 max-w-sm">
          <PermissionsCard />
        </div>
      </div>
      <div className={block}>
        <FinaleCopy />
      </div>
    </div>
  );
}

/** CSS stand-in for the core while WebGL loads, or when it is unavailable. */
function Poster() {
  return (
    <div aria-hidden="true" className="absolute inset-0 bg-[#050607]">
      <div className="absolute left-[62%] top-1/2 h-[46vmin] w-[46vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(233,180,76,0.28),transparent_68%)]" />
      <div className="absolute left-[62%] top-1/2 h-[13vmin] w-[13vmin] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_38%_35%,#FFD98A,#E9B44C_40%,#7A4E10_85%)] shadow-[0_0_80px_20px_rgba(233,180,76,0.35)]" />
      <div className="absolute left-[62%] top-1/2 h-[40vmin] w-[40vmin] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(233,180,76,0.18)]" />
    </div>
  );
}

/** Extra CSS for the AI story (gold CTA fill + voice bars). */
export const AI_CSS = `
.afv-gold::before { background: #FFD98A !important; }
.afv-gold::after { filter: sepia(1) saturate(3) hue-rotate(-10deg); }
@keyframes afv-voice { 0%,100% { transform: scaleY(.45) } 50% { transform: scaleY(1) } }
.afv-voice > span { animation: afv-voice 1.1s ease-in-out infinite; transform-origin: center; }
@media (prefers-reduced-motion: reduce) { .afv-voice > span { animation: none; } }
html[data-reduce-motion="true"] .afv-voice > span { animation: none; }
`;
