"use client";

// Copy blocks and product cards for each act of the home film. Shared by the
// cinematic stage and the stacked (mobile / reduced-motion) layout.
import { type MotionValue } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useSyncExternalStore } from "react";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import {
  AiOrb,
  BODY,
  CARD,
  CARD_AI,
  CHIP,
  EYEBROW,
  GHOST_LINK,
  GOLD_CTA,
  H1,
  H2,
  HAIR,
  MONO,
  SOFT,
  useStep,
} from "@/modules/afvarOs";
import { REGISTER_HREF } from "../ui";
import { SATELLITES, SOURCES, STORY, THINK, THINK_OUT } from "./aiConfig";

export type Quotes = Record<string, HomeQuote>;

/* ------------------------------------------------------------ market text */

export const LANE_KEYS = [
  ["XAUUSD", "XAU/USD"],
  ["XAGUSD", "XAG/USD"],
  ["WTI", "WTI"],
  ["EURUSD", "EUR/USD"],
  ["USDJPY", "USD/JPY"],
  ["GBPUSD", "GBP/USD"],
  ["NZDUSD", "NZD/USD"],
  ["BTC-USD", "BTC"],
] as const;

export function quoteLine(q: HomeQuote | undefined, sym: string): string {
  if (!q) return sym;
  const up = q.changePct >= 0;
  return `${sym} ${fmtPrice(q.last, q.decimals)} ${up ? "▲" : "▼"}${Math.abs(q.changePct).toFixed(2)}%`;
}

/* ------------------------------------------------------------------ hero */

export function HeroCopy() {
  return (
    <div>
      <p className={EYEBROW}>Pre-launch · AFVAR AI</p>
      <h1 className={`mt-5 ${H1}`}>
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

/** UTC wall clock to the millisecond, written straight to the DOM. */
export function LiveClock({ ms = true }: { ms?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
    let raf = 0;
    let iv: ReturnType<typeof setInterval> | undefined;
    const pad = (n: number, l = 2) => String(n).padStart(l, "0");
    const write = () => {
      const d = new Date();
      const tail = ms && !reduce ? `.${pad(d.getUTCMilliseconds(), 3)}` : "";
      if (ref.current) ref.current.textContent = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}${tail} UTC`;
    };
    const loop = () => {
      write();
      raf = requestAnimationFrame(loop);
    };
    if (reduce || !ms) {
      write();
      iv = setInterval(write, 1000);
    } else loop();
    return () => {
      cancelAnimationFrame(raf);
      if (iv) clearInterval(iv);
    };
  }, [ms]);
  return (
    <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#E9B44C]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#E9B44C] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#E9B44C]" />
      </span>
      <span ref={ref} className="tabular-nums">
        --:--:-- UTC
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- cores */

export function CoresCopy() {
  return (
    <div>
      <p className={EYEBROW}>01 · Multicore AI</p>
      <h2 className={`mt-4 ${H2}`}>
        One AI. <span className={SOFT}>Seven cores thinking at once.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>Each core is a specialist. They work in parallel, all the time, and reach one answer together.</p>
      <ul className={`mt-7 grid gap-x-6 gap-y-3 border-t ${HAIR} pt-5 sm:grid-cols-2`}>
        {SATELLITES.map((s) => (
          <li key={s.id} className="flex gap-3">
            <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${s.id === "verify" ? "bg-[#FFD98A]" : "bg-[#E9B44C]"}`} />
            <span>
              <span className="block text-sm font-semibold text-[#F5F7F7]">{s.label}</span>
              <span className="block text-[13px] leading-snug text-[#8A9295]">{s.line}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------------------------------------------------------------- stream */

export function StreamCopy() {
  return (
    <div>
      <p className={EYEBROW}>02 · Every tick</p>
      <h2 className={`mt-4 ${H2}`}>
        Every tick. <span className={SOFT}>Every source. Into the right core.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>
        Prices go to the Market core, the calendar to Macro, headlines to News, your account to Risk and your journal to Memory. Nothing waits for you to open a
        chart.
      </p>
    </div>
  );
}

const CORE_TAG: Record<string, string> = { price: "MARKET", macro: "MACRO", news: "NEWS", account: "RISK", journal: "MEMORY" };

/** A live log of what the AI is reading, line by line, with millisecond stamps. */
export function ReadingLog({ quotes, mv, at }: { quotes: Quotes; mv?: MotionValue<number>; at?: readonly [number, number] }) {
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const quotesRef = useRef(quotes);
  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
    const lines: { t: string; src: string; text: string; tag: string; tone: string }[] = [];
    let n = 0;
    const pad = (x: number, l = 2) => String(x).padStart(l, "0");
    const next = () => {
      const d = new Date();
      const stamp = `${pad(d.getUTCHours())}:${pad(d.getUTCMinutes())}:${pad(d.getUTCSeconds())}.${pad(d.getUTCMilliseconds(), 3)}`;
      const pick = n % 7 < 4 ? 0 : 1 + (n % 4);
      const src = SOURCES[pick];
      let text: string;
      let tone = "text-[#C9CFD1]";
      if (src.id === "price") {
        const [key, sym] = LANE_KEYS[n % LANE_KEYS.length];
        const q = quotesRef.current[key];
        text = quoteLine(q, sym);
        tone = q && q.changePct < 0 ? "text-[#FF8A8A]" : "text-[#7CF0B4]";
      } else text = src.samples[Math.floor(n / 4) % src.samples.length];
      n++;
      lines.unshift({ t: stamp, src: src.id, text, tag: CORE_TAG[src.id], tone });
      lines.length = Math.min(lines.length, rows.current.length);
      lines.forEach((l, i) => {
        const el = rows.current[i];
        if (!el) return;
        el.dataset.tone = l.tone;
        el.innerHTML = "";
        const a = document.createElement("span");
        a.className = "w-[92px] shrink-0 tabular-nums text-[#6D7578]";
        a.textContent = l.t;
        const b = document.createElement("span");
        b.className = `min-w-0 flex-1 truncate ${l.tone}`;
        b.textContent = l.text;
        const c = document.createElement("span");
        c.className = "shrink-0 text-[#E9B44C]";
        c.textContent = `→ ${l.tag}`;
        el.append(a, b, c);
        el.style.opacity = String(1 - i * 0.085);
      });
    };
    const visible = () => {
      if (!mv || !at) return true;
      const p = mv.get();
      return p >= at[0] && p <= at[1];
    };
    for (let i = 0; i < rows.current.length; i++) next();
    if (reduce) return;
    const id = setInterval(() => {
      if (visible()) next();
    }, 140);
    return () => clearInterval(id);
  }, [mv, at]);

  return (
    <div className={`${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#8A9295]`}>What the AI is reading · now</p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#E9B44C]">
          <AiOrb size={7} /> LIVE LOG
        </span>
      </div>
      <ol className="mt-3 space-y-1 font-mono text-[11.5px]">
        {Array.from({ length: 9 }, (_, i) => (
          <li key={i} ref={(el) => void (rows.current[i] = el)} className="flex h-[18px] items-center gap-3" />
        ))}
      </ol>
      <p className="mt-3 text-[11px] leading-snug text-[#6D7578]">Prices are real (live or delayed, as labelled in the ticker). Calendar, headlines, account and journal lines are samples.</p>
    </div>
  );
}

/* ----------------------------------------------------------------- think */

export function ThinkCopy() {
  return (
    <div>
      <p className={EYEBROW}>03 · How it thinks</p>
      <h2 className={`mt-4 ${H2}`}>
        Seven cores weigh in. <span className={SOFT}>One answer comes out, checked.</span>
      </h2>
      <p className={`mt-4 ${BODY}`}>Every core adds what it knows, including what it knows about you. Verify re-checks the numbers before you see them.</p>
    </div>
  );
}

/** The reasoning, core by core, synced with the 3D cores lighting up. */
export function ThinkCard({ mv }: { mv: MotionValue<number> }) {
  const thresholds = [...THINK.map((r) => STORY.at("think", r.at)), STORY.at("think", THINK_OUT)];
  const step = useStep(mv, thresholds);
  const out = step >= THINK.length;
  return (
    <div className={`${CARD_AI} p-4`} aria-label="How AFVAR AI reaches one answer, sample">
      <div className="flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <AiOrb size={12} /> “Should I buy gold now?”
        </p>
        <span className={`${MONO} text-[10px] text-[#6D7578]`}>Sample</span>
      </div>
      <ol className="mt-3 space-y-1.5">
        {THINK.map((r, i) => {
          const state = i < step ? "done" : i === step ? "now" : "wait";
          return (
            <li
              key={r.core + r.text}
              className={`flex items-start gap-3 rounded-lg border px-3 py-1.5 transition-colors duration-300 ${
                state === "now" ? "border-[rgba(233,180,76,0.6)] bg-[rgba(233,180,76,0.08)]" : "border-[rgba(255,255,255,0.06)]"
              } ${state === "wait" ? "opacity-35" : ""}`}
            >
              <span className={`${MONO} mt-0.5 w-[92px] shrink-0 text-[10px] ${state === "wait" ? "text-[#6D7578]" : "text-[#E9B44C]"}`}>{SATELLITES[r.core].label.replace(" core", "")}</span>
              <span className="min-w-0 flex-1 text-[12.5px] leading-snug text-[#E6E9EB]">{r.text}</span>
              <span className={`shrink-0 font-mono text-[11px] ${state === "done" ? "text-[#00E676]" : state === "now" ? "text-[#E9B44C]" : "text-[#4A5256]"}`}>
                {state === "done" ? "✓" : state === "now" ? "…" : "·"}
              </span>
            </li>
          );
        })}
      </ol>
      <div className={`mt-3 rounded-xl border p-3.5 transition-all duration-500 ${out ? "border-[rgba(233,180,76,0.7)] bg-[#17130A] opacity-100" : "border-[rgba(255,255,255,0.06)] opacity-30"}`}>
        <div className="flex items-center justify-between">
          <span className={`${MONO} text-[10px] text-[#E9B44C]`}>The answer</span>
          <span className="rounded-full border border-[rgba(233,180,76,0.6)] bg-[rgba(233,180,76,0.14)] px-3 py-0.5 font-mono text-[12px] tracking-[0.16em] text-[#E9B44C]">WAIT</span>
        </div>
        <p className="mt-2 text-[14px] leading-relaxed text-[#F5F7F7]">Not before payrolls. A 1H close above 4,040 turns the view bullish; below 3,985 it turns bearish.</p>
        <p className="mt-2 text-[11px] text-[#6D7578]">Graded in public after 4 hours · not investment advice</p>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- always */

export function AlwaysCopy() {
  return (
    <div>
      <p className={EYEBROW}>04 · Always on</p>
      <h2 className={`mt-4 ${H2}`}>
        It never sleeps. <span className={SOFT}>24 hours, 7 days, every week of every year.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>
        Sydney hands over to Tokyo, Tokyo to London, London to New York, and crypto never closes. The AI follows each session, so the brief is ready when you
        are.
      </p>
    </div>
  );
}

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

function subscribeMinute(cb: () => void) {
  const id = setInterval(cb, 30_000);
  return () => clearInterval(id);
}
const readMinute = () => Math.floor(Date.now() / 60_000);
/** The current UTC minute (null on the server render). */
export function useNowMinute(): Date | null {
  const m = useSyncExternalStore(subscribeMinute, readMinute, () => 0);
  return m ? new Date(m * 60_000) : null;
}

export function sessionsNow(now: Date | null) {
  const h = now ? now.getUTCHours() + now.getUTCMinutes() / 60 : -1;
  const weekOpen = now ? fxOpen(now) : true;
  return [
    ...SESSION_HOURS.map((s) => ({ name: s.name, open: now ? weekOpen && (s.from < s.to ? h >= s.from && h < s.to : h >= s.from || h < s.to) : null })),
    { name: "Crypto", open: now ? true : null },
  ];
}

export function SessionCard() {
  const now = useNowMinute();
  const rows = sessionsNow(now);
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

/* ------------------------------------------------------------------- ask */

export function AskCopy() {
  return (
    <div>
      <p className={EYEBROW}>05 · Ask</p>
      <h2 className={`mt-4 ${H2}`}>
        Ask in your words. <span className={SOFT}>Get an answer you can check.</span>
      </h2>
      <p className={`mt-5 ${BODY}`}>Type it or say it, in English or हिन्दी. It answers about the market and about you: your limits, your plan, your history.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        {["What's moving gold?", "Am I near my daily limit?", "Open my London layout"].map((q) => (
          <span key={q} className={CHIP}>
            “{q}”
          </span>
        ))}
      </div>
    </div>
  );
}

export function VoiceBars() {
  return (
    <span aria-hidden="true" className="afv-voice flex h-5 items-center gap-[3px]">
      {[8, 14, 10, 18, 12, 16, 7, 12].map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-[#E9B44C]" style={{ height: h, animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

export function AnswerCard() {
  return (
    <article className="rounded-3xl border border-[rgba(233,180,76,0.3)] bg-[#0F1214] p-5" aria-label="Sample answer from AFVAR AI">
      <div className="mb-4 ml-auto flex w-max items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#171A1C] px-4 py-2.5">
        <VoiceBars />
        <span className="text-[15px]" lang="hi">
          आज मेरी लिमिट कितनी बची है?
        </span>
      </div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AiOrb size={18} />
          <span className="text-sm font-semibold">AFVAR AI</span>
          <span className={`${MONO} text-[10px] text-[#6D7578]`}>Risk · Sample</span>
        </div>
      </div>
      <p className="mt-3 text-[14px] leading-relaxed text-[#E6E9EB]">
        You&apos;ve used 40% of today&apos;s loss limit. If both open trades hit their stops, that becomes 61%. With payrolls in 3 hours, adding size now would leave you
        little room.
      </p>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Used today", "40%", "text-[#F5F7F7]"],
          ["At risk", "+21%", "text-[#FF6B6B]"],
          ["Room left", "39%", "text-[#00E676]"],
        ].map(([k, v, c]) => (
          <div key={k} className="rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#0A0C0D] p-2.5">
            <p className={`${MONO} text-[9px] text-[#6D7578]`}>{k}</p>
            <p className={`mt-1 text-base font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between text-[11px] text-[#6D7578]">
        <span className="flex gap-1.5 font-mono tracking-wider">
          <span>RISK</span>·<span>MEMORY</span>·<span className="text-[#E9B44C]">VERIFIED</span>
        </span>
        <span>Sample · not investment advice</span>
      </div>
    </article>
  );
}

/* ----------------------------------------------------------------- trust */

const STEPS = [
  ["You ask", "Text, voice or a click."],
  ["AI understands", "The core plans the work."],
  ["Policy gate", "Trades are always refused here."],
  ["It acts in the OS", "Opens, arranges, explains."],
  ["Verified, then shown", "No silent success."],
] as const;

export function TrustCopy() {
  return (
    <div>
      <p className={EYEBROW}>07 · Trust</p>
      <h2 className={`mt-4 ${H2}`}>
        It warns. <span className={SOFT}>It never acts.</span>
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

export function PermissionsCard() {
  const rows = [
    ["Broker account", "Read-only", "text-[#00E676]"],
    ["Place or change orders", "Never", "text-[#FF6B6B]"],
    ["Your journal & notes", "Private to you", "text-[#C9CFD1]"],
    ["Every number", "Source + time shown", "text-[#C9CFD1]"],
  ] as const;
  return (
    <div className={`${CARD} overflow-hidden`}>
      <p className="border-b border-[rgba(255,255,255,0.08)] px-4 py-2.5 text-[13px] font-semibold">Privacy & permissions</p>
      {rows.map(([k, v, c]) => (
        <div key={k} className="flex justify-between border-b border-[rgba(255,255,255,0.05)] px-4 py-2.5 text-[13px] last:border-b-0">
          <span className="text-[#C9CFD1]">{k}</span>
          <span className={c}>{v}</span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- finale */

export function FinaleCopy() {
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
