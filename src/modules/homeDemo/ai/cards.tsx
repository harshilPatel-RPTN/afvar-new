"use client";

// Copy and product cards for each act of the home film. Every act says
// something new — no sentence appears in two acts. Each block has a full
// (desktop) and a compact (phone / tablet bottom panel) form.
import { type MotionValue } from "framer-motion";
import Link from "next/link";
import { createContext, useContext, useEffect, useRef, useSyncExternalStore, type CSSProperties, type RefObject } from "react";
import { fmtPrice, type HomeQuote } from "@/modules/home/kit";
import { AiOrb, BODY, CARD, CARD_AI, EYEBROW, GHOST_LINK, AI_CTA, H1, H2, HAIR, HeroTitle, MONO, SOFT, useStep, useTypedText } from "@/modules/afvarOs";
import { REGISTER_HREF } from "../ui";
import { AVATAR, SATELLITES, SOURCES, THINK, THINK_OUT, type ActId, type Film } from "./aiConfig";
import { useVoicedText, VOICE } from "./voice";
import "./mobile-cards.css";

export type Quotes = Record<string, HomeQuote>;

/* ------------------------------------------------------ phone card motion */

const PHONE_MQ = "(max-width: 639.98px)";

function calmMotion(): boolean {
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true || document.documentElement.dataset.reduceMotion === "true";
}

/** True when `el` is a card inside the phone story (.ms-root, < 640 px). */
function inPhoneStory(el: HTMLElement | null): el is HTMLElement {
  return !!el && !!el.closest(".ms-root") && typeof window.matchMedia === "function" && window.matchMedia(PHONE_MQ).matches;
}

/**
 * Phone story only (< 640 px inside .ms-root): marks the card `data-mc`, adds
 * `data-mc-play` once ≥ 40 % of it is on screen and toggles `data-mc-off`
 * while it is off screen (pauses loops). Reduced motion plays at once, and
 * mobile-cards.css then shows the final state. Desktop never gets the marks.
 */
function usePhoneCard<T extends HTMLElement>(onVisible?: (on: boolean) => void): RefObject<T | null> {
  const ref = useRef<T>(null);
  const cb = useRef(onVisible);
  useEffect(() => {
    cb.current = onVisible;
  }, [onVisible]);
  useEffect(() => {
    const el = ref.current;
    if (!inPhoneStory(el)) return;
    el.setAttribute("data-mc", "");
    const play = () => el.setAttribute("data-mc-play", "");
    if (calmMotion() || typeof IntersectionObserver === "undefined") {
      play();
      cb.current?.(true);
      return;
    }
    const io = new IntersectionObserver(
      ([e]) => {
        const vh = window.innerHeight || 1;
        if (e.intersectionRatio >= 0.4 || e.intersectionRect.height >= vh * 0.4) play();
        el.toggleAttribute("data-mc-off", !e.isIntersecting);
        cb.current?.(e.isIntersecting && el.hasAttribute("data-mc-play"));
      },
      { threshold: [0, 0.2, 0.4, 0.6, 0.8, 1] },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

/* ----------------------------------------------------------- film context */

export const FilmUi = createContext<Film | null>(null);
function useFilmUi(): Film {
  const f = useContext(FilmUi);
  if (!f) throw new Error("FilmUi missing");
  return f;
}

/** "02 · Every tick" — numbered by the act's place in the current cut. */
function ActEyebrow({ id, label }: { id: ActId; label: string }) {
  const film = useContext(FilmUi);
  const n = film ? film.story.order.indexOf(id) : -1;
  return <p className={EYEBROW}>{n > 0 ? `${String(n).padStart(2, "0")} · ${label}` : label}</p>;
}

const H2_COMPACT = "text-[clamp(1.55rem,6.4vw,2.2rem)] font-semibold leading-[1.08] tracking-[-0.025em] text-[#F2F5F2]";

/** Opens the site's live AFVAR avatar (voice + chat). */
export function openLiveAvatar() {
  window.dispatchEvent(new CustomEvent("afvar:avatar", { detail: { open: true } }));
}

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

export function HeroCopy({ compact = false, twin = false }: { compact?: boolean; twin?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <p className={EYEBROW}>Pre-launch · AFVAR AI</p>
      <HeroTitle twin={twin} className={compact ? `mt-3 text-[clamp(2.1rem,9vw,3rem)] font-semibold leading-[1.03] tracking-[-0.03em] text-[#F2F5F2]` : `mt-5 ${H1}`}>
        The trading OS <span className="text-[#A8DEC2]">that never stops thinking.</span>
      </HeroTitle>
      <p className={compact ? "mt-3 text-[14.5px] leading-relaxed text-[#B7C5BC]" : `mt-6 max-w-[30rem] ${BODY}`}>
        {compact
          ? "One AI that reads commodities, forex and crypto every millisecond, around the clock. It explains. It never trades."
          : "AFVAR is an operating system for traders, built around one AI. A multicore mind that reads commodities, forex and crypto every millisecond, around the clock, and explains what it sees in plain words. It never places a trade."}
      </p>
      <div className={`home-story-actions ${compact ? "mt-5" : "mt-8"} flex flex-nowrap items-center gap-2.5 sm:gap-5`}>
        <Link href={REGISTER_HREF} prefetch={false} className={AI_CTA}>
          Register Now
        </Link>
        <Link href="/platform" className={GHOST_LINK}>
          Explore the platform
        </Link>
      </div>
      <div className={`home-hero-stats ${compact ? "mt-5 pt-3" : "mt-10 pt-5"} flex flex-wrap items-center gap-x-6 gap-y-2 border-t ${HAIR}`}>
        <LiveClock />
        <span className={`${MONO} text-[#92A399]`}>24 / 7 / 365</span>
        {compact ? null : <span className={`${MONO} text-[#92A399]`}>8 markets</span>}
        <span className={`${MONO} text-[#92A399]`}>0 order buttons</span>
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
    <span className="flex items-center gap-2 font-mono text-[11px] tracking-[0.12em] text-[#A8DEC2]">
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#A8DEC2] opacity-50" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-[#A8DEC2]" />
      </span>
      <span ref={ref} className="tabular-nums">
        --:--:-- UTC
      </span>
    </span>
  );
}

/* ----------------------------------------------------------------- cores */

export function CoresCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="cores" label="Multicore AI" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        One AI. <span className={SOFT}>Seven cores thinking at once.</span>
      </h2>
      {compact ? (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {SATELLITES.map((s) => (
            <li key={s.id} className="rounded-full border border-[rgba(168,222,194,0.35)] px-2.5 py-1 font-mono text-[10.5px] tracking-[0.06em] text-[#DAECDF]">
              {s.label}
            </li>
          ))}
        </ul>
      ) : (
        <>
          <p className={`mt-5 ${BODY}`}>Each core is a specialist. They work in parallel, all the time, and reach one answer together.</p>
          <ul className={`mt-7 grid gap-x-6 gap-y-3 border-t ${HAIR} pt-5 sm:grid-cols-2`}>
            {SATELLITES.map((s) => (
              <li key={s.id} className="flex gap-3">
                <span aria-hidden="true" className={`mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full ${s.id === "verify" ? "bg-[#D8F3E4]" : "bg-[#A8DEC2]"}`} />
                <span>
                  <span className="block text-sm font-semibold text-[#F2F5F2]">{s.label}</span>
                  <span className="block text-[13px] leading-snug text-[#8A9295]">{s.line}</span>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

/* ---------------------------------------------------------------- stream */

export function StreamCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="stream" label="Every tick" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        Every tick. <span className={SOFT}>Every source. Into the right core.</span>
      </h2>
      {compact ? null : (
        <p className={`mt-5 ${BODY}`}>
          Prices go to the Market core, the calendar to Macro, headlines to News, your account to Risk and your journal to Memory. Nothing waits for you to open a
          chart.
        </p>
      )}
    </div>
  );
}

const CORE_TAG: Record<string, string> = { price: "MARKET", macro: "MACRO", news: "NEWS", account: "RISK", journal: "MEMORY" };

/** A live log of what the AI is reading, line by line, with millisecond stamps. */
export function ReadingLog({ quotes, mv, at, rows: rowCount = 9 }: { quotes: Quotes; mv?: MotionValue<number>; at?: readonly [number, number]; rows?: number }) {
  const rows = useRef<(HTMLLIElement | null)[]>([]);
  const list = useRef<HTMLOListElement>(null);
  const quotesRef = useRef(quotes);
  /** Phone story: on screen and ≥ 40 % seen once (set by usePhoneCard). */
  const live = useRef(false);
  const wake = useRef<(() => void) | null>(null);
  const root = usePhoneCard<HTMLDivElement>((on) => {
    live.current = on;
    if (on) wake.current?.();
  });
  useEffect(() => {
    quotesRef.current = quotes;
  }, [quotes]);
  const a0 = at?.[0];
  const a1 = at?.[1];

  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.documentElement.dataset.reduceMotion === "true";
    // Phone story: a terminal — newest line at the bottom, pushed in from below,
    // slower ticks, starts once the card is in view and pauses off screen.
    const phone = !!root.current?.hasAttribute("data-mc");
    const lines: { t: string; text: string; tag: string; tone: string }[] = [];
    let n = 0;
    const pad = (x: number, l = 2) => String(x).padStart(l, "0");
    const next = (animate = false) => {
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
      lines.unshift({ t: stamp, text, tag: CORE_TAG[src.id], tone });
      lines.length = Math.min(lines.length, rows.current.length);
      lines.forEach((l, i) => {
        const el = rows.current[i];
        if (!el) return;
        el.replaceChildren();
        const a = document.createElement("span");
        a.className = "mc-stamp w-[84px] shrink-0 tabular-nums text-[#92A399]";
        a.textContent = l.t;
        const b = document.createElement("span");
        b.className = `min-w-0 flex-1 truncate ${l.tone}`;
        b.textContent = l.text;
        const c = document.createElement("span");
        c.className = "shrink-0 text-[#A8DEC2]";
        c.textContent = `→ ${l.tag}`;
        el.append(a, b, c);
        el.style.opacity = String(1 - i * 0.085);
      });
      if (animate && typeof list.current?.animate === "function") {
        const top = rows.current[0];
        const prev = rows.current[1];
        const shift = top && prev ? Math.abs(top.offsetTop - prev.offsetTop) : 22;
        list.current.animate([{ transform: `translateY(${shift}px)` }, { transform: "translateY(0)" }], { duration: 260, easing: "cubic-bezier(.2,.8,.2,1)" });
        top?.animate([{ backgroundColor: "rgba(0,230,118,0.16)" }, { backgroundColor: "rgba(0,230,118,0)" }], { duration: 1100, easing: "ease-out" });
        top?.firstElementChild?.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0.25 }, { opacity: 1 }], { duration: 320, easing: "steps(4, end)" });
      }
    };
    const visible = () => {
      if (a0 === undefined || a1 === undefined || !mv) return !document.hidden;
      const p = mv.get();
      return !document.hidden && p >= a0 && p <= a1;
    };
    if (phone && !reduce) {
      // Empty until seen; the first screenful types in fast, then a steady beat.
      let id: ReturnType<typeof setTimeout> | undefined;
      const tick = () => {
        id = undefined;
        if (!live.current || document.hidden) return;
        next(true);
        id = setTimeout(tick, n < rows.current.length ? 150 : 900);
      };
      wake.current = () => {
        if (id === undefined) tick();
      };
      if (live.current) wake.current();
      return () => {
        wake.current = null;
        if (id !== undefined) clearTimeout(id);
      };
    }
    for (let i = 0; i < rows.current.length; i++) next();
    if (reduce) return;
    const id = setInterval(() => {
      if (visible()) next();
    }, 140);
    return () => clearInterval(id);
  }, [mv, a0, a1, rowCount, root]);

  return (
    <div ref={root} className={`home-reading-log mc-log ${CARD} p-4`}>
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#8A9295]`}>What the AI is reading · now</p>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-[#A8DEC2]">
          <AiOrb size={7} /> LIVE LOG
        </span>
      </div>
      <ol ref={list} className="mc-log-list mt-3 space-y-1 font-mono text-[11px]">
        {Array.from({ length: rowCount }, (_, i) => (
          <li key={i} ref={(el) => void (rows.current[i] = el)} className="flex h-[18px] items-center gap-2.5" />
        ))}
      </ol>
      <p className="mt-3 text-[10.5px] leading-snug text-[#92A399]">Prices can be live or delayed. The other lines are samples.</p>
    </div>
  );
}

/* ----------------------------------------------------------------- think */

export function ThinkCopy() {
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="think" label="How it thinks" />
      <h2 className={`mt-4 ${H2}`}>
        Seven cores weigh in. <span className={SOFT}>One answer comes out, checked.</span>
      </h2>
      <p className={`mt-4 ${BODY} [@media(max-height:860px)]:hidden`}>Every core adds what it knows, including what it knows about you. Verify re-checks the numbers before you see them.</p>
    </div>
  );
}

/** The reasoning, core by core, synced with the 3D cores lighting up. */
const THINK_ANSWER = "Not before payrolls. A 1H close above 4,040 turns the view bullish; below 3,985 it turns bearish.";

export function ThinkCard({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useFilmUi();
  const thresholds = [...THINK.map((r) => film.at("think", r.at)), film.at("think", THINK_OUT)];
  const step = useStep(mv, thresholds);
  const out = step >= THINK.length;
  const root = usePhoneCard<HTMLDivElement>();
  const progress = Math.max(0, Math.min(step + 1, THINK.length + 1)) / (THINK.length + 1);
  return (
    <div
      ref={root}
      className={`mc-think ${CARD_AI} ${compact ? "p-3" : "p-4 [@media(max-height:780px)]:p-3"}`}
      style={{ "--mc-p": progress } as CSSProperties}
      aria-label="How AFVAR AI reaches one answer, sample"
    >
      <div className="mc-think-head flex items-center justify-between">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <AiOrb size={12} /> “Should I buy gold now?”
        </p>
        <span className={`${MONO} text-[10px] text-[#92A399]`}>Sample</span>
        <svg className="mc-deco mc-ring" viewBox="0 0 20 20" aria-hidden="true">
          <circle cx="10" cy="10" r="8" />
          <circle className="mc-ring-fill" cx="10" cy="10" r="8" pathLength={1} />
        </svg>
      </div>
      <ol className={`${compact ? "mt-2 space-y-1" : "mt-3 space-y-1.5"}`}>
        {THINK.map((r, i) => {
          const state = i < step ? "done" : i === step ? "now" : "wait";
          return (
            <li
              key={r.core + r.text}
              data-state={state}
              className={`mc-step flex items-start gap-3 rounded-lg border px-3 ${compact ? "py-1" : "py-1.5 [@media(max-height:760px)]:py-1"} transition-colors duration-300 ${
                state === "now" ? "border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.08)]" : "border-[rgba(255,255,255,0.06)]"
              } ${state === "wait" ? "opacity-35" : ""}`}
            >
              <span className="mc-deco mc-scan" aria-hidden="true" />
              <span className={`mc-core ${MONO} mt-0.5 ${compact ? "w-[64px]" : "w-[92px]"} shrink-0 text-[10px] ${state === "wait" ? "text-[#92A399]" : "text-[#A8DEC2]"}`}>
                {SATELLITES[r.core].label.replace(" core", "")}
              </span>
              <span className={`min-w-0 flex-1 ${compact ? "text-[12px]" : "text-[12.5px]"} leading-snug text-[#E6E9EB]`}>{r.text}</span>
              <span className={`mc-tick shrink-0 font-mono text-[11px] ${state === "done" ? "text-[#00E676]" : state === "now" ? "text-[#A8DEC2]" : "text-[#4A5256]"}`}>
                {state === "done" ? "✓" : state === "now" ? "…" : "·"}
              </span>
            </li>
          );
        })}
      </ol>
      <div
        data-out={out}
        className={`mc-out mt-3 rounded-xl border ${compact ? "p-3" : "p-3.5"} transition-all duration-500 ${out ? "border-[rgba(168,222,194,0.7)] bg-[#06110C] opacity-100" : "border-[rgba(255,255,255,0.06)] opacity-30"}`}
      >
        <div className="flex items-center justify-between">
          <span className={`${MONO} text-[10px] text-[#A8DEC2]`}>The answer</span>
          <span className="mc-verdict rounded-full border border-[rgba(168,222,194,0.6)] bg-[rgba(168,222,194,0.14)] px-3 py-0.5 font-mono text-[12px] tracking-[0.16em] text-[#A8DEC2]">WAIT</span>
        </div>
        <p className={`mt-2 ${compact ? "text-[13px]" : "text-[14px]"} leading-relaxed text-[#F2F5F2]`}>{THINK_ANSWER}</p>
        {compact ? null : <p className="mt-2 text-[11px] text-[#92A399] [@media(max-height:780px)]:hidden">Graded in public after 4 hours · not investment advice</p>}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- always */

export function AlwaysCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="always" label="Always on" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        It never sleeps. <span className={SOFT}>24 hours, 7 days, every week of every year.</span>
      </h2>
      {compact ? null : (
        <p className={`mt-5 ${BODY}`}>
          Sydney hands over to Tokyo, Tokyo to London, London to New York, and crypto never closes. The AI follows each session, so the brief is ready when you
          are.
        </p>
      )}
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

/** Phone story: a session's hours on a 24 h UTC track, as [left %, width %] segments. */
function sessionSegments(i: number): [number, number][] {
  const s = SESSION_HOURS[i];
  if (!s) return [[0, 100]];
  const pct = (h: number) => (h / 24) * 100;
  return s.from < s.to ? [[pct(s.from), pct(s.to - s.from)]] : [[pct(s.from), pct(24 - s.from)], [0, pct(s.to)]];
}

export function SessionCard({ compact = false }: { compact?: boolean }) {
  const now = useNowMinute();
  const rows = sessionsNow(now);
  const root = usePhoneCard<HTMLDivElement>();
  const nowPct = now ? (now.getUTCHours() + now.getUTCMinutes() / 60) / 24 : 0;
  return (
    <div ref={root} className={`mc-sessions ${CARD} ${compact ? "p-3" : "p-4"}`} style={{ "--mc-now": nowPct } as CSSProperties}>
      <div className="flex items-center justify-between">
        <p className={`${MONO} text-[10px] text-[#8A9295]`}>Sessions right now</p>
        <span className="font-mono text-[11px] text-[#8A9295]">{now ? `${String(now.getUTCHours()).padStart(2, "0")}:${String(now.getUTCMinutes()).padStart(2, "0")} UTC` : "—"}</span>
      </div>
      <ul className={compact ? "mt-2 grid grid-cols-2 gap-x-4 gap-y-1" : "mt-3 space-y-1.5"}>
        {rows.map((r, i) => (
          <li key={r.name} data-open={r.open === true} style={{ "--i": i } as CSSProperties} className="mc-sess flex items-center justify-between text-[13px]">
            <span className="text-[#C9CFD1]">{r.name}</span>
            <span className={`flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider ${r.open ? "text-[#00E676]" : "text-[#92A399]"}`}>
              <span className={`mc-dot h-1.5 w-1.5 rounded-full ${r.open ? "bg-[#00E676]" : "bg-[#3A4044]"}`} />
              {r.open === null ? "—" : r.open ? "Open" : "Closed"}
            </span>
            <span className="mc-deco mc-track" aria-hidden="true">
              {sessionSegments(i).map(([l, w]) => (
                <i key={l} className="mc-seg" style={{ left: `${l}%`, width: `${w}%` }} />
              ))}
              {now ? (
                <span className="mc-needle-run">
                  <i className="mc-needle" />
                </span>
              ) : null}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center justify-between border-t border-[rgba(255,255,255,0.06)] pt-2.5 text-[11px] text-[#92A399]">
        <span>Approx. hours, UTC</span>
        <span className="text-[#A8DEC2]">AI coverage: all of them</span>
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------- avatar */

/** The avatar's hello as it waves, typed with its voice; only in the scroll film (`mv`). */
function Hello({ mv }: { mv: MotionValue<number> }) {
  const film = useFilmUi();
  const A = (f: number) => film.at("avatar", f);
  const step = useStep(mv, [A(AVATAR.wave[0]), A(AVATAR.listen[0])]);
  const typed = useVoicedText(mv, VOICE.hello, HELLO, step === 0, [A(AVATAR.wave[0]), A(AVATAR.wave[0] + 0.04)]);
  return (
    <p className={`mt-4 flex items-center gap-2 text-[14px] text-[#E6E9EB] transition-opacity duration-300 ${step === 0 ? "opacity-100" : "opacity-0"}`}>
      <AiOrb size={10} pulse={step === 0} />
      <span ref={typed} aria-hidden="true" />
      <span className="sr-only">{HELLO}</span>
    </p>
  );
}
const HELLO = "Hi, I am AFVAR.";

export function AvatarCopy({ compact = false, mv }: { compact?: boolean; mv?: MotionValue<number> }) {
  const film = useFilmUi();
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="avatar" label="Meet AFVAR" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        The AI has a face. <span className={SOFT}>And a voice you can talk to.</span>
      </h2>
      {compact ? null : (
        <p className={`mt-5 ${BODY}`}>
          {film.has("os")
            ? "AFVAR's avatar listens, thinks out loud and answers in English or हिन्दी. In the OS it keeps a corner of your screen, points at what matters and walks over when your risk needs you."
            : "AFVAR's avatar listens, thinks out loud and answers in English or हिन्दी."}
        </p>
      )}
      <div className={`home-story-actions ${compact ? "mt-4" : "mt-6"} flex flex-wrap items-center gap-4`}>
        <button type="button" onClick={openLiveAvatar} className={`${AI_CTA} inline-flex items-center gap-2`}>
          <span aria-hidden="true" className="h-2 w-2 rounded-full bg-(--afvar-mint)" />
          Talk to AFVAR
        </button>
        <span className="text-[12px] text-[#92A399]">Live voice beta · uses your microphone</span>
      </div>
      {mv ? <Hello mv={mv} /> : null}
    </div>
  );
}

export function VoiceBars() {
  return (
    <span aria-hidden="true" className="afv-voice flex h-5 items-center gap-[3px]">
      {[8, 14, 10, 18, 12, 16, 7, 12].map((h, i) => (
        <span key={i} className="w-[3px] rounded-full bg-[#A8DEC2]" style={{ height: h, animationDelay: `${i * 90}ms` }} />
      ))}
    </span>
  );
}

const ANSWER =
  "You've used 40% of today's loss limit. If both open trades hit their stops, that becomes 61%. With payrolls in 3 hours, adding size now would leave you little room.";

/** The avatar's conversation, synced to its gestures: question → thinking → spoken answer. */
export function Dialogue({ mv, compact = false }: { mv: MotionValue<number>; compact?: boolean }) {
  const film = useFilmUi();
  const A = (f: number) => film.at("avatar", f);
  const step = useStep(mv, [A(AVATAR.listen[0]), A(AVATAR.think[0]), A(AVATAR.answer[0]), A(AVATAR.answer[1] - 0.04)]);
  const typed = useTypedText(mv, ANSWER, [A(AVATAR.answer[0] + 0.01), A(AVATAR.answer[1] - 0.06)]);
  const root = usePhoneCard<HTMLElement>();
  return (
    <article ref={root} data-step={step} className={`mc-talk rounded-3xl border border-[rgba(168,222,194,0.3)] bg-[#10231B] ${compact ? "p-3.5" : "p-5"}`} aria-label="Sample conversation with the AFVAR avatar">
      <div className={`mc-user ml-auto flex w-max max-w-full items-center gap-3 rounded-2xl border border-[rgba(255,255,255,0.1)] bg-[#182B21] px-4 py-2.5 transition-opacity duration-300 ${step >= 0 ? "opacity-100" : "opacity-0"}`}>
        {step === 0 ? <VoiceBars /> : null}
        <span className={compact ? "text-[14px]" : "text-[15px]"} lang="hi">
          आज मेरी लिमिट कितनी बची है?
        </span>
      </div>
      <div className={`mc-ai-head ${compact ? "mt-3" : "mt-4"} flex items-center gap-2.5`}>
        <AiOrb size={16} pulse={step === 1 || step === 2} />
        <span className="text-sm font-semibold">AFVAR</span>
        <span className={`${MONO} text-[10px] text-[#92A399]`}>{step === 1 ? "Thinking…" : step >= 2 ? "Speaking · sample" : "Listening"}</span>
      </div>
      <p className={`mc-ai-line ${compact ? "mt-2 min-h-[4.4em] text-[13px]" : "mt-3 min-h-[4.8em] text-[14px]"} leading-relaxed text-[#E6E9EB]`} aria-live="off">
        <span className="mc-deco mc-typing" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <span ref={typed} />
        {step === 2 ? <span className="afv-caret" /> : null}
      </p>
      <span className="sr-only">{ANSWER}</span>
      <div className={`mc-stats mt-3 grid grid-cols-3 gap-2 transition-opacity duration-500 ${step >= 3 ? "opacity-100" : "opacity-0"}`}>
        {[
          ["Used today", "40%", "text-[#F2F5F2]"],
          ["At risk", "+21%", "text-[#FF6B6B]"],
          ["Room left", "39%", "text-[#00E676]"],
        ].map(([k, v, c], i) => (
          <div key={k} style={{ "--i": i } as CSSProperties} className="mc-stat rounded-xl border border-[rgba(255,255,255,0.08)] bg-[#06110C] p-2">
            <p className={`${MONO} text-[9px] text-[#92A399]`}>{k}</p>
            <p className={`mt-0.5 text-[15px] font-semibold ${c}`}>{v}</p>
          </div>
        ))}
      </div>
      {compact ? null : <p className="mt-3 text-right text-[11px] text-[#92A399]">Sample · not investment advice</p>}
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

export function TrustCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <ActEyebrow id="trust" label="Trust" />
      <h2 className={compact ? `mt-3 ${H2_COMPACT}` : `mt-4 ${H2}`}>
        It warns. <span className={SOFT}>It never acts.</span>
      </h2>
      <p className={compact ? "mt-3 text-[14px] leading-relaxed text-[#B7C5BC]" : `mt-5 ${BODY}`}>
        Every request passes a policy gate before anything happens. AFVAR can open, explain and warn. It cannot place, change or close a trade.
      </p>
      {compact ? null : (
        <ol className={`mt-6 border-t ${HAIR}`}>
          {STEPS.map(([t, d], i) => (
            <li key={t} className={`flex items-baseline gap-4 border-b ${HAIR} py-2.5`}>
              <span className={`${MONO} w-6 text-[10px] ${i === 2 ? "text-[#A8DEC2]" : "text-[#92A399]"}`}>{String(i + 1).padStart(2, "0")}</span>
              <span className={`text-sm font-semibold ${i === 2 ? "text-[#A8DEC2]" : "text-[#F2F5F2]"}`}>{t}</span>
              <span className="ml-auto text-[13px] text-[#8A9295]">{d}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export function PermissionsCard({ compact = false }: { compact?: boolean }) {
  const rows = [
    ["Broker account", "Read-only", "text-[#00E676]"],
    ["Place or change orders", "Never", "text-[#FF6B6B]"],
    ["Your journal & notes", "Private to you", "text-[#C9CFD1]"],
    ["Every number", "Source + time shown", "text-[#C9CFD1]"],
  ] as const;
  const root = usePhoneCard<HTMLDivElement>();
  return (
    <div ref={root} className={`home-permissions-card mc-perms ${CARD} overflow-hidden`}>
      <p className={`mc-perms-head border-b border-[rgba(255,255,255,0.08)] px-4 ${compact ? "py-2" : "py-2.5"} text-[13px] font-semibold`}>
        Privacy & permissions
        <svg className="mc-deco mc-lock" viewBox="0 0 14 16" aria-hidden="true">
          <path className="mc-shackle" d="M3.5 7.5V5a3.5 3.5 0 0 1 7 0v2.5" />
          <rect x="1.5" y="7.5" width="11" height="7.5" rx="1.5" />
        </svg>
      </p>
      {rows.map(([k, v, c], i) => (
        <div
          key={k}
          data-kind={v === "Never" ? "deny" : "allow"}
          style={{ "--i": i } as CSSProperties}
          className={`mc-perm flex justify-between border-b border-[rgba(255,255,255,0.05)] px-4 ${compact ? "py-1.5" : "py-2.5"} text-[13px] last:border-b-0`}>
          <span className="text-[#C9CFD1]">{k}</span>
          <span className={c}>{v}</span>
          <span className="mc-deco mc-toggle" aria-hidden="true">
            <i className="mc-knob">
              <svg className="mc-mark" viewBox="0 0 8 8">
                <path pathLength={1} d={v === "Never" ? "M2.2 2.2l3.6 3.6M5.8 2.2L2.2 5.8" : "M1.8 4.2l1.6 1.6 2.9-3.4"} />
              </svg>
            </i>
          </span>
        </div>
      ))}
    </div>
  );
}

/* ---------------------------------------------------------------- finale */

export function FinaleCopy({ compact = false }: { compact?: boolean }) {
  return (
    <div className="home-chapter-prose">
      <p className={EYEBROW}>Launching soon</p>
      <h2 className={compact ? "mt-3 text-[clamp(2rem,8.5vw,2.8rem)] font-semibold leading-[1.04] tracking-[-0.03em] text-[#F2F5F2]" : "mt-4 text-[clamp(2.4rem,4.2vw,4rem)] font-semibold leading-[1.03] tracking-[-0.035em] text-[#F2F5F2]"}>
        One mind. Always on. <span className="text-[#A8DEC2]">On your side.</span>
      </h2>
      <p className={compact ? "mt-3 text-[14px] leading-relaxed text-[#B7C5BC]" : `mt-6 max-w-[30rem] ${BODY}`}>Register now to be first in line when AFVAR opens, with your place in the launch queue.</p>
      <div className={`home-story-actions ${compact ? "mt-5" : "mt-8"} flex flex-nowrap items-center gap-2.5 sm:gap-5`}>
        <Link href={REGISTER_HREF} prefetch={false} className={AI_CTA}>
          Register Now
        </Link>
        <a href="#launch-queue" className={GHOST_LINK}>
          See the launch queue
        </a>
      </div>
    </div>
  );
}
